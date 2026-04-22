import { dbOptions, getConnection } from "../config/db.js";

export async function getStudentDashboard(req, res, next) {
  let connection;

  try {
    const { studentId } = req.validated?.params || req.params;

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
      LEFT JOIN (
        SELECT
          Disbursement_ID,
          Amount_Disbursed,
          Disbursement_Date,
          Payment_Mode,
          Application_ID,
          ROW_NUMBER() OVER (
            PARTITION BY Application_ID
            ORDER BY Disbursement_Date DESC, Disbursement_ID DESC
          ) AS rn
        FROM Disbursement
      ) d
        ON d.Application_ID = a.Application_ID
        AND d.rn = 1
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

export async function getStudentProfile(req, res, next) {
  let connection;

  try {
    if (!req.auth || req.auth.role !== "Student") {
      return res.status(401).json({ message: "Student authentication required." });
    }

    const studentId = Number(req.auth.studentId);

    connection = await getConnection();

    const studentResult = await connection.execute(
      `SELECT
        Student_ID AS "studentId",
        Name AS "name",
        DOB AS "dob",
        Gender AS "gender",
        Category AS "category",
        Income AS "income",
        Institution AS "institution",
        Course AS "course"
      FROM Student
      WHERE Student_ID = :studentId`,
      { studentId },
      dbOptions
    );

    if (studentResult.rows.length === 0) {
      return res.status(404).json({ message: "Student not found." });
    }

    const applicationResult = await connection.execute(
      `SELECT
        a.Application_ID AS "applicationId",
        a.Application_Date AS "applicationDate",
        a.Status AS "status",
        s.Scholarship_ID AS "scholarshipId",
        s.Scholarship_Name AS "scholarshipName",
        s.Amount AS "scholarshipAmount",
        d.Amount_Disbursed AS "amountDisbursed",
        d.Disbursement_Date AS "disbursementDate",
        d.Payment_Mode AS "paymentMode"
      FROM Application a
      JOIN Scholarship s
        ON s.Scholarship_ID = a.Scholarship_ID
      LEFT JOIN (
        SELECT
          Disbursement_ID,
          Amount_Disbursed,
          Disbursement_Date,
          Payment_Mode,
          Application_ID,
          ROW_NUMBER() OVER (
            PARTITION BY Application_ID
            ORDER BY Disbursement_Date DESC, Disbursement_ID DESC
          ) AS rn
        FROM Disbursement
      ) d
        ON d.Application_ID = a.Application_ID
        AND d.rn = 1
      WHERE a.Student_ID = :studentId
      ORDER BY a.Application_Date DESC`,
      { studentId },
      dbOptions
    );

    const documentResult = await connection.execute(
      `SELECT
        ad.Application_Document_ID AS "applicationDocumentId",
        ad.Application_ID AS "applicationId",
        ad.Document_Type AS "documentType",
        ad.Document_Label AS "documentLabel",
        ad.File_Name AS "fileName",
        ad.File_Path AS "filePath",
        ad.Mime_Type AS "mimeType",
        ad.Uploaded_At AS "uploadedAt"
      FROM Application_Document ad
      JOIN Application a
        ON a.Application_ID = ad.Application_ID
      WHERE a.Student_ID = :studentId
      ORDER BY ad.Uploaded_At DESC`,
      { studentId },
      dbOptions
    );

    const historyResult = await connection.execute(
      `SELECT
        h.Application_Status_History_ID AS "applicationStatusHistoryId",
        h.Application_ID AS "applicationId",
        h.Status AS "status",
        h.Event_Type AS "eventType",
        h.Notes AS "notes",
        h.Actor_Role AS "actorRole",
        h.Actor_ID AS "actorId",
        h.Changed_At AS "changedAt"
      FROM Application_Status_History h
      JOIN Application a
        ON a.Application_ID = h.Application_ID
      WHERE a.Student_ID = :studentId
      ORDER BY h.Changed_At DESC`,
      { studentId },
      dbOptions
    );

    const documentsByApplicationId = new Map();
    for (const document of documentResult.rows) {
      const key = Number(document.applicationId);
      const current = documentsByApplicationId.get(key) || [];
      current.push(document);
      documentsByApplicationId.set(key, current);
    }

    const historyByApplicationId = new Map();
    for (const historyEvent of historyResult.rows) {
      const key = Number(historyEvent.applicationId);
      const current = historyByApplicationId.get(key) || [];
      current.push(historyEvent);
      historyByApplicationId.set(key, current);
    }

    const applications = applicationResult.rows.map((application) => ({
      ...application,
      documents: documentsByApplicationId.get(Number(application.applicationId)) || [],
      timeline: historyByApplicationId.get(Number(application.applicationId)) || []
    }));

    return res.json({
      student: studentResult.rows[0],
      applications
    });
  } catch (error) {
    return next(error);
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}
