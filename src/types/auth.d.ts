import { Request } from 'express';

// Define the structure of your user object that will be attached to the request
// This often matches the payload of your JWT
export interface AuthenticatedUser {
  id: string; // Or number, depending on your User model's ID type
  email: string;
  // Add any other properties you include in your JWT payload and want to access
  // For example: roles?: string[];
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

