import { Routes } from '@angular/router';
import { adminGuard, alumnoGuard, guestGuard, inicioGuard } from './core/guards';
import { Shell } from './shared/shell/shell';

export const routes: Routes = [
  { path: '', pathMatch: 'full', canActivate: [inicioGuard], children: [] },

  { path: 'login', canActivate: [guestGuard], loadComponent: () => import('./pages/auth/login/login').then(m => m.Login), title: 'Iniciar Sesión - Biblioteca Escolar' },
  { path: 'registro', canActivate: [guestGuard], loadComponent: () => import('./pages/auth/register/register').then(m => m.Register), title: 'Registro - Biblioteca Escolar' },

  {
    path: 'admin',
    component: Shell,
    canActivate: [adminGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', loadComponent: () => import('./pages/admin/dashboard/dashboard').then(m => m.Dashboard), title: 'Dashboard Administrador - Biblioteca Escolar' },
      { path: 'libros', loadComponent: () => import('./pages/admin/libros/libros').then(m => m.Libros), title: 'Gestión de Libros - Biblioteca Escolar' },
      { path: 'usuarios', loadComponent: () => import('./pages/admin/usuarios/usuarios').then(m => m.Usuarios), title: 'Gestión de Usuarios - Biblioteca Escolar' },
      { path: 'prestamos', loadComponent: () => import('./pages/admin/prestamos/prestamos').then(m => m.Prestamos), title: 'Gestión de Préstamos - Biblioteca Escolar' },
      { path: 'reportes', loadComponent: () => import('./pages/admin/reportes/reportes').then(m => m.Reportes), title: 'Reportes - Biblioteca Escolar' },
      { path: 'perfil', loadComponent: () => import('./pages/admin/perfil/perfil').then(m => m.AdminPerfil), title: 'Mi Perfil - Biblioteca Escolar' }
    ]
  },

  {
    path: '',
    component: Shell,
    canActivate: [alumnoGuard],
    children: [
      { path: 'catalogo', loadComponent: () => import('./pages/alumno/catalogo/catalogo').then(m => m.Catalogo), title: 'Catálogo - Biblioteca Escolar' },
      { path: 'mis-prestamos', loadComponent: () => import('./pages/alumno/mis-prestamos/mis-prestamos').then(m => m.MisPrestamos), title: 'Mis Préstamos - Biblioteca Escolar' },
      { path: 'perfil', loadComponent: () => import('./pages/alumno/perfil/perfil').then(m => m.AlumnoPerfil), title: 'Mi Perfil - Biblioteca Escolar' }
    ]
  },

  { path: '403', loadComponent: () => import('./pages/error/error-page').then(m => m.ErrorPage), data: { codigo: 403 }, title: 'Acceso denegado' },
  { path: '500', loadComponent: () => import('./pages/error/error-page').then(m => m.ErrorPage), data: { codigo: 500 }, title: 'Error del servidor' },
  { path: '404', loadComponent: () => import('./pages/error/error-page').then(m => m.ErrorPage), data: { codigo: 404 }, title: 'Página no encontrada' },
  { path: '**', loadComponent: () => import('./pages/error/error-page').then(m => m.ErrorPage), data: { codigo: 404 }, title: 'Página no encontrada' }
];
