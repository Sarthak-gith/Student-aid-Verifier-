import crypto from "crypto";

const ALGORITHM = "sha256";
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
const ITERATIONS = 120000;

export function hashPassword(password) {
  const salt = crypto.randomBytes(SALT_LENGTH).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, ALGORITHM)
    .toString("hex");

  return { salt, hash };
}

export function verifyPassword(password, salt, expectedHash) {
  const hash = crypto
    .pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, ALGORITHM)
    .toString("hex");

  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(expectedHash, "hex"));
}
