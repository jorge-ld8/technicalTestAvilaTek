import { Request, Response, NextFunction } from 'express';
import HttpStatusCodes from '../common/constants/HttpStatusCodes';
import { AuthenticatedRequest } from '@src/types/auth';
import AuthService from '@src/services/AuthService';

class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  public async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { firstName, lastName, email, password } = req.body;

      const user = await this.authService.register({
        firstName,
        lastName,
        email,
        password,
      });
      
      res.status(HttpStatusCodes.CREATED).json({ user });
    } catch (error) {
      next(error);
    }
  }

  public async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const { user, token } = await this.authService.login({ email, password });
  
      res.status(HttpStatusCodes.OK).json({
        token,
        user,
      });
    } catch (error) {
      next(error);
    }
  }

  public async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const user = await this.authService.getById(userId);

      res.status(HttpStatusCodes.OK).json({
        user,
      });
    } catch (error) {
      next(error);
    }
  }

  public logout(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    try {
      if (!req.user) {
        res.status(HttpStatusCodes.UNAUTHORIZED).json({ message: 'Authentication required' });
        return;
      }

      const authHeader = req.headers.authorization;
      let token: string | undefined;
      
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }

      this.authService.logout(token);
      
      res.status(HttpStatusCodes.OK).json({
        message: 'Logged out successfully',
      });
      
    } catch (error) {
      next(error);
    }
  }
}

export default AuthController;
