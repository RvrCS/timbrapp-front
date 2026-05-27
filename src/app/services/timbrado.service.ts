import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { TimbrarRequest, TimbradoDto, TimbradoUsoDto } from '../models/timbrado.models';

/**
 * Wraps the TimbradoController endpoints:
 *   POST /api/timbrado          → stamp a CFDI via Facturama
 *   GET  /api/timbrado          → list with optional ?anio=&mes= filters
 *   GET  /api/timbrado/{id}     → single timbrado detail
 *
 * Auth headers are added automatically by AuthInterceptor.
 */
@Injectable({ providedIn: 'root' })
export class TimbradoService {
  private readonly api = inject(ApiService);

  timbrar(request: TimbrarRequest): Observable<TimbradoDto> {
    return this.api.post<TimbradoDto>('/api/timbrado', request);
  }

  list(anio?: number, mes?: number): Observable<TimbradoDto[]> {
    const params: string[] = [];
    if (anio !== undefined) params.push(`anio=${anio}`);
    if (mes  !== undefined) params.push(`mes=${mes}`);
    const qs = params.length ? `?${params.join('&')}` : '';
    return this.api.get<TimbradoDto[]>(`/api/timbrado${qs}`);
  }

  getById(id: string): Observable<TimbradoDto> {
    return this.api.get<TimbradoDto>(`/api/timbrado/${id}`);
  }

  getUso(): Observable<TimbradoUsoDto> {
    return this.api.get<TimbradoUsoDto>('/api/timbrado/uso');
  }

  // ── Download helpers ────────────────────────────────────────────────────────

  /** Opens the XML as a download from a base64 string */
  downloadXml(t: TimbradoDto): void {
    if (!t.xmlBase64) return;
    const blob  = this.b64ToBlob(t.xmlBase64, 'application/xml');
    const fname = `CFDI_${t.uuid ?? t.id}.xml`;
    this.triggerDownload(blob, fname);
  }

  /** Opens the PDF as a download from a base64 string */
  downloadPdf(t: TimbradoDto): void {
    if (!t.pdfBase64) return;
    const blob  = this.b64ToBlob(t.pdfBase64, 'application/pdf');
    const fname = `CFDI_${t.uuid ?? t.id}.pdf`;
    this.triggerDownload(blob, fname);
  }

  private b64ToBlob(b64: string, mime: string): Blob {
    const binary = atob(b64);
    const bytes  = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  }

  private triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href    = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
