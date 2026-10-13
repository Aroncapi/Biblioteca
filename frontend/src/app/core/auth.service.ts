import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, of, switchMap, tap } from 'rxjs';
import { JwtResponse, Rol, Usuario } from './models';

const KEY = 'biblioteca_auth';

interface Sesion {
  token: string;
  id: number;
  email: string;
  rol: Rol;
}

/**
 * Autenticación con JWT (reemplaza al formLogin + sesión JSESSIONID de Thymeleaf).
 * - "Recordarme" activo  -> localStorage (persiste al cerrar el navegador)
 * - "Recordarme" inactivo -> sessionStorage (se borra al cerrar la pestaña)
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private sesion = signal<Sesion | null>(this.leer());
  readonly perfil = signal<Usuario | null>(null);

  readonly estaLogueado = computed(() => !!this.sesion());
  readonly rol = computed<Rol | null>(() => this.sesion()?.rol ?? null);
  readonly esAdmin = computed(() => this.sesion()?.rol === 'ADMIN');
  readonly esAlumno = computed(() => this.sesion()?.rol === 'ALUMNO');
  readonly email = computed(() => this.sesion()?.email ?? '');
  readonly nombreCompleto = computed(() => {
    const p = this.perfil();
    return p ? `${p.nombre} ${p.apellido}` : this.sesion()?.email ?? 'Usuario';
  });
  readonly token = computed(() => this.sesion()?.token ?? null);

  /** Ruta "home" según el rol (equivale a "/" y "/dashboard-redirect" de Thymeleaf). */
  rutaInicio(): string {
    const rol = this.rol();
    if (rol === 'ADMIN') return '/admin/dashboard';
    if (rol === 'ALUMNO') return '/catalogo';
    return '/login';
  }

  login(email: string, password: string, recordar: boolean): Observable<Usuario | null> {
    return this.http.post<JwtResponse>('/api/auth/login', { email, password }).pipe(
      tap(r => {
        const s: Sesion = { token: r.token, id: r.id, email: r.email, rol: r.rol };
        this.guardar(s, recordar);
        this.sesion.set(s);
      }),
      switchMap(() => this.cargarPerfil())
    );
  }

  registrarAlumno(datos: Usuario) {
    return this.http.post<Usuario>('/api/auth/register/alumno', datos);
  }

  cargarPerfil(): Observable<Usuario | null> {
    return this.http.get<Usuario>('/api/usuarios/perfil').pipe(
      tap(p => this.perfil.set(p)),
      catchError(() => of(null))
    );
  }

  logout(query: Record<string, string> = { logout: '1' }) {
    localStorage.removeItem(KEY);
    sessionStorage.removeItem(KEY);
    this.sesion.set(null);
    this.perfil.set(null);
    this.router.navigate(['/login'], { queryParams: query });
  }

  private guardar(s: Sesion, recordar: boolean) {
    localStorage.removeItem(KEY);
    sessionStorage.removeItem(KEY);
    (recordar ? localStorage : sessionStorage).setItem(KEY, JSON.stringify(s));
  }

  private leer(): Sesion | null {
    try {
      const raw = localStorage.getItem(KEY) ?? sessionStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as Sesion) : null;
    } catch {
      return null;
    }
  }
}
