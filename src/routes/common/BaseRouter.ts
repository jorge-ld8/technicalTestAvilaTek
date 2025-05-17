import { Router } from 'express';


export abstract class BaseRouter<T> {
  protected router: Router;
  protected controller: T;

  constructor(controller: T) {
    this.router = Router();
    this.controller = controller;
    this.setupRoutes();
  }

  public getRouter(): Router {
    return this.router;
  }

  protected abstract setupRoutes(): void;
} 