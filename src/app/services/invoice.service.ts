import { Injectable, inject } from '@angular/core';
import { HttpEventType } from '@angular/common/http';
import { Observable, concat, of } from 'rxjs';
import { concatMap, map, filter } from 'rxjs';
import { ApiService } from './api.service';
import {
  ExtractResult,
  JobStatusDto,
  UploadStageEvent,
} from '../models/cfdi.models';

interface PresignResponse {
  presignedUrl: string;
  s3Bucket: string;
  s3Key: string;
  /** Additional headers required by S3 (e.g. KMS encryption). May be absent or {}. */
  uploadHeaders?: Record<string, string>;
}

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private readonly api = inject(ApiService);

  /**
   * Presigns, uploads to S3 (real progress), then runs extraction in up to two
   * synchronous backend calls: POST /extract (fast path — cache hit or XML
   * resolve here) and, only if that responds "Ready", POST /extract/analyze
   * (the slow Bedrock call). Both calls are fully synchronous end-to-end —
   * this API runs as a Lambda in QA/prod, so nothing can keep working in the
   * background after an HTTP response is sent.
   */
  extractInvoice(file: File, force = false): Observable<UploadStageEvent> {
    return this.api.post<PresignResponse>('/api/invoice/presign', { fileName: file.name }).pipe(
      concatMap((presign) =>
        concat(
          this.uploadToS3(presign, file),
          this.runExtraction(presign, file.name, force),
        )
      ),
    );
  }

  private uploadToS3(presign: PresignResponse, file: File): Observable<UploadStageEvent> {
    return this.api.putS3(presign.presignedUrl, file, presign.uploadHeaders ?? {}).pipe(
      filter((event) => event.type === HttpEventType.UploadProgress || event.type === HttpEventType.Response),
      map((event): UploadStageEvent => {
        if (event.type === HttpEventType.UploadProgress) {
          const percent = event.total ? Math.round((100 * event.loaded) / event.total) : 0;
          return { stage: 'uploading', percent };
        }
        // Response event — upload finished; the next stage ('preparing') is
        // emitted separately once the /extract call actually starts.
        return { stage: 'uploading', percent: 100 };
      }),
    );
  }

  private runExtraction(presign: PresignResponse, fileName: string, force: boolean): Observable<UploadStageEvent> {
    const body = { s3Key: presign.s3Key, s3Bucket: presign.s3Bucket, fileName, force };

    return concat(
      of<UploadStageEvent>({ stage: 'preparing' }),
      this.api.post<JobStatusDto>('/api/invoice/extract', body).pipe(
        concatMap((first): Observable<UploadStageEvent> => {
          if (first.status !== 'Ready') {
            return of({ stage: 'done', result: this.toExtractResult(first) });
          }
          return concat(
            of<UploadStageEvent>({ stage: 'analyzing' }),
            this.api.post<JobStatusDto>('/api/invoice/extract/analyze', body).pipe(
              map((second) => ({ stage: 'done', result: this.toExtractResult(second) }) as UploadStageEvent),
            ),
          );
        }),
      ),
    );
  }

  private toExtractResult(s: JobStatusDto): ExtractResult {
    return {
      success:        s.status === 'Completed' && !s.error,
      error:          s.error          ?? null,
      extractionType: s.extractionType ?? null,
      cfdiFields:     s.cfdiFields     ?? null,
      warnings:       s.warnings       ?? null,
      rawText:        null,
      totalPages:     0,
      ocrPages:       0,
    };
  }
}
