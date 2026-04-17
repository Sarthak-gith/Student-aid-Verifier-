import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import applicationRoutes from "./routes/applicationRoutes.js";
import authorityRoutes from "./routes/authorityRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173"
  })
);
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "scholarship-aid-verifier" });
});

app.use("/api/student", studentRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/authorities", authorityRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({
    message: "An unexpected server error occurred.",
    error: process.env.NODE_ENV === "production" ? undefined : error.message
  });
});

export default app;
