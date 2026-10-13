import { Component, computed, inject, signal } from '@angular/core';
import { ApiService } from '../../../core/api.service';
import { NotifyService } from '../../../core/notify.service';
import { Libro } from '../../../core/models';
import { forkJoin } from 'rxjs';

const MAX_PRESTAMOS = 3;

@Component({
  selector: 'app-catalogo',
  templateUrl: './catalogo.html'
})
export class Catalogo {
  private api = inject(ApiService);
  private notify = inject(NotifyService);

  maximo = MAX_PRESTAMOS;
  libros = signal<Libro[]>([]);
  activos = signal(0);
  cargando = signal(true);
  busqueda = signal('');
  categoria = signal('todos');

  categorias = computed(() => Array.from(new Set(this.libros().map(l => l.categoria))).sort());
  disponibles = computed(() => this.libros().filter(l => (l.stockDisponible ?? 0) > 0).length);
  filtrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    const cat = this.categoria();
    return this.libros().filter(l =>
      (cat === 'todos' || l.categoria === cat) &&
      (!q || [l.nombre, l.categoria, l.codigoLibro].join(' ').toLowerCase().includes(q)));
  });

  constructor() { this.cargar(); }

  cargar() {
    forkJoin({ libros: this.api.getLibros(), activos: this.api.getMisPrestamosActivos() }).subscribe({
      next: ({ libros, activos }) => { this.libros.set(libros); this.activos.set(activos.length); this.cargando.set(false); },
      error: err => { this.cargando.set(false); this.notify.error(this.notify.mensajeError(err, 'No se pudo cargar el catálogo')); }
    });
  }

  limpiar() { this.busqueda.set(''); this.categoria.set('todos'); }

  async solicitar(libro: Libro) {
    if (!(await this.notify.confirmar(`¿Confirmas que deseas solicitar "${libro.nombre}"?`))) return;
    this.notify.cargando('Solicitando préstamo...');
    this.api.solicitarPrestamo(libro.id!).subscribe({
      next: () => { this.notify.cerrar(); this.notify.ok('✅ Préstamo solicitado correctamente'); this.cargar(); },
      error: err => { this.notify.cerrar(); this.notify.error('❌ Error: ' + this.notify.mensajeError(err)); }
    });
  }
}
