"use client";

import { use } from 'react';
import { BookingLookupContainer } from '@/features/bookings/components/booking-lookup-container';

type BookingLookupSearchParams = Record<string, string | string[] | undefined>;

type BookingLookupPageProps = {
  searchParams: Promise<BookingLookupSearchParams>;
};

export default function BookingLookupPage({ searchParams }: BookingLookupPageProps) {
  use(searchParams);
  return <BookingLookupContainer />;
}
