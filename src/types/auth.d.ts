import { Request } from 'express';
import { IUser } from '@src/models/User';

export interface AuthenticatedUser {
  id: string; 
  email: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export interface RegisterUserDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
}

export interface RegisterResponse {
    user: IUser;
}

export interface LoginUserDto {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: IUser;
  token: string;
}
export enum UserRole {
    CLIENT = 'CLIENT',
    ADMIN = 'ADMIN'
  }
  
export interface JwtPayload {
    userId: string;
    email: string;
    role: UserRole;
  }
  
export interface AuthUser {
    id: string;
    email: string;
    role: UserRole;
  }
  

