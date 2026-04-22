import { z } from "zod";

export const authorityIdParamSchema = z.object({
  authorityId: z.coerce.number().int().positive()
});

export const authorityLoginSchema = z.object({
  authorityId: z.coerce.number().int().positive(),
  password: z.string().min(1, "Password is required.")
});
