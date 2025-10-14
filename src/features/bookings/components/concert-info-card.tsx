"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatDateTime } from '@/lib/utils/date';

const CARD_TITLE = '공연 정보';
const VENUE_LABEL = '공연 장소';
const START_LABEL = '공연 시작';
const END_LABEL = '공연 종료';

const resolveEndDate = (startDate: string, endDate: string) => {
  const start = formatDateTime(startDate);
  const end = formatDateTime(endDate);

  if (startDate === endDate) {
    return start;
  }

  return end;
};

type ConcertInfoCardProps = {
  title: string;
  venue: string;
  startDate: string;
  endDate: string;
};

export function ConcertInfoCard({ title, venue, startDate, endDate }: ConcertInfoCardProps) {
  const formattedStart = formatDateTime(startDate);
  const formattedEnd = resolveEndDate(startDate, endDate);

  return (
    <Card className="border-slate-800 bg-slate-900/60">
      <CardHeader>
        <CardTitle className="text-lg text-white">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-300">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">{VENUE_LABEL}</span>
          <span>{venue}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">{START_LABEL}</span>
          <span>{formattedStart}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">{END_LABEL}</span>
          <span>{formattedEnd}</span>
        </div>
      </CardContent>
    </Card>
  );
}
