/* eslint-disable */
import { PrismaClient } from "../../generated/prisma/edge";
import ENV from "./constants/ENV";
import { NodeEnvs } from "./constants";
import { withAccelerate } from "@prisma/extension-accelerate";
import type {
  User,
  Order,
  Product,
  OrderProduct,
} from "../../generated/prisma/edge";

//
declare global {
  var prisma: PrismaClient | undefined | any;
}

let prismaInstance;

if (ENV.NodeEnv === NodeEnvs.Production) {
  prismaInstance = new PrismaClient({
    datasourceUrl: ENV.DatabaseUrl,
  }).$extends(withAccelerate());
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      datasourceUrl: ENV.DatabaseUrl,
    }).$extends(withAccelerate());
  }
  prismaInstance = global.prisma;
}

// Export the Prisma model instances
export const UserModel = prismaInstance.user;
export const OrderModel = prismaInstance.order;
export const ProductModel = prismaInstance.product;
export const OrderProductModel = prismaInstance.orderProduct;

// Export the types
export type { User, Order, Product, OrderProduct };

export default prismaInstance as PrismaClient;
