import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { AuthService } from '../services/auth.service';

/**
 * Functional HTTP interceptor — attaches `Authorization: Bearer <token>`
 * to every outgoing request EXCEPT those targeting `/api/auth/`
 * (login and register do not need a token).
 *
 * Registered in app.config.ts via provideHttpClient(withInterceptors([authInterceptor])).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.token();

  // Public auth endpoints — skip
  if (!token || req.url.includes('/api/auth/')) {
    return next(req);
  }

  const authedReq = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });

  return next(authedReq);
};
