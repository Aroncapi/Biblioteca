import { Component, HostListener, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink],
  templateUrl: './navbar.html'
})
export class Navbar {
  auth = inject(AuthService);
  menuAbierto = signal(false);
  colapsado = signal(false);

  rutaPerfil() { return this.auth.esAdmin() ? '/admin/perfil' : '/perfil'; }

  cerrarSesion() { this.menuAbierto.set(false); this.auth.logout(); }

  @HostListener('document:click', ['$event'])
  clickFuera(e: Event) {
    if (!(e.target as HTMLElement).closest('.nav-item.dropdown')) this.menuAbierto.set(false);
  }
}
