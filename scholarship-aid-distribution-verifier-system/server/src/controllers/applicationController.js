import { dbOptions, getConnection } from "../config/db.js";
import { documentUploadSchema } from "../validators/applicationSchemas.js";

const VALID_STATUSES = new Set(["Approved", "Rejected"]);

function toVerificationFlag(value, defaultValue) {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  if (typeof value === "number") {
    return value ? 1 : 0;
  }

  const normalized = String(value).trim().toLowerCase();
  return ["1", "true", "yes", "y", "approved", "valid"].includes(normalized) ? 1 : 0;
}

async function getNextId(connection, tableName, columnName, alias) {
  await connection.execute(`LOCK TABLE ${tableName} IN EXCLUSIVE MODE`);

  const result = await connection.execute(
    `SELECT NVL(MAX(${columnName}), 0) + 1 AS "${alias}" FROM ${tableName}`,
    {},
    dbOptions
  );

  return result.rows[0][alias];
}

async function getApplicationOwnership(connection, applicationId) {
  const result = await connection.execute(
    `SELECT
      a.Application_ID AS "applicationId",
      a.Student_ID AS "studentId",
      a.Status AS "status"
    FROM Application a
    WHERE a.Application_ID = :applicationId`,
    { applicationId },
    dbOptions
  );

  return result.rows[0] || null;
}

async function logApplicationStatusEvent(
  connection,
  { applicationId, status, eventType, notes = null, actorRole, actorId = null }
) {
  const historyId = await getNextId(
    connection,
    "Application_Status_History",
    "Application_Status_History_ID",
    "nextApplicationStatusHistoryId"
  );

  await connection.execute(
    `INSERT INTO Application_Status_History (
      Application_Status_History_ID,
      Application_ID,
      Status,
      Event_Type,
      Notes,
      Actor_Role,
      Actor_ID,
      Changed_At
    ) VALUES (
      :historyId,
      :applicationId,
      :status,
      :eventType,
      :notes,
      :actorRole,
      :actorId,
      SYSTIMESTAMP
    )`,
    {
      historyId,
      applicationId,
      status,
      eventType,
      notes,
      actorRole,
      actorId
    }
  );
}

export async function submitApplication(req, res, next) {
  let connection;

  try {
    const { studentId, scholarshipId } = req.validated?.body || req.body;

    if (!req.auth || req.auth.role !== "Student") {
      return res.status(401).json({ message: "Student authentication required." });
    }

    if (Number(req.auth.studentId) !== Number(studentId)) {
      return res.status(403).json({ message: "You can only submit applications for your own account." });
    }

    connection = await getConnection();

    const studentResult = await connection.execute(
      `SELECT Student_ID AS "studentId"
      FROM Student
      WHERE Student_ID = :studentId`,
      { studentId },
      dbOptions
    );

    if (studentResult.rows.length === 0) {
      return res.status(404).json({ message: "Student not found." });
    }

    const scholarshipResult = await connection.execute(
      `SELECT Scholarship_ID AS "scholarshipId"
      FROM Scholarship
      WHERE Scholarship_ID = :scholarshipId`,
      { scholarshipId },
      dbOptions
    );

    if (scholarshipResult.rows.length === 0) {
      return res.status(404).json({ message: "Scholarship not found." });
    }

    const duplicateResult = await connection.execute(
      `SELECT Application_ID AS "applicationId"
      FROM Application
      WHERE Student_ID = :studentId
        AND Scholarship_ID = :scholarshipId`,
      { studentId, scholarshipId },
      dbOptions
    );

    if (duplicateResult.rows.length > 0) {
      return res.status(409).json({
        message: "An application for this scholarship already exists for the student."
      });
    }

    const applicationId = await getNextId(
      connection,
      "Application",
      "Application_ID",
      "nextApplicationId"
    );

    await connection.execute(
      `INSERT INTO Application (
        Application_ID,
        Application_Date,
        Status,
        Student_ID,
        Scholarship_ID
      ) VALUES (
        :applicationId,
        SYSDATE,
        :status,
        :studentId,
        :scholarshipId
      )`,
      {
        applicationId,
        status: "Pending",
        studentId,
        scholarshipId
      }
    );

    await logApplicationStatusEvent(connection, {
      applicationId,
      status: "Pending",
      eventType: "Submitted",
      notes: "Application submitted by student.",
      actorRole: "Student",
      actorId: studentId
    });

    await connection.commit();

    return res.status(201).json({
      message: "Application submitted successfully.",
      application: {
        applicationId,
        studentId,
        scholarshipId,
        status: "Pending"
      }
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    return next(error);
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

export async function uploadApplicationDocument(req, res, next) {
  let connection;

  try {
    const { applicationId } = req.validated?.params || req.params;
    const { documentType, documentLabel } = documentUploadSchema.parse(req.body);

    if (!req.auth || req.auth.role !== "Student") {
      return res.status(401).json({ message: "Student authentication required." });
    }

    if (!req.file) {
      return res.status(400).json({ message: "A document file is required." });
    }

    connection = await getConnection();

    const application = await getApplicationOwnership(connection, applicationId);

    if (!application) {
      return res.status(404).json({ message: "Application not found." });
    }

    if (Number(req.auth.studentId) !== Number(application.studentId)) {
      return res.status(403).json({
        message: "You can only upload documents for your own applications."
      });
    }

    const existingDocument = await connection.execute(
      `SELECT Application_Document_ID AS "applicationDocumentId"
      FROM Application_Document
      WHERE Application_ID = :applicationId
        AND Document_Type = :documentType`,
      { applicationId, documentType },
      dbOptions
    );

    if (existingDocument.rows.length > 0) {
      return res.status(409).json({
        message: "A document of this type already exists for this application."
      });
    }

    const applicationDocumentId = await getNextId(
      connection,
      "Application_Document",
      "Application_Document_ID",
      "nextApplicationDocumentId"
    );

    await connection.execute(
      `INSERT INTO Application_Document (
        Application_Document_ID,
        Application_ID,
        Document_Type,
        Document_Label,
        File_Name,
        File_Path,
        Mime_Type,
        Uploaded_At
      ) VALUES (
        :applicationDocumentId,
        :applicationId,
        :documentType,
        :documentLabel,
        :fileName,
        :filePath,
        :mimeType,
        SYSTIMESTAMP
      )`,
      {
        applicationDocumentId,
        applicationId,
        documentType,
        documentLabel: documentLabel || null,
        fileName: req.file.filename,
        filePath: req.file.path,
        mimeType: req.file.mimetype
      }
    );

    await connection.commit();

    return res.status(201).json({
      message: "Document uploaded successfully.",
      document: {
        applicationDocumentId,
        applicationId,
        documentType,
        documentLabel: documentLabel || null,
        fileName: req.file.filename,
        filePath: req.file.path
      }
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    return next(error);
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

export async function getApplicationDocuments(req, res, next) {
  let connection;

  try {
    const { applicationId } = req.validated?.params || req.params;

    if (!req.auth || req.auth.role !== "Student") {
      return res.status(401).json({ message: "Student authentication required." });
    }

    connection = await getConnection();

    const application = await getApplicationOwnership(connection, applicationId);

    if (!application) {
      return res.status(404).json({ message: "Application not found." });
    }

    if (Number(req.auth.studentId) !== Number(application.studentId)) {
      return res.status(403).json({
        message: "You can only view documents for your own applications."
      });
    }

    const result = await connection.execute(
      `SELECT
        Application_Document_ID AS "applicationDocumentId",
        Application_ID AS "applicationId",
        Document_Type AS "documentType",
        Document_Label AS "documentLabel",
        File_Name AS "fileName",
        File_Path AS "filePath",
        Mime_Type AS "mimeType",
        Uploaded_At AS "uploadedAt"
      FROM Application_Document
      WHERE Application_ID = :applicationId
      ORDER BY Uploaded_At DESC`,
      { applicationId },
      dbOptions
    );

    return res.json({ documents: result.rows });
  } catch (error) {
    return next(error);
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

export async function getPendingApplications(req, res, next) {
  let connection;

  try {
    connection = await getConnection();

    const result = await connection.execute(
      `SELECT
        a.Application_ID AS "applicationId",
        a.Application_Date AS "applicationDate",
        a.Student_ID AS "studentId",
        st.Name AS "studentName",
        st.Institution AS "institution",
        st.Course AS "course",
        s.Scholarship_ID AS "scholarshipId",
        s.Scholarship_Name AS "scholarshipName",
        s.Amount AS "amount",
        a.Status AS "status"
      FROM Application a
      JOIN Student st
        ON st.Student_ID = a.Student_ID
      JOIN Scholarship s
        ON s.Scholarship_ID = a.Scholarship_ID
      WHERE a.Status = :status
      ORDER BY a.Application_Date ASC`,
      { status: "Pending" },
      dbOptions
    );

    return res.json({ applications: result.rows });
  } catch (error) {
    return next(error);
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

export async function getProcessedApplications(req, res, next) {
  let connection;

  try {
    connection = await getConnection();

    const result = await connection.execute(
      `SELECT
        a.Application_ID AS "applicationId",
        a.Application_Date AS "applicationDate",
        a.Student_ID AS "studentId",
        st.Name AS "studentName",
        st.Institution AS "institution",
        st.Course AS "course",
        s.Scholarship_ID AS "scholarshipId",
        s.Scholarship_Name AS "scholarshipName",
        s.Amount AS "amount",
        a.Status AS "status"
      FROM Application a
      JOIN Student st
        ON st.Student_ID = a.Student_ID
      JOIN Scholarship s
        ON s.Scholarship_ID = a.Scholarship_ID
      WHERE a.Status IN (:approvedStatus, :rejectedStatus)
      ORDER BY a.Application_Date DESC`,
      { approvedStatus: "Approved", rejectedStatus: "Rejected" },
      dbOptions
    );

    return res.json({ applications: result.rows });
  } catch (error) {
    return next(error);
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

export async function processApplication(req, res, next) {
  let connection;

  try {
    const {
      applicationId,
      authorityId,
      status,
      verificationDetails = {}
    } = req.validated?.body || req.body;

    if (!applicationId || !authorityId || !VALID_STATUSES.has(status)) {
      return res.status(400).json({
        message: "applicationId, authorityId, and a valid status (Approved or Rejected) are required."
      });
    }

    connection = await getConnection();

    const authorityResult = await connection.execute(
      `SELECT Authority_ID AS "authorityId"
      FROM Authority
      WHERE Authority_ID = :authorityId`,
      { authorityId },
      dbOptions
    );

    if (authorityResult.rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Authority_ID not found." });
    }

    const applicationResult = await connection.execute(
      `SELECT
        a.Application_ID AS "applicationId",
        a.Status AS "status",
        s.Amount AS "scholarshipAmount"
      FROM Application a
      JOIN Scholarship s
        ON s.Scholarship_ID = a.Scholarship_ID
      WHERE a.Application_ID = :applicationId
      FOR UPDATE`,
      { applicationId },
      dbOptions
    );

    if (applicationResult.rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Application not found." });
    }

    const application = applicationResult.rows[0];

    if (application.status !== "Pending") {
      await connection.rollback();
      return res.status(409).json({ message: "Only pending applications can be processed." });
    }

    const verificationId = await getNextId(
      connection,
      "Verification",
      "Verification_ID",
      "nextVerificationId"
    );

    await connection.execute(
      `INSERT INTO Verification (
        Verification_ID,
        Income_Verified,
        Academic_Verified,
        Documents_Status,
        Verification_Date,
        Application_ID,
        Authority_ID
      ) VALUES (
        :verificationId,
        :incomeVerified,
        :academicVerified,
        :documentsStatus,
        SYSDATE,
        :applicationId,
        :authorityId
      )`,
      {
        verificationId,
        incomeVerified: toVerificationFlag(
          verificationDetails.incomeVerified,
          status === "Approved" ? 1 : 0
        ),
        academicVerified: toVerificationFlag(
          verificationDetails.academicVerified,
          status === "Approved" ? 1 : 0
        ),
        documentsStatus: verificationDetails.documentsStatus ?? "Reviewed",
        applicationId,
        authorityId
      }
    );

    await connection.execute(
      `UPDATE Application
      SET Status = :status
      WHERE Application_ID = :applicationId`,
      { status, applicationId }
    );

    await logApplicationStatusEvent(connection, {
      applicationId,
      status,
      eventType: status === "Approved" ? "Approved" : "Rejected",
      notes: verificationDetails.documentsStatus || null,
      actorRole: "Authority",
      actorId: authorityId
    });

    let disbursement = null;

    if (status === "Approved") {
      const amountDisbursed =
        verificationDetails.amountDisbursed ?? application.scholarshipAmount;
      const paymentMode = verificationDetails.paymentMode ?? "Bank Transfer";
      const disbursementId = await getNextId(
        connection,
        "Disbursement",
        "Disbursement_ID",
        "nextDisbursementId"
      );

      await connection.execute(
        `INSERT INTO Disbursement (
          Disbursement_ID,
          Amount_Disbursed,
          Disbursement_Date,
          Payment_Mode,
          Application_ID
        ) VALUES (
          :disbursementId,
          :amountDisbursed,
          SYSDATE,
          :paymentMode,
          :applicationId
        )`,
        {
          disbursementId,
          amountDisbursed,
          paymentMode,
          applicationId
        }
      );

      disbursement = {
        disbursementId,
        amountDisbursed,
        paymentMode
      };
    }

    await connection.commit();

    return res.json({
      message: `Application ${status.toLowerCase()} successfully.`,
      applicationId,
      status,
      disbursement
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    return next(error);
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

export async function undoApplication(req, res, next) {
  let connection;

  try {
    const { applicationId } = req.validated?.body || req.body;

    if (!applicationId) {
      return res.status(400).json({ message: "applicationId is required." });
    }

    connection = await getConnection();

    const applicationResult = await connection.execute(
      `SELECT
        Application_ID AS "applicationId",
        Status AS "status"
      FROM Application
      WHERE Application_ID = :applicationId
      FOR UPDATE`,
      { applicationId },
      dbOptions
    );

    if (applicationResult.rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Application not found." });
    }

    if (!VALID_STATUSES.has(applicationResult.rows[0].status)) {
      await connection.rollback();
      return res.status(409).json({
        message: "Only approved or rejected applications can be undone."
      });
    }

    await connection.execute(
      `DELETE FROM Disbursement
      WHERE Application_ID = :applicationId`,
      { applicationId }
    );

    await connection.execute(
      `DELETE FROM Verification
      WHERE Application_ID = :applicationId`,
      { applicationId }
    );

    await connection.execute(
      `UPDATE Application
      SET Status = :status
      WHERE Application_ID = :applicationId`,
      { status: "Pending", applicationId }
    );

    await logApplicationStatusEvent(connection, {
      applicationId,
      status: "Pending",
      eventType: "Reopened",
      notes: "Decision was undone and application moved back to pending.",
      actorRole: "Authority",
      actorId: null
    });

    await connection.commit();

    return res.json({
      message: "Application moved back to pending.",
      applicationId,
      status: "Pending"
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    return next(error);
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}
