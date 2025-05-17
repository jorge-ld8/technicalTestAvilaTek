import morgan from 'morgan';
import path from 'path';
import helmet from 'helmet';
import express, { Request, Response, NextFunction } from 'express';
import logger from 'jet-logger';

import BaseRouter from '@src/routes';

import Paths from '@src/common/constants/Paths';
import ENV from '@src/common/constants/ENV';
import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import { RouteError } from '@src/common/util/route-errors';
import { NodeEnvs } from '@src/common/constants';
import prismaInstance from './common/prisma';
import { User } from '../generated/prisma/edge';
import AuthRouter from './routes/AuthRouter';

/******************************************************************************
                                Setup
******************************************************************************/

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

// Add APIs, must be after middleware
app.use(Paths.Base, BaseRouter);

// Add error handler
app.use((err: Error, _: Request, res: Response, next: NextFunction) => {
  if (ENV.NodeEnv !== NodeEnvs.Test.valueOf()) {
    logger.err(err, true);
  }
  let status = HttpStatusCodes.BAD_REQUEST;
  if (err instanceof RouteError) {
    status = err.status;
    res.status(status).json({ error: err.message });
  }
  return next(err);
});

// app.get('/', (_: Request, res: Response) => {
//   res.status(200).send('Hello World');
// });

// app.get('/users', async (_, res: Response) => {
//   const users: User[] = await prismaInstance.user.findMany();
//   res.json(users);
// });

// app.post('/users', async (req: Request, res: Response) => {
//   const { firstName, lastName, email, password } = req.body;
//   const user: User = await prismaInstance.user.create({
//     data: { firstName, lastName, email, password },
//   });
//   res.json(user);
// });

// app.get('/users/:id', async (req: Request, res: Response) => {
//   console.log('got into /users/:id');
//   const { id } = req.params;
//   const user = await prismaInstance.user.findUnique({
//     where: { id },
//   });
//   res.json(user);
// });

// app.delete('/users/:id', async (req: Request, res: Response) => {
//   const { id } = req.params;
//   const user = await prismaInstance.user.delete({
//     where: { id },
//   });
//   res.json(user);
// });

app.use('/auth', AuthRouter);

export default app;
