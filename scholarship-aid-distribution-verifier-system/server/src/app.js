import cors from "cors";
import express from "express";
import path from "path";
import swaggerUi from "swagger-ui-express";
import { fileURLToPath } from "url";
import { env } from "./config/env.js";
import { openApiDocument } from "./docs/openapi.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import authorityRoutes from "./routes/authorityRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import { getHealth } from "./controllers/healthController.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(
  cors({
    origin: env.clientOrigin
  })
);
app.use(express.json());
app.use("/uploads", express.static(path.resolve(__dirname, "..", "uploads")));

app.get("/api/health", getHealth);
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

app.use("/api/student", studentRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/authorities", authorityRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
