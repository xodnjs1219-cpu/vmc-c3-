"use client";

import { cn } from "@/lib/utils";
import type { ConcertResponse } from "@/features/concerts/lib/dto";
import { ConcertCard } from "@/features/concerts/components/concert-card";

const GRID_CLASS = "grid gap-6 sm:grid-cols-2 xl:grid-cols-3";

export type ConcertGridProps = {
  concerts: ConcertResponse[];
  className?: string;
};

export function ConcertGrid({ concerts, className }: ConcertGridProps) {
  return (
    <div className={cn(GRID_CLASS, className)}>
      {concerts.map((concert) => (
        <div key={concert.id}>
          <ConcertCard concert={concert} />
        </div>
      ))}
    </div>
  );
}
