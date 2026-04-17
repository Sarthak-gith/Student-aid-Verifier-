# Scholarship & Aid Distribution Verifier System

Full-stack React, Express, and Oracle DB project for viewing scholarship status, verifying pending applications, and recording aid disbursement.

## Structure

```text
client/   React + Vite + Tailwind
server/   Node.js + Express + Oracle DB
```

## Backend Setup

```bash
cd server
npm install
copy .env.example .env
npm run dev
```

Update `.env` with your Oracle credentials before starting the server.
On PowerShell, the copy command is:

```powershell
Copy-Item .env.example .env
```

The backend expects the existing schema:

- Student
- Scholarship
- Application
- Authority
- Verification
- Disbursement

It does not create tables. The process endpoint generates new `Verification_ID` and `Disbursement_ID` values inside the transaction from the existing tables, so no additional sequence objects are required.

## Frontend Setup

```bash
cd client
npm install
npm run dev
```

Optional `.env` for the frontend:

```text
VITE_API_BASE_URL=http://localhost:5000/api
```

## APIs

- `GET /api/student/:studentId`
- `GET /api/applications/pending`
- `POST /api/applications/process`

All Oracle queries use bind variables such as `:studentId`, `:applicationId`, and `:status`.
