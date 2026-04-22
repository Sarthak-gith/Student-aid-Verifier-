CREATE TABLE Application_Status_History (
  Application_Status_History_ID NUMBER PRIMARY KEY,
  Application_ID NUMBER NOT NULL,
  Status VARCHAR2(20) NOT NULL,
  Event_Type VARCHAR2(30) NOT NULL,
  Notes VARCHAR2(500),
  Actor_Role VARCHAR2(30) NOT NULL,
  Actor_ID NUMBER,
  Changed_At TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
  CONSTRAINT fk_application_status_history_application
    FOREIGN KEY (Application_ID) REFERENCES Application(Application_ID)
);

CREATE INDEX idx_app_status_history_application_id
  ON Application_Status_History (Application_ID);

CREATE INDEX idx_app_status_history_changed_at
  ON Application_Status_History (Changed_At);
