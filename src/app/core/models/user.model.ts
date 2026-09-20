export class User {
  id?: number;
  name: string;
  email: string;
  password?: string;
  avatar?: string;
  location?: string;
  bio?: string;
  role?: 'user' | 'admin';
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data?: Partial<User>) {
    this.id = data?.id;
    this.name = data?.name || '';
    this.email = data?.email || '';
    this.password = data?.password;
    this.avatar = data?.avatar;
    this.location = data?.location;
    this.bio = data?.bio;
    this.role = data?.role || 'user';
    this.createdAt = data?.createdAt;
    this.updatedAt = data?.updatedAt;
  }
}