import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../../core/api.service';
import { NotifyService } from '../../../core/notify.service';
import { Prestamo } from '../../../core/models';
import { Modal } from '../../../shared/modal/modal';
import { Paginator } from '../../../shared/paginator/paginator';

type Pestana = 'TODOS' | 'ACTIVO' | 'DEVUELTO' | 'VENCIDO';

@Component({
  selector: 'app-mis-prestamos',
  imports: [DatePipe, Modal, Paginator],
  templateUrl: './mis-prestamos.html'
})
export class MisPrestamos {
  private api = inject(ApiService);
  private notify = inject(NotifyService);

  hoy = new Date();
  todos = signal<Prestamo[]>([]);
  cargando = signal(true);
  pestana = signal<Pestana>('TODOS');
  pagina = signal(1);
  detalle = signal<Prestamo | null>(null);

  activos = computed(() => this.todos().filter(p => p.estado === 'ACTIVO'));
  devueltos = computed(() => this.todos().filter(p => p.estado === 'DEVUELTO'));
  vencidos = computed(() => this.todos().filter(p => p.estado === 'VENCIDO'));
  ultimasDevoluciones = computed(() => this.devueltos().slice(0, 3));

  lista = computed(() => {
    const e = this.pestana();
    return e === 'TODOS' ? this.todos() : this.todos().filter(p => p.estado === e);
  });
  visibles = computed(() => this.lista().slice((this.pagina() - 1) * 10, this.pagina() * 10));

  constructor() { this.cargar(); }

  cargar() {
    this.api.getMisPrestamos().subscribe({
      next: p => { this.todos.set(p); this.cargando.set(false); },
      error: err => { this.cargando.set(false); this.notify.error(this.notify.mensajeError(err, 'No se pudieron cargar tus préstamos')); }
    });
  }

  cambiarPestana(p: Pestana) { this.pestana.set(p); this.pagina.set(1); }

  verDetalle(p: Prestamo) {
    this.detalle.set(p);
    this.api.getPrestamo(p.id).subscribe({ next: d => this.detalle.set(d), error: () => this.notify.error('❌ Error al cargar el detalle del préstamo') });
  }

  async devolver(p: Prestamo) {
    if (!(await this.notify.confirmar(`¿Confirmas la devolución de "${p.libroNombre}"?`))) return;
    this.notify.cargando('Registrando devolución...');
    this.api.devolverMiLibro(p.id).subscribe({
      next: () => { this.notify.cerrar(); this.notify.ok('✅ Libro devuelto correctamente'); this.detalle.set(null); this.cargar(); },
      error: err => { this.notify.cerrar(); this.notify.error('❌ Error: ' + this.notify.mensajeError(err)); }
    });
  }

  clase(e: string) { return e === 'ACTIVO' ? 'success' : e === 'VENCIDO' ? 'danger' : 'info'; }
}
