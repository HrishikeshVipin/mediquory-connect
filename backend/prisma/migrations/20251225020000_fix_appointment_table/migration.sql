-- Fix migration: Create Appointment table if not exists
CREATE TABLE IF NOT EXISTS "Appointment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "doctorId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "requestedDate" TIMESTAMP(3) NOT NULL,
    "requestedTimePreference" TEXT,
    "reason" TEXT,
    "scheduledTime" TIMESTAMP(3),
    "proposedTime" TIMESTAMP(3),
    "proposedMessage" TEXT,
    "rejectionReason" TEXT,
    "duration" INTEGER NOT NULL DEFAULT 30,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "consultationType" TEXT NOT NULL DEFAULT 'VIDEO',
    "consultationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "respondedAt" TIMESTAMP(3),
    CONSTRAINT "Appointment_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Appointment_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "Consultation" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create indexes if not exist
CREATE UNIQUE INDEX IF NOT EXISTS "Appointment_consultationId_key" ON "Appointment"("consultationId");
CREATE INDEX IF NOT EXISTS "Appointment_doctorId_status_requestedDate_idx" ON "Appointment"("doctorId", "status", "requestedDate");
CREATE INDEX IF NOT EXISTS "Appointment_patientId_status_idx" ON "Appointment"("patientId", "status");
CREATE INDEX IF NOT EXISTS "Appointment_doctorId_scheduledTime_idx" ON "Appointment"("doctorId", "scheduledTime");
