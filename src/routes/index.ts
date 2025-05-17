import { Router } from 'express';
import AuthRouter from './AuthRouter';
import ProductRouter from './ProductRouter';
import OrderRouter from './OrderRouter';

const apiRouter = Router();

apiRouter.use('/auth', AuthRouter);
apiRouter.use('/products', ProductRouter);
apiRouter.use('/orders', OrderRouter);

export default apiRouter;
