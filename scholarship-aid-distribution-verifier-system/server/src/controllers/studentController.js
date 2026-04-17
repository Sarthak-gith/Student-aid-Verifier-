import { dbOptions, getConnection } from "../config/db.js";

export async function getStudentDashboard(req, res, next) {
  let connection;

  try {
    const { studentId } = req.params;

    if (!studentId) {
      return res.status(400).json({ message: "Student ID is required." });
    }

    connection = await getConnection();

    const result = await connection.execute(
      `SELECT
        a.Application_ID AS "applicationId",
        st.Name AS "studentName",
        s.Scholarship_Name AS "scholarshipName",
        a.Status AS "status",
        d.Amount_Disbursed AS "amountDisbursed",
        d.Disbursement_Date AS "disbursementDate",
        d.Payment_Mode AS "paymentMode"
      FROM Application a
      JOIN Student st
        ON st.Student_ID = a.Student_ID
      JOIN Scholarship s
        ON s.Scholarship_ID = a.Scholarship_ID
      LEFT JOIN Disbursement d
        ON d.Application_ID = a.Application_ID
      WHERE a.Student_ID = :studentId
      ORDER BY a.Application_Date DESC`,
      { studentId },
      dbOptions
    );

    return res.json({
      studentId,
      studentName: result.rows[0]?.studentName || null,
      applications: result.rows
    });
  } catch (error) {
    return next(error);
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}
