'use client';

import { use } from 'react';
import { SeatSelectionProvider } from '@/features/seats/context/seat-selection-context';
import { SeatSelectionContainer } from '@/features/seats/components/seat-selection-container';

const MISSING_PARAMS_ERROR = '좌석 선택을 위해 콘서트 식별자와 인원수가 필요합니다.';
const INVALID_COUNT_ERROR = '유효한 인원수를 입력해주세요.';

type SeatSelectionSearchParams = {
  concertId?: string;
  numberOfTickets?: string;
  count?: string;
};

type SeatSelectionPageProps = {
  searchParams: Promise<SeatSelectionSearchParams>;
};

const toTicketCount = (raw?: string) => {
  if (!raw) {
    return NaN;
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? Math.floor(parsed) : NaN;
};

export default function SeatSelectionPage({ searchParams }: SeatSelectionPageProps) {
  const resolvedSearchParams = use(searchParams);
  const concertId = resolvedSearchParams.concertId ?? '';
  const rawCount = resolvedSearchParams.numberOfTickets ?? resolvedSearchParams.count ?? '';
  const numberOfTickets = toTicketCount(rawCount);

  if (!concertId) {
    throw new Error(MISSING_PARAMS_ERROR);
  }

  if (!Number.isFinite(numberOfTickets) || numberOfTickets <= 0) {
    throw new Error(INVALID_COUNT_ERROR);
  }

  return (
    <SeatSelectionProvider concertId={concertId} numberOfTickets={numberOfTickets}>
      <SeatSelectionContainer />
    </SeatSelectionProvider>
  );
}
