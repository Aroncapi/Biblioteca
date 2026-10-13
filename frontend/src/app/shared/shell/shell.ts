import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';

interface ItemMenu { ruta: string; texto: string; icono: string; }

/** Layout principal: navbar + sidebar (según rol) + contenido + footer. */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Navbar, Footer],
  templateUrl: './shell.html'
})
export class Shell implements OnInit, OnDestroy {
  auth = inject(AuthService);
  hora = signal(this.formatoHora());
  private timer?: ReturnType<typeof setInterval>;

  menuAdmin: ItemMenu[] = [
    { ruta: '/admin/dashboard', texto: 'Dashboard', icono: 'bi-speedometer2' },
    { ruta: '/admin/usuarios', texto: 'Usuarios', icono: 'bi-people' },
    { ruta: '/admin/libros', texto: 'Libros', icono: 'bi-book' },
    { ruta: '/admin/prestamos', texto: 'Préstamos', icono: 'bi-arrow-left-right' },
    { ruta: '/admin/reportes', texto: 'Reportes', icono: 'bi-graph-up' },
    { ruta: '/admin/perfil', texto: 'Mi Perfil', icono: 'bi-person-circle' }
  ];
  menuAlumno: ItemMenu[] = [
    { ruta: '/catalogo', texto: 'Catálogo', icono: 'bi-grid' },
    { ruta: '/mis-prestamos', texto: 'Mis Préstamos', icono: 'bi-clock-history' },
    { ruta: '/perfil', texto: 'Mi Perfil', icono: 'bi-person-circle' }
  ];

  menu() { return this.auth.esAdmin() ? this.menuAdmin : this.menuAlumno; }

  ngOnInit() {
    // Si recargan la página, recuperar el nombre del usuario para el navbar
    if (this.auth.estaLogueado() && !this.auth.perfil()) this.auth.cargarPerfil().subscribe();
    this.timer = setInterval(() => this.hora.set(this.formatoHora()), 30000);
  }
  ngOnDestroy() { clearInterval(this.timer); }

  private formatoHora() {
    return new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
}
