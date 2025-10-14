"use client";

import { CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { BookingInfoCard } from '@/features/bookings/components/booking-info-card';
import { BOOKING_REDIRECT_ROUTES } from '@/features/bookings/constants';
import type { BookingInfo } from '@/features/bookings/types';

const SUCCESS_TITLE = '예약이 완료되었습니다!';
const SUCCESS_DESCRIPTION =
  '예약번호를 안전하게 보관하시고, 예매 시 입력하신 휴대폰 번호와 비밀번호로 조회하실 수 있습니다.';
const HOME_BUTTON_LABEL = '홈으로 돌아가기';
const LOOKUP_BUTTON_LABEL = '예약 조회하기';

type BookingSuccessViewProps = {
  booking: BookingInfo;
};

export function BookingSuccessView({ booking }: BookingSuccessViewProps) {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <CheckCircle className="h-16 w-16 text-green-500" />
        <h1 className="text-2xl font-bold text-white">{SUCCESS_TITLE}</h1>
        <p className="text-sm text-slate-300">{SUCCESS_DESCRIPTION}</p>
      </div>

      <BookingInfoCard
        concertTitle={booking.concertTitle}
        venue={booking.venue}
        startDate={booking.startDate}
        seats={booking.seats}
        totalAmount={booking.totalAmount}
        bookerName={booking.bookerName}
        phoneNumber={booking.phoneNumber}
        bookingId={booking.id}
        createdAt={booking.createdAt}
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          variant="outline"
          className="flex-1 border-slate-600 bg-slate-800 text-white hover:bg-slate-700"
          onClick={() => router.push(BOOKING_REDIRECT_ROUTES.home)}
        >
          {HOME_BUTTON_LABEL}
        </Button>
        <Button
          className="flex-1 bg-amber-500 text-slate-950 hover:bg-amber-600"
          onClick={() => router.push(BOOKING_REDIRECT_ROUTES.lookup)}
        >
          {LOOKUP_BUTTON_LABEL}
        </Button>
      </div>
    </div>
  );
}
