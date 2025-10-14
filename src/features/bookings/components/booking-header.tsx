"use client";

import { Badge } from '@/components/ui/badge';
import {
  BOOKING_STATUS,
  BOOKING_STATUS_COLORS,
  BOOKING_STATUS_LABELS,
} from '@/features/bookings/constants';
import { formatDateTime } from '@/lib/utils/date';

const HEADER_CONTAINER_CLASS = 'flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-6 print:border-none print:bg-transparent';
const SUBTEXT_CLASS = 'text-sm text-slate-400';
const BOOKING_ID_LABEL = '예약 번호';
const CANCELLED_AT_LABEL = '취소 완료 시각';

const resolveStatusLabel = (status: string) => BOOKING_STATUS_LABELS[status as keyof typeof BOOKING_STATUS_LABELS] ?? status;
const resolveStatusColorClass = (status: string) => BOOKING_STATUS_COLORS[status as keyof typeof BOOKING_STATUS_COLORS] ?? 'text-slate-300';

type BookingHeaderProps = {
  bookingId: string;
  status: (typeof BOOKING_STATUS)[keyof typeof BOOKING_STATUS];
  cancelledAt: string | null;
};

export function BookingHeader({ bookingId, status, cancelledAt }: BookingHeaderProps) {
  const statusLabel = resolveStatusLabel(status);
  const statusColorClass = resolveStatusColorClass(status);
  const formattedCancelledAt = cancelledAt ? formatDateTime(cancelledAt) : null;

  return (
    <section className={HEADER_CONTAINER_CLASS} aria-label="예약 상태">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-slate-500">{BOOKING_ID_LABEL}</p>
          <p className="font-mono text-sm text-emerald-300">{bookingId}</p>
        </div>
        <Badge className={`border-transparent bg-slate-800 text-xs font-semibold ${statusColorClass}`}>
          {statusLabel}
        </Badge>
      </div>

      {formattedCancelledAt ? (
        <p className={SUBTEXT_CLASS}>
          {CANCELLED_AT_LABEL}: {formattedCancelledAt}
        </p>
      ) : null}
    </section>
  );
}
