import { Component, computed, input, model } from '@angular/core';

/** Paginación simple (reemplaza a la paginación de DataTables). */
@Component({
  selector: 'app-paginator',
  template: `
    @if (total() > 0) {
      <div class="pager">
        <span class="text-muted">Mostrando {{ desde() }} a {{ hasta() }} de {{ total() }} registros</span>
        @if (paginas() > 1) {
          <div class="pager-btns">
            <button type="button" [disabled]="pagina() === 1" (click)="ir(pagina() - 1)"><i class="bi bi-chevron-left"></i></button>
            @for (p of lista(); track p) {
              <button type="button" [class.active]="p === pagina()" (click)="ir(p)">{{ p }}</button>
            }
            <button type="button" [disabled]="pagina() === paginas()" (click)="ir(pagina() + 1)"><i class="bi bi-chevron-right"></i></button>
          </div>
        }
      </div>
    }
  `
})
export class Paginator {
  total = input.required<number>();
  tamano = input(10);
  pagina = model(1);

  paginas = computed(() => Math.max(1, Math.ceil(this.total() / this.tamano())));
  desde = computed(() => (this.total() === 0 ? 0 : (this.pagina() - 1) * this.tamano() + 1));
  hasta = computed(() => Math.min(this.pagina() * this.tamano(), this.total()));
  lista = computed(() => {
    const n = this.paginas(), p = this.pagina();
    const ini = Math.max(1, Math.min(p - 2, n - 4));
    const fin = Math.min(n, ini + 4);
    return Array.from({ length: fin - ini + 1 }, (_, i) => ini + i);
  });

  ir(p: number) { this.pagina.set(Math.min(Math.max(1, p), this.paginas())); }
}
