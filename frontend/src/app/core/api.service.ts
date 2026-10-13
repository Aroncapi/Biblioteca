import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  DashboardStats, FormatoExport, Libro, Prestamo, PrestamosPorMes, TipoReporte, Usuario
} from './models';

/** Todas las llamadas REST que antes hacían los controladores de vistas / fetch() de cada HTML. */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  // ---------- Libros ----------
  getLibros() { return this.http.get<Libro[]>('/api/libros'); }
  getLibro(id: number) { return this.http.get<Libro>(`/api/libros/${id}`); }
  crearLibro(l: Libro) { return this.http.post<Libro>('/api/libros', l); }
  actualizarLibro(id: number, l: Libro) { return this.http.put<Libro>(`/api/libros/${id}`, l); }
  eliminarLibro(id: number) { return this.http.delete<{ message: string }>(`/api/libros/${id}`); }

  // ---------- Usuarios (admin) ----------
  getUsuarios() { return this.http.get<Usuario[]>('/api/admin/usuarios'); }
  crearAlumno(u: Usuario) { return this.http.post<Usuario>('/api/admin/usuarios/alumno', u); }
  crearAdmin(u: Usuario) { return this.http.post<Usuario>('/api/admin/usuarios/admin', u); }
  actualizarUsuario(id: number, u: Usuario) { return this.http.put<Usuario>(`/api/admin/usuarios/${id}`, u); }
  eliminarUsuario(id: number) { return this.http.delete<{ message: string }>(`/api/admin/usuarios/${id}`); }

  // ---------- Perfil (cualquier rol) ----------
  actualizarPerfil(u: Usuario) {
    return this.http.put<{ message: string; usuario: Usuario }>('/api/usuarios/perfil', u);
  }
  cambiarPassword(passwordActual: string, passwordNueva: string) {
    return this.http.post<{ message: string }>('/api/usuarios/cambiar-password', { passwordActual, passwordNueva });
  }

  // ---------- Préstamos ----------
  getPrestamo(id: number) { return this.http.get<Prestamo>(`/api/prestamos/${id}`); }
  getTodosPrestamos() { return this.http.get<Prestamo[]>('/api/admin/prestamos'); }
  devolverAdmin(id: number) { return this.http.put<{ message: string; prestamo: Prestamo }>(`/api/admin/prestamos/devolver/${id}`, {}); }
  actualizarVencidos() { return this.http.post<{ message: string }>('/api/admin/prestamos/actualizar-vencidos', {}); }

  getMisPrestamos() { return this.http.get<Prestamo[]>('/api/alumno/mis-prestamos'); }
  getMisPrestamosActivos() { return this.http.get<Prestamo[]>('/api/alumno/mis-prestamos/activos'); }
  solicitarPrestamo(libroId: number) { return this.http.post<Prestamo>(`/api/alumno/prestamos/solicitar/${libroId}`, {}); }
  devolverMiLibro(prestamoId: number) { return this.http.put<Prestamo>(`/api/alumno/prestamos/devolver/${prestamoId}`, {}); }

  // ---------- Dashboard y reportes ----------
  getDashboard() { return this.http.get<DashboardStats>('/api/admin/dashboard'); }
  getPrestamosPorMes(meses = 6) {
    return this.http.get<PrestamosPorMes>('/api/admin/reportes/prestamos-por-mes', { params: { meses } });
  }

  getReporte(tipo: TipoReporte, params: Record<string, string | number> = {}): Observable<any> {
    return this.http.get<any>(`/api/admin/reportes/${tipo}`, { params: new HttpParams({ fromObject: params as any }) });
  }

  /** Descarga el reporte (PDF/XLSX/CSV) generado por el backend y lo guarda en el navegador. */
  exportarReporte(tipo: TipoReporte, formato: FormatoExport, params: Record<string, string | number> = {}) {
    return this.http.get(`/api/admin/reportes/${tipo}/export/${formato}`, {
      params: new HttpParams({ fromObject: params as any }),
      responseType: 'blob',
      observe: 'response'
    });
  }
}
