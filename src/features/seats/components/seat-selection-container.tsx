'use client';

import { useMemo } from 'react';
import { PrimaryHeader } from '@/components/layout/header';
import { SeatLayout } from '@/features/seats/components/seat-layout';
import { SelectionPanel } from '@/features/seats/components/selection-panel';
import { SeatSelectionSkeleton } from '@/features/seats/components/seat-selection-skeleton';
import { ExpirationModal } from '@/features/seats/components/expiration-modal';
import { useSeatSelectionContext } from '@/features/seats/context/seat-selection-context';
import { ConcertErrorState } from '@/features/concerts/components/concert-error-state';

type SeatSelectionContainerProps = {
  title?: string;
};

const DEFAULT_TITLE = '좌석 선택';
const STATUS_ERROR_MESSAGE = '좌석 상태를 최신으로 동기화하지 못했습니다. 잠시 후 다시 시도해주세요.';

export function SeatSelectionContainer({ title = DEFAULT_TITLE }: SeatSelectionContainerProps) {
  const {
    state,
    seatsQuery,
    seatStatusQuery,
    totalAmount,
    remainingSeatCount,
    canProceed,
    isOverCapacity,
    formattedTime,
    timerVariant,
    isExpired,
    selectSeat,
    releaseSeat,
    proceedToCheckout,
    resetSelection,
    clearError,
  } = useSeatSelectionContext();

  const seats = seatsQuery.data?.seats ?? [];

  const selectedSeatIds = useMemo(
    () => new Set(state.selectedSeats.map((seat) => seat.id)),
    [state.selectedSeats],
  );

  const layout = seatsQuery.isLoading ? (
    <SeatSelectionSkeleton />
  ) : seatsQuery.isError ? (
    <ConcertErrorState
      message={seatsQuery.error instanceof Error ? seatsQuery.error.message : undefined}
      onRetry={() => seatsQuery.refetch()}
    />
  ) : (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <SeatLayout
        seats={seats}
        selectedSeatIds={selectedSeatIds}
        sessionId={state.sessionId}
        isReserving={state.isReserving}
        isReleasing={state.isReleasing}
        onSelect={selectSeat}
        onRelease={(seat) => releaseSeat(seat.id)}
      />

      <SelectionPanel
        selectedSeats={state.selectedSeats}
        remainingSeatCount={remainingSeatCount}
        totalAmount={totalAmount}
        formattedTime={formattedTime}
        timerVariant={timerVariant}
        isExpired={isExpired}
        isReserving={state.isReserving}
        isReleasing={state.isReleasing}
        isValidating={state.isValidating}
        canProceed={canProceed && !isOverCapacity}
        onSeatRemove={(seatId) => releaseSeat(seatId)}
        onProceed={proceedToCheckout}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-white">
      <PrimaryHeader />

      <main className="container mx-auto max-w-6xl space-y-8 px-4 py-10">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          {seatStatusQuery.isError && (
            <p className="text-sm text-amber-300">{STATUS_ERROR_MESSAGE}</p>
          )}
        </header>

        {state.error && (
          <div className="flex items-start justify-between gap-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            <p className="flex-1">{state.error}</p>
            <button
              type="button"
              onClick={clearError}
              className="text-xs font-semibold uppercase tracking-wide text-amber-200/80 hover:text-amber-100"
            >
              닫기
            </button>
          </div>
        )}

        {layout}
      </main>

      <ExpirationModal isOpen={isExpired} onReset={resetSelection} />
    </div>
  );
}
