export interface IExchange {
  id: number;
  bookOfferedId: number;
  bookOfferedTitle: string;
  bookRequestedId: number;
  bookRequestedTitle: string;
  proposerId: number;
  proposerName: string;
  receiverId: number;
  receiverName: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed';
  message: string;
  createdAt: string;
  updatedAt: string;
}

export interface IExchangeProposal {
  bookOfferedId: number;
  bookRequestedId: number;
  message?: string;
}