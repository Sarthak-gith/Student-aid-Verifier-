import { dbOptions, getConnection } from "../config/db.js";

export async function getAuthorityById(req, res, next) {
  let connection;

  try {
    const { authorityId } = req.params;

    if (!authorityId) {
      return res.status(400).json({ message: "Authority_ID is required." });
    }

    connection = await getConnection();

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

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Authority_ID not found." });
    }

    return res.json({ authority: result.rows[0] });
  } catch (error) {
    return next(error);
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}
