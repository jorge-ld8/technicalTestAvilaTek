/* eslint-disable */
import { PrismaClient } from '@prisma/client';
import ENV from './constants/ENV';
import { NodeEnvs } from './constants';
// 
declare global {
  var prisma: PrismaClient | undefined;
}

let prismaInstance: PrismaClient;

if (ENV.NodeEnv === NodeEnvs.Production) {
  prismaInstance = new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient({
    });
  }
  prismaInstance = global.prisma;
}

export default prismaInstance;
