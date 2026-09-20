import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AuthUser {
  id: number;
  nombre: string;
  email: string;
  rol: 'usuario' | 'admin';
  ubicacion?: string;
  telefono?: string;
  foto_perfil?: string;
}

interface AuthResponse {
  exito?: boolean;
  success?: boolean;
  mensaje?: string;
  message?: string;
  token: string;
  usuario?: AuthUser;
  user?: AuthUser;
  data?: {
    token?: string;
    user?: AuthUser;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/users`;
  private readonly tokenKey = 'pl_token';
  private readonly userKey = 'pl_user';
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(!!this.getToken());
  private currentUserSubject = new BehaviorSubject<AuthUser | null>(this.getStoredUser());

  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  login(email: string, password: string, rememberSession = false): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap((response) => this.persistSession(response, rememberSession))
    );
  }

  register(userData: {
    nombre: string;
    email: string;
    password: string;
    ubicacion?: string;
    telefono?: string;
  }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData).pipe(
      tap((response) => this.persistSession(response))
    );
  }

  loadProfile(): Observable<AuthUser> {
    return this.http.get<{ exito: boolean; usuario: AuthUser }>(`${this.apiUrl}/profile`).pipe(
      map((response) => response.usuario),
      tap((user) => this.setCurrentUser(user))
    );
  }

  updateStoredUser(user: AuthUser): void {
    this.setCurrentUser(user);
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    sessionStorage.removeItem(this.tokenKey);
    sessionStorage.removeItem(this.userKey);
    this.isAuthenticatedSubject.next(false);
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey) || sessionStorage.getItem(this.tokenKey);
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  private persistSession(response: AuthResponse, rememberSession = false): void {
    const token = response.token || response.data?.token;
    const user = response.usuario || response.user || response.data?.user;
    const storage = rememberSession ? localStorage : sessionStorage;
    const otherStorage = rememberSession ? sessionStorage : localStorage;

    otherStorage.removeItem(this.tokenKey);
    otherStorage.removeItem(this.userKey);

    if (token) {
      storage.setItem(this.tokenKey, token);
      this.isAuthenticatedSubject.next(true);
    }

    if (user) {
      storage.setItem(this.userKey, JSON.stringify(user));
      this.currentUserSubject.next(user);
    }
  }

  private getStoredUser(): AuthUser | null {
    const rawUser = localStorage.getItem(this.userKey) || sessionStorage.getItem(this.userKey);
    if (!rawUser) return null;

    try {
      return JSON.parse(rawUser) as AuthUser;
    } catch {
      localStorage.removeItem(this.userKey);
      sessionStorage.removeItem(this.userKey);
      return null;
    }
  }

  private getActiveStorage(): Storage {
    return localStorage.getItem(this.tokenKey) ? localStorage : sessionStorage;
  }

  private setCurrentUser(user: AuthUser): void {
    this.getActiveStorage().setItem(this.userKey, JSON.stringify(user));
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(!!this.getToken());
  }
}
