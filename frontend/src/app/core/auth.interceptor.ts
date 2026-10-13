import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * Agrega "Authorization: Bearer <token>" a todas las llamadas a /api
 * y cierra la sesión si el servidor responde 401 (token vencido/inválido).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token();
  const esApi = req.url.startsWith('/api');
  const esLogin = req.url.startsWith('/api/auth/');

  const peticion = esApi && token && !esLogin
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(peticion).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && esApi && !esLogin && auth.estaLogueado()) {
        auth.logout({ expired: '1' });
      }
      return throwError(() => err);
    })
  );
};
