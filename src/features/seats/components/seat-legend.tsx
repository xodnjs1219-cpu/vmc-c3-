'use client';

import { SEAT_GRADE_COLORS, SEAT_GRADE_LABELS, SEAT_GRADES } from '@/features/seats/constants';

const GRADE_ORDER = [SEAT_GRADES.vip, SEAT_GRADES.r, SEAT_GRADES.s, SEAT_GRADES.a];

export function SeatLegend() {
  return (
    <div className="flex flex-wrap gap-3 text-sm text-slate-300">
      {GRADE_ORDER.map((grade) => (
        <div key={grade} className="flex items-center gap-2">
          <span
            aria-hidden
            className="inline-flex h-4 w-4 items-center justify-center rounded"
            style={{ backgroundColor: SEAT_GRADE_COLORS[grade] }}
          />
          <span>{SEAT_GRADE_LABELS[grade]}</span>
        </div>
      ))}
    </div>
  );
}
