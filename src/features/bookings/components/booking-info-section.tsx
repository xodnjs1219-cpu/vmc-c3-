"use client";

import { BookingHeader } from '@/features/bookings/components/booking-header';
import { ConcertInfoCard } from '@/features/bookings/components/concert-info-card';
import { SeatInfoCard } from '@/features/bookings/components/seat-info-card';
import { BookerInfoCard } from '@/features/bookings/components/booker-info-card';
import { PaymentInfoCard } from '@/features/bookings/components/payment-info-card';
import { BookingActions } from '@/features/bookings/components/booking-actions';
import {
  canCancelBooking,
  getCancellationMessage,
} from '@/features/bookings/lib/policy';
import { BOOKING_STATUS } from '@/features/bookings/constants';
import type { BookingDetail } from '@/features/bookings/types';

const SECTION_CLASS = 'space-y-8';
const GRID_CLASS = 'grid gap-6 md:grid-cols-2';
const ALERT_CONTAINER_CLASS = 'rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-200 print:hidden';
const ALERT_WARNING_CLASS = 'rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200 print:hidden';
const ALERT_INFO_CLASS = 'rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-100 print:hidden';
const ALERT_TITLE_CLASS = 'font-semibold';
const ALERT_MESSAGE_CLASS = 'mt-1';
const CANCELLATION_NOTICE_TITLE = '취소 안내';
const CANCELLATION_WARNING_TITLE = '취소 불가 안내';
const CANCELLATION_WARNING_MESSAGE = '현재 시간 기준으로 취소 가능 기한을 지났습니다.';
const CANCELLATION_COMPLETED_TITLE = '취소 완료';
const CANCELLATION_COMPLETED_MESSAGE = '해당 예약은 취소되어 좌석이 반환되었습니다.';

export type BookingInfoSectionProps = {
  booking: BookingDetail;
  canCancel: boolean;
  onCancelClick: () => void;
};

export function BookingInfoSection({ booking, canCancel, onCancelClick }: BookingInfoSectionProps) {
  const cancellationGuide = getCancellationMessage(booking.concertStartDate);
  const isConfirmed = booking.status === BOOKING_STATUS.confirmed;
  const cancellationPossible = canCancel && isConfirmed && canCancelBooking(booking.concertStartDate);

  return (
    <section className={SECTION_CLASS} aria-label="예약 정보">
      <BookingHeader bookingId={booking.id} status={booking.status} cancelledAt={booking.cancelledAt} />

      {isConfirmed ? (
        cancellationPossible ? (
          <div className={ALERT_CONTAINER_CLASS} role="status">
            <p className={`${ALERT_TITLE_CLASS} text-amber-300`}>{CANCELLATION_NOTICE_TITLE}</p>
            <p className={`${ALERT_MESSAGE_CLASS} text-amber-100`}>{cancellationGuide}</p>
          </div>
        ) : (
          <div className={ALERT_WARNING_CLASS} role="status">
            <p className={`${ALERT_TITLE_CLASS} text-red-200`}>{CANCELLATION_WARNING_TITLE}</p>
            <p className={`${ALERT_MESSAGE_CLASS} text-red-100`}>{CANCELLATION_WARNING_MESSAGE}</p>
          </div>
        )
      ) : booking.status === BOOKING_STATUS.cancelled ? (
        <div className={ALERT_INFO_CLASS} role="status">
          <p className={`${ALERT_TITLE_CLASS} text-emerald-200`}>{CANCELLATION_COMPLETED_TITLE}</p>
          <p className={`${ALERT_MESSAGE_CLASS} text-emerald-100`}>{CANCELLATION_COMPLETED_MESSAGE}</p>
        </div>
      ) : null}

      <div className={GRID_CLASS}>
        <ConcertInfoCard
          title={booking.concertTitle}
          venue={booking.concertVenue}
          startDate={booking.concertStartDate}
          endDate={booking.concertEndDate}
        />

        <SeatInfoCard seats={booking.seats} />
      </div>

      <div className={GRID_CLASS}>
        <BookerInfoCard bookerName={booking.bookerName} phoneNumber={booking.phoneNumber} createdAt={booking.createdAt} />

        <PaymentInfoCard totalAmount={booking.totalAmount} seatCount={booking.seats.length} />
      </div>

      <BookingActions bookingId={booking.id} booking={booking} canCancel={canCancel} onCancelClick={onCancelClick} />
    </section>
  );
}
