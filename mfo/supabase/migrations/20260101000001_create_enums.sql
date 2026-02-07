-- User roles
CREATE TYPE user_role AS ENUM (
  'super_admin', 'facility_admin', 'manager', 'supervisor', 'staff', 'read_only'
);

-- Incident types
CREATE TYPE incident_type AS ENUM ('incident', 'accident');

-- Injured party type
CREATE TYPE party_type AS ENUM ('patron', 'staff');

-- Fuel type for machines
CREATE TYPE fuel_type AS ENUM ('gas', 'electric');

-- Checklist type
CREATE TYPE checklist_type AS ENUM ('opening', 'closing', 'daily_operations');

-- Recurrence frequency
CREATE TYPE recurrence_frequency AS ENUM ('daily', 'weekly', 'monthly', 'seasonal');

-- Notification channel
CREATE TYPE notification_channel AS ENUM ('in_app', 'email', 'sms');

-- Shift swap status
CREATE TYPE swap_status AS ENUM ('pending', 'approved', 'denied');

-- Oil level check
CREATE TYPE oil_level AS ENUM ('ok', 'low', 'add');

-- Module identifier
CREATE TYPE module_id AS ENUM (
  'daily_reports', 'ice_depth', 'ice_operations', 'scheduling',
  'incidents', 'refrigeration', 'air_quality', 'admin'
);

-- Day of week
CREATE TYPE day_of_week AS ENUM (
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
);
