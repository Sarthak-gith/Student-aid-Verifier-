export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Scholarship Aid Distribution Verifier API",
    version: "1.0.0",
    description:
      "Backend API for student scholarship tracking, verifier actions, and aid disbursement."
  },
  servers: [
    {
      url: "http://localhost:5000/api",
      description: "Local development server"
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    },
    schemas: {
      HealthResponse: {
        type: "object",
        properties: {
          status: { type: "string", example: "ok" },
          service: { type: "string", example: "scholarship-aid-verifier" }
        }
      }
    }
  },
  paths: {
    "/health": {
      get: {
        summary: "Health check",
        responses: {
          200: {
            description: "Service health",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HealthResponse" }
              }
            }
          }
        }
      }
    },
    "/student/{studentId}": {
      get: {
        summary: "Get a student's dashboard",
        parameters: [
          {
            in: "path",
            name: "studentId",
            required: true,
            schema: { type: "integer" }
          }
        ],
        responses: {
          200: {
            description: "Student dashboard data"
          }
        }
      }
    },
    "/student/register": {
      post: {
        summary: "Register a student account",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: [
                  "studentId",
                  "name",
                  "dob",
                  "gender",
                  "category",
                  "income",
                  "institution",
                  "course",
                  "password"
                ],
                properties: {
                  studentId: { type: "integer" },
                  name: { type: "string" },
                  dob: { type: "string", example: "2004-05-12" },
                  gender: { type: "string" },
                  category: { type: "string" },
                  income: { type: "number" },
                  institution: { type: "string" },
                  course: { type: "string" },
                  password: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: "Student registered successfully"
          }
        }
      }
    },
    "/student/profile": {
      get: {
        summary: "Get authenticated student profile with applications and timeline",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Student profile data"
          }
        }
      }
    },
    "/student/login": {
      post: {
        summary: "Log in a student and issue a JWT",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["studentId", "password"],
                properties: {
                  studentId: { type: "integer" },
                  password: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: "Student authenticated"
          }
        }
      }
    },
    "/authorities/login": {
      post: {
        summary: "Log in an authority and issue a JWT",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  authorityId: { type: "integer" },
                  password: { type: "string" }
                },
                required: ["authorityId", "password"]
              }
            }
          }
        },
        responses: {
          200: {
            description: "Authority session created"
          }
        }
      }
    },
    "/applications/pending": {
      get: {
        summary: "List pending applications",
        responses: {
          200: {
            description: "Pending applications"
          }
        }
      }
    },
    "/applications/submit": {
      post: {
        summary: "Submit a new scholarship application",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["studentId", "scholarshipId"],
                properties: {
                  studentId: { type: "integer" },
                  scholarshipId: { type: "integer" }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: "Application submitted"
          }
        }
      }
    },
    "/applications/{applicationId}/documents": {
      get: {
        summary: "List uploaded documents for an application",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "applicationId",
            required: true,
            schema: { type: "integer" }
          }
        ],
        responses: {
          200: {
            description: "Uploaded application documents"
          }
        }
      },
      post: {
        summary: "Upload a document for an application",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "applicationId",
            required: true,
            schema: { type: "integer" }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["documentType", "document"],
                properties: {
                  documentType: {
                    type: "string",
                    enum: [
                      "income-proof",
                      "marksheet",
                      "caste-certificate",
                      "bank-passbook",
                      "other"
                    ]
                  },
                  documentLabel: { type: "string" },
                  document: { type: "string", format: "binary" }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: "Document uploaded"
          }
        }
      }
    },
    "/applications/processed": {
      get: {
        summary: "List processed applications",
        responses: {
          200: {
            description: "Processed applications"
          }
        }
      }
    },
    "/applications/process": {
      post: {
        summary: "Approve or reject an application",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Application processed"
          }
        }
      }
    },
    "/applications/undo": {
      post: {
        summary: "Undo an application decision",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Application moved back to pending"
          }
        }
      }
    }
  }
};
