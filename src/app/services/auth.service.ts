import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import {
  AuthUser,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
} from '../models/auth.models';

const TOKEN_KEY = 'timbrapp_token';
const USER_KEY  = 'timbrapp_user';

/**
 * Manages authentication state for the app.
 *
 * - Persists JWT + user snapshot in localStorage across page reloads.
 * - Exposes reactive signals: `token`, `currentUser`, `isLoggedIn`.
 * - `AuthInterceptor` reads `token()` to attach Bearer headers automatically.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);

  /** Raw JWT. Null when the user is not logged in. */
  readonly token = signal<string | null>(localStorage.getItem(TOKEN_KEY));

  /** Parsed session snapshot. Null when logged out. */
  readonly currentUser = signal<AuthUser | null>(this.restoreUser());

  /** True iff a valid token is present in memory. */
  readonly isLoggedIn = computed(() => this.token() !== null);

  // ── Auth endpoints ─────────────────────────────────────────────────────────

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.api
      .post<LoginResponse>('/api/auth/login', request)
      .pipe(tap((res) => this.persist(res)));
  }

  register(request: RegisterRequest): Observable<LoginResponse> {
    return this.api
      .post<LoginResponse>('/api/auth/register', request)
      .pipe(tap((res) => this.persist(res)));
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.token.set(null);
    this.currentUser.set(null);
  }

  // ── Internals ──────────────────────────────────────────────────────────────

  private persist(response: LoginResponse): void {
    const user: AuthUser = {
      email:          response.email,
      nombreCompleto: response.nombreCompleto,
      plan:           response.plan,
      licenciaId:     response.licenciaId,
      rfcEmisor:      response.rfcEmisor,
      nombreEmisor:   response.nombreEmisor,
    };
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.token.set(response.token);
    this.currentUser.set(user);
  }

  private restoreUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  }
}
