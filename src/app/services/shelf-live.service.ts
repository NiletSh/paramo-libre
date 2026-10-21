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
  uid: string;
  presentes: string;
  result: string;
  message: string;
  exchangeId: number | null;
}

export interface ShelfLogEntry {
  id: number;
  at: string;
  tipo: 'conexion' | 'peso' | 'movimiento' | 'luz' | 'rfid' | 'tarjeta' | 'presencia' | 'libro';
  texto: string;
  detalle: string;
}

export const SHELF_CARDS = [
  { nombre: 'Libro 1', uid: '2A34651A', peso: 235 },
  { nombre: 'Libro 2', uid: 'B7F6BB3B', peso: 500 },
  { nombre: 'Libro 3', uid: '9AF57919', peso: 330 },
  { nombre: 'Libro 4', uid: '40835B7C', peso: 235 }
];

const EMPTY: ShelfLiveState = {
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

@Injectable({ providedIn: 'root' })
export class ShelfLiveService implements OnDestroy {
  readonly state$ = new BehaviorSubject<ShelfLiveState>(EMPTY);
  readonly events$ = new Subject<ShelfLiveState>();
  readonly log$ = new BehaviorSubject<ShelfLogEntry[]>(this.readLog());
  private logSerial = Date.now();

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
      mov: data.mov === undefined ? this.state$.value.mov : Boolean(data.mov),
      oscuro: data.oscuro === undefined ? this.state$.value.oscuro : Boolean(data.oscuro),
      rfid: data.rfid === undefined ? this.state$.value.rfid : Boolean(data.rfid),
      uid: typeof data.uid === 'string' ? data.uid : this.state$.value.uid,
      presentes: typeof data.presentes === 'string' ? data.presentes : this.state$.value.presentes,
      result: data.result || this.state$.value.result,
      message: data.message || this.state$.value.message,
      exchangeId: data.exchangeId ?? this.state$.value.exchangeId
    };
    const previous = this.state$.value;
    this.state$.next(next);
    this.recordChanges(previous, next, data);

    if (!data.result || data.result === 'status' || !data.message) return;

    this.events$.next(next);
    if (this.auth.getCurrentUser()?.rol !== 'admin') return;

    const alert = data.result === 'wrong' || data.result === 'unknown';
    this.snackBar.open(data.message, 'Cerrar', {
      duration: 8000,
      panelClass: [alert ? 'snackbar-error' : 'snackbar-success']
    });
  }

  private primed = false;

  private recordChanges(
    previous: ShelfLiveState,
    next: ShelfLiveState,
    data: Partial<ShelfLiveState> & { title?: string }
  ): void {
    const entries = this.describeChanges(previous, next, data);
    const first = !this.primed;
    this.primed = true;
    if (first && (!data.result || data.result === 'status')) return;
    this.pushLog(entries);
  }

  private describeChanges(
    previous: ShelfLiveState,
    next: ShelfLiveState,
    data: Partial<ShelfLiveState> & { title?: string }
  ): ShelfLogEntry[] {
    const entries: ShelfLogEntry[] = [];
    const add = (tipo: ShelfLogEntry['tipo'], texto: string, detalle = '') => {
      this.logSerial += 1;
      entries.push({
        id: this.logSerial,
        at: new Date().toISOString(),
        tipo,
        texto,
        detalle
      });
    };

    if (previous.deviceOnline !== next.deviceOnline) {
      add(
        'conexion',
        next.deviceOnline ? 'El estante se conectó' : 'El estante se desconectó',
        next.deviceOnline ? 'En línea' : 'Sin enlace'
      );
    }

    if (data.peso !== undefined && data.peso !== null && Number.isFinite(Number(data.peso))) {
      const peso = Number(data.peso);
      const antes = previous.peso;
      if (antes === null || Math.abs(peso - antes) >= 20) {
        add(
          'peso',
          antes === null ? `Peso del estante: ${peso} g` : `El peso pasó de ${antes} g a ${peso} g`,
          `${peso} g`
        );
      }
    }

    if (data.mov !== undefined && previous.mov !== next.mov) {
      add('movimiento', next.mov ? 'Hay movimiento frente al estante' : 'El estante quedó quieto', next.mov ? 'Activo' : 'Inactivo');
    }

    if (data.oscuro !== undefined && previous.oscuro !== next.oscuro) {
      add('luz', next.oscuro ? 'El estante quedó a oscuras' : 'El estante tiene luz', next.oscuro ? 'Oscuro' : 'Con luz');
    }

    if (data.rfid !== undefined && previous.rfid !== next.rfid) {
      add('rfid', next.rfid ? 'El lector RFID está activo' : 'El lector RFID no responde', next.rfid ? 'Activo' : 'Inactivo');
    }

    const uid = this.cleanUid(data.uid);
    if (uid && uid !== this.cleanUid(previous.uid)) {
      add('tarjeta', `Se leyó la tarjeta ${this.formatUid(uid)}`, uid);
    }

    if (typeof data.presentes === 'string') {
      const before = (previous.presentes || '1111').padEnd(4, '1');
      const after = data.presentes.padEnd(4, '1');
      SHELF_CARDS.forEach((card, index) => {
        if (before.charAt(index) === after.charAt(index)) return;
        const salio = after.charAt(index) === '0';
        add(
          'presencia',
          salio ? `${card.nombre} salió del estante` : `${card.nombre} volvió al estante`,
          `${this.formatUid(card.uid)} · ${card.peso} g`
        );
      });
    }

    if (data.result && data.result !== 'status' && data.message) {
      add('libro', data.message, data.title || (uid ? this.formatUid(uid) : ''));
    } else if ((!data.result || data.result === 'status') && data.message && data.message !== previous.message) {
      add('conexion', data.message, 'Estado');
    }

    return entries;
  }

  private pushLog(entries: ShelfLogEntry[]): void {
    if (!entries.length) return;
    const next = [...entries].reverse().concat(this.log$.value).slice(0, 200);
    this.log$.next(next);
    try {
      localStorage.setItem('pl_shelf_log', JSON.stringify(next));
    } catch {
      // El registro en memoria sigue, aunque el navegador no pueda guardarlo.
    }
  }

  private readLog(): ShelfLogEntry[] {
    try {
      const raw = localStorage.getItem('pl_shelf_log');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.slice(0, 200) : [];
    } catch {
      return [];
    }
  }

  private cleanUid(value: unknown): string {
    return String(value || '').replace(/[^0-9a-f]/gi, '').toUpperCase();
  }

  private formatUid(uid: string): string {
    return uid.replace(/(.{2})/g, '$1 ').trim();
  }
}
