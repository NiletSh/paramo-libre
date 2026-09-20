export interface IUser {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  location?: string;
  bio?: string;
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface ILoginResponse {
  success: boolean;
  token: string;
  user: IUser;
}

export interface IRegisterRequest {
  name: string;
  email: string;
  password: string;
  location?: string;
}