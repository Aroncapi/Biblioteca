import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/api.service';
import { AuthService } from '../../../core/auth.service';
import { NotifyService } from '../../../core/notify.service';
import { Modal } from '../../../shared/modal/modal';

@Component({
  selector: 'app-admin-perfil',
  imports: [DatePipe, FormsModule, RouterLink, Modal],
  templateUrl: './perfil.html'
})
export class AdminPerfil implements OnInit {
  auth = inject(AuthService);
  private api = inject(ApiService);
  private notify = inject(NotifyService);

  ahora = new Date();
  modal = signal(false);
  enviado = signal(false);
  form = { nombre: '', apellido: '', email: '', password: '' };

  ngOnInit() { if (!this.auth.perfil()) this.auth.cargarPerfil().subscribe(); }

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
          this.notify.ok('✅ Perfil actualizado correctamente');
        }
      },
      error: err => { this.notify.cerrar(); this.notify.error('❌ Error: ' + this.notify.mensajeError(err)); }
    });
  }
}
