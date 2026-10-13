import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

const INFO: Record<number, { titulo: string; texto: string; icono: string; color: string }> = {
  403: { titulo: 'Acceso Denegado', texto: 'No tienes permisos para acceder a este recurso.', icono: 'bi-shield-lock-fill', color: '#ffb347' },
  404: { titulo: 'Página No Encontrada', texto: 'La página que buscas no existe o fue movida.', icono: 'bi-search', color: '#3b8bc2' },
  500: { titulo: 'Error Interno del Servidor', texto: 'Ha ocurrido un error inesperado. Intenta de nuevo en unos minutos.', icono: 'bi-exclamation-octagon-fill', color: '#ff4757' }
};

/** Reemplaza error/403.html, error/404.html y error/500.html. */
@Component({
  selector: 'app-error-page',
  imports: [RouterLink],
  template: `
    <div class="min-vh-100 d-flex align-items-center justify-content-center"
         style="background: linear-gradient(135deg, #0b2b4f 0%, #1e4a7a 50%, #2c6b9e 100%);">
      <div class="container text-center">
        <div class="row justify-content-center">
          <div class="col-md-8 col-lg-6">
            <div class="card border-0 rounded-5 shadow-lg overflow-hidden fade-in-up">
              <div class="py-5" style="background: linear-gradient(135deg, #0b2b4f 0%, #1e4a7a 100%);">
                <div style="width:90px;height:90px;background:rgba(255,255,255,0.2);border-radius:24px;margin:0 auto;display:flex;align-items:center;justify-content:center;">
                  <i class="bi text-white" [class]="info.icono" style="font-size:3rem;"></i>
                </div>
              </div>
              <div class="card-body p-5">
                <div class="display-1 fw-bold mb-3" [style.color]="info.color">{{ codigo }}</div>
                <h2 class="fw-bold mb-3" style="color:#0b2b4f;font-family:'Poppins',sans-serif;">{{ info.titulo }}</h2>
                <p class="lead text-muted mb-4">{{ info.texto }}</p>
                <div class="d-flex gap-3 justify-content-center flex-wrap">
                  <a class="btn-modern primary" [routerLink]="auth.estaLogueado() ? auth.rutaInicio() : '/login'">
                    <i class="bi bi-house-door"></i> Volver al inicio
                  </a>
                  @if (codigo === 500) {
                    <button class="btn-modern outline" type="button" (click)="recargar()"><i class="bi bi-arrow-clockwise"></i> Reintentar</button>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ErrorPage {
  auth = inject(AuthService);
  codigo: number = inject(ActivatedRoute).snapshot.data['codigo'] ?? 404;
  info = INFO[this.codigo] ?? INFO[404];
  recargar() { location.reload(); }
}
