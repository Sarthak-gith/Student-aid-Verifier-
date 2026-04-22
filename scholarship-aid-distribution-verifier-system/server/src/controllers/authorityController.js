import { dbOptions, getConnection } from "../config/db.js";
import { env } from "../config/env.js";
import { createSessionToken } from "../services/authService.js";

async function findAuthority(connection, authorityId) {
  const result = await connection.execute(
    `SELECT
      Authority_ID AS "authorityId",
      Name AS "name",
      Role AS "role",
      Department AS "department"
    FROM Authority
    WHERE Authority_ID = :authorityId`,
    { authorityId },
    dbOptions
  );

  return result.rows[0] || null;
}

export async function getAuthorityById(req, res, next) {
  let connection;

  try {
    const { authorityId } = req.validated?.params || req.params;

    if (!authorityId) {
      return res.status(400).json({ message: "Authority_ID is required." });
    }

    connection = await getConnection();

    const authority = await findAuthority(connection, authorityId);

    if (!authority) {
      return res.status(404).json({ message: "Authority_ID not found." });
    }

    return res.json({ authority });
  } catch (error) {
    return next(error);
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

export async function loginAuthority(req, res, next) {
  let connection;

  try {
    const { authorityId, password } = req.validated?.body || req.body;

    if (!authorityId || !password) {
      return res.status(400).json({
        message: "Authority_ID and password are required."
      });
    }

    if (password !== env.authorityLoginPassword) {
      return res.status(401).json({ message: "Invalid authority password." });
    }

    connection = await getConnection();

    const authority = await findAuthority(connection, authorityId);

    if (!authority) {
      return res.status(404).json({ message: "Authority_ID not found." });
    }

    return res.json({
      authority,
      token: createSessionToken({
        sub: String(authority.authorityId),
        authorityId: authority.authorityId,
        role: authority.role,
        department: authority.department
      })
    });
  } catch (error) {
    return next(error);
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

export function getCurrentAuthoritySession(req, res) {
  return res.json({
    session: {
      authorityId: Number(req.auth.authorityId),
      role: req.auth.role,
      department: req.auth.department
    }
  });
}
