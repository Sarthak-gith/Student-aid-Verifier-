import express from "express";
import { getAuthorityById, loginAuthority } from "../controllers/authorityController.js";

const router = express.Router();

router.post("/login", loginAuthority);
router.get("/:authorityId", getAuthorityById);

export default router;
