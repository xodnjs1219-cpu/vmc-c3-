"use client";

import { use, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PrimaryHeader } from '@/components/layout/header';
import {
  BOOKING_ERROR_FALLBACK_MESSAGE,
  BOOKING_MIN_SEAT_COUNT,
  BOOKING_REDIRECT_ROUTES,
  BOOKING_SEAT_IDS_DELIMITER,
} from '@/features/bookings/constants';
import { BookingErrorView } from '@/features/bookings/components/booking-error-view';
import { BookingLoadingView } from '@/features/bookings/components/booking-loading-view';
import { BookingSuccessView } from '@/features/bookings/components/booking-success-view';
import { useCreateBookingMutation } from '@/features/bookings/hooks/useCreateBookingMutation';
import type {
  BookingMutationError,
  CreateBookingPayload,
} from '@/features/bookings/types';

type BookingCompleteSearchParams = {
  concertId?: string;
  seatIds?: string;
  sessionId?: string;
  bookerName?: string;
  phoneNumber?: string;
  password?: string;
};

type BookingCompletePageProps = {
  searchParams: Promise<BookingCompleteSearchParams>;
};

const parseSeatIds = (rawSeatIds?: string) =>
  (rawSeatIds ?? '')
    .split(BOOKING_SEAT_IDS_DELIMITER)
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

const toBookingPayload = (
  params: BookingCompleteSearchParams,
): CreateBookingPayload | null => {
  const seatIds = parseSeatIds(params.seatIds);

  if (
    !params.concertId ||
    !params.sessionId ||
    !params.bookerName ||
    !params.phoneNumber ||
    !params.password ||
    seatIds.length < BOOKING_MIN_SEAT_COUNT
  ) {
    return null;
  }

  return {
    concertId: params.concertId,
    seatIds,
    sessionId: params.sessionId,
    bookerName: params.bookerName,
    phoneNumber: params.phoneNumber,
    password: params.password,
  };
};

export default function BookingCompletePage({ searchParams }: BookingCompletePageProps) {
  const router = useRouter();
  const resolvedSearchParams = use(searchParams);
  const bookingPayload = useMemo(
    () => toBookingPayload(resolvedSearchParams),
    [resolvedSearchParams],
  );
  const {
    mutate,
    reset,
    isPending,
    isSuccess,
    isError,
    data,
    error,
  } = useCreateBookingMutation();
  const [hasAttempted, setHasAttempted] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    if (!bookingPayload && !hasRedirected) {
      router.replace(BOOKING_REDIRECT_ROUTES.home);
      setHasRedirected(true);
      return;
    }

    if (bookingPayload && !hasAttempted) {
      mutate(bookingPayload);
      setHasAttempted(true);
    }
  }, [bookingPayload, hasAttempted, hasRedirected, mutate, router]);

  const bookingError = isError ? (error as BookingMutationError) : null;
  const errorMessage = bookingError?.message ?? BOOKING_ERROR_FALLBACK_MESSAGE;

  const handleRetry = () => {
    if (!bookingPayload) {
      router.replace(BOOKING_REDIRECT_ROUTES.home);
      return;
    }

    reset();
    mutate(bookingPayload);
    setHasAttempted(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PrimaryHeader />

      <main className="container mx-auto max-w-6xl px-4 py-10">
        {isPending ? <BookingLoadingView /> : null}

        {isSuccess ? <BookingSuccessView booking={data} /> : null}

        {isError ? (
          <BookingErrorView
            errorMessage={errorMessage || BOOKING_ERROR_FALLBACK_MESSAGE}
            errorCode={bookingError?.code}
            onRetry={handleRetry}
          />
        ) : null}
      </main>
    </div>
  );
}
