import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ExchangeService } from '../../services/exchange.service';
import { ExchangeProposal, ExchangeStatus } from '../../models/exchange.model';

type StatusFilter = 'all' | ExchangeStatus;
type ProposalTab = 'sent' | 'received';

@Component({
  selector: 'app-my-proposals',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSnackBarModule
  ],
  templateUrl: './my-proposals.component.html',
  styleUrls: ['./my-proposals.component.scss']
})
export class MyProposalsComponent implements OnInit {
  sentProposals: ExchangeProposal[] = [];
  receivedProposals: ExchangeProposal[] = [];
  filteredProposals: ExchangeProposal[] = [];
  activeTab: ProposalTab = 'sent';
  activeFilter: StatusFilter = 'all';
  loading = true;

  readonly tabs: { value: ProposalTab; label: string }[] = [
    { value: 'sent', label: 'Enviadas' },
    { value: 'received', label: 'Recibidas' }
  ];

  readonly filters: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'Todas' },
    { value: 'pending', label: 'Pendientes' },
    { value: 'accepted', label: 'Aceptadas' },
    { value: 'rejected', label: 'Rechazadas' },
    { value: 'cancelled', label: 'Canceladas' },
    { value: 'completed', label: 'Completadas' }
  ];

  constructor(
    private exchangeService: ExchangeService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadProposals();
  }

  setTab(tab: ProposalTab): void {
    this.activeTab = tab;
    this.activeFilter = 'all';
    this.applyFilter();
  }

  private loadProposals(): void {
    this.loading = true;

    this.exchangeService.getMyProposals().subscribe({
      next: (data) => {
        this.sentProposals = data;
        this.exchangeService.getReceivedProposals().subscribe({
          next: (received) => {
            this.receivedProposals = received;
            this.applyFilter();
            this.loading = false;
          },
          error: () => {
            this.receivedProposals = [];
            this.applyFilter();
            this.loading = false;
          }
        });
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Error al cargar las propuestas. Intenta nuevamente.', 'Cerrar', {
          duration: 5000,
          panelClass: ['snackbar-error']
        });
      }
    });
  }

  setFilter(filter: StatusFilter): void {
    this.activeFilter = filter;
    this.applyFilter();
  }

  private applyFilter(): void {
    const source = this.activeTab === 'sent' ? this.sentProposals : this.receivedProposals;

    if (this.activeFilter === 'all') {
      this.filteredProposals = [...source];
    } else {
      this.filteredProposals = source.filter((p) => p.status === this.activeFilter);
    }
  }

  cancelProposal(id: number): void {
    this.exchangeService.cancelProposal(id).subscribe({
      next: () => {
        this.snackBar.open('Propuesta cancelada correctamente.', 'Cerrar', {
          duration: 4000,
          panelClass: ['snackbar-success']
        });
        this.loadProposals();
      },
      error: () => {
        this.snackBar.open('Error al cancelar la propuesta.', 'Cerrar', {
          duration: 5000,
          panelClass: ['snackbar-error']
        });
      }
    });
  }

  acceptProposal(id: number): void {
    this.exchangeService.updateStatus(id, 'accepted').subscribe({
      next: () => {
        this.snackBar.open('Propuesta aceptada correctamente.', 'Cerrar', {
          duration: 4000,
          panelClass: ['snackbar-success']
        });
        this.loadProposals();
      },
      error: () => {
        this.snackBar.open('Error al aceptar la propuesta.', 'Cerrar', {
          duration: 5000,
          panelClass: ['snackbar-error']
        });
      }
    });
  }

  rejectProposal(id: number): void {
    this.exchangeService.updateStatus(id, 'rejected').subscribe({
      next: () => {
        this.snackBar.open('Propuesta rechazada correctamente.', 'Cerrar', {
          duration: 4000,
          panelClass: ['snackbar-success']
        });
        this.loadProposals();
      },
      error: () => {
        this.snackBar.open('Error al rechazar la propuesta.', 'Cerrar', {
          duration: 5000,
          panelClass: ['snackbar-error']
        });
      }
    });
  }

  getStatusLabel(status: ExchangeStatus): string {
    const map: Record<ExchangeStatus, string> = {
      pending: 'Pendiente',
      accepted: 'Aceptada',
      rejected: 'Rechazada',
      cancelled: 'Cancelada',
      completed: 'Completada'
    };
    return map[status];
  }

  getStatusClass(status: ExchangeStatus): string {
    return `status-${status}`;
  }

  formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  getOfferLabel(): string {
    return this.activeTab === 'sent' ? 'Ofreces' : 'Te ofrecen';
  }

  getRequestLabel(): string {
    return this.activeTab === 'sent' ? 'Solicitas' : 'Solicitan';
  }
}
