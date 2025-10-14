"use client";

import { useMemo } from 'react';
import QRCode from 'react-qr-code';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  downloadQRCode,
  generateQRCodeData,
} from '@/lib/utils/qr-code';

const QR_CONTAINER_CLASS = 'space-y-4 rounded-xl border border-slate-800 bg-slate-900/40 p-6 print:border-none print:bg-transparent';
const QR_HEADER_TITLE_CLASS = 'text-lg font-semibold text-white';
const QR_HEADER_SUBTITLE_CLASS = 'text-sm text-slate-400';
const QR_CANVAS_WRAPPER_CLASS = 'flex justify-center';
const QR_BACKGROUND_CLASS = 'rounded-lg bg-white p-4 shadow-sm print:shadow-none';
const QR_DOWNLOAD_BUTTON_CLASS = 'w-full gap-2 border-slate-700 print:hidden';
const QR_TITLE = '입장 확인용 QR 코드';
const QR_DESCRIPTION = '공연 당일 입장 시 이 QR 코드를 제시해주세요.';
const QR_STATUS_LABEL = '현재 예약 상태';
const QR_DOWNLOAD_LABEL = 'QR 코드 다운로드';
const QR_ELEMENT_ID = 'booking-qr-code';
const QR_SIZE = 200;
const QR_ERROR_CORRECTION_LEVEL = 'H';

type QRCodeDisplayProps = {
  bookingId: string;
  statusLabel?: string;
  isBookingConfirmed?: boolean;
};

export function QRCodeDisplay({ bookingId, statusLabel, isBookingConfirmed = true }: QRCodeDisplayProps) {
  const qrValue = useMemo(() => generateQRCodeData(bookingId), [bookingId]);
  const statusMessage = statusLabel ? `${QR_STATUS_LABEL}: ${statusLabel}` : null;

  return (
    <div className={QR_CONTAINER_CLASS} aria-live="polite">
      <div className="space-y-2 text-center">
        <h3 className={QR_HEADER_TITLE_CLASS}>{QR_TITLE}</h3>
        <p className={QR_HEADER_SUBTITLE_CLASS}>{QR_DESCRIPTION}</p>
        {statusMessage ? <p className="text-xs text-slate-500">{statusMessage}</p> : null}
        {!isBookingConfirmed ? (
          <p className="text-xs text-amber-400">취소된 예약은 QR 코드를 사용할 수 없습니다.</p>
        ) : null}
      </div>

      <div className={QR_CANVAS_WRAPPER_CLASS}>
        <div className={QR_BACKGROUND_CLASS}>
          <QRCode
            id={QR_ELEMENT_ID}
            value={qrValue}
            size={QR_SIZE}
            level={QR_ERROR_CORRECTION_LEVEL}
            bgColor="white"
            fgColor="#0f172a"
          />
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={() => downloadQRCode(bookingId, QR_ELEMENT_ID)}
        className={QR_DOWNLOAD_BUTTON_CLASS}
      >
        <Download className="h-4 w-4" />
        {QR_DOWNLOAD_LABEL}
      </Button>
    </div>
  );
}
