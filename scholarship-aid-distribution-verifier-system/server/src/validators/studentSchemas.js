import { z } from "zod";

export const studentIdParamSchema = z.object({
  studentId: z.coerce.number().int().positive()
});

export const studentRegisterSchema = z.object({
  studentId: z.coerce.number().int().positive(),
  name: z.string().trim().min(1).max(100),
  dob: z.string().trim().min(1),
  gender: z.string().trim().min(1).max(20),
  category: z.string().trim().min(1).max(50),
  income: z.coerce.number().nonnegative(),
  institution: z.string().trim().min(1).max(150),
  course: z.string().trim().min(1).max(100),
  password: z.string().min(8).max(200)
});

export const studentLoginSchema = z.object({
  studentId: z.coerce.number().int().positive(),
  password: z.string().min(1)
});
