export interface Perfil {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  ubicacion?: string;
  biografia?: string;
  fotoUrl?: string;
  fechaRegistro: string;
  librosPublicados: number;
  intercambiosCompletados: number;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}