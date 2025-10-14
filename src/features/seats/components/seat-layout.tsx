'use client';

import type { Seat } from '@/features/seats/lib/dto';
import { SeatLegend } from '@/features/seats/components/seat-legend';
import { SeatGrid } from '@/features/seats/components/seat-grid';

export type SeatLayoutProps = {
  seats: Seat[];
  selectedSeatIds: Set<string>;
  sessionId: string;
  isReserving: boolean;
  isReleasing: boolean;
  onSelect: (seat: Seat) => void;
  onRelease: (seat: Seat) => void;
};

const TITLE = '좌석 배치도';
const DESCRIPTION = '좌석을 선택하거나 다시 클릭하여 선택을 취소할 수 있습니다.';

export function SeatLayout({
  seats,
  selectedSeatIds,
  sessionId,
  isReserving,
  isReleasing,
  onSelect,
  onRelease,
}: SeatLayoutProps) {
  return (
    <section className="space-y-6 rounded-lg border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/40">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">{TITLE}</h2>
          <p className="text-sm text-slate-400">{DESCRIPTION}</p>
        </div>
        <SeatLegend />
      </div>

      <SeatGrid
        seats={seats}
        selectedSeatIds={selectedSeatIds}
        sessionId={sessionId}
        isReserving={isReserving}
        isReleasing={isReleasing}
        onSelect={onSelect}
        onRelease={onRelease}
      />
    </section>
  );
}
