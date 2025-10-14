"use client";

import { useMemo } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BOOKING_SEAT_GRADE_LABELS,
  BOOKING_TOTAL_LABEL,
  BOOKING_CURRENCY_SUFFIX,
} from '@/features/bookings/constants';
import type { SeatSelectionSessionSnapshot } from '@/features/seats/lib/session-storage';
import type { ConcertDetailResponse } from '@/features/concerts/lib/dto';

const NUMBER_FORMATTER = new Intl.NumberFormat('ko-KR');
const DATE_TIME_FORMAT = 'yyyy년 M월 d일 (E) HH:mm';
const REMAINING_TIME_LABEL = '남은 시간';
const EDIT_SEAT_BUTTON_LABEL = '좌석 다시 선택하기';
const SELECTED_SEATS_LABEL = '선택한 좌석';
const TOTAL_SEATS_LABEL = '총 매수';
const TICKET_COUNT_SUFFIX = '매';
const SUMMARY_TITLE = '예매 정보 확인';
const TIMER_DANGER_CLASS = 'text-red-400';
const TIMER_WARNING_CLASS = 'text-amber-300';
const TIMER_DEFAULT_CLASS = 'text-emerald-300';

const toCurrency = (value: number) => `${NUMBER_FORMATTER.format(value)}${BOOKING_CURRENCY_SUFFIX}`;

const renderSeatLabel = (seat: SeatSelectionSessionSnapshot['selectedSeats'][number]) => {
  const gradeLabel = BOOKING_SEAT_GRADE_LABELS[seat.grade] ?? seat.grade.toUpperCase();
  return `${gradeLabel} ${seat.section}구역 ${seat.rowNumber}행 ${seat.seatNumber}번`;
};

const deriveTimerClass = (remainingSeconds: number) => {
  if (remainingSeconds <= 60) {
    return TIMER_DANGER_CLASS;
  }

  if (remainingSeconds <= 180) {
    return TIMER_WARNING_CLASS;
  }

  return TIMER_DEFAULT_CLASS;
};

const formatRemainingTime = (remainingSeconds: number) => {
  const safeSeconds = Math.max(0, remainingSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export type BookingCheckoutSummaryProps = {
  snapshot: SeatSelectionSessionSnapshot;
  concert?: ConcertDetailResponse;
  isConcertLoading: boolean;
  remainingSeconds: number;
  onEditSeats: () => void;
};

export function BookingCheckoutSummary({
  snapshot,
  concert,
  isConcertLoading,
  remainingSeconds,
  onEditSeats,
}: BookingCheckoutSummaryProps) {
  const formattedStartDate = useMemo(() => {
    if (!concert) {
      return null;
    }

    return format(new Date(concert.startDate), DATE_TIME_FORMAT, { locale: ko });
  }, [concert]);

  const timerClassName = deriveTimerClass(remainingSeconds);

  return (
    <Card className="border-slate-700 bg-slate-800/60 text-slate-100">
      <CardHeader className="space-y-2">
        <CardTitle className="text-xl font-semibold text-white">{SUMMARY_TITLE}</CardTitle>
        <div className="flex items-center justify-between text-sm text-slate-300">
          <span>{REMAINING_TIME_LABEL}</span>
          <span className={`font-mono text-lg ${timerClassName}`}>{formatRemainingTime(remainingSeconds)}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-3 rounded-lg border border-slate-700 bg-slate-900/40 p-4">
          <div className="flex items-center gap-2 text-slate-200">
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">
              {concert ? concert.title : isConcertLoading ? '공연 정보를 불러오는 중입니다...' : '공연 정보를 찾을 수 없습니다.'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Clock className="h-3.5 w-3.5" />
            <span>{formattedStartDate ?? '-'}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <MapPin className="h-3.5 w-3.5" />
            <span>{concert?.venue ?? '-'}</span>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-300">{SELECTED_SEATS_LABEL}</h3>
          <div className="space-y-1 rounded-md border border-slate-700 bg-slate-900/40 p-3 text-sm text-slate-200">
            {snapshot.selectedSeats.map((seat) => (
              <div key={seat.id} className="flex justify-between">
                <span>{renderSeatLabel(seat)}</span>
                <span>{toCurrency(seat.price)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between text-sm text-slate-300">
          <span>{TOTAL_SEATS_LABEL}</span>
          <span>
            {snapshot.selectedSeats.length}
            {TICKET_COUNT_SUFFIX}
          </span>
        </div>

        <div className="flex justify-between text-base font-semibold text-white">
          <span>{BOOKING_TOTAL_LABEL}</span>
          <span className="text-amber-400">{toCurrency(snapshot.totalAmount)}</span>
        </div>

        <Button
          variant="outline"
          className="w-full border-slate-600 bg-slate-900 text-white hover:bg-slate-800"
          onClick={onEditSeats}
        >
          {EDIT_SEAT_BUTTON_LABEL}
        </Button>
      </CardContent>
    </Card>
  );
}
