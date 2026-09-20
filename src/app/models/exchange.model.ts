export type ExchangeStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed';

export interface ExchangeProposal {
  id: number;
  requestedBookId: number;
  requestedBookTitle: string;
  requestedBookImage: string;
  requestedBookOwnerId: number;
  offeredBookId: number;
  offeredBookTitle: string;
  offeredBookImage: string;
  proposerUserId: number;
  proposerUserName: string;
  message?: string;
  status: ExchangeStatus;
  createdAt: string;
}

export interface ExchangeProposalRequest {
  requestedBookId: number;
  offeredBookId: number;
  message?: string;
}
