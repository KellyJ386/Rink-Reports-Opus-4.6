-- Migration: Create utility functions and triggers
-- Agent 01 - Step 6

-- ============================================
-- AUTO-UPDATE updated_at TIMESTAMP
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at column
CREATE TRIGGER tr_facilities_updated
  BEFORE UPDATE ON facilities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_profiles_updated
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_shifts_updated
  BEFORE UPDATE ON shifts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_scheduled_reports_updated
  BEFORE UPDATE ON scheduled_report_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- REFRIGERATION OUT-OF-RANGE CHECK
-- ============================================
CREATE OR REPLACE FUNCTION check_refrig_out_of_range()
RETURNS TRIGGER AS $$
DECLARE
  min_val NUMERIC;
  max_val NUMERIC;
BEGIN
  SELECT min_threshold, max_threshold INTO min_val, max_val
  FROM equipment_reading_types WHERE id = NEW.reading_type_id;

  IF NEW.numeric_value IS NOT NULL THEN
    NEW.is_out_of_range := (
      (min_val IS NOT NULL AND NEW.numeric_value < min_val) OR
      (max_val IS NOT NULL AND NEW.numeric_value > max_val)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_refrig_range_check
  BEFORE INSERT OR UPDATE ON refrigeration_reading_values
  FOR EACH ROW EXECUTE FUNCTION check_refrig_out_of_range();

-- ============================================
-- AIR QUALITY OUT-OF-RANGE CHECK
-- ============================================
CREATE OR REPLACE FUNCTION check_aq_out_of_range()
RETURNS TRIGGER AS $$
DECLARE
  min_val NUMERIC;
  max_val NUMERIC;
BEGIN
  SELECT min_threshold, max_threshold INTO min_val, max_val
  FROM air_quality_metrics WHERE id = NEW.metric_id;

  NEW.is_out_of_range := (
    (min_val IS NOT NULL AND NEW.value < min_val) OR
    (max_val IS NOT NULL AND NEW.value > max_val)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_aq_range_check
  BEFORE INSERT OR UPDATE ON air_quality_reading_values
  FOR EACH ROW EXECUTE FUNCTION check_aq_out_of_range();
