-- Add missing defaultSlotDuration field to Doctor table
-- This field was added for appointment scheduling feature
ALTER TABLE "Doctor" ADD COLUMN IF NOT EXISTS "defaultSlotDuration" INTEGER NOT NULL DEFAULT 30;
