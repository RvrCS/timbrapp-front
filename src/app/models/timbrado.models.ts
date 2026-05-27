import { CfdiFields } from './cfdi.models';

// ── Uso / Plan ───────────────────────────────────────────────────────────────

export interface TimbradoUsoDto {
  anio:               number;
  mes:                number;
  incluidos:          number;
  realizados:         number;
  excedentes:         number;
  precioExcedenteMxn: number;
  costoExcedentesMxn: number;
  esPlanIlimitado:    boolean;
}

// ── Request ─────────────────────────────────────────────────────────────────

export interface TimbrarRequest {
  receptorId:     string;
  camposExtraidos: CfdiFields;
  /** Overrides el FormaPago detectado (ej. '01' = efectivo) */
  formaPago?:     string | null;
  /** Overrides el MetodoPago detectado (ej. 'PUE' = pago en una sola exhibición) */
  metodoPago?:    string | null;
  serie?:         string | null;
  folio?:         string | null;
}

// ── Response ─────────────────────────────────────────────────────────────────

export interface TimbradoDto {
  id:             string;
  licenciaId:     string;
  receptorId:     string;
  nombreReceptor: string | null;
  rfcReceptor:    string | null;
  fechaEmision:   string;        // ISO-8601
  fechaTimbrado:  string | null; // ISO-8601
  uuid:           string | null;
  serie:          string | null;
  folio:          string | null;
  total:          number;
  tipoComprobante: string | null;
  formaPago:      string | null;
  metodoPago:     string | null;
  /** Base64-encoded XML (CFDI timbrado) */
  xmlBase64:      string | null;
  /** Base64-encoded PDF */
  pdfBase64:      string | null;
  extractionType: string | null;
  errorFacturama: string | null;
}
