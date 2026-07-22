export type ExtractionType = 'Digital' | 'Vision' | 'XmlCfdi';

// ── Job API shapes (async pipeline) ──────────────────────────────────────────

export interface JobCreatedDto {
  jobId: string;
  status: string;
  message: string;
}

export interface JobStatusDto {
  jobId: string;
  /** 'Completed' | 'Ready' | 'Failed' — 'Ready' means call POST /api/invoice/extract/analyze next. */
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

/** Documento relacionado de un pago (complemento de Pagos 2.0 / REP). */
export interface DoctoRelacionadoPago {
  uuid: string | null;
  serie: string | null;
  folio: string | null;
  moneda: string | null;
  numParcialidad: string | null;
  impSaldoAnt: number;
  impPagado: number;
  impSaldoInsoluto: number;
  metodoPagoDR: string | null;
  objetoImpDR: string | null;
}

/** Datos del pago (complemento de Pagos 2.0 / REP) para tipoDeComprobante "P". */
export interface Pago {
  fechaPago: string | null;
  formaDePagoP: string | null;
  monto: number;
  numOperacion: string | null;
  doctosRelacionados: DoctoRelacionadoPago[] | null;
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

  /** SAT catalog c_TipoRelacion. Required when tipoDeComprobante === 'E'. */
  tipoRelacion: string | null;
  /** UUIDs of the CFDIs this Egreso relates to. Required when tipoDeComprobante === 'E'. */
  cfdiRelacionados: string[] | null;

  /** Complemento de Pagos 2.0 / REP. Required when tipoDeComprobante === 'P'. */
  pago: Pago | null;
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

// ── Upload/extraction progress (InvoiceService.extractInvoice) ─────────────────
// 'uploading' carries a real % from the S3 PUT's HttpProgressEvent. 'preparing' and
// 'analyzing' have no finer-grained real signal (each is one synchronous backend
// call) — 'analyzing' only ever appears when the backend actually needs the
// extractor Lambda (POST /extract responded "Ready"); cache hits and XML skip
// straight from 'preparing' to 'done'.

export type UploadStageEvent =
  | { stage: 'uploading'; percent: number }
  | { stage: 'preparing' }
  | { stage: 'analyzing' }
  | { stage: 'done'; result: ExtractResult };

// ── Manual invoice entry (no file upload) ──────────────────────────────────────

/**
 * Blank CfdiFields for the "factura manual" flow — same shape PreviewComponent
 * expects from a real extraction, just empty. `conceptos`/`impuestosTrasladados`/
 * `impuestosRetenidos` must stay `[]` (non-nullable in CfdiFields), and the object
 * itself must never be null — PreviewComponent.ngOnInit writes to `draft!.lugarExpedicion`
 * unconditionally once `result().cfdiFields` is set.
 */
export function buildBlankCfdiFields(): CfdiFields {
  return {
    version: '4.0', serie: null, folio: null, fecha: null,
    formaPago: '01', noCertificado: null, subTotal: '0', descuento: null,
    moneda: 'MXN', tipoCambio: null, total: '0',
    tipoDeComprobante: 'I', exportacion: '01', metodoPago: 'PUE', lugarExpedicion: null,
    rfcEmisor: null, nombreEmisor: null, regimenFiscalEmisor: null,
    rfcReceptor: null, nombreReceptor: null, domicilioFiscalReceptor: null,
    regimenFiscalReceptor: null, usoCfdi: null,
    conceptos: [],
    totalImpuestosTrasladados: null, totalImpuestosRetenidos: null,
    impuestosTrasladados: [], impuestosRetenidos: [],
    uuid: null, fechaTimbrado: null, noCertificadoSat: null,
    receptorMatchId: null, tipoRelacion: null, cfdiRelacionados: null, pago: null,
  };
}

/** Wraps buildBlankCfdiFields() in the ExtractResult shape PreviewComponent's `result` input expects. */
export function buildManualExtractResult(): ExtractResult {
  return {
    success: true, error: null, extractionType: null,
    cfdiFields: buildBlankCfdiFields(), warnings: null,
    rawText: null, totalPages: 0, ocrPages: 0,
  };
}
