import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/api.service';
import { NotifyService } from '../../../core/notify.service';
import { Prestamo } from '../../../core/models';
import { Modal } from '../../../shared/modal/modal';
import { Paginator } from '../../../shared/paginator/paginator';

type Pestana = 'TODOS' | 'ACTIVO' | 'VENCIDO' | 'DEVUELTO';

@Component({
  selector: 'app-prestamos',
  imports: [DatePipe, FormsModule, Modal, Paginator],
  templateUrl: './prestamos.html'
})
export class Prestamos {
  private api = inject(ApiService);
  private notify = inject(NotifyService);

  prestamos = signal<Prestamo[]>([]);
  cargando = signal(true);
  pestana = signal<Pestana>('ACTIVO');
  busqueda = signal('');
  fechaDesde = signal('');
  pagina = signal(1);

  hoy = new Date();
  detalle = signal<Prestamo | null>(null);
  porDevolver = signal<Prestamo | null>(null);

  activos = computed(() => this.prestamos().filter(p => p.estado === 'ACTIVO'));
  vencidos = computed(() => this.prestamos().filter(p => p.estado === 'VENCIDO'));
  devueltos = computed(() => this.prestamos().filter(p => p.estado === 'DEVUELTO'));
  totalDiasRetraso = computed(() => this.vencidos().reduce((s, p) => s + (p.diasRetraso ?? 0), 0));

  filtrados = computed(() => {
    const est = this.pestana();
    const q = this.busqueda().trim().toLowerCase();
    const desde = this.fechaDesde();
    return this.prestamos().filter(p => {
      if (est !== 'TODOS' && p.estado !== est) return false;
      if (desde && p.fechaPrestamo.substring(0, 10) < desde) return false;
      if (q && ![p.usuarioNombre, p.usuarioEmail, p.libroNombre, p.libroCodigo].join(' ').toLowerCase().includes(q)) return false;
      return true;
    });
  });
  visibles = computed(() => this.filtrados().slice((this.pagina() - 1) * 10, this.pagina() * 10));

  constructor() { this.cargar(); }

  cargar() {
    this.api.getTodosPrestamos().subscribe({
      next: p => { this.prestamos.set(p); this.cargando.set(false); },
      error: err => { this.cargando.set(false); this.notify.error(this.notify.mensajeError(err, 'No se pudieron cargar los préstamos')); }
    });
  }

  cambiarPestana(p: Pestana) { this.pestana.set(p); this.pagina.set(1); }
  buscar(v: string) { this.busqueda.set(v); this.pagina.set(1); }
  filtrarFecha(v: string) { this.fechaDesde.set(v); this.pagina.set(1); }
  limpiar() { this.busqueda.set(''); this.fechaDesde.set(''); this.pagina.set(1); }

  verDetalle(p: Prestamo) {

    this.detalle.set(p);
    this.api.getPrestamo(p.id).subscribe({ next: d => this.detalle.set(d), error: () => {} });
  }

  confirmarDevolucion() {
    const p = this.porDevolver();
    if (!p) return;
    this.notify.cargando('Registrando devolución...');
    this.api.devolverAdmin(p.id).subscribe({
      next: () => {
        this.notify.cerrar();
        this.notify.ok('✅ Devolución registrada correctamente');
        this.porDevolver.set(null);
        this.cargar();
      },
      error: err => { this.notify.cerrar(); this.notify.error('❌ Error: ' + this.notify.mensajeError(err)); }
    });
  }

  async actualizarVencidos() {
    if (!(await this.notify.confirmar('¿Actualizar el estado de préstamos vencidos?'))) return;
    this.api.actualizarVencidos().subscribe({
      next: () => { this.notify.ok('✅ Préstamos vencidos actualizados'); this.cargar(); },
      error: err => this.notify.error('❌ ' + this.notify.mensajeError(err, 'Error al actualizar'))
    });
  }

  clase(estado: string) { return estado === 'ACTIVO' ? 'success' : estado === 'VENCIDO' ? 'danger' : 'info'; }
}
