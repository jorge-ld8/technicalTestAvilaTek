/* eslint-disable */
import { PrismaClient } from '../../generated/prisma/edge';
import ENV from './constants/ENV';
import { NodeEnvs } from './constants';
import { withAccelerate } from '@prisma/extension-accelerate';

// 
declare global {
  var prisma: PrismaClient | undefined | any;
}

let prismaInstance;

if (ENV.NodeEnv === NodeEnvs.Production) {
  prismaInstance = new PrismaClient().$extends(withAccelerate());
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient({}).$extends(withAccelerate());
  }
  prismaInstance = global.prisma;
}

export default prismaInstance as PrismaClient;
