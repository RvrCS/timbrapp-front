import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

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

  getLicencia(): Observable<LicenciaDto> {
    return this.api.get<LicenciaDto>('/api/licencia');
  }

  verificarCsdFacturama(): Observable<FacturamaCsdStatus> {
    return this.api.get<FacturamaCsdStatus>('/api/licencia/csd/status');
  }

  subirCsd(cer: File, key: File, password: string): Observable<SubirCsdResponse> {
    const fd = new FormData();
    fd.append('certificado', cer);
    fd.append('llave', key);
    fd.append('password', password);
    return this.api.postForm<SubirCsdResponse>('/api/licencia/csd', fd);
  }
}
