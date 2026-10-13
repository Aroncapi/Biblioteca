import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import Swal from 'sweetalert2';

type Tipo = 'success' | 'error' | 'warning' | 'info';

const ICONOS: Record<Tipo, string> = {
  success: 'bi-check-circle-fill',
  error: 'bi-exclamation-triangle-fill',
  warning: 'bi-exclamation-circle-fill',
  info: 'bi-info-circle-fill'
};
const COLORES: Record<Tipo, string> = {
  success: '#00c9b7', error: '#ff4757', warning: '#ffb347', info: '#3b8bc2'
};

/** Reemplaza a showNotification()/confirmAction() del header.html (SweetAlert2). */
@Injectable({ providedIn: 'root' })
export class NotifyService {
  toast(mensaje: string, tipo: Tipo = 'success') {
    Swal.fire({
      html: `<div class="d-flex align-items-center">
               <i class="bi ${ICONOS[tipo]} fs-1 me-3" style="color:${COLORES[tipo]}"></i>
               <span>${this.escapar(mensaje)}</span>
             </div>`,
      timer: 3000, showConfirmButton: false, position: 'top-end', toast: true,
      background: 'white', customClass: { popup: 'rounded-4 shadow-lg border-0' }
    });
  }

  ok(m: string) { this.toast(m, 'success'); }
  error(m: string) { this.toast(m, 'error'); }
  aviso(m: string) { this.toast(m, 'warning'); }
  info(m: string) { this.toast(m, 'info'); }

  async confirmar(mensaje: string, titulo = '¿Estás seguro?'): Promise<boolean> {
    const r = await Swal.fire({
      title: titulo, text: mensaje, icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#1e4a7a', cancelButtonColor: '#ff4757',
      confirmButtonText: 'Sí, continuar', cancelButtonText: 'Cancelar',
      background: 'white', customClass: { popup: 'rounded-4 shadow-lg' }
    });
    return r.isConfirmed;
  }

  cargando(titulo = 'Procesando...', detalle = 'Por favor espere') {
    Swal.fire({
      title: titulo, html: detalle, allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });
  }

  cerrar() { Swal.close(); }

  /** Obtiene un mensaje legible desde cualquier forma de error que devuelve el backend. */
  mensajeError(err: unknown, porDefecto = 'Ocurrió un error inesperado'): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) return 'No se pudo conectar con el servidor';
      const b = err.error;
      if (typeof b === 'string' && b.trim()) return b;
      if (b?.error) return String(b.error);
      if (b?.message) return String(b.message);
      if (b && typeof b === 'object') {           // errores de validación {campo: mensaje}
        const msgs = Object.values(b).filter(v => typeof v === 'string');
        if (msgs.length) return msgs.join(' · ');
      }
      if (err.status === 403) return 'No tiene permisos para realizar esta acción';
      if (err.status === 401) return 'Credenciales inválidas o sesión vencida';
    }
    return porDefecto;
  }

  private escapar(t: string) {
    return t.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
  }
}
