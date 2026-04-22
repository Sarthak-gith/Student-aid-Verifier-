import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function createSessionToken(payload) {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn
  });
}

export function verifySessionToken(token) {
  return jwt.verify(token, env.jwtSecret);
}
