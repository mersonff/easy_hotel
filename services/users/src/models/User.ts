// Temporary types until Prisma client is generated
export type Role = 'ADMIN' | 'STAFF' | 'GUEST';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  phone?: string | null;
  address?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Request/Response types
export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role?: Role;
  phone?: string;
  address?: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  password?: string;
  role?: Role;
  phone?: string;
  address?: string;
  isActive?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: Omit<User, 'password'>;
  token: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  name: string;
}

// Utility type for user without password
export type UserWithoutPassword = Omit<User, 'password'>; 