'use client';

import { Button } from '@/components/ui/button';
import { SEAT_GRADE_LABELS } from '@/features/seats/constants';
import type { Seat } from '@/features/seats/lib/dto';

const currencyFormatter = new Intl.NumberFormat('ko-KR', {
  style: 'currency',
  currency: 'KRW',
});

const EMPTY_MESSAGE = '선택한 좌석이 없습니다.';
const REMOVE_BUTTON_LABEL = '해제';

export type SelectedSeatListProps = {
  seats: Seat[];
  onRemove: (seatId: string) => void;
  isRemoving: boolean;
};

export function SelectedSeatList({ seats, onRemove, isRemoving }: SelectedSeatListProps) {
  if (seats.length === 0) {
    return <p className="text-sm text-slate-400">{EMPTY_MESSAGE}</p>;
  }

  return (
    <div className="space-y-3">
      {seats.map((seat) => {
        const gradeLabel = SEAT_GRADE_LABELS[seat.grade] ?? seat.grade.toUpperCase();
        const seatName = `${seat.section}구역 ${seat.rowNumber}행 ${seat.seatNumber}번`;
        const priceLabel = currencyFormatter.format(seat.price);

        return (
          <div
            key={seat.id}
            className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm"
          >
            <div className="space-y-1">
              <p className="font-semibold text-white">{seatName}</p>
              <p className="text-xs text-slate-400">
                {gradeLabel} · {priceLabel}
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={isRemoving}
              onClick={() => onRemove(seat.id)}
            >
              {REMOVE_BUTTON_LABEL}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
