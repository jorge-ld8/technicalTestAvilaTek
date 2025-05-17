import { Router } from 'express';
import AuthRouter from './AuthRouter';

const apiRouter = Router();

// Public routes
apiRouter.use('/auth', AuthRouter);

// Note: The following routes will be added as their controllers and validators are implemented
// apiRouter.use('/products', ProductRouter);
// apiRouter.use('/orders', authenticate, OrderRouter);
// apiRouter.use('/users', authenticate, UserRouter);

export default apiRouter;
