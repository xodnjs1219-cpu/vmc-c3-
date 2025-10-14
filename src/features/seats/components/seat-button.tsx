'use client';

import { cn } from '@/lib/utils';
import { SEAT_GRADE_COLORS, SEAT_GRADE_LABELS } from '@/features/seats/constants';
import type { Seat } from '@/features/seats/lib/dto';

export type SeatButtonProps = {
  seat: Seat;
  isSelected: boolean;
  isDisabled: boolean;
  isReservedByOthers: boolean;
  onClick: () => void;
};

export function SeatButton({
  seat,
  isSelected,
  isDisabled,
  isReservedByOthers,
  onClick,
}: SeatButtonProps) {
  const gradeLabel = SEAT_GRADE_LABELS[seat.grade] ?? seat.grade.toUpperCase();
  const baseColor = SEAT_GRADE_COLORS[seat.grade] ?? '#334155';

  const displayLabel = seat.seatNumber;
  const ariaLabel = `${seat.section}구역 ${seat.rowNumber}행 ${seat.seatNumber}번 좌석, ${gradeLabel}, ${seat.status === 'available' ? '선택 가능' : seat.status === 'reserved' ? '임시 예약됨' : '예매 완료'}`;

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-md border text-xs font-semibold transition',
        'focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-950',
        isSelected && 'border-amber-300 bg-amber-400 text-slate-900 shadow-lg shadow-amber-400/30',
        isReservedByOthers && 'border-slate-700 bg-slate-800/80 text-slate-500',
        seat.status === 'booked' && 'border-slate-800 bg-slate-900/60 text-slate-600 line-through',
        !isSelected && !isReservedByOthers && seat.status === 'available' && 'text-slate-900',
        isDisabled && 'cursor-not-allowed opacity-75',
      )}
      style={!isSelected && !isReservedByOthers && seat.status === 'available'
        ? { backgroundColor: baseColor }
        : undefined}
    >
      {displayLabel}
    </button>
  );
}
