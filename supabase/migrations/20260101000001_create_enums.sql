-- Migration: Create all enum types
-- Agent 01 - Step 1

-- User roles (hierarchy: super_admin > facility_admin > manager > supervisor > staff > read_only)
CREATE TYPE user_role AS ENUM (
  'super_admin', 'facility_admin', 'manager', 'supervisor', 'staff', 'read_only'
);

-- Incident types
CREATE TYPE incident_type AS ENUM ('incident', 'accident');

-- Injured party type
CREATE TYPE party_type AS ENUM ('patron', 'staff');

-- Fuel type for machines (Zambonis/resurfacers)
CREATE TYPE fuel_type AS ENUM ('gas', 'electric');

-- Checklist type for daily reports
CREATE TYPE checklist_type AS ENUM ('opening', 'closing', 'daily_operations');

-- Recurrence frequency for checklist items
CREATE TYPE recurrence_frequency AS ENUM ('daily', 'weekly', 'monthly', 'seasonal');

-- Notification delivery channel
CREATE TYPE notification_channel AS ENUM ('in_app', 'email', 'sms');

-- Shift swap request status
CREATE TYPE swap_status AS ENUM ('pending', 'approved', 'denied');

-- Oil level check values
CREATE TYPE oil_level AS ENUM ('ok', 'low', 'add');

-- Module identifier for settings and alerts
CREATE TYPE module_id AS ENUM (
  'daily_reports', 'ice_depth', 'ice_operations', 'scheduling',
  'incidents', 'refrigeration', 'air_quality', 'admin'
);

-- Day of week for operating hours
CREATE TYPE day_of_week AS ENUM (
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
);
