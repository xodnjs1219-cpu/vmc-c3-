'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PrimaryHeader } from '@/components/layout/header';
import { ROUTES } from '@/constants/app';
import {
  MIN_TICKET_COUNT,
  DEFAULT_MAX_TICKETS_PER_BOOKING,
} from '@/features/concerts/constants';
import { useConcertDetailQuery } from '@/features/concerts/hooks/useConcertDetailQuery';
import { useConcertSeatAvailability } from '@/features/concerts/hooks/useConcertSeatAvailability';
import { useTicketCountValidation } from '@/features/concerts/hooks/useTicketCountValidation';
import { ConcertDetailSkeleton } from './concert-detail-skeleton';
import { ConcertErrorState } from '@/features/concerts/components/concert-error-state';
import { ConcertEmptyState } from '@/features/concerts/components/concert-empty-state';
import { ConcertInfoSection } from './concert-info-section';
import { TicketGradeTable } from './ticket-grade-table';
import { TicketCounter } from './ticket-counter';
import { BookingCTASection } from './booking-cta-section';

const LOADING_AVAILABILITY_LABEL = '좌석 정보를 불러오는 중입니다.';
const SOLD_OUT_TITLE = '모든 좌석이 매진되었습니다.';
const SOLD_OUT_DESCRIPTION = '다른 공연을 확인해보세요.';
const NOT_FOUND_TITLE = '요청하신 콘서트를 찾을 수 없습니다.';
const NOT_FOUND_DESCRIPTION = '이미 종료된 공연이거나 잘못된 링크입니다.';
const GENERIC_EMPTY_TITLE = '콘서트 정보를 불러올 수 없습니다.';
const GENERIC_EMPTY_DESCRIPTION = '잠시 후 다시 시도해주세요.';
const COUNTER_TITLE = '인원 선택';
const COUNTER_DESCRIPTION_PREFIX = '예매하실 인원 수를 선택해주세요. (최대 ';
const COUNTER_DESCRIPTION_SUFFIX = '매)';
const AVAILABILITY_ERROR_MESSAGE = '좌석 정보를 불러오는데 실패했습니다.';

export type ConcertDetailContainerProps = {
  concertId: string;
};

export function ConcertDetailContainer({ concertId }: ConcertDetailContainerProps) {
  const router = useRouter();
  const [ticketCount, setTicketCount] = useState<number>(MIN_TICKET_COUNT);

  const detailQuery = useConcertDetailQuery(concertId);
  const seatQuery = useConcertSeatAvailability(concertId, detailQuery.isSuccess);

  const maxTicketsPerBooking = detailQuery.data?.maxTicketsPerBooking ?? DEFAULT_MAX_TICKETS_PER_BOOKING;
  const totalAvailableSeats = seatQuery.data?.totalAvailable ?? 0;

  const maxSelectable = useMemo(() => {
    if (seatQuery.data) {
      return Math.max(MIN_TICKET_COUNT, Math.min(maxTicketsPerBooking, totalAvailableSeats));
    }

    return maxTicketsPerBooking;
  }, [seatQuery.data, maxTicketsPerBooking, totalAvailableSeats]);

  useEffect(() => {
    if (ticketCount > maxSelectable) {
      setTicketCount(maxSelectable);
    }
  }, [ticketCount, maxSelectable]);

  const validation = useTicketCountValidation(ticketCount, maxTicketsPerBooking, totalAvailableSeats);

  const handleBooking = () => {
    if (!validation.isValid) {
      return;
    }

    const seatSelectionUrl = ROUTES.seatSelection(concertId, ticketCount);
    router.push(seatSelectionUrl);
  };

  if (detailQuery.isLoading) {
    return <ConcertDetailSkeleton />;
  }

  if (detailQuery.isError) {
    const errorMessage = detailQuery.error instanceof Error ? detailQuery.error.message : String(detailQuery.error);
    const normalizedMessage = errorMessage.toLowerCase();
    const isNotFound = normalizedMessage.includes('not found');

    if (isNotFound) {
      return (
        <div className="min-h-screen bg-slate-950">
          <PrimaryHeader />
          <main className="container mx-auto max-w-5xl px-4 py-12">
            <ConcertEmptyState title={NOT_FOUND_TITLE} description={NOT_FOUND_DESCRIPTION} />
          </main>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-950">
        <PrimaryHeader />
        <main className="container mx-auto max-w-5xl px-4 py-12">
          <ConcertErrorState
            message={errorMessage}
            onRetry={() => detailQuery.refetch()}
          />
        </main>
      </div>
    );
  }

  if (!detailQuery.data) {
    return (
      <div className="min-h-screen bg-slate-950">
        <PrimaryHeader />
        <main className="container mx-auto max-w-5xl px-4 py-12">
          <ConcertEmptyState title={GENERIC_EMPTY_TITLE} description={GENERIC_EMPTY_DESCRIPTION} />
        </main>
      </div>
    );
  }

  const concert = detailQuery.data;
  const isSoldOut = seatQuery.data?.totalAvailable === 0;

  return (
    <div className="min-h-screen bg-slate-950">
      <PrimaryHeader />

      <main className="container mx-auto max-w-5xl space-y-10 px-4 py-10">
        <ConcertInfoSection concert={concert} />

        {seatQuery.isLoading ? (
          <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-6 text-center text-sm text-slate-300">
            {LOADING_AVAILABILITY_LABEL}
          </div>
        ) : seatQuery.isError ? (
          <ConcertErrorState
            message={seatQuery.error instanceof Error ? seatQuery.error.message : AVAILABILITY_ERROR_MESSAGE}
            onRetry={() => seatQuery.refetch()}
          />
        ) : isSoldOut ? (
          <ConcertEmptyState title={SOLD_OUT_TITLE} description={SOLD_OUT_DESCRIPTION} />
        ) : (
          <div className="space-y-8">
            <TicketGradeTable grades={seatQuery.data?.grades ?? []} />

            <div className="space-y-6 rounded-lg border border-slate-800 bg-slate-900/40 p-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white">{COUNTER_TITLE}</h3>
                <p className="text-sm text-slate-400">
                  {COUNTER_DESCRIPTION_PREFIX}
                  {maxTicketsPerBooking}
                  {COUNTER_DESCRIPTION_SUFFIX}
                </p>
              </div>

              <TicketCounter
                value={ticketCount}
                min={MIN_TICKET_COUNT}
                max={maxSelectable}
                onChange={setTicketCount}
                disabled={isSoldOut}
              />

              <BookingCTASection
                ticketCount={ticketCount}
                isDisabled={!validation.isValid || isSoldOut}
                onBooking={handleBooking}
                validationMessage={validation.validationMessage}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
