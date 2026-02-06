-- Migration: Create notification and alert tables
-- Agent 01 - Step 5

-- ============================================
-- NOTIFICATIONS (in-app)
-- ============================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, is_read, created_at DESC);

-- ============================================
-- NOTIFICATION PREFERENCES (per user, per trigger, per channel)
-- ============================================
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL,
  channel notification_channel NOT NULL,
  is_enabled BOOLEAN DEFAULT TRUE,
  UNIQUE(profile_id, trigger_type, channel)
);

CREATE INDEX idx_notif_prefs_profile ON notification_preferences(profile_id);

-- ============================================
-- ACTIVE ALERTS (dashboard badge counts)
-- ============================================
CREATE TABLE active_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  module module_id NOT NULL,
  alert_type TEXT NOT NULL,
  reference_id UUID,
  message TEXT,
  is_acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ
);

CREATE INDEX idx_alerts_facility_module ON active_alerts(facility_id, module, is_acknowledged);

-- ============================================
-- SCHEDULED REPORT SETTINGS (for Agent 13)
-- ============================================
CREATE TABLE scheduled_report_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT FALSE,
  recipients UUID[] DEFAULT '{}',
  delivery_hour INTEGER DEFAULT 7,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(facility_id, report_type)
);
