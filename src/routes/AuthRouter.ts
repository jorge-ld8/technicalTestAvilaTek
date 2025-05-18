import AuthController from '@src/controllers/AuthController';
import { RequestHandler } from 'express';
import { validateRequest } from '@src/middlewares/validateRequest';
import { loginSchema, registerSchema } from '@src/validators/auth.validator';
import { authenticate } from '@src/middlewares/authMiddleware';
import rateLimiter from 'express-rate-limit';
import { BaseRouter } from './common/BaseRouter';

const limiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 3, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
});

class AuthRouter extends BaseRouter<AuthController> {
  constructor() {
    super(new AuthController());
  }

  protected setupRoutes(): void {
    this.router.post('/register', 
      limiter,
      validateRequest(registerSchema) as RequestHandler,
      (req, res, next) => this.controller.register(req, res, next));

    this.router.post('/login', 
      limiter,
      validateRequest(loginSchema) as RequestHandler,
      (req, res, next) => this.controller.login(req, res, next));

    this.router.get('/profile', 
      authenticate,
      (req, res, next) => this.controller.getProfile(req, res, next));
  }
}

const authRouterInstance = new AuthRouter();
export default authRouterInstance.getRouter();
