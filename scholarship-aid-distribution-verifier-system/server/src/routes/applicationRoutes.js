import express from "express";
import {
  getProcessedApplications,
  getPendingApplications,
  getApplicationDocuments,
  processApplication,
  submitApplication,
  uploadApplicationDocument,
  undoApplication
} from "../controllers/applicationController.js";
import { authenticateStudent } from "../middleware/authenticateStudent.js";
import { upload } from "../middleware/upload.js";
import { validateRequest } from "../middleware/validateRequest.js";
import {
  applicationIdParamSchema,
  submitApplicationSchema,
  processApplicationSchema,
  undoApplicationSchema
} from "../validators/applicationSchemas.js";

const router = express.Router();

router.get("/pending", getPendingApplications);
router.get("/processed", getProcessedApplications);
router.post("/submit", authenticateStudent, validateRequest(submitApplicationSchema), submitApplication);
router.get(
  "/:applicationId/documents",
  authenticateStudent,
  validateRequest(applicationIdParamSchema, "params"),
  getApplicationDocuments
);
router.post(
  "/:applicationId/documents",
  authenticateStudent,
  upload.single("document"),
  validateRequest(applicationIdParamSchema, "params"),
  uploadApplicationDocument
);
router.post("/process", validateRequest(processApplicationSchema), processApplication);
router.post("/undo", validateRequest(undoApplicationSchema), undoApplication);

export default router;
