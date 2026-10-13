import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/api.service';
import { NotifyService } from '../../../core/notify.service';
import { Usuario } from '../../../core/models';
import { Modal } from '../../../shared/modal/modal';
import { Paginator } from '../../../shared/paginator/paginator';

type Pestana = 'alumnos' | 'admins';

@Component({
  selector: 'app-usuarios',
  imports: [FormsModule, Modal, Paginator],
  templateUrl: './usuarios.html'
})
export class Usuarios {
  private api = inject(ApiService);
  private notify = inject(NotifyService);

  usuarios = signal<Usuario[]>([]);
  cargando = signal(true);
  pestana = signal<Pestana>('alumnos');
  busqueda = signal('');
  pagina = signal(1);

  modalForm = signal(false);
  modalDetalle = signal(false);
  detalle = signal<Usuario | null>(null);
  enviado = signal(false);
  grados = [1, 2, 3, 4, 5, 6];
  secciones = ['A', 'B', 'C', 'D'];
  form = this.vacio();
  tipo: 'ALUMNO' | 'ADMIN' = 'ALUMNO';

  alumnos = computed(() => this.usuarios().filter(u => u.rol === 'ALUMNO'));
  admins = computed(() => this.usuarios().filter(u => u.rol === 'ADMIN'));
  filtrados = computed(() => {
    const base = this.pestana() === 'alumnos' ? this.alumnos() : this.admins();
    const q = this.busqueda().trim().toLowerCase();
    if (!q) return base;
    return base.filter(u => [u.nombre, u.apellido, u.email, u.nivel, u.seccion].join(' ').toLowerCase().includes(q));
  });
  visibles = computed(() => this.filtrados().slice((this.pagina() - 1) * 10, this.pagina() * 10));

  constructor() { this.cargar(); }

  cargar() {
    this.api.getUsuarios().subscribe({
      next: u => { this.usuarios.set(u); this.cargando.set(false); },
      error: err => { this.cargando.set(false); this.notify.error(this.notify.mensajeError(err, 'No se pudieron cargar los usuarios')); }
    });
  }

  cambiarPestana(p: Pestana) { this.pestana.set(p); this.pagina.set(1); this.busqueda.set(''); }
  buscar(v: string) { this.busqueda.set(v); this.pagina.set(1); }

  private vacio(): Usuario { return { nombre: '', apellido: '', email: '', password: '', nivel: 'PRIMARIA', grado: 1, seccion: 'A' }; }

  nuevo() { this.form = this.vacio(); this.tipo = this.pestana() === 'admins' ? 'ADMIN' : 'ALUMNO'; this.enviado.set(false); this.modalForm.set(true); }

  editar(u: Usuario) {
    this.form = { ...u, password: '' };
    this.tipo = u.rol as 'ALUMNO' | 'ADMIN';
    this.enviado.set(false);
    this.modalForm.set(true);
  }

  ver(u: Usuario) { this.detalle.set(u); this.modalDetalle.set(true); }

  guardar(f: { valid: boolean | null }) {
    this.enviado.set(true);
    const edicion = this.form.id != null;
    const passwordOk = edicion ? (!this.form.password || this.form.password.length >= 6) : (this.form.password?.length ?? 0) >= 6;
    if (!f.valid || !passwordOk) return;

    const datos: Usuario = {
      nombre: this.form.nombre.trim(), apellido: this.form.apellido.trim(), email: this.form.email.trim(),
      password: this.form.password || undefined
    };
    if (this.tipo === 'ALUMNO') {
      datos.nivel = this.form.nivel; datos.grado = Number(this.form.grado); datos.seccion = this.form.seccion;
    }

    this.notify.cargando('Guardando...');
    const peticion = edicion
      ? this.api.actualizarUsuario(this.form.id!, datos)
      : this.tipo === 'ADMIN' ? this.api.crearAdmin(datos) : this.api.crearAlumno(datos);

    peticion.subscribe({
      next: () => {
        this.notify.cerrar();
        this.notify.ok(edicion ? '✅ Usuario actualizado correctamente' : '✅ Usuario creado correctamente');
        this.modalForm.set(false);
        this.cargar();
      },
      error: err => { this.notify.cerrar(); this.notify.error('❌ Error: ' + this.notify.mensajeError(err)); }
    });
  }

  async eliminar(u: Usuario) {
    if (!(await this.notify.confirmar('¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.'))) return;
    this.api.eliminarUsuario(u.id!).subscribe({
      next: () => { this.notify.ok('✅ Usuario eliminado correctamente'); this.cargar(); },
      error: err => this.notify.error('❌ ' + this.notify.mensajeError(err, 'Error al eliminar usuario'))
    });
  }
}
