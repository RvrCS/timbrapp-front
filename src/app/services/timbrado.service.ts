import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { TimbrarRequest, TimbradoDto, TimbradoUsoDto } from '../models/timbrado.models';
import { CachedResource, KeyedCachedResource } from '../utils/cached-resource';

/**
 * Wraps the TimbradoController endpoints:
 *   POST /api/timbrado          → stamp a CFDI via Facturama
 *   GET  /api/timbrado          → list with optional ?anio=&mes= filters
 *   GET  /api/timbrado/{id}     → single timbrado detail
 *   GET  /api/timbrado/uso      → monthly usage counters
 *
 * Lists are cached per filter combination (TTL 3 min).
 * After timbrar(), all list buckets + uso cache are invalidated so the next
 * fetch reflects the new timbrado.
 */
@Injectable({ providedIn: 'root' })
export class TimbradoService {
  private readonly api = inject(ApiService);

  private readonly _listCache = new KeyedCachedResource<TimbradoDto[]>(3 * 60 * 1000);
  private readonly _usoCache  = new CachedResource<TimbradoUsoDto>(3 * 60 * 1000);

  timbrar(request: TimbrarRequest): Observable<TimbradoDto> {
    return this.api.post<TimbradoDto>('/api/timbrado', request).pipe(
      tap(() => {
        // A new timbrado affects every filter bucket and the uso counter.
        this._listCache.invalidateAll();
        this._usoCache.invalidate();
      })
    );
  }

  /**
   * Returns the timbrado list for the given filters.
   * Returns cache if fresh (TTL 3 min); set `force = true` to bypass.
   */
  list(anio?: number, mes?: number, force = false): Observable<TimbradoDto[]> {
    const key = `${anio ?? ''}|${mes ?? ''}`;
    const params: string[] = [];
    if (anio !== undefined) params.push(`anio=${anio}`);
    if (mes  !== undefined) params.push(`mes=${mes}`);
    const qs = params.length ? `?${params.join('&')}` : '';
    return this._listCache.load(key, () => this.api.get<TimbradoDto[]>(`/api/timbrado${qs}`), force);
  }

  getById(id: string): Observable<TimbradoDto> {
    return this.api.get<TimbradoDto>(`/api/timbrado/${id}`);
  }

  /** Monthly usage counters. Returns cache if fresh (TTL 3 min). */
  getUso(force = false): Observable<TimbradoUsoDto> {
    return this._usoCache.load(() => this.api.get<TimbradoUsoDto>('/api/timbrado/uso'), force);
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
