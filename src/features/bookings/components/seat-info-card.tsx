"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { BookingDetailWithSeat } from '@/features/bookings/lib/dto';

const CARD_TITLE = '좌석 정보';
const HEADER_LABELS = ['좌석', '가격'];
const NUMBER_FORMATTER = new Intl.NumberFormat('ko-KR');
const CURRENCY_SUFFIX = '원';

const formatSeatLabel = (seat: BookingDetailWithSeat['seats'][number]) =>
  `${seat.section}구역 ${seat.rowNumber}열 ${seat.seatNumber}번 (${seat.grade.toUpperCase()})`;

const formatPrice = (price: number) => `${NUMBER_FORMATTER.format(price)}${CURRENCY_SUFFIX}`;

type SeatInfoCardProps = {
  seats: BookingDetailWithSeat['seats'];
};

export function SeatInfoCard({ seats }: SeatInfoCardProps) {
  return (
    <Card className="border-slate-800 bg-slate-900/60">
      <CardHeader>
        <CardTitle className="text-lg text-white">{CARD_TITLE}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-300">
        <div className="grid grid-cols-2 text-xs uppercase tracking-wide text-slate-500">
          {HEADER_LABELS.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        <div className="space-y-2">
          {seats.map((seat) => (
            <div key={seat.id} className="grid grid-cols-2 items-center">
              <span className="text-slate-200">{formatSeatLabel(seat)}</span>
              <span className="text-right text-emerald-300">{formatPrice(seat.price)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
