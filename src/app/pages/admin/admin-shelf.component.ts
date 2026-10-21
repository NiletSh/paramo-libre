import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { SHELF_CARDS, ShelfLiveService, ShelfLiveState, ShelfLogEntry } from '../../services/shelf-live.service';

@Component({
  selector: 'app-admin-shelf',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-shelf.component.html',
  styleUrl: './admin-shelf.component.scss'
})
export class AdminShelfComponent implements OnInit, OnDestroy {
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
  registro: ShelfLogEntry[] = [];
  readonly tarjetas = SHELF_CARDS;

  private liveSub?: Subscription;
  private logSub?: Subscription;

  constructor(private shelfLive: ShelfLiveService) {}

  ngOnInit(): void {
    this.liveSub = this.shelfLive.state$.subscribe((state) => {
      this.live = state;
    });
    this.logSub = this.shelfLive.log$.subscribe((entries) => {
      this.registro = entries;
    });
  }

  ngOnDestroy(): void {
    this.liveSub?.unsubscribe();
    this.logSub?.unsubscribe();
  }

  enEstante(index: number): boolean {
    return (this.live.presentes || '1111').charAt(index) !== '0';
  }

  formatWhen(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  }

  tipoTexto(tipo: ShelfLogEntry['tipo']): string {
    const labels: Record<ShelfLogEntry['tipo'], string> = {
      conexion: 'Enlace',
      peso: 'Peso',
      movimiento: 'Movimiento',
      luz: 'Luz',
      rfid: 'Lector',
      tarjeta: 'Tarjeta',
      presencia: 'Libro',
      libro: 'Aviso'
    };
    return labels[tipo];
  }
}
