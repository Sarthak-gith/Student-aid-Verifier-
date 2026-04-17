import express from "express";
import { getAuthorityById } from "../controllers/authorityController.js";

const router = express.Router();

router.get("/:authorityId", getAuthorityById);

export default router;
