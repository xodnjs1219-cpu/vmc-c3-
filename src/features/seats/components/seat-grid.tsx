'use client';

import { useMemo } from 'react';
import type { Seat } from '@/features/seats/lib/dto';
import { SeatButton } from '@/features/seats/components/seat-button';

export type SeatGridProps = {
  seats: Seat[];
  selectedSeatIds: Set<string>;
  sessionId: string;
  isReserving: boolean;
  isReleasing: boolean;
  onSelect: (seat: Seat) => void;
  onRelease: (seat: Seat) => void;
};

type SectionGroup = {
  section: string;
  rows: {
    rowNumber: string;
    seats: Seat[];
  }[];
  seatCount: number;
};

const toNumericSortValue = (value: string) => {
  const numeric = Number(value);
  return Number.isNaN(numeric) ? Number.MAX_SAFE_INTEGER : numeric;
};

export function SeatGrid({
  seats,
  selectedSeatIds,
  sessionId,
  isReserving,
  isReleasing,
  onSelect,
  onRelease,
}: SeatGridProps) {
  const sections = useMemo<SectionGroup[]>(() => {
    const sectionMap = new Map<string, Map<string, Seat[]>>();

    seats.forEach((seat) => {
      if (!sectionMap.has(seat.section)) {
        sectionMap.set(seat.section, new Map());
      }

      const rowsMap = sectionMap.get(seat.section)!;

      if (!rowsMap.has(seat.rowNumber)) {
        rowsMap.set(seat.rowNumber, []);
      }

      rowsMap.get(seat.rowNumber)!.push(seat);
    });

    return Array.from(sectionMap.entries())
      .map(([section, rowsMap]) => {
        const rows = Array.from(rowsMap.entries())
          .map(([rowNumber, rowSeats]) => ({
            rowNumber,
            seats: rowSeats.sort((a, b) => {
              const value = toNumericSortValue(a.seatNumber) - toNumericSortValue(b.seatNumber);

              if (value !== 0) {
                return value;
              }

              return a.seatNumber.localeCompare(b.seatNumber, 'ko');
            }),
          }))
          .sort((a, b) => {
            const value = toNumericSortValue(a.rowNumber) - toNumericSortValue(b.rowNumber);

            if (value !== 0) {
              return value;
            }

            return a.rowNumber.localeCompare(b.rowNumber, 'ko');
          });

        const seatCount = rows.reduce((count, row) => count + row.seats.length, 0);

        return {
          section,
          rows,
          seatCount,
        } satisfies SectionGroup;
      })
      .sort((a, b) => a.section.localeCompare(b.section, 'ko'));
  }, [seats]);

  const isBusy = isReserving || isReleasing;

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <div
          key={`section-${section.section}`}
          className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 backdrop-blur"
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">{section.section}구역</h3>
            <span className="text-xs text-slate-400">총 {section.seatCount}석</span>
          </div>

          <div className="space-y-2">
            {section.rows.map((row) => (
              <div key={`row-${section.section}-${row.rowNumber}`} className="flex items-center gap-3">
                <span className="w-12 text-xs font-medium uppercase text-slate-400">
                  {row.rowNumber}행
                </span>

                <div className="flex flex-wrap gap-2">
                  {row.seats.map((seat) => {
                    const isSelected = selectedSeatIds.has(seat.id);
                    const isMySelection = isSelected || (seat.status === 'reserved' && seat.sessionId === sessionId);
                    const isReservedByOthers = seat.status === 'reserved' && seat.sessionId !== sessionId;
                    const isDisabled = isBusy || isReservedByOthers || seat.status === 'booked';

                    const handleClick = () => {
                      if (isDisabled) {
                        return;
                      }

                      if (isMySelection) {
                        onRelease(seat);
                        return;
                      }

                      onSelect(seat);
                    };

                    return (
                      <SeatButton
                        key={seat.id}
                        seat={seat}
                        isSelected={isMySelection}
                        isDisabled={isDisabled}
                        isReservedByOthers={isReservedByOthers}
                        onClick={handleClick}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {sections.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-800 bg-slate-900/40 p-10 text-center text-sm text-slate-400">
          표시할 좌석 정보가 없습니다.
        </div>
      )}
    </div>
  );
}
