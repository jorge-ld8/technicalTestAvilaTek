import ENV from '@src/common/constants/ENV';
import { IUser } from '@src/models/User';
import UserRepo from '@src/repos/UserRepo';
import { LoginResponse, LoginUserDto, RegisterResponse, RegisterUserDto } from '@src/types/auth';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import 
{ AuthenticationError, 
  ConflictError, 
  InternalServerError, 
  NotFoundError 
} from '@src/common/errors';

class AuthService {
  private userRepo = new UserRepo();

  public async getAll(): Promise<IUser[]> {
    return await this.userRepo.getAll();
  }

  public async register(registerUserDto: RegisterUserDto): Promise<RegisterResponse> {

    const existingUser = await this.userRepo.getOne(registerUserDto.email);

    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(registerUserDto.password, salt);
    registerUserDto.password = hashedPassword;
    
    const user = await this.userRepo.add(registerUserDto);
    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword };
  }

  public async login(loginUserDto: LoginUserDto): Promise<LoginResponse> {
    const user = await this.userRepo.getOne(loginUserDto.email);
    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(loginUserDto.password, user.password!);
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Generate JWT token
    this.ensureJwtSecret();
    
    const token = jwt.sign(
      { id: user.id, email: user.email },
      ENV.JwtSecret,
      { expiresIn: '1d' },
    );

    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  private ensureJwtSecret(): void {
    if (!ENV.JwtSecret) {
      console.error("FATAL ERROR: JWT_SECRET is not defined");
      throw new InternalServerError("Authentication configuration error");
    }
  }

  public async getOne(email: string): Promise<IUser | null> {
    return await this.userRepo.getOne(email);
  }

  public async getById(id: string): Promise<IUser | null> {
    const user = await this.userRepo.getById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }
}

export default AuthService;
