import express from "express";
import { getStudentDashboard, getStudentProfile } from "../controllers/studentController.js";
import { loginStudent, registerStudent } from "../controllers/studentAuthController.js";
import { authenticateStudent } from "../middleware/authenticateStudent.js";
import { validateRequest } from "../middleware/validateRequest.js";
import {
  studentIdParamSchema,
  studentLoginSchema,
  studentRegisterSchema
} from "../validators/studentSchemas.js";

const router = express.Router();

router.post("/register", validateRequest(studentRegisterSchema), registerStudent);
router.post("/login", validateRequest(studentLoginSchema), loginStudent);
router.get("/profile", authenticateStudent, getStudentProfile);
router.get("/:studentId", validateRequest(studentIdParamSchema, "params"), getStudentDashboard);

export default router;
