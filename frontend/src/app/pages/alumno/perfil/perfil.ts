import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/api.service';
import { AuthService } from '../../../core/auth.service';
import { NotifyService } from '../../../core/notify.service';
import { Prestamo } from '../../../core/models';
import { Modal } from '../../../shared/modal/modal';

@Component({
  selector: 'app-alumno-perfil',
  imports: [DatePipe, FormsModule, RouterLink, Modal],
  templateUrl: './perfil.html'
})
export class AlumnoPerfil implements OnInit {
  auth = inject(AuthService);
  private api = inject(ApiService);
  private notify = inject(NotifyService);

  hoy = new Date();
  prestamos = signal<Prestamo[]>([]);
  modal = signal(false);
  enviado = signal(false);
  form = { nombre: '', apellido: '', email: '', password: '' };

  total = computed(() => this.prestamos().length);
  activos = computed(() => this.prestamos().filter(p => p.estado === 'ACTIVO').length);
  devueltos = computed(() => this.prestamos().filter(p => p.estado === 'DEVUELTO').length);
  ultimos = computed(() => this.prestamos().slice(0, 5));
  nivelLector = computed(() => (this.total() > 10 ? 'Lector Avanzado' : 'Lector Inicial'));

  ngOnInit() {
    if (!this.auth.perfil()) this.auth.cargarPerfil().subscribe();
    this.api.getMisPrestamos().subscribe({ next: p => this.prestamos.set(p), error: () => {} });
  }

  editar() {
    const p = this.auth.perfil();
    if (!p) return;
    this.form = { nombre: p.nombre, apellido: p.apellido, email: p.email, password: '' };
    this.enviado.set(false);
    this.modal.set(true);
  }

  guardar(f: { valid: boolean | null }) {
    this.enviado.set(true);
    if (!f.valid || (this.form.password && this.form.password.length < 6)) return;
    const actual = this.auth.perfil()!;
    this.notify.cargando('Guardando cambios...');
    this.api.actualizarPerfil({
      nombre: this.form.nombre.trim(), apellido: this.form.apellido.trim(), email: this.form.email.trim(),
      password: this.form.password || undefined, rol: actual.rol
    }).subscribe({
      next: r => {
        this.notify.cerrar();
        this.modal.set(false);
        if (r.usuario.email !== actual.email) {
          this.notify.ok('✅ Correo actualizado. Inicia sesión nuevamente.');
          setTimeout(() => this.auth.logout(), 1800);
        } else {
          this.auth.perfil.set(r.usuario);
          this.notify.ok('✅ ' + (r.message || 'Perfil actualizado correctamente'));
        }
      },
      error: err => { this.notify.cerrar(); this.notify.error('❌ Error: ' + this.notify.mensajeError(err)); }
    });
  }

  clase(e: string) { return e === 'ACTIVO' ? 'success' : e === 'VENCIDO' ? 'danger' : 'info'; }
}
