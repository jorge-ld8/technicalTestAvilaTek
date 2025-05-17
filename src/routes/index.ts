import { Router } from 'express';
import AuthRouter from './AuthRouter';
import ProductRouter from './ProductRouter';
import { authenticate } from '@src/middlewares/authMiddleware';

const apiRouter = Router();

// Public routes
apiRouter.use('/auth', AuthRouter);
apiRouter.use('/products', ProductRouter);

// Note: The following routes will be added as their controllers and validators are implemented
// apiRouter.use('/orders', authenticate, OrderRouter);
// apiRouter.use('/users', authenticate, UserRouter);

export default apiRouter;
