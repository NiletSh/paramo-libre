import { Injectable, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, Subject, Subscription } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../core/services/auth.service';

export interface ShelfLiveState {
  connected: boolean;
  deviceOnline: boolean;
  peso: number | null;
  mov: boolean;
  oscuro: boolean;
  rfid: boolean;
  result: string;
  message: string;
  exchangeId: number | null;
}

const EMPTY: ShelfLiveState = {
  connected: false,
  deviceOnline: false,
  peso: null,
  mov: false,
  oscuro: false,
  rfid: false,
  result: '',
  message: '',
  exchangeId: null
};

@Injectable({ providedIn: 'root' })
export class ShelfLiveService implements OnDestroy {
  readonly state$ = new BehaviorSubject<ShelfLiveState>(EMPTY);
  readonly events$ = new Subject<ShelfLiveState>();

  private socket?: WebSocket;
  private retry?: ReturnType<typeof setTimeout>;
  private authSub?: Subscription;
  private active = false;

  constructor(
    private auth: AuthService,
    private snackBar: MatSnackBar
  ) {}

  connect(): void {
    if (this.active) return;
    this.active = true;
    this.authSub = this.auth.currentUser$.subscribe((user) => {
      if (user && this.auth.getToken()) this.open();
      else this.close();
    });
  }

  ngOnDestroy(): void {
    this.active = false;
    this.authSub?.unsubscribe();
    this.close();
  }

  private open(): void {
    const token = this.auth.getToken();
    if (!token || this.socket) return;

    const socket = new WebSocket(`${environment.wsUrl}?token=${encodeURIComponent(token)}`);
    this.socket = socket;

    socket.onopen = () => {
      this.state$.next({ ...this.state$.value, connected: true });
    };

    socket.onmessage = (event) => {
      this.apply(event.data);
    };

    socket.onclose = () => {
      this.socket = undefined;
      this.state$.next({ ...this.state$.value, connected: false, deviceOnline: false });
      if (this.active && this.auth.getToken()) {
        this.retry = setTimeout(() => this.open(), 4000);
      }
    };

    socket.onerror = () => socket.close();
  }

  private close(): void {
    if (this.retry) clearTimeout(this.retry);
    this.retry = undefined;
    this.socket?.close();
    this.socket = undefined;
    this.state$.next({ ...EMPTY });
  }

  private apply(raw: string): void {
    let data: Partial<ShelfLiveState> & { message?: string; result?: string };
    try {
      data = JSON.parse(raw);
    } catch {
      return;
    }

    const next: ShelfLiveState = {
      ...this.state$.value,
      connected: true,
      deviceOnline: Boolean(data.deviceOnline),
      peso: data.peso === null || data.peso === undefined ? this.state$.value.peso : Number(data.peso),
      mov: Boolean(data.mov),
      oscuro: Boolean(data.oscuro),
      rfid: Boolean(data.rfid),
      result: data.result || this.state$.value.result,
      message: data.message || this.state$.value.message,
      exchangeId: data.exchangeId ?? this.state$.value.exchangeId
    };
    this.state$.next(next);

    if (!data.result || data.result === 'status' || !data.message) return;

    this.events$.next(next);
    if (this.auth.getCurrentUser()?.rol !== 'admin') return;

    const alert = data.result === 'wrong' || data.result === 'unknown';
    this.snackBar.open(data.message, 'Cerrar', {
      duration: 8000,
      panelClass: [alert ? 'snackbar-error' : 'snackbar-success']
    });
  }
}
