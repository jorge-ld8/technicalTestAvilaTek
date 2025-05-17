import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../common/prisma';
import HttpStatusCodes from '../common/constants/HttpStatusCodes';
import ENV from '../common/constants/ENV';
import { AuthenticatedRequest } from '@src/types/auth';
import UserService from '@src/services/UserService';

class AuthController {
  private userService: UserService;
  // constructor(private readonly userService: UserService) {}
  constructor() {
    this.userService = new UserService();
  }

  public async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { firstName, lastName, email, password } = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        res.status(HttpStatusCodes.BAD_REQUEST).json({
          message: 'User with this email already exists',
        });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password as string, salt);


      const user = await this.userService.register({
        firstName,
        lastName,
        email,
        password: hashedPassword,
      });

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      res.status(HttpStatusCodes.CREATED).json({
        user: userWithoutPassword,
      });
    } catch (error) {
      next(error);
    }
  }

  public async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
  
      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { email },
      });
  
      if (!user) {
        res.status(HttpStatusCodes.UNAUTHORIZED).json({
          message: 'Invalid credentials',
        });
      }
  
      // Check password
      const isPasswordValid = await bcrypt.compare(
        password as string, user!.password);
  
      if (!isPasswordValid) {
        res.status(HttpStatusCodes.UNAUTHORIZED).json({
          message: 'Invalid credentials',
        });
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { id: user!.id, email: user!.email },
        ENV.JwtSecret || 'your-secret-key',
        { expiresIn: '1d' },
      );
  
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user!;
  
      res.status(HttpStatusCodes.OK).json({
        token,
        user: userWithoutPassword,
      });
    } catch (error) {
      next(error);
    }
  }

  public async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
  
      if (!userId) {
        res.status(HttpStatusCodes.UNAUTHORIZED).json({
          message: 'Not authenticated',
        });
      }
  
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
  
      if (!user) {
        res.status(HttpStatusCodes.NOT_FOUND).json({
          message: 'User not found',
        });
      }
  
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user!;
  
      res.status(HttpStatusCodes.OK).json({
        user: userWithoutPassword,
      });
    } catch (error: unknown) {
      next(error);
    }
  }
}

export default AuthController;
