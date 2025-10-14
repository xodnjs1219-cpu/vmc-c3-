"use client";

import { use } from 'react';
import { BookingInfoContainer } from '@/features/bookings/components/booking-info-container';

const LOADING_FALLBACK = null;

export type BookingPageParams = {
  bookingId: string;
};

export type BookingInfoPageProps = {
  params: Promise<BookingPageParams>;
};

export default function BookingInfoPage({ params }: BookingInfoPageProps) {
  const resolvedParams = use(params);

  if (!resolvedParams?.bookingId) {
    return LOADING_FALLBACK;
  }

  return <BookingInfoContainer bookingId={resolvedParams.bookingId} />;
}
