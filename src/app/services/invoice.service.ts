import { Injectable, inject } from '@angular/core';
import { Observable, of, switchMap, timer, filter, take, map } from 'rxjs';
import { ApiService } from './api.service';
import {
  ExtractResult,
  JobStatusDto,
} from '../models/cfdi.models';

interface PresignResponse {
  presignedUrl: string;
  s3Bucket: string;
  s3Key: string;
}

const POLL_INTERVAL_MS = 2_000;

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private readonly api = inject(ApiService);

  extractInvoice(file: File, isrRetencionTasa?: number, force = false): Observable<ExtractResult> {
    return this.api.post<PresignResponse>('/api/invoice/presign', { fileName: file.name }).pipe(
      switchMap((presign) =>
        this.api.putS3(presign.presignedUrl, file).pipe(
          switchMap(() =>
            this.api.post<JobStatusDto>('/api/invoice/extract', {
              s3Key: presign.s3Key,
              s3Bucket: presign.s3Bucket,
              fileName: file.name,
              isrRetencionTasa: isrRetencionTasa ?? 0,
              force,
            })
          )
        )
      ),
      switchMap((created) => {
        if (created.status === 'Completed') {
          return of(created).pipe(map((s) => this.toExtractResult(s)));
        }
        return timer(0, POLL_INTERVAL_MS).pipe(
          switchMap(() =>
            this.api.get<JobStatusDto>(
              `/api/invoice/extract/${created.jobId}/status`
            )
          ),
          filter((s) => s.status === 'Completed' || s.status === 'Failed'),
          take(1),
          map((s) => this.toExtractResult(s))
        );
      })
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
