import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { ExchangeProposal, ExchangeProposalRequest, ExchangeStatus } from '../models/exchange.model';

interface ExchangeResponse {
  message?: string;
  exchange: ApiExchange;
}

interface ApiExchange {
  id: number;
  requestedBookId?: number;
  book_id?: number;
  book_title?: string;
  requestedBookTitle?: string;
  book_image?: string;
  requestedBookImage?: string;
  ownerId?: number;
  owner_id?: number;
  offeredBookId?: number;
  offered_book_id?: number;
  offered_book_title?: string;
  offeredBookTitle?: string;
  offered_book_image?: string;
  offeredBookImage?: string;
  requesterId?: number;
  requester_id?: number;
  requester_name?: string;
  proposerUserName?: string;
  message?: string;
  status: ExchangeStatus;
  createdAt?: string;
  created_at?: string;
}

type ActionStatus = Exclude<ExchangeStatus, 'pending'>;

@Injectable({
  providedIn: 'root'
})
export class ExchangeService {
  private readonly apiUrl = `${environment.apiUrl}/exchanges`;

  constructor(private http: HttpClient) {}

  createProposal(request: ExchangeProposalRequest): Observable<ExchangeProposal> {
    return this.http.post<ExchangeResponse>(this.apiUrl, {
      book_id: request.requestedBookId,
      offered_book_id: request.offeredBookId,
      message: request.message
    }).pipe(
      map((response) => this.normalizeExchange(response.exchange))
    );
  }

  getMyProposals(_userId?: number): Observable<ExchangeProposal[]> {
    return this.http.get<ApiExchange[]>(`${this.apiUrl}/my-requests`).pipe(
      map((exchanges) => exchanges.map((exchange) => this.normalizeExchange(exchange)))
    );
  }

  getReceivedProposals(_ownerId?: number): Observable<ExchangeProposal[]> {
    return this.http.get<ApiExchange[]>(`${this.apiUrl}/received`).pipe(
      map((exchanges) => exchanges.map((exchange) => this.normalizeExchange(exchange)))
    );
  }

  cancelProposal(proposalId: number): Observable<void> {
    return this.http.put<ExchangeResponse>(`${this.apiUrl}/${proposalId}/cancel`, {}).pipe(
      map(() => undefined)
    );
  }

  updateStatus(proposalId: number, status: ActionStatus): Observable<ExchangeProposal> {
    const actionMap: Record<ActionStatus, string> = {
      accepted: 'accept',
      rejected: 'reject',
      cancelled: 'cancel',
      completed: 'complete'
    };

    return this.http.put<ExchangeResponse>(`${this.apiUrl}/${proposalId}/${actionMap[status]}`, {}).pipe(
      map((response) => this.normalizeExchange(response.exchange))
    );
  }

  private normalizeExchange(exchange: ApiExchange): ExchangeProposal {
    return {
      id: exchange.id,
      requestedBookId: exchange.requestedBookId || exchange.book_id || 0,
      requestedBookTitle: exchange.requestedBookTitle || exchange.book_title || 'Libro solicitado',
      requestedBookImage: exchange.requestedBookImage || exchange.book_image || '',
      requestedBookOwnerId: exchange.ownerId || exchange.owner_id || 0,
      offeredBookId: exchange.offeredBookId || exchange.offered_book_id || 0,
      offeredBookTitle: exchange.offeredBookTitle || exchange.offered_book_title || 'Libro ofrecido',
      offeredBookImage: exchange.offeredBookImage || exchange.offered_book_image || '',
      proposerUserId: exchange.requesterId || exchange.requester_id || 0,
      proposerUserName: exchange.proposerUserName || exchange.requester_name || 'Usuario',
      message: exchange.message,
      status: exchange.status,
      createdAt: exchange.createdAt || exchange.created_at || new Date().toISOString()
    };
  }
}
