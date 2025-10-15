"use client";

import { use, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { PrimaryHeader } from '@/components/layout/header';
import { ROUTES } from '@/constants/app';
import {
  BookingCheckoutForm,
  type BookingCheckoutFormValues,
} from '@/features/bookings/components/booking-checkout-form';
import { BookingCheckoutSummary } from '@/features/bookings/components/booking-checkout-summary';
import {
  BOOKING_ERROR_FALLBACK_MESSAGE,
  BOOKING_SEAT_IDS_DELIMITER,
} from '@/features/bookings/constants';
import { useSeatSelectionSnapshot } from '@/features/bookings/hooks/useSeatSelectionSnapshot';
import { useConcertDetailQuery } from '@/features/concerts/hooks/useConcertDetailQuery';
import { useToast } from '@/hooks/use-toast';

const INVALID_ROUTE_MESSAGE = '필수 정보가 누락되었습니다. 처음부터 다시 진행해주세요.';
const EXPIRED_SELECTION_MESSAGE = '좌석 선택 시간이 만료되었습니다. 다시 좌석을 선택해주세요.';
const MISMATCH_SELECTION_MESSAGE = '좌석 정보가 올바르지 않습니다. 다시 좌석을 선택해주세요.';
const PAGE_TITLE = '예약자 정보 입력';
const PAGE_DESCRIPTION = '선택하신 좌석 정보를 확인하고 예약자 정보를 입력해주세요.';
const LAYOUT_BG_CLASS = 'min-h-screen bg-gray-50';
const MAIN_CONTAINER_CLASS = 'container mx-auto max-w-6xl px-4 py-10';
const GRID_LAYOUT_CLASS = 'grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]';
const LOADING_MESSAGE = '좌석 정보를 확인하는 중입니다...';
const TOAST_DURATION = 3_000;

const formatSeatIds = (seatIds: string[]) => seatIds.join(BOOKING_SEAT_IDS_DELIMITER);

type BookingCheckoutSearchParams = {
  concertId?: string;
  sessionId?: string;
};

type BookingCheckoutPageProps = {
  searchParams: Promise<BookingCheckoutSearchParams>;
};

export default function BookingCheckoutPage({ searchParams }: BookingCheckoutPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const resolvedParams = use(searchParams);
  const concertId = resolvedParams.concertId ?? '';
  const sessionId = resolvedParams.sessionId ?? '';
  const notificationRef = useRef({ invalid: false, mismatch: false, expired: false });

  const {
    snapshot,
    isHydrated,
    remainingSeconds,
    isExpired,
    seatIds,
    seatCount,
    totalAmount,
    clearSnapshot,
  } = useSeatSelectionSnapshot(concertId, sessionId);

  const { data: concertDetail, isLoading: isConcertLoading } = useConcertDetailQuery(concertId);

  const isSelectionValid = useMemo(() => {
    if (!snapshot) {
      return false;
    }

    if (seatIds.length === 0 || seatCount === 0) {
      return false;
    }

    return true;
  }, [seatCount, seatIds, snapshot]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!concertId || !sessionId) {
      if (!notificationRef.current.invalid) {
        notificationRef.current.invalid = true;
        toast({ description: INVALID_ROUTE_MESSAGE, duration: TOAST_DURATION });
      }

      router.replace(ROUTES.home);
      return;
    }

    if (!isSelectionValid) {
      if (!notificationRef.current.mismatch) {
        notificationRef.current.mismatch = true;
        toast({ description: MISMATCH_SELECTION_MESSAGE, duration: TOAST_DURATION });
      }

      if (snapshot) {
        clearSnapshot();
      }

      router.replace(ROUTES.seatSelection(concertId, snapshot?.numberOfTickets ?? 1));
    }
  }, [clearSnapshot, concertId, isHydrated, isSelectionValid, router, sessionId, snapshot, toast]);

  useEffect(() => {
    if (!isHydrated || !snapshot) {
      return;
    }

    if (isExpired) {
      if (!notificationRef.current.expired) {
        notificationRef.current.expired = true;
        toast({ description: EXPIRED_SELECTION_MESSAGE, duration: TOAST_DURATION });
      }

      clearSnapshot();
      router.replace(ROUTES.seatSelection(concertId, snapshot.numberOfTickets));
    }
  }, [clearSnapshot, concertId, isExpired, isHydrated, router, snapshot, toast]);

  if (!isHydrated) {
    return (
      <div className={LAYOUT_BG_CLASS}>
        <PrimaryHeader />
        <main className={MAIN_CONTAINER_CLASS}>
          <p className="text-center text-sm text-gray-600">{LOADING_MESSAGE}</p>
        </main>
      </div>
    );
  }

  if (!snapshot || seatIds.length === 0 || totalAmount <= 0) {
    return (
      <div className={LAYOUT_BG_CLASS}>
        <PrimaryHeader />
        <main className={MAIN_CONTAINER_CLASS}>
          <p className="text-center text-sm text-gray-600">{BOOKING_ERROR_FALLBACK_MESSAGE}</p>
        </main>
      </div>
    );
  }

  const handleSubmit = (values: BookingCheckoutFormValues) => {
    const params = new URLSearchParams({
      concertId,
      sessionId,
      seatIds: formatSeatIds(seatIds),
      bookerName: values.bookerName,
      phoneNumber: values.phoneNumber,
      password: values.password,
    });

    router.push(`/booking/complete?${params.toString()}`);
  };

  return (
    <div className={LAYOUT_BG_CLASS}>
      <PrimaryHeader />
      <main className={MAIN_CONTAINER_CLASS}>
        <header className="mb-8 space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">{PAGE_TITLE}</h1>
          <p className="text-sm text-gray-600">{PAGE_DESCRIPTION}</p>
        </header>

        <section className={GRID_LAYOUT_CLASS}>
          <BookingCheckoutSummary
            snapshot={snapshot}
            concert={concertDetail}
            isConcertLoading={isConcertLoading}
            remainingSeconds={remainingSeconds}
            onEditSeats={() => router.push(ROUTES.seatSelection(concertId, snapshot.numberOfTickets))}
          />

          <BookingCheckoutForm
            onSubmit={handleSubmit}
            isDisabled={!isSelectionValid || isExpired}
            isSubmitting={false}
          />
        </section>
      </main>
    </div>
  );
}
