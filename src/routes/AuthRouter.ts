import AuthController from '@src/controllers/AuthController';
import { RequestHandler } from 'express';
import { validateRequest } from '@src/middlewares/validateRequest';
import { loginSchema, registerSchema } from '@src/validators/auth.validator';
import { authenticate } from '@src/middlewares/authMiddleware';
import rateLimiter from 'express-rate-limit';
import { BaseRouter } from './common/BaseRouter';

const limiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 3, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
});

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - id
 *         - firstName
 *         - lastName
 *         - email
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated ID of the user
 *         firstName:
 *           type: string
 *           description: The user's first name
 *         lastName:
 *           type: string
 *           description: The user's last name
 *         email:
 *           type: string
 *           format: email
 *           description: The user's email
 *         role:
 *           type: string
 *           enum: [CLIENT, ADMIN]
 *           description: The user's role
 *       example:
 *         id: "60d0fe4f5311236168a109ca"
 *         firstName: "John"
 *         lastName: "Doe"
 *         email: "john.doe@example.com"
 *         role: "CLIENT"
 *
 *     RegisterUserDto:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - email
 *         - password
 *       properties:
 *         firstName:
 *           type: string
 *           description: The user's first name
 *         lastName:
 *           type: string
 *           description: The user's last name
 *         email:
 *           type: string
 *           format: email
 *           description: The user's email
 *         password:
 *           type: string
 *           format: password
 *           description: The user's password (min 6 characters)
 *         role:
 *           type: string
 *           enum: [CLIENT, ADMIN]
 *           description: Optional user role
 *       example:
 *         firstName: "John"
 *         lastName: "Doe"
 *         email: "john.doe@example.com"
 *         password: "securepassword123"
 *
 *     LoginUserDto:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: The user's email
 *         password:
 *           type: string
 *           format: password
 *           description: The user's password
 *       example:
 *         email: "john.doe@example.com"
 *         password: "securepassword123"
 *
 *     LoginResponse:
 *       type: object
 *       properties:
 *         user:
 *           $ref: '#/components/schemas/User'
 *         token:
 *           type: string
 *           description: JWT authentication token
 *       example:
 *         user:
 *           id: "60d0fe4f5311236168a109ca"
 *           firstName: "John"
 *           lastName: "Doe"
 *           email: "john.doe@example.com"
 *           role: "CLIENT"
 *         token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 */

class AuthRouter extends BaseRouter<AuthController> {
  constructor() {
    super(new AuthController());
  }

  protected setupRoutes(): void {
    /**
     * @swagger
     * /auth/register:
     *   post:
     *     summary: Register a new user
     *     tags: [Authentication]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/RegisterUserDto'
     *     responses:
     *       201:
     *         description: User registered successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 user:
     *                   $ref: '#/components/schemas/User'
     *       400:
     *         description: Invalid input data
     *       409:
     *         description: Email already in use
     *       429:
     *         description: Rate limit exceeded
     */
    this.router.post(
      '/register',
      limiter,
      validateRequest(registerSchema) as RequestHandler,
      (req, res, next) => this.controller.register(req, res, next),
    );

    /**
     * @swagger
     * /auth/login:
     *   post:
     *     summary: Log in an existing user
     *     tags: [Authentication]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/LoginUserDto'
     *     responses:
     *       200:
     *         description: Login successful
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/LoginResponse'
     *       400:
     *         description: Invalid credentials
     *       401:
     *         description: Authentication failed
     *       429:
     *         description: Rate limit exceeded
     */
    this.router.post(
      '/login',
      limiter,
      validateRequest(loginSchema) as RequestHandler,
      (req, res, next) => this.controller.login(req, res, next),
    );

    /**
     * @swagger
     * /auth/profile:
     *   get:
     *     summary: Get the current user's profile
     *     tags: [Authentication]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: User profile retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/User'
     *       401:
     *         description: Unauthorized - Invalid or missing token
     *       404:
     *         description: User not found
     */
    this.router.get('/profile', authenticate, (req, res, next) =>
      this.controller.getProfile(req, res, next),
    );

    /**
     * @swagger
     * /auth/logout:
     *   post:
     *     summary: Logout the current user
     *     tags: [Authentication]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: User logged out successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Logged out successfully"
     *       401:
     *         description: Unauthorized - Invalid or missing token
     */
    this.router.post('/logout', authenticate, (req, res, next) =>
      this.controller.logout(req, res, next),
    );
  }
}

const authRouterInstance = new AuthRouter();
export default authRouterInstance.getRouter();
