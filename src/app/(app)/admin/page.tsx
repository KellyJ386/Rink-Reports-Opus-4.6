import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type {
  Facility,
  Profile,
  ModuleSetting,
  Equipment,
  Threshold,
  TabConfiguration,
  ChecklistItem,
  ShiftType,
  Rink,
  RinkZone,
} from "@/lib/types/database";
import {
  getFacility,
  getUsers,
  getModuleSettings,
  getEquipment,
  getThresholds,
  getTabConfigurations,
  getShiftTypes,
  getRinks,
} from "@/app/(app)/admin/actions";
import { AdminTabs } from "@/app/(app)/admin/components/AdminTabs";

export default async function AdminPage() {
  // Check auth and role
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  const typedProfile = profile as Profile;

  // Only facility_admin and super_admin can access admin
  if (
    typedProfile.role !== "facility_admin" &&
    typedProfile.role !== "super_admin"
  ) {
    redirect("/dashboard");
  }

  const facilityId = typedProfile.facility_id;

  if (!facilityId) {
    redirect("/dashboard");
  }

  // Fetch all initial data in parallel
  const [
    facilityResult,
    usersResult,
    modulesResult,
    equipmentResult,
    thresholdsResult,
    tabsResult,
    shiftsResult,
    rinksResult,
  ] = await Promise.all([
    getFacility(),
    getUsers(),
    getModuleSettings(),
    getEquipment(),
    getThresholds(),
    getTabConfigurations(),
    getShiftTypes(),
    getRinks(),
  ]);

  const facility = facilityResult.success ? facilityResult.data : null;
  const users = usersResult.success ? usersResult.data : [];
  const modules = modulesResult.success ? modulesResult.data : [];
  const equipment = equipmentResult.success ? equipmentResult.data : [];
  const thresholds = thresholdsResult.success ? thresholdsResult.data : [];
  const tabs = tabsResult.success ? tabsResult.data : [];
  const checklists: ChecklistItem[] = [];
  const shifts = shiftsResult.success ? shiftsResult.data : [];
  const rinksData = rinksResult.success ? rinksResult.data : [];
  const rinks = rinksData.map(({ rink_zones: _rz, ...r }) => r) as Rink[];
  const zones = rinksData.flatMap((r) => r.rink_zones ?? []) as RinkZone[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Admin Control Center
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage facility settings, users, modules, and configurations.
        </p>
      </div>

      <AdminTabs
        facilityId={facilityId}
        facility={facility as Facility | null}
        users={users as Profile[]}
        modules={modules as ModuleSetting[]}
        equipment={equipment as Equipment[]}
        thresholds={thresholds as Threshold[]}
        tabs={tabs as TabConfiguration[]}
        checklists={checklists as ChecklistItem[]}
        shifts={shifts as ShiftType[]}
        rinks={rinks as Rink[]}
        zones={zones as RinkZone[]}
      />
    </div>
  );
}
