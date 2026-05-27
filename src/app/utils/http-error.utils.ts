export interface ParsedError {
  message: string;
  details: string[];
}

/** Maps ASP.NET ModelState keys to human-readable Spanish labels. */
const MODEL_STATE_LABELS: Record<string, string> = {
  'cfdiToCreate.Receiver.Rfc':           'RFC del Receptor',
  'cfdiToCreate.Receiver.Name':          'Nombre del Receptor',
  'cfdiToCreate.Receiver.FiscalAddress': 'C.P. del Receptor',
  'cfdiToCreate.Receiver.TaxZipCode':    'C.P. del Receptor',
  'cfdiToCreate.Receiver.FiscalRegime':  'Régimen Fiscal del Receptor',
  'cfdiToCreate.Receiver.CfdiUse':       'Uso del CFDI',
  'cfdiToCreate.Issuer.Rfc':             'RFC del Emisor',
  'cfdiToCreate.Issuer.Name':            'Nombre del Emisor',
  'cfdiToCreate.Issuer.FiscalRegime':    'Régimen Fiscal del Emisor',
  'cfdiToCreate.PaymentMethod':          'Método de Pago',
  'cfdiToCreate.PaymentForm':            'Forma de Pago',
  'cfdiToCreate.ExpeditionPlace':        'Lugar de Expedición',
  'cfdiToCreate.Date':                   'Fecha',
  'cfdiToCreate.Currency':               'Moneda',
  'cfdiToCreate.ExportationCode':        'Exportación',
  'cfdiToCreate.SubTotal':               'Subtotal',
  'cfdiToCreate.Total':                  'Total',
};

function labelFor(key: string): string {
  if (MODEL_STATE_LABELS[key]) return MODEL_STATE_LABELS[key];
  // Fallback: last dotted segment, split on capital letters
  const last = key.split('.').pop() ?? key;
  return last.replace(/([A-Z])/g, ' $1').trim();
}

/**
 * Parses any Angular HttpErrorResponse into a structured error with a main
 * message and optional field-level detail lines.
 *
 * Handles:
 *  - Network / CORS errors (status 0)
 *  - ASP.NET ModelState 400 { Message, ModelState: { field: string[] } }
 *  - Standard API bodies { message | Message | error | title }
 *  - Plain string bodies
 */
export function parseHttpError(err: unknown, fallback: string): ParsedError {
  if (!err || typeof err !== 'object') {
    return { message: fallback, details: [] };
  }

  const e = err as Record<string, any>;

  if (e['status'] === 0) {
    return { message: 'Sin conexión con el servidor. Revisa tu red e intenta de nuevo.', details: [] };
  }

  const body = e['error'];

  if (!body) {
    return { message: (e['message'] as string) ?? fallback, details: [] };
  }

  if (typeof body === 'string') {
    return { message: body || fallback, details: [] };
  }

  // ASP.NET ModelState validation error (400)
  if (body['ModelState'] && typeof body['ModelState'] === 'object') {
    const details: string[] = Object.entries(body['ModelState'] as Record<string, string[]>)
      .flatMap(([key, msgs]) =>
        (Array.isArray(msgs) ? msgs : [String(msgs)]).map(m => `${labelFor(key)}: ${m}`)
      );
    return {
      message: body['Message'] ?? body['message'] ?? 'La solicitud contiene errores de validación.',
      details,
    };
  }

  const msg: string =
    body['message'] ??
    body['Message'] ??
    body['error']   ??
    body['title']   ??
    fallback;

  return { message: msg, details: [] };
}

/** Collapses a ParsedError into a single string for inline/compact displays. */
export function formatHttpError(err: unknown, fallback: string): string {
  const { message, details } = parseHttpError(err, fallback);
  if (details.length === 0) return message;
  return `${message} — ${details.join('; ')}`;
}
