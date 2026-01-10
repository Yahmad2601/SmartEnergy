-- Add new enums
DO $$ BEGIN
    CREATE TYPE "device_status" AS ENUM('online', 'offline', 'error');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "control_command" AS ENUM('disconnect', 'reconnect', 'reset');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "control_status" AS ENUM('pending', 'executed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add new columns to lines table
ALTER TABLE "lines" ADD COLUMN IF NOT EXISTS "thresholds" jsonb DEFAULT '{"maxCurrent": 30, "maxPower": 5000, "idleLimitHours": 24}';
ALTER TABLE "lines" ADD COLUMN IF NOT EXISTS "last_update" timestamp DEFAULT now();

-- Create devices table
CREATE TABLE IF NOT EXISTS "devices" (
    "id" varchar(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    "block_id" varchar(255) NOT NULL REFERENCES "blocks"("id"),
    "device_token" text NOT NULL UNIQUE,
    "name" text,
    "status" "device_status" NOT NULL DEFAULT 'offline',
    "registered_at" timestamp NOT NULL DEFAULT now(),
    "last_seen" timestamp
);

-- Create control_queue table
CREATE TABLE IF NOT EXISTS "control_queue" (
    "id" varchar(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    "line_id" varchar(255) NOT NULL REFERENCES "lines"("id"),
    "command" "control_command" NOT NULL,
    "status" "control_status" NOT NULL DEFAULT 'pending',
    "created_at" timestamp NOT NULL DEFAULT now(),
    "executed_at" timestamp
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_energy_logs_line_id" ON "energy_logs"("line_id");
CREATE INDEX IF NOT EXISTS "idx_energy_logs_timestamp" ON "energy_logs"("timestamp");
CREATE INDEX IF NOT EXISTS "idx_alerts_line_id" ON "alerts"("line_id");
CREATE INDEX IF NOT EXISTS "idx_alerts_created_at" ON "alerts"("created_at");
CREATE INDEX IF NOT EXISTS "idx_control_queue_line_id" ON "control_queue"("line_id");
CREATE INDEX IF NOT EXISTS "idx_control_queue_status" ON "control_queue"("status");
CREATE INDEX IF NOT EXISTS "idx_devices_block_id" ON "devices"("block_id");
CREATE INDEX IF NOT EXISTS "idx_devices_device_token" ON "devices"("device_token");
