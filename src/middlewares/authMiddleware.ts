import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest, AuthenticatedUser } from '@src/types/auth.d';
import { AuthenticationError, AuthorizationError } from '@src/common/errors';
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
        },
      });
      
      if (!user) {
        return next(new AuthenticationError('User not found'));
      }
      
      // Attach user to request
      req.user = {
        id: user.id,
        email: user.email,
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

/**
 * Optional middleware: Checks if a user has admin privileges
 * Note: You need to add an isAdmin field to your User model to use this
 */
export const isAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  // First ensure the user is authenticated
  if (!req.user) {
    return next(new AuthenticationError('Authentication required'));
  }
  
  try {
    // Look up the full user record to check admin status
    const user = await prismaInstance.user.findUnique({
      where: { id: req.user.id },
      select: { id: true /* , isAdmin: true */ }, // Uncomment and add isAdmin field to your User model
    });
    
    if (!user) {
      return next(new AuthenticationError('User not found'));
    }
    
    // Check admin status - uncomment and adjust this once you add isAdmin to your User model
    // if (!user.isAdmin) {
    //   return next(new AuthorizationError('Administrator access required'));
    // }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Creates a middleware that checks if the user has one of the specified roles
 * Note: You need to add a role field to your User model to use this
 */
export const authorizeRoles = (...roles: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required'));
    }
    
    try {
      // Look up the full user to check role
      const user = await prismaInstance.user.findUnique({
        where: { id: req.user.id },
        select: { id: true /* , role: true */ }, // Uncomment and add role field to your User model
      });
      
      if (!user) {
        return next(new AuthenticationError('User not found'));
      }
      
      // Check role - uncomment and adjust this once you add role to your User model
      // if (!roles.includes(user.role)) {
      //   return next(new AuthorizationError(`Role ${user.role} is not authorized to access this resource`));
      // }
      
      next();
    } catch (error) {
      next(error);
    }
  };
}; 