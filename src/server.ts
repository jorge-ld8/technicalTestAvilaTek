import morgan from 'morgan';
import helmet from 'helmet';
import express, { Request, Response } from 'express';
import apiRouter from '@src/routes';
import Paths from '@src/common/constants/Paths';
import ENV from '@src/common/constants/ENV';
import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import { NodeEnvs } from '@src/common/constants';
import { errorHandler } from './middlewares/errorHandler';

const app = express();
// Basic middleware
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Show routes called in console during development
if (ENV.NodeEnv === NodeEnvs.Dev) {
  app.use(morgan('dev'));
}

// Security
if (ENV.NodeEnv === NodeEnvs.Production) {
  // eslint-disable-next-line n/no-process-env
  if (!process.env.DISABLE_HELMET) {
    app.use(helmet());
  }
}

app.use(Paths.Base, apiRouter);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(HttpStatusCodes.OK).json({ status: 'OK' });
});

app.use(errorHandler);

export default app;
