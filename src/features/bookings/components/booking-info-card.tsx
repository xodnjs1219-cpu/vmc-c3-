"use client";

import { useMemo } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  BOOKING_CURRENCY_SUFFIX,
  BOOKING_SEAT_GRADE_LABELS,
  BOOKING_TOTAL_LABEL,
} from '@/features/bookings/constants';
import type { SeatInfo } from '@/features/bookings/types';

const DATE_DISPLAY_FORMAT = 'yyyy년 M월 d일 (E) HH:mm';
const TIMESTAMP_DISPLAY_FORMAT = 'yyyy년 M월 d일 HH:mm:ss';
const NUMBER_FORMATTER = new Intl.NumberFormat('ko-KR');
const SECTION_SEPARATOR = '구역';
const ROW_SUFFIX = '행';
const SEAT_SUFFIX = '번';
const VENUE_LABEL = '공연 장소';
const SCHEDULE_LABEL = '공연 일시';
const SEAT_SECTION_TITLE = '예매 좌석';
const BOOKER_SECTION_TITLE = '예매자 정보';
const BOOKER_NAME_LABEL = '이름';
const BOOKER_PHONE_LABEL = '휴대폰 번호';
const BOOKING_ID_LABEL = '예약번호';
const BOOKING_CREATED_AT_LABEL = '예약 일시';

const toCurrency = (value: number) => `${NUMBER_FORMATTER.format(value)}${BOOKING_CURRENCY_SUFFIX}`;

const renderSeatLabel = (seat: SeatInfo) =>
  `${BOOKING_SEAT_GRADE_LABELS[seat.grade] ?? seat.grade} ${seat.section}${SECTION_SEPARATOR} ${seat.rowNumber}${ROW_SUFFIX} ${seat.seatNumber}${SEAT_SUFFIX}`;

type BookingInfoCardProps = {
  concertTitle: string;
  venue: string;
  startDate: string;
  seats: SeatInfo[];
  totalAmount: number;
  bookerName: string;
  phoneNumber: string;
  bookingId?: string;
  createdAt?: string;
};

export function BookingInfoCard({
  concertTitle,
  venue,
  startDate,
  seats,
  totalAmount,
  bookerName,
  phoneNumber,
  bookingId,
  createdAt,
}: BookingInfoCardProps) {
  const formattedStartDate = useMemo(
    () => format(new Date(startDate), DATE_DISPLAY_FORMAT, { locale: ko }),
    [startDate],
  );

  const formattedCreatedAt = useMemo(() => {
    if (!createdAt) {
      return null;
    }

    return format(new Date(createdAt), TIMESTAMP_DISPLAY_FORMAT, { locale: ko });
  }, [createdAt]);

  return (
    <Card className="border-slate-700 bg-slate-800">
      <CardHeader>
        <CardTitle className="text-xl text-white">{concertTitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-slate-200">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">{VENUE_LABEL}</span>
            <span>{venue}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">{SCHEDULE_LABEL}</span>
            <span>{formattedStartDate}</span>
          </div>
        </div>

        <hr className="border-slate-700" />

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-300">{SEAT_SECTION_TITLE}</h3>
          <div className="space-y-1">
            {seats.map((seat) => (
              <div key={seat.id} className="flex justify-between text-sm">
                <span className="text-slate-400">{renderSeatLabel(seat)}</span>
                <span>{toCurrency(seat.price)}</span>
              </div>
            ))}
          </div>
        </div>

        <hr className="border-slate-700" />

        <div className="flex justify-between text-base font-semibold">
          <span className="text-slate-300">{BOOKING_TOTAL_LABEL}</span>
          <span className="text-amber-400">{toCurrency(totalAmount)}</span>
        </div>

        <hr className="border-slate-700" />

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-300">{BOOKER_SECTION_TITLE}</h3>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">{BOOKER_NAME_LABEL}</span>
            <span>{bookerName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">{BOOKER_PHONE_LABEL}</span>
            <span>{phoneNumber}</span>
          </div>
        </div>

        {bookingId ? (
          <>
            <hr className="border-slate-700" />
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">{BOOKING_ID_LABEL}</span>
                <span className="font-mono text-xs text-amber-400">{bookingId}</span>
              </div>
              {formattedCreatedAt ? (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">{BOOKING_CREATED_AT_LABEL}</span>
                  <span className="text-xs">{formattedCreatedAt}</span>
                </div>
              ) : null}
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
