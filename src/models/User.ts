import { UserRole } from '@src/types/auth';

export interface IUser {
  id: string;  
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role?: UserRole;
}