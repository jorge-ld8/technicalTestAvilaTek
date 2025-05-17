import { IUser } from '@src/models/User';
import prisma, { User } from '@src/common/prisma';
import { RegisterUserDto } from '@src/types/auth';


function mapPrismaUserToIUser(user: User): IUser {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    password: user.password,
  };
}

class UserRepo {
  async getOne(email: string): Promise<IUser | null> {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    return user ? mapPrismaUserToIUser(user) : null;
  }

  async getById(id: string): Promise<IUser | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    return user ? mapPrismaUserToIUser(user) : null;
  }

  async getAll(): Promise<IUser[]> {
    const users = await prisma.user.findMany();
    return users.map(mapPrismaUserToIUser);
  }

  async add(registerUserDto: RegisterUserDto): Promise<IUser> {
    const user = await prisma.user.create({
      data: {
        firstName: registerUserDto.firstName,
        lastName: registerUserDto.lastName,
        email: registerUserDto.email,
        password: registerUserDto.password ?? '',
      },
    });
    return mapPrismaUserToIUser(user);
  }

  async update(user: IUser): Promise<void> {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        password: user.password ?? '',
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.user.delete({
      where: { id },
    });
  }

  async deleteAll(): Promise<void> {
    await prisma.user.deleteMany();
  } 

  async insertMult(users: IUser[]): Promise<IUser[]> {
    const createdUsers = await prisma.$transaction(
      users.map(user => 
        prisma.user.create({
          data: {
            ...user,
            password: user.password ?? '',
            createdAt: new Date(),
          },
        })
      )
    );
    return createdUsers;
  }
}

export default UserRepo;
