"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const CARD_TITLE = '결제 정보';
const TOTAL_AMOUNT_LABEL = '총 결제 금액';
const SEAT_COUNT_LABEL = '예매 좌석 수';
const NUMBER_FORMATTER = new Intl.NumberFormat('ko-KR');
const CURRENCY_SUFFIX = '원';

const formatCurrency = (value: number) => `${NUMBER_FORMATTER.format(value)}${CURRENCY_SUFFIX}`;

 type PaymentInfoCardProps = {
  totalAmount: number;
  seatCount: number;
};

export function PaymentInfoCard({ totalAmount, seatCount }: PaymentInfoCardProps) {
  return (
    <Card className="border-slate-800 bg-slate-900/60">
      <CardHeader>
        <CardTitle className="text-lg text-white">{CARD_TITLE}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-300">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">{TOTAL_AMOUNT_LABEL}</span>
          <span className="text-emerald-300">{formatCurrency(totalAmount)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">{SEAT_COUNT_LABEL}</span>
          <span>{seatCount}석</span>
        </div>
      </CardContent>
    </Card>
  );
}
