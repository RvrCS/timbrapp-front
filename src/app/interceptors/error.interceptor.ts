import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Intercepts 401 responses from the API and logs the user out.
 * Covers the case where a token was revoked on another device (e.g. after
 * a password change) so the UI doesn't stay stuck in an authenticated-but-
 * unauthorized state.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router      = inject(Router);

  return next(req).pipe(
    catchError((err) => {
      if (err.status === 401) {
        authService.logout();
        router.navigate(['/login']);
      }
      return throwError(() => err);
    })
  );
};
