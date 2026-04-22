import { dbOptions, getConnection } from "../config/db.js";
import { createSessionToken } from "../services/authService.js";
import { hashPassword, verifyPassword } from "../services/passwordService.js";

async function findStudent(connection, studentId) {
  const result = await connection.execute(
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

  return result.rows[0] || null;
}

async function findStudentAccount(connection, studentId) {
  const result = await connection.execute(
    `SELECT
      Student_ID AS "studentId",
      Password_Salt AS "passwordSalt",
      Password_Hash AS "passwordHash"
    FROM Student_Account
    WHERE Student_ID = :studentId`,
    { studentId },
    dbOptions
  );

  return result.rows[0] || null;
}

export async function registerStudent(req, res, next) {
  let connection;

  try {
    const {
      studentId,
      name,
      dob,
      gender,
      category,
      income,
      institution,
      course,
      password
    } = req.validated?.body || req.body;

    connection = await getConnection();

    const existingStudent = await findStudent(connection, studentId);
    if (existingStudent) {
      return res.status(409).json({ message: "Student_ID already exists." });
    }

    const { salt, hash } = hashPassword(password);

    await connection.execute(
      `INSERT INTO Student (
        Student_ID,
        Name,
        DOB,
        Gender,
        Category,
        Income,
        Institution,
        Course
      ) VALUES (
        :studentId,
        :name,
        TO_DATE(:dob, 'YYYY-MM-DD'),
        :gender,
        :category,
        :income,
        :institution,
        :course
      )`,
      {
        studentId,
        name,
        dob,
        gender,
        category,
        income,
        institution,
        course
      }
    );

    await connection.execute(
      `INSERT INTO Student_Account (
        Student_ID,
        Password_Salt,
        Password_Hash,
        Created_At,
        Updated_At
      ) VALUES (
        :studentId,
        :passwordSalt,
        :passwordHash,
        SYSTIMESTAMP,
        SYSTIMESTAMP
      )`,
      {
        studentId,
        passwordSalt: salt,
        passwordHash: hash
      }
    );

    await connection.commit();

    return res.status(201).json({
      message: "Student registered successfully.",
      student: {
        studentId,
        name,
        dob,
        gender,
        category,
        income,
        institution,
        course
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

export async function loginStudent(req, res, next) {
  let connection;

  try {
    const { studentId, password } = req.validated?.body || req.body;

    connection = await getConnection();

    const student = await findStudent(connection, studentId);
    if (!student) {
      return res.status(404).json({ message: "Student_ID not found." });
    }

    const studentAccount = await findStudentAccount(connection, studentId);
    if (!studentAccount) {
      return res.status(404).json({
        message: "Student account not found. Register the student first."
      });
    }

    const isPasswordValid = verifyPassword(
      password,
      studentAccount.passwordSalt,
      studentAccount.passwordHash
    );

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid student password." });
    }

    return res.json({
      message: "Login successful.",
      student: {
        studentId: student.studentId,
        name: student.name
      },
      token: createSessionToken({
        sub: String(student.studentId),
        studentId: student.studentId,
        role: "Student",
        department: student.category
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
