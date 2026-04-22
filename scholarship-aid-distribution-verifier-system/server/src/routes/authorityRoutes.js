import express from "express";
import {
  getAuthorityById,
  getCurrentAuthoritySession,
  loginAuthority
} from "../controllers/authorityController.js";
import { authenticateAuthority } from "../middleware/authenticate.js";
import { validateRequest } from "../middleware/validateRequest.js";
import {
  authorityIdParamSchema,
  authorityLoginSchema
} from "../validators/authoritySchemas.js";

const router = express.Router();

router.post("/login", validateRequest(authorityLoginSchema), loginAuthority);
router.get("/me", authenticateAuthority, getCurrentAuthoritySession);
router.get("/:authorityId", validateRequest(authorityIdParamSchema, "params"), getAuthorityById);

export default router;
