import { Request, Response, NextFunction } from 'express';
import HttpStatusCodes from '../common/constants/HttpStatusCodes';
import { AuthenticatedRequest } from '@src/types/auth';
import UserService from '@src/services/UserService';

class AuthController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  public async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { firstName, lastName, email, password } = req.body;

      const user = await this.userService.register({
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

  public async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const { user, token } = await this.userService.login({ email, password });
  
      res.status(HttpStatusCodes.OK).json({
        token,
        user,
      });
    } catch (error) {
      next(error);
    }
  }

  public async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const user = await this.userService.getById(userId);

      res.status(HttpStatusCodes.OK).json({
        user,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default AuthController;
