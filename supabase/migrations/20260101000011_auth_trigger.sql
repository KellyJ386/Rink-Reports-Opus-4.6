-- ============================================
-- AUTH TRIGGER: Auto-create profile on user signup
-- ============================================

-- Function that creates a profile row whenever a new user signs up via Supabase Auth.
-- It extracts full_name, role, and facility_id from the raw_user_meta_data JSON
-- that can be passed during signUp() or admin createUser().
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    facility_id
  ) VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(
      (NEW.raw_user_meta_data ->> 'role')::user_role,
      'staff'::user_role
    ),
    (NEW.raw_user_meta_data ->> 'facility_id')::UUID
  );
  RETURN NEW;
END;
$$;

-- Trigger fires after every new row inserted into auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
