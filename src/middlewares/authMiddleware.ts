import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest, AuthenticatedUser, UserRole } from '@src/types/auth.d';
import { AuthenticationError, AuthorizationError, ForbiddenError } from '@src/common/errors';
import ENV from '@src/common/constants/ENV';
import prismaInstance, { User } from '@src/common/prisma';

interface JwtPayload {
  id: string;
  email: string;
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      return next(new AuthenticationError('Authentication required'));
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return next(new AuthenticationError('Authentication required'));
    }
    
    try {
      if (!ENV.JwtSecret) {
        console.error('JWT_SECRET is not defined in the environment');
        return next(new AuthenticationError('Authentication configuration error'));
      }
      
      // Verify token
      const decoded = jwt.verify(token, ENV.JwtSecret) as JwtPayload;
      
      const user = await prismaInstance.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      });
      
      if (!user) {
        return next(new AuthenticationError('User not found'));
      }
      
      // Attach user to request
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role as UserRole
      } as AuthenticatedUser;
      
      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return next(new AuthenticationError('Invalid or expired token'));
      }
      next(error);
    }
  } catch (error) {
    next(error);
  }
};

export const authorize = (roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // First ensure the user is authenticated
    if (!req.user) {
      return next(new AuthenticationError('User not authenticated'));
    }

    // Check if user has one of the required roles
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('User does not have required permissions'));
    }

    next();
  };
}; 