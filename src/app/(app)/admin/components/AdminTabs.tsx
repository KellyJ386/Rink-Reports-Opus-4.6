"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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
import { FacilitySettings } from "./FacilitySettings";
import { UserManagement } from "./UserManagement";
import { ModuleSettings } from "./ModuleSettings";
import { EquipmentManager } from "./EquipmentManager";
import { ThresholdSettings } from "./ThresholdSettings";
import { TabBuilder } from "./TabBuilder";
import { ShiftTypeManager } from "./ShiftTypeManager";
import { RinkManager } from "./RinkManager";

interface AdminTabsProps {
  facilityId: string;
  facility: Facility | null;
  users: Profile[];
  modules: ModuleSetting[];
  equipment: Equipment[];
  thresholds: Threshold[];
  tabs: TabConfiguration[];
  checklists: ChecklistItem[];
  shifts: ShiftType[];
  rinks: Rink[];
  zones: RinkZone[];
}

export function AdminTabs({
  facilityId,
  facility,
  users,
  modules,
  equipment,
  thresholds,
  tabs,
  checklists,
  shifts,
  rinks,
  zones,
}: AdminTabsProps) {
  return (
    <Tabs defaultValue="facility" className="w-full">
      <ScrollArea className="w-full whitespace-nowrap">
        <TabsList className="inline-flex h-10 w-full justify-start gap-1 bg-muted/50 p-1 md:gap-0">
          <TabsTrigger value="facility" className="text-xs md:text-sm">
            Facility
          </TabsTrigger>
          <TabsTrigger value="users" className="text-xs md:text-sm">
            Users
          </TabsTrigger>
          <TabsTrigger value="modules" className="text-xs md:text-sm">
            Modules
          </TabsTrigger>
          <TabsTrigger value="equipment" className="text-xs md:text-sm">
            Equipment
          </TabsTrigger>
          <TabsTrigger value="thresholds" className="text-xs md:text-sm">
            Thresholds
          </TabsTrigger>
          <TabsTrigger value="reports-config" className="text-xs md:text-sm">
            Reports Config
          </TabsTrigger>
          <TabsTrigger value="shifts" className="text-xs md:text-sm">
            Shifts
          </TabsTrigger>
          <TabsTrigger value="rinks" className="text-xs md:text-sm">
            Rinks
          </TabsTrigger>
        </TabsList>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <div className="mt-6">
        <TabsContent value="facility">
          <FacilitySettings facilityId={facilityId} facility={facility} />
        </TabsContent>

        <TabsContent value="users">
          <UserManagement facilityId={facilityId} users={users} />
        </TabsContent>

        <TabsContent value="modules">
          <ModuleSettings facilityId={facilityId} modules={modules} />
        </TabsContent>

        <TabsContent value="equipment">
          <EquipmentManager facilityId={facilityId} equipment={equipment} />
        </TabsContent>

        <TabsContent value="thresholds">
          <ThresholdSettings facilityId={facilityId} thresholds={thresholds} />
        </TabsContent>

        <TabsContent value="reports-config">
          <TabBuilder
            facilityId={facilityId}
            tabs={tabs}
            checklists={checklists}
          />
        </TabsContent>

        <TabsContent value="shifts">
          <ShiftTypeManager facilityId={facilityId} shifts={shifts} />
        </TabsContent>

        <TabsContent value="rinks">
          <RinkManager
            facilityId={facilityId}
            rinks={rinks}
            zones={zones}
          />
        </TabsContent>
      </div>
    </Tabs>
  );
}
