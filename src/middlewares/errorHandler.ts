import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import logger from 'jet-logger';
import { ZodError } from 'zod';
import { AppError } from '@src/common/errors';
import { RouteError } from '@src/common/util/route-errors';
import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import ENV from '@src/common/constants/ENV';
import { NodeEnvs } from '@src/common/constants';

// Interface for standard error response
interface ErrorResponse {
  message: string;
  status: string;
  details?: string;
  errors?: { message: string }[];
}

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // Log error in development and production (not in test)
  if (ENV.NodeEnv !== NodeEnvs.Test) {
    logger.err(err, true);
  }

  let statusCode = HttpStatusCodes.INTERNAL_SERVER_ERROR;
  let errorMessage = 'An unexpected error occurred';
  let errorDetails: string | undefined = undefined;
  let validationErrors: { message: string }[] | undefined = undefined;

  if (err instanceof ZodError) {
    statusCode = HttpStatusCodes.BAD_REQUEST;
    errorMessage = 'Validation failed';
    validationErrors = err.errors.map((error) => ({
      message: String(error.path) + ' ' + error.message,
    }));
  } else if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorMessage = err.message;
  } else if (err instanceof RouteError) {
    statusCode = err.status;
    errorMessage = err.message;
  } else if (err instanceof SyntaxError && 'body' in err) {
    statusCode = HttpStatusCodes.BAD_REQUEST;
    errorMessage = 'Invalid JSON format';
  } else if (ENV.NodeEnv === NodeEnvs.Dev) {
    errorMessage = err.message;
    errorDetails = err.stack;
  }

  const errorResponse: ErrorResponse = {
    message: errorMessage,
    status: 'error',
  };

  if (validationErrors) {
    errorResponse.status = 'controller validation failed';
    errorResponse.errors = validationErrors;
  }

  if (errorDetails && ENV.NodeEnv === NodeEnvs.Dev) {
    errorResponse.details = errorDetails;
  }

  res.status(statusCode).json(errorResponse);
};
