import { IUser } from '@src/models/User';
import prisma, { User } from '@src/common/prisma';
import { RegisterUserDto, UpdateUserDto, UserRole } from '@src/types/auth.d';
import { IBaseRepository } from './BaseRepository';
import { PaginatedResult, PaginationParams } from '@src/types/common';
import { createPaginatedResult, normalizePaginationParams } from '@src/common/util/pagination';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

function mapPrismaUserToIUser(user: User): IUser {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    password: user.password,
    role: user.role as UserRole,
  };
}

class UserRepo implements IBaseRepository<IUser, RegisterUserDto, UpdateUserDto> {
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

  async getAll(pagination?: PaginationParams): Promise<PaginatedResult<IUser>> {
    const { page, pageSize } = normalizePaginationParams(pagination);
    const skip = (page - 1) * pageSize;
    
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count(),
    ]);
    
    return createPaginatedResult(
      users.map(mapPrismaUserToIUser),
      {
        total: totalCount,
        currentPage: page,
        pageSize,
      }
    );
  }

  async create(data: RegisterUserDto): Promise<IUser> {
    const user = await prisma.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password ?? '',
        role: data.role ?? UserRole.CLIENT,
      },
    });
    return mapPrismaUserToIUser(user);
  }

  async update(id: string, data: UpdateUserDto): Promise<IUser | null> {
    try {
      const user = await prisma.user.update({
        where: { id },
        data: {
          ...(data.firstName !== undefined && { firstName: data.firstName }),
          ...(data.lastName !== undefined && { lastName: data.lastName }),
          ...(data.email !== undefined && { email: data.email }),
          ...(data.password !== undefined && { password: data.password }),
          ...(data.role !== undefined && { role: data.role }),
        },
      });
      return mapPrismaUserToIUser(user);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
        return null;
      }
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.user.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
        return false;
      }
      throw error;
    }
  }

  async deleteAll(): Promise<void> {
    await prisma.user.deleteMany();
  } 

  async insertMult(users: RegisterUserDto[]): Promise<IUser[]> {
    const createdUsers = await prisma.$transaction(
      users.map(data => 
        prisma.user.create({
          data: {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            password: data.password ?? '',
            role: data.role ?? UserRole.CLIENT,
          },
        }),
      ),
    );
    return createdUsers.map(mapPrismaUserToIUser);
  }
}

export default UserRepo;
