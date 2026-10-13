import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/api.service';
import { NotifyService } from '../../../core/notify.service';
import { Libro } from '../../../core/models';
import { Modal } from '../../../shared/modal/modal';
import { Paginator } from '../../../shared/paginator/paginator';

export const CATEGORIAS = [
  { v: 'Novela', e: '📖' }, { v: 'Infantil', e: '🧸' }, { v: 'Fantasía', e: '🧙' },
  { v: 'Ciencia ficción', e: '🚀' }, { v: 'Clásico', e: '🏛️' }, { v: 'Terror', e: '👻' },
  { v: 'Biografía', e: '📝' }, { v: 'Historia', e: '📜' }, { v: 'Poesía', e: '📝' }, { v: 'Teatro', e: '🎭' }
];

@Component({
  selector: 'app-libros',
  imports: [FormsModule, Modal, Paginator],
  templateUrl: './libros.html'
})
export class Libros {
  private api = inject(ApiService);
  private notify = inject(NotifyService);

  categorias = CATEGORIAS;
  libros = signal<Libro[]>([]);
  cargando = signal(true);
  busqueda = signal('');
  pagina = signal(1);

  modalForm = signal(false);
  modalDetalle = signal(false);
  detalle = signal<Libro | null>(null);
  enviado = signal(false);
  form: Libro = this.vacio();

  filtrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    if (!q) return this.libros();
    return this.libros().filter(l =>
      [l.id, l.codigoLibro, l.nombre, l.categoria].join(' ').toLowerCase().includes(q));
  });
  visibles = computed(() => this.filtrados().slice((this.pagina() - 1) * 10, this.pagina() * 10));
  totalDisponibles = computed(() => this.libros().reduce((s, l) => s + (l.stockDisponible ?? 0), 0));

  constructor() { this.cargar(); }

  cargar() {
    this.api.getLibros().subscribe({
      next: l => { this.libros.set(l); this.cargando.set(false); },
      error: err => { this.cargando.set(false); this.notify.error(this.notify.mensajeError(err, 'No se pudieron cargar los libros')); }
    });
  }

  buscar(v: string) { this.busqueda.set(v); this.pagina.set(1); }

  private vacio(): Libro { return { nombre: '', categoria: '', codigoLibro: '', stockTotal: 1 }; }

  nuevo() { this.form = this.vacio(); this.enviado.set(false); this.modalForm.set(true); }

  editar(l: Libro) { this.form = { ...l }; this.enviado.set(false); this.modalForm.set(true); }

  ver(l: Libro) { this.detalle.set(l); this.modalDetalle.set(true); }

  codigoValido() { return /^[A-Z0-9-]+$/.test(this.form.codigoLibro ?? ''); }

  guardar(f: { valid: boolean | null }) {
    this.enviado.set(true);
    if (!f.valid || !this.codigoValido()) return;
    const datos: Libro = {
      nombre: this.form.nombre.trim(), categoria: this.form.categoria,
      codigoLibro: this.form.codigoLibro.trim(), stockTotal: Number(this.form.stockTotal)
    };
    const edicion = this.form.id != null;
    this.notify.cargando('Guardando...');
    const peticion = edicion ? this.api.actualizarLibro(this.form.id!, datos) : this.api.crearLibro(datos);
    peticion.subscribe({
      next: () => {
        this.notify.cerrar();
        this.notify.ok(edicion ? '✅ Libro actualizado correctamente' : '✅ Libro creado correctamente');
        this.modalForm.set(false);
        this.cargar();
      },
      error: err => { this.notify.cerrar(); this.notify.error('❌ Error: ' + this.notify.mensajeError(err)); }
    });
  }

  async eliminar(l: Libro) {
    if (!(await this.notify.confirmar('¿Estás seguro de eliminar este libro? Esta acción no se puede deshacer.'))) return;
    this.api.eliminarLibro(l.id!).subscribe({
      next: () => { this.notify.ok('✅ Libro eliminado correctamente'); this.cargar(); },
      error: err => this.notify.error('❌ Error: ' + this.notify.mensajeError(err))
    });
  }

  puedeEliminar(l: Libro) { return l.stockDisponible === l.stockTotal; }

  /** Exporta el listado visible a CSV (con BOM para que Excel respete los tildes). */
  exportarCsv() {
    const filas = [['ID', 'Código', 'Nombre', 'Categoría', 'Stock Total', 'Stock Disponible']]
      .concat(this.filtrados().map(l => [String(l.id), l.codigoLibro, l.nombre, l.categoria, String(l.stockTotal), String(l.stockDisponible)]));
    const csv = filas.map(r => r.map(c => `"${(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'libros.csv';
    a.click();
    URL.revokeObjectURL(a.href);
    this.notify.ok('✅ Listado exportado correctamente');
  }
}
