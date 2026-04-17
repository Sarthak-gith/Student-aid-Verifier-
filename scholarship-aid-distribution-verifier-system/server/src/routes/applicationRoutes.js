import express from "express";
import {
  getProcessedApplications,
  getPendingApplications,
  processApplication,
  undoApplication
} from "../controllers/applicationController.js";

const router = express.Router();

router.get("/pending", getPendingApplications);
router.get("/processed", getProcessedApplications);
router.post("/process", processApplication);
router.post("/undo", undoApplication);

export default router;
