import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth.service';
import { NotifyService } from '../../../core/notify.service';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html'
})
export class Register {
  private auth = inject(AuthService);
  private router = inject(Router);
  private notify = inject(NotifyService);

  datos = { nombre: '', apellido: '', email: '', password: '', nivel: '', grado: '', seccion: '' };
  terminos = false;
  enviado = signal(false);
  grados = [1, 2, 3, 4, 5, 6];
  secciones = ['A', 'B', 'C', 'D'];

  registrar(form: { valid: boolean | null }) {
    this.enviado.set(true);
    if (!form.valid) { this.notify.error('❌ Por favor complete todos los campos correctamente'); return; }
    if (!this.terminos) { this.notify.aviso('❌ Debe aceptar los términos y condiciones'); return; }

    this.notify.cargando('Procesando registro...');
    this.auth.registrarAlumno({
      nombre: this.datos.nombre.trim(),
      apellido: this.datos.apellido.trim(),
      email: this.datos.email.trim(),
      password: this.datos.password,
      nivel: this.datos.nivel as 'PRIMARIA' | 'SECUNDARIA',
      grado: Number(this.datos.grado),
      seccion: this.datos.seccion
    }).subscribe({
      next: () => {
        this.notify.cerrar();
        this.notify.ok('✅ Registro exitoso. Por favor inicia sesión.');
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: err => { this.notify.cerrar(); this.notify.error('❌ Error: ' + this.notify.mensajeError(err)); }
    });
  }
}
