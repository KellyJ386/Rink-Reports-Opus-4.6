import { type ReactNode } from "react";

import type { ModuleId } from "@/lib/constants/moduleIcons";

interface ModuleGuardProps {
  module: ModuleId;
  children: ReactNode;
}

/**
 * Server component that guards access to a module.
 *
 * When Supabase is available, this component will:
 *  1. Query `module_settings` to verify the module is enabled for the user's facility.
 *  2. Query the user profile to check their role has access to this module.
 *  3. Redirect to /dashboard if access is denied.
 *
 * For now, it renders children unconditionally as a pass-through.
 */
export default async function ModuleGuard({
  module,
  children,
}: ModuleGuardProps) {
  // -----------------------------------------------------------------
  // TODO: Uncomment and implement when Supabase is running locally
  // -----------------------------------------------------------------
  //
  // import { redirect } from "next/navigation";
  // import { createClient } from "@/lib/supabase/server";
  //
  // const supabase = await createClient();
  //
  // // Get the current user
  // const { data: { user } } = await supabase.auth.getUser();
  // if (!user) {
  //   redirect("/login");
  // }
  //
  // // Get user profile to determine facility and role
  // const { data: profile } = await supabase
  //   .from("profiles")
  //   .select("facility_id, role")
  //   .eq("id", user.id)
  //   .single();
  //
  // if (!profile) {
  //   redirect("/login");
  // }
  //
  // // Check if module is enabled for this facility
  // const { data: moduleSettings } = await supabase
  //   .from("module_settings")
  //   .select("enabled")
  //   .eq("facility_id", profile.facility_id)
  //   .eq("module_id", module)
  //   .single();
  //
  // if (!moduleSettings?.enabled) {
  //   redirect("/dashboard");
  // }
  //
  // // Optionally check role-based access here
  // const ADMIN_ONLY_MODULES: ModuleId[] = ["admin"];
  // const ADMIN_ROLES = ["super_admin", "facility_admin"];
  //
  // if (ADMIN_ONLY_MODULES.includes(module) && !ADMIN_ROLES.includes(profile.role)) {
  //   redirect("/dashboard");
  // }
  // -----------------------------------------------------------------

  // Suppress unused variable warning in pass-through mode
  void module;

  return <>{children}</>;
}
