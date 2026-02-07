"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard } from "lucide-react";

import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/constants/brand";
import { MODULE_CONFIG } from "@/lib/constants/moduleIcons";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
  const pathname = usePathname();

  const modules = Object.entries(MODULE_CONFIG);

  function handleLinkClick() {
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b px-4 py-4">
          <SheetTitle className="text-left text-lg font-bold text-navy dark:text-white">
            {BRAND.shortName}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-65px)]">
          <nav className="flex flex-col gap-1 p-3">
            {/* Dashboard link */}
            <MobileNavLink
              href="/dashboard"
              icon={LayoutDashboard}
              label="Dashboard"
              active={pathname === "/dashboard"}
              onClick={handleLinkClick}
            />

            {/* Module links */}
            {modules.map(([key, config]) => {
              const isActive =
                pathname === config.href ||
                pathname.startsWith(config.href + "/");

              return (
                <MobileNavLink
                  key={key}
                  href={config.href}
                  icon={config.icon}
                  label={config.label}
                  active={isActive}
                  onClick={handleLinkClick}
                />
              );
            })}
          </nav>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/* Internal mobile nav link component                                  */
/* ------------------------------------------------------------------ */

interface MobileNavLinkProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  onClick: () => void;
}

function MobileNavLink({
  href,
  icon: Icon,
  label,
  active,
  onClick,
}: MobileNavLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        active
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground"
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span>{label}</span>
    </Link>
  );
}
