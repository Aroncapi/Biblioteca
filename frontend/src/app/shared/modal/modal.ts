import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-modal',
  template: `
    @if (abierto()) {
      <div class="app-modal-backdrop" (mousedown)="cerrarFondo && cerrar.emit()">
        <div class="app-modal" [class.modal-lg-custom]="grande()" (mousedown)="$event.stopPropagation()" role="dialog">
          <div class="app-modal-header" [class.header-teal]="tema() === 'teal'">
            <h5>
              @if (icono()) { <i class="bi me-2" [class]="icono()"></i> }
              {{ titulo() }}
            </h5>
            <button type="button" class="btn-close btn-close-white" aria-label="Cerrar" (click)="cerrar.emit()"></button>
          </div>
          <div class="app-modal-body"><ng-content /></div>
          <div class="app-modal-footer"><ng-content select="[footer]" /></div>
        </div>
      </div>
    }
  `
})
export class Modal {
  abierto = input.required<boolean>();
  titulo = input('');
  icono = input('');
  tema = input<'azul' | 'teal'>('azul');
  grande = input(false);
  cerrar = output<void>();
  cerrarFondo = false;
}
