import type { Request, Response, NextFunction } from "express";
import { z } from "zod";

export const validateRequest =
  (schema: z.AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      next(error);
    }
  };
