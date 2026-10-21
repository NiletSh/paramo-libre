import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  AdminActivityItem,
  AdminBookRow,
  AdminExchangeRow,
  AdminUserRow,
  DashboardService
} from '../../services/dashboard.service';
import { ShelfLiveService, ShelfLiveState } from '../../services/shelf-live.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent implements OnInit, OnDestroy {
  loading = true;
  error = '';
  truequesListos = true;
  resumen = { usuarios: 0, libros: 0, propuestas: 0, trueques: 0 };
  actividades: AdminActivityItem[] = [];
  usuarios: AdminUserRow[] = [];
  libros: AdminBookRow[] = [];
  intercambios: AdminExchangeRow[] = [];
  live: ShelfLiveState = {
    connected: false,
    deviceOnline: false,
    peso: null,
    mov: false,
    oscuro: false,
    rfid: false,
    uid: '',
    presentes: '1111',
    result: '',
    message: '',
    exchangeId: null
  };
  readonly tarjetas = [
    { nombre: 'Libro 1', uid: '2A34651A', peso: 235 },
    { nombre: 'Libro 2', uid: 'B7F6BB3B', peso: 500 },
    { nombre: 'Libro 3', uid: '9AF57919', peso: 330 },
    { nombre: 'Libro 4', uid: '40835B7C', peso: 235 }
  ];

  private timer?: ReturnType<typeof setInterval>;
  private liveSub?: Subscription;
  private eventSub?: Subscription;

  constructor(
    private dashboardService: DashboardService,
    private shelfLive: ShelfLiveService
  ) {}

  ngOnInit(): void {
    this.load();
    this.timer = setInterval(() => this.load(false), 20000);
    this.liveSub = this.shelfLive.state$.subscribe((state) => {
      this.live = state;
    });
    this.eventSub = this.shelfLive.events$.subscribe(() => this.load(false));
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
    this.liveSub?.unsubscribe();
    this.eventSub?.unsubscribe();
  }

  formatWhen(value: string | null): string {
    if (!value) return 'Sin registro';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Sin registro';
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  estadoLibro(estado: string): string {
    const labels: Record<string, string> = {
      disponible: 'Disponible',
      en_intercambio: 'En trueque',
      intercambiado: 'Intercambiado',
      pausado: 'Pausado'
    };
    return labels[estado] || estado;
  }

  enEstante(index: number): boolean {
    return (this.live.presentes || '1111').charAt(index) !== '0';
  }

  estadoTrueque(estado: string): string {
    const labels: Record<string, string> = {
      pendiente: 'Pendiente',
      aceptado: 'Aceptado',
      rechazado: 'Rechazado',
      cancelado: 'Cancelado',
      completado: 'Completado'
    };
    return labels[estado] || estado;
  }

  private load(showSpinner = true): void {
    if (showSpinner) this.loading = true;
    this.dashboardService.getAdminActivity().subscribe({
      next: (data) => {
        this.resumen = data.resumen || this.resumen;
        this.actividades = data.actividades || [];
        this.usuarios = data.usuarios || [];
        this.libros = data.libros || [];
        this.intercambios = data.intercambios || [];
        this.truequesListos = data.truequesDisponibles !== false;
        const vacio = !this.usuarios.length && !this.libros.length && !this.truequesListos;
        this.error = vacio
          ? 'No se pudo cargar la actividad. Entra de nuevo con la cuenta administradora.'
          : '';
        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudo cargar la actividad. Entra de nuevo con la cuenta administradora.';
        this.loading = false;
      }
    });
  }
}
