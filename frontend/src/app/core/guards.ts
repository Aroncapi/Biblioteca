import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** Solo usuarios con sesión iniciada. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.estaLogueado() ? true : inject(Router).createUrlTree(['/login']);
};

/** Solo ADMIN (equivale a hasRole('ADMIN') sobre /admin/**). */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.estaLogueado()) return router.createUrlTree(['/login']);
  return auth.esAdmin() ? true : router.createUrlTree(['/403']);
};

/** Solo ALUMNO (equivale a hasRole('ALUMNO') sobre las vistas del alumno). */
export const alumnoGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.estaLogueado()) return router.createUrlTree(['/login']);
  return auth.esAlumno() ? true : router.createUrlTree(['/403']);
};

/** Login/registro: si ya hay sesión, manda al inicio del rol. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.estaLogueado() ? inject(Router).createUrlTree([auth.rutaInicio()]) : true;
};

/** Reemplaza al "/" de ViewController: redirige según el rol. */
export const inicioGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return inject(Router).createUrlTree([auth.estaLogueado() ? auth.rutaInicio() : '/login']);
};
