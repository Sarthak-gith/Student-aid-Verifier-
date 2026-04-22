import fs from "fs";
import path from "path";
import multer from "multer";
import { env } from "../config/env.js";

fs.mkdirSync(env.uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, env.uploadsDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    cb(null, `${timestamp}-${sanitizedName}`);
  }
});

function fileFilter(req, file, cb) {
  const allowedExtensions = new Set([".pdf", ".png", ".jpg", ".jpeg"]);
  const extension = path.extname(file.originalname).toLowerCase();

  if (!allowedExtensions.has(extension)) {
    cb(new Error("Only PDF, PNG, JPG, and JPEG files are allowed."));
    return;
  }

  cb(null, true);
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});
