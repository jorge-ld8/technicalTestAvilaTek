import { User } from 'generated/prisma';
import prisma from '../common/prisma';
import { RegisterUserDto } from '@src/types/auth';
class UserService {
  public async register(user: RegisterUserDto): Promise<User> {
    const existingUser = await prisma.user.findUnique({
      where: { email: user.email },
    });
    if (existingUser) {
      throw new Error('User already exists');
    }
    const newUser = await prisma.user.create({
      data: user,
    });

    return newUser;
  }

  public async login(user: User) {
    const existingUser = await prisma.user.findUnique({
      where: { email: user.email },
    });
  }
  
  public async getProfile(user: User) {
    const existingUser = await prisma.user.findUnique({
      where: { email: user.email },
    });
  }
}

export default UserService;
