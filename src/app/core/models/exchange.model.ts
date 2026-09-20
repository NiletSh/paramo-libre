export class Exchange {
  id?: number;
  bookOfferedId: number;
  bookOfferedTitle?: string;
  bookRequestedId: number;
  bookRequestedTitle?: string;
  proposerId?: number;
  proposerName?: string;
  receiverId?: number;
  receiverName?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed';
  message?: string;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data?: Partial<Exchange>) {
    this.id = data?.id;
    this.bookOfferedId = data?.bookOfferedId || 0;
    this.bookOfferedTitle = data?.bookOfferedTitle;
    this.bookRequestedId = data?.bookRequestedId || 0;
    this.bookRequestedTitle = data?.bookRequestedTitle;
    this.proposerId = data?.proposerId;
    this.proposerName = data?.proposerName;
    this.receiverId = data?.receiverId;
    this.receiverName = data?.receiverName;
    this.status = data?.status || 'pending';
    this.message = data?.message;
    this.createdAt = data?.createdAt;
    this.updatedAt = data?.updatedAt;
  }
}