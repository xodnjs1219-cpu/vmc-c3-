"use client";

import { useMemo, useState } from 'react';
import { Printer, QrCode, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  BOOKING_STATUS,
  BOOKING_STATUS_LABELS,
} from '@/features/bookings/constants';
import type { BookingDetail } from '@/features/bookings/types';
import { QRCodeDisplay } from './qr-code-display';
import { handlePrint } from '@/lib/utils/print';

const ACTIONS_CONTAINER_CLASS = 'space-y-4 print:hidden';
const BUTTON_GROUP_CLASS = 'flex flex-wrap gap-4';
const BUTTON_CLASS = 'flex-1 gap-2 border-slate-700';
const CANCEL_BUTTON_CLASS = 'flex-1 gap-2';
const QR_TOGGLE_LABEL = 'QR 코드';
const QR_SHOW_LABEL = '보기';
const QR_HIDE_LABEL = '숨기기';
const PRINT_LABEL = '인쇄하기';
const CANCEL_LABEL = '예약 취소';
const CANCEL_DISABLED_LABEL = '취소 불가';

const resolveStatusLabel = (status: BookingDetail['status']) =>
  BOOKING_STATUS_LABELS[status] ?? status;

type BookingActionsProps = {
  bookingId: string;
  booking: BookingDetail;
  canCancel: boolean;
  onCancelClick: () => void;
};

export function BookingActions({ bookingId, booking, canCancel, onCancelClick }: BookingActionsProps) {
  const [isQrVisible, setIsQrVisible] = useState(false);
  const statusLabel = useMemo(() => resolveStatusLabel(booking.status), [booking.status]);
  const isBookingConfirmed = booking.status === BOOKING_STATUS.confirmed;

  const toggleQrVisibility = () => setIsQrVisible((visible) => !visible);

  return (
    <section className={ACTIONS_CONTAINER_CLASS} aria-label="예약 관련 작업">
      <div className={BUTTON_GROUP_CLASS}>
        <Button
          type="button"
          variant="outline"
          onClick={toggleQrVisibility}
          className={BUTTON_CLASS}
        >
          <QrCode className="h-4 w-4" />
          {QR_TOGGLE_LABEL} {isQrVisible ? QR_HIDE_LABEL : QR_SHOW_LABEL}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={handlePrint}
          className={BUTTON_CLASS}
        >
          <Printer className="h-4 w-4" />
          {PRINT_LABEL}
        </Button>

        <Button
          type="button"
          variant="destructive"
          className={CANCEL_BUTTON_CLASS}
          onClick={onCancelClick}
          disabled={!canCancel}
        >
          <Trash2 className="h-4 w-4" />
          {canCancel ? CANCEL_LABEL : CANCEL_DISABLED_LABEL}
        </Button>
      </div>

      {isQrVisible ? <QRCodeDisplay bookingId={bookingId} statusLabel={statusLabel} isBookingConfirmed={isBookingConfirmed} /> : null}
    </section>
  );
}
