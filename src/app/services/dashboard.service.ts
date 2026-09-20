import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DashboardStats {
  propuestas: number;
  solicitudes: number;
  truequesRealizados: number;
  librosPublicados: number;
}

export interface DashboardBook {
  id: number;
  title: string;
  author: string;
  status: 'available' | 'exchanged' | 'reserved';
  imageUrl?: string | null;
}

export interface DashboardActivity {
  id: number;
  message: string;
  time: string;
  icon: string;
  status: string;
}

export interface DashboardData {
  stats: DashboardStats;
  recentBooks: DashboardBook[];
  activities: DashboardActivity[];
}

export interface AppNotification {
  id: number;
  tipo: string;
  mensaje: string;
  fecha: string;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getDashboard(): Observable<DashboardData> {
    return this.http.get<{ exito: boolean; data: DashboardData }>(`${this.apiUrl}/dashboard`).pipe(
      map((response) => response.data)
    );
  }

  getNotifications(): Observable<AppNotification[]> {
    return this.http.get<{ exito: boolean; notificaciones: AppNotification[] }>(`${this.apiUrl}/notifications`).pipe(
      map((response) => response.notificaciones || [])
    );
  }
}
