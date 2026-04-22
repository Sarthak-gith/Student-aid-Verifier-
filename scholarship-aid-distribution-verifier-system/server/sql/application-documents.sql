CREATE TABLE Application_Document (
  Application_Document_ID NUMBER PRIMARY KEY,
  Application_ID NUMBER NOT NULL,
  Document_Type VARCHAR2(50) NOT NULL,
  Document_Label VARCHAR2(100),
  File_Name VARCHAR2(255) NOT NULL,
  File_Path VARCHAR2(500) NOT NULL,
  Mime_Type VARCHAR2(100) NOT NULL,
  Uploaded_At TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
  CONSTRAINT fk_application_document_application
    FOREIGN KEY (Application_ID) REFERENCES Application(Application_ID)
);

CREATE INDEX idx_application_document_application_id
  ON Application_Document (Application_ID);
