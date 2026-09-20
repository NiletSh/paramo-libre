import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Perfil } from '../models/perfil.model';

@Injectable({
  providedIn: 'root'
})
export class PerfilService {
  private readonly apiUrl = `${environment.apiUrl}/users`;
  private readonly defaultAvatar = '';

  constructor(private http: HttpClient) {}

  private normalizePerfil(data: any): Perfil {
    return {
      id: data.id,
      nombre: data.nombre || data.name || '',
      apellido: data.apellido || '',
      email: data.email || '',
      telefono: data.telefono,
      ubicacion: data.ubicacion || data.location,
      biografia: data.biografia || data.bio,
      fotoUrl: this.normalizeAssetUrl(data.foto_perfil || data.avatar),
      fechaRegistro: data.fecha_registro || data.createdAt || '',
      librosPublicados: data.libros_publicados || 0,
      intercambiosCompletados: data.intercambios_completados || 0
    };
  }

  getPerfil(): Observable<Perfil> {
    return this.http.get<any>(`${this.apiUrl}/profile`).pipe(map((response) => this.normalizePerfil(response.usuario || response.data || response)));
  }

  updatePerfil(perfil: Perfil): Observable<Perfil> {
    return this.http.put<any>(`${this.apiUrl}/profile`, {
      nombre: perfil.nombre,
      email: perfil.email,
      biografia: perfil.biografia,
      ubicacion: perfil.ubicacion,
      telefono: perfil.telefono
    }).pipe(map((response) => this.normalizePerfil(response.usuario || response.data || response)));
  }

  changePassword(currentPassword: string, newPassword: string): Observable<boolean> {
    return this.http.put<any>(`${this.apiUrl}/password`, {
      passwordActual: currentPassword,
      passwordNuevo: newPassword
    }).pipe(map((response) => response.exito !== false));
  }

  uploadFoto(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('foto', file, file.name);

    return this.http.post<any>(`${this.apiUrl}/photo`, formData).pipe(
      map((response) => this.normalizeAssetUrl(response.foto_perfil || response.fotoUrl))
    );
  }

  private normalizeAssetUrl(url?: string | null): string {
    if (!url) return this.defaultAvatar;
    if (/^(https?:|data:|assets\/)/.test(url)) return url;
    return url.startsWith('/') ? url : `/${url}`;
  }
}
