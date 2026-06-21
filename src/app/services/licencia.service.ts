import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { CachedResource } from '../utils/cached-resource';

export interface SubirCsdResponse {
  numeroCertificado: string;
  vigencia:          string;
  rfcDelCertificado: string;
  tieneLlave:        boolean;
  mensaje:           string;
}

export interface FacturamaCsdStatus {
  sincronizado:      boolean;
  vigenciaFacturama: string | null;
  mensaje:           string;
}

export interface LicenciaDto {
  id:                          string;
  plan:                        string;
  fechaInicio:                 string;
  fechaVencimiento:            string;
  isActive:                    boolean;
  timbradosMensualesIncluidos: number;
  precioExcedenteMxn:          number;
  rfcEmisor:                   string;
  nombreEmisor:                string;
  regimenFiscal:               string;
  domicilioFiscal:             string;
  tieneCsd:                    boolean;
  numeroCertificado:           string | null;
  certificadoVigencia:         string | null;
}

@Injectable({ providedIn: 'root' })
export class LicenciaService {
  private readonly api = inject(ApiService);

  private readonly _licenciaCache  = new CachedResource<LicenciaDto>(10 * 60 * 1000);
  private readonly _csdStatusCache = new CachedResource<FacturamaCsdStatus>(10 * 60 * 1000);

  /** Datos de la licencia activa. `force = true` ignora TTL. */
  getLicencia(force = false): Observable<LicenciaDto> {
    return this._licenciaCache.load(() => this.api.get<LicenciaDto>('/api/licencia'), force);
  }

  /** Estado de sincronización del CSD con Facturama. `force = true` ignora TTL. */
  verificarCsdFacturama(force = false): Observable<FacturamaCsdStatus> {
    return this._csdStatusCache.load(
      () => this.api.get<FacturamaCsdStatus>('/api/licencia/csd/status'),
      force
    );
  }

  /** Sube .cer + .key + contraseña. Invalida ambos caches al completar. */
  subirCsd(cer: File, key: File, password: string): Observable<SubirCsdResponse> {
    const fd = new FormData();
    fd.append('certificado', cer);
    fd.append('llave', key);
    fd.append('password', password);
    return this.api.postForm<SubirCsdResponse>('/api/licencia/csd', fd).pipe(
      tap(() => {
        this._licenciaCache.invalidate();
        this._csdStatusCache.invalidate();
      })
    );
  }
}
