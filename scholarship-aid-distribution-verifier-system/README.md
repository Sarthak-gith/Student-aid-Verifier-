# Scholarship & Aid Distribution Verifier System

A full-stack DBMS project for verifying scholarship applications and tracking student aid disbursement.

The system provides a student-facing portal for checking scholarship status and a verifier dashboard for approving, rejecting, and undoing scholarship application decisions. It uses React on the frontend, Express on the backend, and Oracle Database for persistent storage.

## Features

- Student dashboard lookup by `Student_ID`
- Student name, scholarship status, disbursed amount, and payment mode display
- Color-coded application status badges:
  - Approved: green
  - Pending: yellow
  - Rejected: red
- Verifier login using `Authority_ID` and password
- Authority ID validation against the Oracle `Authority` table
- Pending applications dashboard
- Approve and reject actions
- Processed applications section for approved/rejected applications
- Undo action to move processed applications back to pending
- Oracle transaction handling with commit and rollback
- Oracle bind variables for safer SQL execution

## Tech Stack

### Frontend

- React
- Vite
- Tailwind CSS
- Functional components and React hooks

### Backend

- Node.js
- Express.js
- oracledb npm package
- dotenv
- cors

### Database

- Oracle Database
- Existing schema tables
- Connection pooling through `oracledb.createPool()`

## Project Structure

```text
scholarship-aid-distribution-verifier-system/
  client/
    index.html
    package.json
    postcss.config.js
    tailwind.config.js
    vite.config.js
    src/
      App.jsx
      main.jsx
      index.css
      components/
        StatusBadge.jsx
        StudentPortal.jsx
        VerifierDashboard.jsx
      services/
        api.js
  server/
    package.json
    .env.example
    src/
      app.js
      server.js
      config/
        db.js
      controllers/
        applicationController.js
        authorityController.js
        studentController.js
      routes/
        applicationRoutes.js
        authorityRoutes.js
        studentRoutes.js
  .gitignore
  README.md
```

## Database Schema

The project expects these Oracle tables to already exist:

```text
Student(Student_ID, Name, DOB, Gender, Category, Income, Institution, Course)

Scholarship(Scholarship_ID, Scholarship_Name, Type, Amount, Eligibility_Criteria, Sponsor)

Application(Application_ID, Application_Date, Status, Student_ID, Scholarship_ID)

Authority(Authority_ID, Name, Role, Department)

Verification(Verification_ID, Income_Verified, Academic_Verified, Documents_Status, Verification_Date, Application_ID, Authority_ID)

Disbursement(Disbursement_ID, Amount_Disbursed, Disbursement_Date, Payment_Mode, Application_ID)
```

This app does not create tables automatically. Create the tables and insert sample data in Oracle before running the app.

## Environment Variables

Create a backend environment file:

```powershell
cd server
Copy-Item .env.example .env
```

Example `server/.env`:

```env
PORT=5000
CLIENT_ORIGIN=http://localhost:5173

ORACLE_USER=your_oracle_username
ORACLE_PASSWORD=your_oracle_password
ORACLE_CONNECT_STRING=localhost:1521/XEPDB1
ORACLE_POOL_MIN=1
ORACLE_POOL_MAX=5
ORACLE_POOL_INCREMENT=1

AUTHORITY_LOGIN_PASSWORD=verifier123
```

Do not commit your real `.env` file to GitHub.

## Installation

Clone the repository:

```bash
git clone <your-repository-url>
cd scholarship-aid-distribution-verifier-system
```

## Clone And Run On Another Device

This project will not run on another device with only `git clone`. The other device must also have Node.js, Oracle Database, the required tables, and a valid `.env` file.

### 1. Install Required Software

Install these on the other device:

- Node.js
- npm
- Oracle Database XE or another Oracle Database installation
- SQLPlus or another Oracle SQL client
- Git

Check Node and npm:

```bash
node -v
npm -v
```

Check Oracle listener:

```powershell
lsnrctl status
```

### 2. Clone The Repository

```bash
git clone <your-repository-url>
cd scholarship-aid-distribution-verifier-system
```

### 3. Install Dependencies

Backend:

```bash
cd server
npm install
```

Frontend:

```bash
cd ../client
npm install
```

### 4. Create Oracle User

Connect as SYSDBA:

```powershell
sqlplus / as sysdba
```

Switch to the pluggable database:

```sql
ALTER SESSION SET CONTAINER = XEPDB1;
```

Create a user for the project:

```sql
CREATE USER scholarship_app IDENTIFIED BY scholarship123;
GRANT CREATE SESSION TO scholarship_app;
GRANT CREATE TABLE TO scholarship_app;
GRANT CREATE SEQUENCE TO scholarship_app;
GRANT CREATE VIEW TO scholarship_app;
ALTER USER scholarship_app DEFAULT TABLESPACE USERS;
ALTER USER scholarship_app QUOTA UNLIMITED ON USERS;
```

Now connect as that user:

```powershell
sqlplus scholarship_app/scholarship123@localhost:1521/XEPDB1
```

### 5. Create Required Tables

Create these tables in Oracle before running the app. The backend does not create tables automatically.

```sql
CREATE TABLE Student (
  Student_ID NUMBER PRIMARY KEY,
  Name VARCHAR2(100),
  DOB DATE,
  Gender VARCHAR2(20),
  Category VARCHAR2(50),
  Income NUMBER(12,2),
  Institution VARCHAR2(150),
  Course VARCHAR2(100)
);

CREATE TABLE Scholarship (
  Scholarship_ID NUMBER PRIMARY KEY,
  Scholarship_Name VARCHAR2(150),
  Type VARCHAR2(50),
  Amount NUMBER(10,2),
  Eligibility_Criteria VARCHAR2(500),
  Sponsor VARCHAR2(150)
);

CREATE TABLE Application (
  Application_ID NUMBER PRIMARY KEY,
  Application_Date DATE,
  Status VARCHAR2(20),
  Student_ID NUMBER,
  Scholarship_ID NUMBER,
  CONSTRAINT fk_application_student
    FOREIGN KEY (Student_ID) REFERENCES Student(Student_ID),
  CONSTRAINT fk_application_scholarship
    FOREIGN KEY (Scholarship_ID) REFERENCES Scholarship(Scholarship_ID)
);

CREATE TABLE Authority (
  Authority_ID NUMBER PRIMARY KEY,
  Name VARCHAR2(100),
  Role VARCHAR2(50),
  Department VARCHAR2(100)
);

CREATE TABLE Verification (
  Verification_ID NUMBER PRIMARY KEY,
  Income_Verified NUMBER(1),
  Academic_Verified NUMBER(1),
  Documents_Status VARCHAR2(50),
  Verification_Date DATE,
  Application_ID NUMBER,
  Authority_ID NUMBER,
  CONSTRAINT fk_verification_application
    FOREIGN KEY (Application_ID) REFERENCES Application(Application_ID),
  CONSTRAINT fk_verification_authority
    FOREIGN KEY (Authority_ID) REFERENCES Authority(Authority_ID)
);

CREATE TABLE Disbursement (
  Disbursement_ID NUMBER PRIMARY KEY,
  Amount_Disbursed NUMBER(10,2),
  Disbursement_Date DATE,
  Payment_Mode VARCHAR2(50),
  Application_ID NUMBER,
  CONSTRAINT fk_disbursement_application
    FOREIGN KEY (Application_ID) REFERENCES Application(Application_ID)
);
```

### 6. Insert Sample Data

Add at least one student, scholarship, authority, and pending application:

```sql
INSERT INTO Student
VALUES (102, 'Sarthak Singh', DATE '2004-05-12', 'Male', 'General', 250000, 'ABC Engineering College', 'B.Tech CSE');

INSERT INTO Scholarship
VALUES (202, 'Need Scholarship', 'Need Based', 40000, 'Income below required limit', 'State Education Board');

INSERT INTO Authority
VALUES (402, 'Ms Rao', 'Verifier', 'Finance Dept');

INSERT INTO Application
VALUES (302, SYSDATE, 'Pending', 102, 202);

COMMIT;
```

You can add more rows for richer testing.

### 7. Configure Backend Environment

Create the backend `.env` file:

```powershell
cd server
Copy-Item .env.example .env
```

Update `server/.env`:

```env
PORT=5000
CLIENT_ORIGIN=http://localhost:5173

ORACLE_USER=scholarship_app
ORACLE_PASSWORD=scholarship123
ORACLE_CONNECT_STRING=localhost:1521/XEPDB1
ORACLE_POOL_MIN=1
ORACLE_POOL_MAX=5
ORACLE_POOL_INCREMENT=1

AUTHORITY_LOGIN_PASSWORD=verifier123
```

Test Oracle login:

```powershell
sqlplus scholarship_app/scholarship123@localhost:1521/XEPDB1
```

### 8. Start Backend And Frontend

Backend:

```bash
cd server
npm run dev
```

Frontend:

```bash
cd client
npm run dev
```

Open:

```text
http://localhost:5173
```

Use these sample credentials:

```text
Student_ID: 102

Authority_ID: 402
Password: verifier123
```

Install backend dependencies:

```bash
cd server
npm install
```

Install frontend dependencies:

```bash
cd ../client
npm install
```

## Running The Project

Start the backend:

```bash
cd server
npm run dev
```

The backend runs on:

```text
http://localhost:5000
```

Start the frontend in another terminal:

```bash
cd client
npm run dev
```

The frontend runs on:

```text
http://localhost:5173
```

## Oracle Connection Checklist

Make sure the Oracle listener is running:

```powershell
lsnrctl status
```

The listener should show a service like:

```text
Service "xepdb1" has 1 instance(s).
```

Test the same connection used by the app:

```powershell
sqlplus your_oracle_username/your_oracle_password@localhost:1521/XEPDB1
```

If SQLPlus cannot connect, the backend will not connect either.

## API Endpoints

### Health Check

```http
GET /api/health
```

Returns:

```json
{
  "status": "ok",
  "service": "scholarship-aid-verifier"
}
```

### Student Dashboard

```http
GET /api/student/:studentId
```

Returns student scholarship applications with scholarship name, status, and latest disbursement details.

### Pending Applications

```http
GET /api/applications/pending
```

Returns all applications where:

```sql
Status = 'Pending'
```

### Processed Applications

```http
GET /api/applications/processed
```

Returns applications where:

```sql
Status IN ('Approved', 'Rejected')
```

### Authority Login

```http
POST /api/authorities/login
```

Request body:

```json
{
  "authorityId": 402,
  "password": "verifier123"
}
```

The password is checked against `AUTHORITY_LOGIN_PASSWORD` from `server/.env`.

### Process Application

```http
POST /api/applications/process
```

Request body:

```json
{
  "applicationId": 302,
  "authorityId": 402,
  "status": "Approved",
  "verificationDetails": {
    "incomeVerified": "Y",
    "academicVerified": "Y",
    "documentsStatus": "Valid",
    "amountDisbursed": 40000,
    "paymentMode": "Bank Transfer"
  }
}
```

For approved applications, the backend:

- Inserts into `Verification`
- Updates `Application.Status`
- Inserts into `Disbursement`
- Commits the transaction

For rejected applications, the backend:

- Inserts into `Verification`
- Updates `Application.Status`
- Does not insert into `Disbursement`
- Commits the transaction

If any step fails, the backend rolls back the transaction.

### Undo Application

```http
POST /api/applications/undo
```

Request body:

```json
{
  "applicationId": 302
}
```

The backend:

- Deletes related `Disbursement` records
- Deletes related `Verification` records
- Updates `Application.Status` back to `Pending`
- Commits the transaction

## Security Notes

- The project uses Oracle bind variables such as `:studentId`, `:applicationId`, and `:status`.
- Real credentials should stay in `server/.env`.
- `server/.env` is ignored by Git.
- `node_modules` is ignored by Git.
- The verifier password is currently a single project-level password from `.env`. For production, store hashed passwords per authority user in the database.

## Common Problems

### ORA-01017: invalid username/password

Check `ORACLE_USER`, `ORACLE_PASSWORD`, and `ORACLE_CONNECT_STRING` in `server/.env`.

### NJS-503 or ECONNREFUSED

Oracle listener is not reachable. Run:

```powershell
lsnrctl status
```

### ORA-00942: table or view does not exist

The Oracle user in `.env` cannot see the required tables. Create the tables under that user or grant access.

### No Pending Applications

All applications may already be approved or rejected. Set some rows back to pending:

```sql
UPDATE Application
SET Status = 'Pending'
WHERE Application_ID IN (303, 306, 308);

COMMIT;
```

## GitHub Notes

Do not commit:

```text
server/.env
client/node_modules
server/node_modules
client/dist
server/dist
```

Commit these files instead:

```text
server/.env.example
client/package.json
server/package.json
client/package-lock.json
server/package-lock.json
```

After cloning, another user must run `npm install` in both `client` and `server`.

## Purpose

This project demonstrates a practical DBMS-backed workflow for scholarship verification and financial aid tracking. It shows how a frontend, backend, and relational database work together to manage application status, verifier actions, and aid disbursement records.
