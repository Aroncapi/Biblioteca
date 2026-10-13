import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/api.service';
import { NotifyService } from '../../../core/notify.service';
import { FormatoExport, Prestamo, TipoReporte } from '../../../core/models';
import { Paginator } from '../../../shared/paginator/paginator';

interface TipoInfo { id: TipoReporte; titulo: string; descripcion: string; icono: string; clase: string; }
interface ReporteVista { tipo: TipoReporte; titulo: string; fecha: string; total: number; columnas: string[]; filas: (string | number)[][]; }

@Component({
  selector: 'app-reportes',
  imports: [FormsModule, Paginator],
  templateUrl: './reportes.html'
})
export class Reportes {
  private api = inject(ApiService);
  private notify = inject(NotifyService);

  tipos: TipoInfo[] = [
    { id: 'prestamos-activos', titulo: 'Préstamos Activos', descripcion: 'Libros que actualmente están en manos de los alumnos.', icono: 'bi-check-circle', clase: 'success' },
    { id: 'prestamos-vencidos', titulo: 'Préstamos Vencidos', descripcion: 'Préstamos que superaron la fecha de devolución.', icono: 'bi-exclamation-triangle', clase: 'danger' },
    { id: 'top-libros', titulo: 'Top 10 Libros', descripcion: 'Los libros más solicitados de la biblioteca.', icono: 'bi-trophy', clase: 'warning' },
    { id: 'usuarios-activos', titulo: 'Usuarios Más Activos', descripcion: 'Alumnos con mayor cantidad de préstamos.', icono: 'bi-people', clase: 'primary' },
    { id: 'estadisticas-categorias', titulo: 'Estadísticas por Categoría', descripcion: 'Libros y préstamos agrupados por categoría.', icono: 'bi-pie-chart', clase: 'info' },
    { id: 'historial', titulo: 'Historial por Fechas', descripcion: 'Todos los préstamos dentro de un rango de fechas.', icono: 'bi-calendar-range', clase: 'secondary' }
  ];

  fechaInicio = '';
  fechaFin = '';
  generando = signal<TipoReporte | null>(null);
  reporte = signal<ReporteVista | null>(null);
  pagina = signal(1);

  visibles = computed(() => {
    const r = this.reporte();
    return r ? r.filas.slice((this.pagina() - 1) * 10, this.pagina() * 10) : [];
  });

  private params(tipo: TipoReporte): Record<string, string | number> | null {
    if (tipo === 'historial') {
      if (!this.fechaInicio || !this.fechaFin) { this.notify.aviso('⚠️ Por favor seleccione ambas fechas'); return null; }
      if (this.fechaInicio > this.fechaFin) { this.notify.error('❌ La fecha de inicio no puede ser mayor a la fecha fin'); return null; }
      return { fechaInicio: this.fechaInicio, fechaFin: this.fechaFin };
    }
    if (tipo === 'top-libros' || tipo === 'usuarios-activos') return { limite: 10 };
    return {};
  }

  generar(tipo: TipoReporte) {
    const params = this.params(tipo);
    if (!params) return;
    this.generando.set(tipo);
    this.api.getReporte(tipo, params).subscribe({
      next: data => {
        this.reporte.set(this.armar(tipo, data));
        this.pagina.set(1);
        this.generando.set(null);
        setTimeout(() => document.getElementById('resultadoReporte')?.scrollIntoView({ behavior: 'smooth' }), 50);
      },
      error: err => { this.generando.set(null); this.notify.error('❌ Error al generar reporte: ' + this.notify.mensajeError(err)); }
    });
  }

  exportar(formato: FormatoExport) {
    const r = this.reporte();
    if (!r) { this.notify.aviso('⚠️ Primero genere un reporte para exportar'); return; }
    const params = this.params(r.tipo);
    if (!params) return;
    this.notify.cargando('Generando archivo...', formato.toUpperCase());
    this.api.exportarReporte(r.tipo, formato, params).subscribe({
      next: resp => {
        this.notify.cerrar();
        const cd = resp.headers.get('content-disposition') ?? '';
        const nombre = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(cd)?.[1] ?? `reporte-${r.tipo}.${formato}`;
        const url = URL.createObjectURL(resp.body as Blob);
        const a = document.createElement('a');
        a.href = url; a.download = decodeURIComponent(nombre); a.click();
        URL.revokeObjectURL(url);
        this.notify.ok('✅ Reporte exportado correctamente');
      },
      error: err => { this.notify.cerrar(); this.notify.error('❌ No se pudo exportar: ' + this.notify.mensajeError(err)); }
    });
  }

  imprimir() {
    if (!this.reporte()) { this.notify.aviso('⚠️ No hay reporte para imprimir'); return; }
    window.print();
  }

  private fecha(iso: string | null | undefined) {
    if (!iso) return '—';
    const d = new Date(iso);
    const p = (n: number) => String(n).padStart(2, '0');
    return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }

  private armar(tipo: TipoReporte, data: any): ReporteVista {
    const base = { tipo, titulo: data.titulo ?? 'Reporte', fecha: this.fecha(data.fechaGeneracion) };
    switch (tipo) {
      case 'prestamos-activos':
      case 'prestamos-vencidos':
      case 'historial': {
        const lista: Prestamo[] = data.prestamos ?? [];
        return {
          ...base, total: lista.length,
          columnas: ['ID', 'Alumno', 'Email', 'Libro', 'Código', 'Fecha Préstamo', 'Fecha Devolución', 'Estado'],
          filas: lista.map(p => [p.id, p.usuarioNombre, p.usuarioEmail, p.libroNombre, p.libroCodigo,
            this.fecha(p.fechaPrestamo), this.fecha(p.fechaDevolucionReal ?? p.fechaDevolucionEstimada), p.estado])
        };
      }
      case 'top-libros': {
        const lista: any[] = data.topLibros ?? [];
        return {
          ...base, total: lista.length, columnas: ['#', 'Libro', 'Código', 'Categoría', 'Total Préstamos'],
          filas: lista.map((l, i) => [i + 1, l.libroNombre, l.libroCodigo, l.categoria, l.totalPrestamos])
        };
      }
      case 'usuarios-activos': {
        const lista: any[] = data.usuarios ?? [];
        return {
          ...base, total: lista.length, columnas: ['#', 'Usuario', 'Total Préstamos'],
          filas: lista.map((u, i) => [i + 1, u.usuario, u.totalPrestamos])
        };
      }
      default: {
        const libros: Record<string, number> = data.librosPorCategoria ?? {};
        const prest: Record<string, number> = data.prestamosPorCategoria ?? {};
        const cats = Array.from(new Set([...Object.keys(libros), ...Object.keys(prest)])).sort();
        const totalPrest = Object.values(prest).reduce((s, n) => s + n, 0);
        return {
          ...base, total: cats.length, columnas: ['Categoría', 'Libros', 'Préstamos', 'Porcentaje'],
          filas: cats.map(c => [c, libros[c] ?? 0, prest[c] ?? 0, totalPrest ? ((prest[c] ?? 0) * 100 / totalPrest).toFixed(1) + '%' : '0%'])
        };
      }
    }
  }
}
