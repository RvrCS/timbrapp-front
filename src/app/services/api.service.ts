import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * Generic HTTP wrapper for all backend calls.
 *
 * - Builds full URLs from `environment.apiBaseUrl`.
 * - Does NOT handle auth headers directly — those are added by
 *   `AuthInterceptor` for every request whose URL does NOT contain `/api/auth/`.
 *
 * Usage:
 *   this.api.get<Cliente[]>('/api/clientes')
 *   this.api.post<LoginResponse>('/api/auth/login', body)   ← no token added
 *   this.api.postForm<JobCreatedDto>('/api/invoice/extract', formData)
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  private url(path: string): string {
    // Avoids double slashes if path already starts with /
    return `${environment.apiBaseUrl}${path}`;
  }

  /** GET — expects JSON response */
  get<T>(path: string): Observable<T> {
    return this.http.get<T>(this.url(path));
  }

  /** POST with JSON body */
  post<T>(path: string, body: unknown): Observable<T> {
    return this.http.post<T>(this.url(path), body);
  }

  /** POST with FormData (multipart/form-data — for file uploads) */
  postForm<T>(path: string, formData: FormData): Observable<T> {
    return this.http.post<T>(this.url(path), formData);
  }

  /** PUT with JSON body */
  put<T>(path: string, body: unknown): Observable<T> {
    return this.http.put<T>(this.url(path), body);
  }

  /** DELETE */
  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(this.url(path));
  }

  /** PUT raw file bytes directly to an external URL (e.g. S3 presigned). No auth header added. */
  putS3(presignedUrl: string, file: File): Observable<string> {
    return this.http.put(presignedUrl, file, {
      headers: { 'Content-Type': file.type },
      responseType: 'text',
    });
  }
}
