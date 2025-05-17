import AuthController from '@src/controllers/AuthController';
import { RequestHandler, Router } from 'express';
import { validateRequest } from '@src/middlewares/validateRequest';
import { loginSchema, registerSchema } from '@src/validators/auth.validator';

class AuthRouter {
  private router: Router;
  private controller: AuthController;

  constructor() {
    this.router = Router();
    this.controller = new AuthController();
    this.setupRoutes();
  }

  public getRouter() {
    return this.router;
  }

  private setupRoutes() {
    this.router.post('/register', 
        validateRequest(registerSchema) as RequestHandler,
        (req, res, next) => this.controller.register(req, res, next));
    this.router.post('/login', 
        validateRequest(loginSchema) as RequestHandler,
        (req, res, next) => this.controller.login(req, res, next));
    this.router.get('/profile', (req, res, next) => this.controller.getProfile(req, res, next));
  }
}

const authRouterInstance = new AuthRouter();
export default authRouterInstance.getRouter();
