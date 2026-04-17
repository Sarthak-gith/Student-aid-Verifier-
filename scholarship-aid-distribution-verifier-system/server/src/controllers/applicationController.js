import { dbOptions, getConnection } from "../config/db.js";

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
    const { applicationId, authorityId, status, verificationDetails = {} } = req.body;

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
    const { applicationId } = req.body;

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
