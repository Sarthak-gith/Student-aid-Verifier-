import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..", "..");

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  authorityLoginPassword: process.env.AUTHORITY_LOGIN_PASSWORD || "verifier123",
  jwtSecret: process.env.JWT_SECRET || "change_this_to_a_long_random_secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  uploadsDir: path.resolve(projectRoot, process.env.UPLOAD_DIR || "uploads")
};

export function isProduction() {
  return env.nodeEnv === "production";
}
