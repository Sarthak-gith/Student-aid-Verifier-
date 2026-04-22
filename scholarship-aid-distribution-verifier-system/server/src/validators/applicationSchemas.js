import { z } from "zod";

const verificationDetailsSchema = z.object({
  incomeVerified: z.union([z.string(), z.number(), z.boolean()]).optional(),
  academicVerified: z.union([z.string(), z.number(), z.boolean()]).optional(),
  documentsStatus: z.string().trim().min(1).max(100).optional(),
  amountDisbursed: z.coerce.number().nonnegative().optional(),
  paymentMode: z.string().trim().min(1).max(50).optional()
});

export const processApplicationSchema = z.object({
  applicationId: z.coerce.number().int().positive(),
  authorityId: z.coerce.number().int().positive(),
  status: z.enum(["Approved", "Rejected"]),
  verificationDetails: verificationDetailsSchema.optional()
});

export const undoApplicationSchema = z.object({
  applicationId: z.coerce.number().int().positive()
});

export const submitApplicationSchema = z.object({
  studentId: z.coerce.number().int().positive(),
  scholarshipId: z.coerce.number().int().positive()
});

export const applicationIdParamSchema = z.object({
  applicationId: z.coerce.number().int().positive()
});

export const documentUploadSchema = z.object({
  documentType: z.enum([
    "income-proof",
    "marksheet",
    "caste-certificate",
    "bank-passbook",
    "other"
  ]),
  documentLabel: z.string().trim().max(100).optional()
});
