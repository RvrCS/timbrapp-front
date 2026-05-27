// ── Requests ──────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  nombreCompleto?: string;
  rfcEmisor?: string;
  nombreEmisor?: string;
  regimenFiscal?: string;
  domicilioFiscal?: string;
}

// ── Responses ─────────────────────────────────────────────────────────────────

export interface LoginResponse {
  token: string;
  expiresAt: string;
  email: string;
  nombreCompleto: string | null;
  plan: string;
  licenciaId: string | null;
  rfcEmisor: string | null;
  nombreEmisor: string | null;
}

// ── Session snapshot stored in localStorage ───────────────────────────────────

export interface AuthUser {
  email: string;
  nombreCompleto: string | null;
  plan: string;
  licenciaId: string | null;
  rfcEmisor: string | null;
  nombreEmisor: string | null;
}
