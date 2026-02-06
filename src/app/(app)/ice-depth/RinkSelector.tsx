"use client";

import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

interface RinkSelectorProps {
  rinks: { id: string; name: string }[];
  selectedRinkId?: string;
}

export function RinkSelector({ rinks, selectedRinkId }: RinkSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();

  function handleSelect(rinkId: string | null) {
    if (rinkId) {
      router.push(`${pathname}?rink=${rinkId}`);
    } else {
      router.push(pathname);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={!selectedRinkId ? "default" : "outline"}
        size="sm"
        onClick={() => handleSelect(null)}
      >
        All Rinks
      </Button>
      {rinks.map((rink) => (
        <Button
          key={rink.id}
          variant={selectedRinkId === rink.id ? "default" : "outline"}
          size="sm"
          onClick={() => handleSelect(rink.id)}
        >
          {rink.name}
        </Button>
      ))}
    </div>
  );
}
