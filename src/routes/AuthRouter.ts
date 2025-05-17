import { isNumber } from 'jet-validators';
import { transform } from 'jet-validators/utils';

import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import UserService from '@src/services/UserService';
import User from '@src/models/User';
import AuthController from '@src/controllers/AuthController';

import { IReq, IRes } from './common/types';
import { parseReq } from './common/util';
import { RequestHandler, Router } from 'express';
import { z } from 'zod';
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
    // this.router.get('/profile', (req, res, next) => this.controller.getProfile(req, res, next));
  }
}

// const Validators = {
//   add: parseReq({ user: User.test }),
//   update: parseReq({ user: User.test }),
//   delete: parseReq({ id: transform(Number, isNumber) }),
// } as const;

const authRouterInstance = new AuthRouter();
export default authRouterInstance.getRouter();
