export type ExtractionType = 'Digital' | 'Vision' | 'XmlCfdi';

// ── Job API shapes (async pipeline) ──────────────────────────────────────────

export interface JobCreatedDto {
  jobId: string;
  status: string;
  message: string;
}

export interface JobStatusDto {
  jobId: string;
  /** 'Queued' | 'Processing' | 'Completed' | 'Failed' */
  status: string;
  extractionType: ExtractionType | null;
  cfdiFields: CfdiFields | null;
  warnings: string[] | null;
  error: string | null;
}

// ── CFDI 4.0 domain models ────────────────────────────────────────────────────

export interface Concepto {
  claveProdServ: string | null;
  noIdentificacion: string | null;
  cantidad: number;
  claveUnidad: string | null;
  unidad: string | null;
  descripcion: string | null;
  valorUnitario: number;
  importe: number;
  descuento: number | null;
}

export interface Impuesto {
  base: string | null;
  impuesto: string | null;
  tipoFactor: string | null;
  tasaOCuota: string | null;
  importe: string | null;
}

export interface CfdiFields {
  version: string | null;
  serie: string | null;
  folio: string | null;
  fecha: string | null;
  formaPago: string | null;
  noCertificado: string | null;
  subTotal: string | null;
  descuento: string | null;
  moneda: string | null;
  tipoCambio: string | null;
  total: string | null;
  tipoDeComprobante: string | null;
  exportacion: string | null;
  metodoPago: string | null;
  lugarExpedicion: string | null;

  rfcEmisor: string | null;
  nombreEmisor: string | null;
  regimenFiscalEmisor: string | null;

  rfcReceptor: string | null;
  nombreReceptor: string | null;
  domicilioFiscalReceptor: string | null;
  regimenFiscalReceptor: string | null;
  usoCfdi: string | null;

  conceptos: Concepto[];

  totalImpuestosTrasladados: string | null;
  totalImpuestosRetenidos: string | null;

  impuestosTrasladados: Impuesto[];
  impuestosRetenidos: Impuesto[];

  uuid: string | null;
  fechaTimbrado: string | null;
  noCertificadoSat: string | null;

  /** Set when the extracted RfcReceptor matched a registered Receptor in DB (all file types). */
  receptorMatchId: string | null;
}

// ── View model used throughout the Angular app ────────────────────────────────
// Maps from JobStatusDto; ocrPages/totalPages/rawText are no longer returned
// by the backend but kept as optional so existing template code still compiles.

export interface ExtractResult {
  success: boolean;
  error: string | null;
  extractionType: ExtractionType | null;
  cfdiFields: CfdiFields | null;
  warnings: string[] | null;
  /** @deprecated not returned by async pipeline — always null */
  rawText: string | null;
  /** @deprecated not returned by async pipeline — always 0 */
  totalPages: number;
  /** @deprecated not returned by async pipeline — always 0 */
  ocrPages: number;
}
