import { Injectable, inject } from '@angular/core';
import { Observable, of, switchMap, timer, filter, take, map } from 'rxjs';
import { ApiService } from './api.service';
import {
  ExtractResult,
  JobStatusDto,
} from '../models/cfdi.models';

const POLL_INTERVAL_MS = 2_000;

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private readonly api = inject(ApiService);

  extractInvoice(file: File, isrRetencionTasa?: number, force = false): Observable<ExtractResult> {
    const formData = new FormData();
    formData.append('file', file);
    if (isrRetencionTasa !== undefined && isrRetencionTasa > 0) {
      formData.append('isrRetencionTasa', isrRetencionTasa.toString());
    }

    const url = force ? '/api/invoice/extract?force=true' : '/api/invoice/extract';

    // Backend returns 200 + full JobStatusDto on cache hit, 202 + partial dto on miss.
    // Both shapes have `jobId` and `status`, so we type as JobStatusDto (superset).
    return this.api.postForm<JobStatusDto>(url, formData).pipe(
      switchMap((created) => {
        // Cache hit — result already complete, skip polling.
        if (created.status === 'Completed') {
          return of(created).pipe(map((s) => this.toExtractResult(s)));
        }
        // New job — poll until done.
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
