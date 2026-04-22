import oracledb from "oracledb";
import { env } from "./env.js";

let pool;

function assertOracleConfig() {
  const missingKeys = [
    "ORACLE_USER",
    "ORACLE_PASSWORD",
    "ORACLE_CONNECT_STRING"
  ].filter((key) => !process.env[key]);

  if (missingKeys.length > 0) {
    throw new Error(
      `Missing Oracle configuration: ${missingKeys.join(
        ", "
      )}. Create server/.env from .env.example and set your Oracle credentials.`
    );
  }
}

export async function initializePool() {
  if (pool) {
    return pool;
  }

  assertOracleConfig();

  pool = await oracledb.createPool({
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: process.env.ORACLE_CONNECT_STRING,
    poolMin: Number(process.env.ORACLE_POOL_MIN || 1),
    poolMax: Number(process.env.ORACLE_POOL_MAX || 5),
    poolIncrement: Number(process.env.ORACLE_POOL_INCREMENT || 1)
  });

  return pool;
}

export async function getConnection() {
  if (!pool) {
    await initializePool();
  }

  return pool.getConnection();
}

export async function closePool() {
  if (pool) {
    await pool.close(10);
    pool = null;
  }
}

export const dbOptions = {
  outFormat: oracledb.OUT_FORMAT_OBJECT
};
