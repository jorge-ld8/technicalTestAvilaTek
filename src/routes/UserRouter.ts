import { RequestHandler, Router } from 'express';
import UserController from '@src/controllers/UserController';
import { validateRequest } from '@src/middlewares/validateRequest';
import { updateUserSchema } from '@src/validators/user.validator';
import { authorize } from '@src/middlewares/authorizeMiddleware';
import { UserRole } from '@src/types/auth.types';
import { BaseRouter } from './common/BaseRouter';

class UserRouter extends BaseRouter<UserController> {
  constructor() {
    super(new UserController());
  }

  protected setupRoutes(): void {
    // Get current user profile - any authenticated user
    this.router.get('/profile', 
      (req, res, next) => this.controller.getCurrentUser(req, res, next));
    
    // Update current user - any authenticated user
    this.router.put('/profile', 
      validateRequest(updateUserSchema) as RequestHandler,
      (req, res, next) => this.controller.updateCurrentUser(req, res, next));
    
    // Admin routes - manage all users
    this.router.get('/', 
      authorize([UserRole.ADMIN]),
      (req, res, next) => this.controller.getAllUsers(req, res, next));
    
    this.router.get('/:id', 
      authorize([UserRole.ADMIN]),
      (req, res, next) => this.controller.getUserById(req, res, next));
    
    this.router.put('/:id', 
      authorize([UserRole.ADMIN]),
      validateRequest(updateUserSchema) as RequestHandler,
      (req, res, next) => this.controller.updateUser(req, res, next));
    
    this.router.delete('/:id', 
      authorize([UserRole.ADMIN]),
      (req, res, next) => this.controller.deleteUser(req, res, next));
  }
}

const userRouterInstance = new UserRouter();
export default userRouterInstance.getRouter(); 