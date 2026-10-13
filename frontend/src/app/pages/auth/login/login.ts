import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth.service';
import { NotifyService } from '../../../core/notify.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html'
})
export class Login {
  private auth = inject(AuthService);
  private router = inject(Router);
  private notify = inject(NotifyService);
  private route = inject(ActivatedRoute);

  email = '';
  password = '';
  recordar = false;
  enviado = signal(false);
  cargando = signal(false);
  mensaje = signal<{ tipo: 'danger' | 'success' | 'warning'; texto: string } | null>(this.mensajeInicial());

  private mensajeInicial() {
    const q = this.route.snapshot.queryParamMap;
    if (q.has('logout')) return { tipo: 'success' as const, texto: 'Ha cerrado sesión correctamente.' };
    if (q.has('expired')) return { tipo: 'warning' as const, texto: 'Su sesión expiró. Inicie sesión nuevamente.' };
    return null;
  }

  entrar(form: { valid: boolean | null }) {
    this.enviado.set(true);
    if (!form.valid) return;
    this.cargando.set(true);
    this.mensaje.set(null);
    this.auth.login(this.email.trim(), this.password, this.recordar).subscribe({
      next: () => this.router.navigateByUrl(this.auth.rutaInicio()),
      error: err => {
        this.cargando.set(false);
        this.password = '';
        this.mensaje.set({
          tipo: 'danger',
          texto: err.status === 401 || err.status === 403
            ? 'Credenciales inválidas. Por favor, intente nuevamente.'
            : this.notify.mensajeError(err)
        });
      }
    });
  }

  olvido(e: Event) {
    e.preventDefault();
    this.notify.info('La recuperación de contraseña estará disponible próximamente');
  }
}
