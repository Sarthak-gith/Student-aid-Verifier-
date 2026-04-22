import { ZodError } from "zod";
import { isProduction } from "../config/env.js";

export function notFoundHandler(req, res) {
  res.status(404).json({ message: "Route not found." });
}

export function errorHandler(error, req, res, next) {
  if (error instanceof ZodError) {
    return res.status(400).json({
      message: "Validation failed.",
      issues: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message
      }))
    });
  }

  console.error(error);

  return res.status(500).json({
    message: "An unexpected server error occurred.",
    error: isProduction() ? undefined : error.message
  });
}
