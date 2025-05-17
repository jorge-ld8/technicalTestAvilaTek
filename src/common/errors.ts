export class AppError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name; // Set the error name to the class name
    Error.captureStackTrace(this, this.constructor); // Capture stack trace
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'You are not authorized to perform this action') {
    super(message, 403);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Invalid request data') {
    super(message, 400);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409);
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'An unexpected error occurred on the server') {
    super(message, 500);
  }
}