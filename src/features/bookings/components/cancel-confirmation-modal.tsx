"use client";

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BookingDetail } from '@/features/bookings/types';
import {
  canCancelBooking,
  getCancellationMessage,
} from '@/features/bookings/lib/policy';
import { formatDateTime } from '@/lib/utils/date';
import { BOOKING_STATUS_LABELS } from '@/features/bookings/constants';

const OVERLAY_CLASS = 'fixed inset-0 z-50 bg-black/70 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0';
const CONTENT_CLASS = 'fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95';
const TITLE_CLASS = 'text-xl font-semibold text-white';
const DESCRIPTION_CLASS = 'mt-2 text-sm text-slate-300';
const DETAIL_LIST_CLASS = 'mt-4 space-y-2 rounded-lg border border-slate-800 bg-slate-900/40 p-4';
const DETAIL_ROW_CLASS = 'flex items-center justify-between text-sm text-slate-300';
const DETAIL_LABEL_CLASS = 'text-slate-500';
const FOOTER_CLASS = 'mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end';
const ERROR_CLASS = 'mt-2 text-sm text-red-400';
const CLOSE_BUTTON_CLASS = 'absolute right-4 top-4 rounded-md p-2 text-slate-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-950';
const CANCEL_BUTTON_LABEL = '돌아가기';
const CONFIRM_BUTTON_LABEL = '예약 취소 진행';
const MODAL_TITLE = '예약을 취소하시겠어요?';
const CONFIRMATION_NOTICE = '예약을 취소하면 좌석이 즉시 반환되며 복구할 수 없습니다.';
const STATUS_LABEL = '예약 상태';
const CONCERT_LABEL = '공연';
const START_DATE_LABEL = '공연 일시';
const DEADLINE_LABEL = '취소 가능 기한';
const BOOKING_ID_LABEL = '예약 번호';

export type CancelConfirmationModalProps = {
  isOpen: boolean;
  booking: BookingDetail;
  onConfirm: () => void;
  onClose: () => void;
  isLoading: boolean;
  errorMessage?: string;
};

export function CancelConfirmationModal({
  isOpen,
  booking,
  onConfirm,
  onClose,
  isLoading,
  errorMessage,
}: CancelConfirmationModalProps) {
  const cancellationDeadline = getCancellationMessage(booking.concertStartDate);
  const canCancel = canCancelBooking(booking.concertStartDate);
  const statusLabel = BOOKING_STATUS_LABELS[booking.status] ?? booking.status;

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(nextOpen) => { if (!nextOpen) { onClose(); } }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={OVERLAY_CLASS} />
        <DialogPrimitive.Content className={CONTENT_CLASS} aria-describedby="cancel-confirmation-description">
          <button type="button" className={CLOSE_BUTTON_CLASS} onClick={onClose} disabled={isLoading}>
            <X className="h-4 w-4" />
            <span className="sr-only">닫기</span>
          </button>

          <DialogPrimitive.Title className={TITLE_CLASS}>{MODAL_TITLE}</DialogPrimitive.Title>
          <DialogPrimitive.Description id="cancel-confirmation-description" className={DESCRIPTION_CLASS}>
            {CONFIRMATION_NOTICE}
          </DialogPrimitive.Description>

          <div className={DETAIL_LIST_CLASS}>
            <div className={DETAIL_ROW_CLASS}>
              <span className={DETAIL_LABEL_CLASS}>{CONCERT_LABEL}</span>
              <span className="text-right text-white">{booking.concertTitle}</span>
            </div>
            <div className={DETAIL_ROW_CLASS}>
              <span className={DETAIL_LABEL_CLASS}>{START_DATE_LABEL}</span>
              <span className="text-right text-white">{formatDateTime(booking.concertStartDate)}</span>
            </div>
            <div className={DETAIL_ROW_CLASS}>
              <span className={DETAIL_LABEL_CLASS}>{BOOKING_ID_LABEL}</span>
              <span className="font-mono text-xs text-emerald-300">{booking.id}</span>
            </div>
            <div className={DETAIL_ROW_CLASS}>
              <span className={DETAIL_LABEL_CLASS}>{STATUS_LABEL}</span>
              <span className="text-right text-white">{statusLabel}</span>
            </div>
            <div className={DETAIL_ROW_CLASS}>
              <span className={DETAIL_LABEL_CLASS}>{DEADLINE_LABEL}</span>
              <span className="text-right text-white">{cancellationDeadline}</span>
            </div>
          </div>

          {!canCancel ? (
            <p className="mt-4 text-sm text-amber-400">
              현재 시간 기준으로 취소 가능 시간을 지났습니다. 취소가 불가능할 수 있습니다.
            </p>
          ) : null}

          {errorMessage ? <p className={ERROR_CLASS}>{errorMessage}</p> : null}

          <div className={FOOTER_CLASS}>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {CANCEL_BUTTON_LABEL}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={onConfirm}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? '처리 중...' : CONFIRM_BUTTON_LABEL}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
