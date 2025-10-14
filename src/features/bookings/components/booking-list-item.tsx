"use client";

import { Calendar, CreditCard, MapPin, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/utils/date';
import { BOOKING_CURRENCY_SUFFIX } from '@/features/bookings/constants';
import type { BookingDetail } from '@/features/bookings/types';

const CARD_CONTAINER_CLASS = 'overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70 transition hover:border-slate-700';
const CARD_HEADER_CLASS = 'border-b border-slate-800 bg-slate-900/80 px-6 py-4';
const CARD_TITLE_CLASS = 'text-lg font-semibold text-white';
const CARD_BODY_CLASS = 'space-y-3 px-6 py-5';
const CARD_INFO_ROW_CLASS = 'flex items-center gap-3 text-sm text-slate-300';
const CARD_ICON_CLASS = 'h-4 w-4 text-emerald-400';
const CARD_FOOTER_CLASS = 'flex flex-col gap-3 border-t border-slate-800 bg-slate-900/60 px-6 py-4 sm:flex-row';
const DETAIL_BUTTON_LABEL = '상세 보기';
const CANCEL_BUTTON_LABEL = '예약 취소';

export type BookingListItemProps = {
  booking: BookingDetail;
  onViewDetailAction: () => void;
  onCancelAction: () => void;
};

export function BookingListItem({ booking, onViewDetailAction, onCancelAction }: BookingListItemProps) {
  const concertDate = formatDateTime(booking.concertStartDate);
  const seatCount = booking.seats.length;
  const totalAmount = booking.totalAmount.toLocaleString();

  return (
    <article className={CARD_CONTAINER_CLASS}>
      <header className={CARD_HEADER_CLASS}>
        <h3 className={CARD_TITLE_CLASS}>{booking.concertTitle}</h3>
      </header>

      <div className={CARD_BODY_CLASS}>
        <p className={CARD_INFO_ROW_CLASS}>
          <Calendar className={CARD_ICON_CLASS} aria-hidden="true" />
          <span>{concertDate}</span>
        </p>
        <p className={CARD_INFO_ROW_CLASS}>
          <MapPin className={CARD_ICON_CLASS} aria-hidden="true" />
          <span>{booking.concertVenue}</span>
        </p>
        <p className={CARD_INFO_ROW_CLASS}>
          <Ticket className={CARD_ICON_CLASS} aria-hidden="true" />
          <span>{seatCount}석 예매</span>
        </p>
        <p className={CARD_INFO_ROW_CLASS}>
          <CreditCard className={CARD_ICON_CLASS} aria-hidden="true" />
          <span className="font-semibold text-white">
            {totalAmount}
            {BOOKING_CURRENCY_SUFFIX}
          </span>
        </p>
      </div>

      <footer className={CARD_FOOTER_CLASS}>
        <Button
          type="button"
          variant="outline"
          onClick={onViewDetailAction}
          className="w-full flex-1 border-emerald-500/50 text-emerald-200 hover:border-emerald-400 hover:bg-emerald-500/10"
        >
          {DETAIL_BUTTON_LABEL}
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={onCancelAction}
          className="w-full flex-1"
        >
          {CANCEL_BUTTON_LABEL}
        </Button>
      </footer>
    </article>
  );
}
