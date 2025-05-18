import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import express, { Request, Response } from 'express';
import apiRouter from '@src/routes';
import Paths from '@src/common/constants/Paths';
import ENV from '@src/common/constants/ENV';
import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import { NodeEnvs } from '@src/common/constants';
import { errorHandler } from './middlewares/errorHandler';
import { setupSwagger } from './common/swagger';

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use(cors());
app.use(compression());
// Rate limiting to prevent abuse
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to API routes
app.use('/api', apiLimiter);

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
// Setup Swagger
setupSwagger(app);

app.use(Paths.Base, apiRouter);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(HttpStatusCodes.OK).json({ status: 'OK' });
});

app.use(errorHandler);

export default app;
