import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../../core/api.service';
import { NotifyService } from '../../../core/notify.service';
import { DashboardStats, PrestamosPorMes } from '../../../core/models';
import { Paginator } from '../../../shared/paginator/paginator';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, RouterLink, Paginator],
  templateUrl: './dashboard.html'
})
export class Dashboard implements AfterViewInit, OnDestroy {
  private api = inject(ApiService);
  private notify = inject(NotifyService);

  @ViewChild('prestamosChart') prestamosCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('estadosChart') estadosCanvas?: ElementRef<HTMLCanvasElement>;

  stats = signal<DashboardStats | null>(null);
  cargando = signal(true);
  pagina = signal(1);
  hoy = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    .replace(/^\w/, c => c.toUpperCase());

  private charts: Chart[] = [];

  ngAfterViewInit() {
    forkJoin({ stats: this.api.getDashboard(), mes: this.api.getPrestamosPorMes(6) }).subscribe({
      next: ({ stats, mes }) => {
        this.stats.set(stats);
        this.cargando.set(false);
        // esperar a que Angular pinte los <canvas> (están dentro del @if)
        setTimeout(() => this.dibujar(stats, mes));
      },
      error: err => { this.cargando.set(false); this.notify.error(this.notify.mensajeError(err, 'No se pudo cargar el dashboard')); }
    });
  }

  ngOnDestroy() { this.charts.forEach(c => c.destroy()); }

  filaPagina() {
    const lista = this.stats()?.ultimosPrestamos ?? [];
    return lista.slice((this.pagina() - 1) * 5, this.pagina() * 5);
  }

  claseEstado(estado: string) {
    return estado === 'ACTIVO' ? 'success' : estado === 'VENCIDO' ? 'danger' : 'info';
  }

  private dibujar(stats: DashboardStats, mes: PrestamosPorMes) {
    const tooltip = {
      backgroundColor: '#1e4a7a', titleColor: 'white', bodyColor: 'rgba(255,255,255,0.9)',
      borderColor: 'rgba(255,255,255,0.2)', borderWidth: 1, padding: 12, cornerRadius: 8
    };

    if (this.prestamosCanvas) {
      this.charts.push(new Chart(this.prestamosCanvas.nativeElement, {
        type: 'line',
        data: {
          labels: mes.labels,
          datasets: [{
            label: 'Préstamos', data: mes.data, borderColor: '#1e4a7a', backgroundColor: 'rgba(30, 74, 122, 0.1)',
            borderWidth: 3, pointBackgroundColor: '#1e4a7a', pointBorderColor: 'white', pointBorderWidth: 2,
            pointRadius: 5, pointHoverRadius: 8, tension: 0.4, fill: true
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip },
          scales: { y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: 'rgba(0,0,0,0.05)' } }, x: { grid: { display: false } } }
        }
      }));
    }

    if (this.estadosCanvas) {
      const devueltos = Math.max(0, stats.totalPrestamos - stats.prestamosActivos - stats.prestamosVencidos);
      this.charts.push(new Chart(this.estadosCanvas.nativeElement, {
        type: 'doughnut',
        data: {
          labels: ['Activos', 'Devueltos', 'Vencidos'],
          datasets: [{ data: [stats.prestamosActivos, devueltos, stats.prestamosVencidos], backgroundColor: ['#1e4a7a', '#00c9b7', '#ff4757'], borderWidth: 0, hoverOffset: 7 }]
        },
        options: {
          responsive: true, maintainAspectRatio: false, cutout: '70%',
          plugins: {
            legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20, font: { size: 12, family: 'Inter' } } },
            tooltip: { ...tooltip, callbacks: { label: c => `${c.label}: ${c.raw} préstamos` } }
          }
        }
      }));
    }
  }
}
