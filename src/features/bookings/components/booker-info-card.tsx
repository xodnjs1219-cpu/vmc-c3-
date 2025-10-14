"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatDateTime } from '@/lib/utils/date';

const CARD_TITLE = '예매자 정보';
const NAME_LABEL = '예매자';
const PHONE_LABEL = '연락처';
const CREATED_AT_LABEL = '예매 일시';

const infoClass = 'flex items-center justify-between text-sm text-slate-300';

type BookerInfoCardProps = {
  bookerName: string;
  phoneNumber: string;
  createdAt: string;
};

export function BookerInfoCard({ bookerName, phoneNumber, createdAt }: BookerInfoCardProps) {
  return (
    <Card className="border-slate-800 bg-slate-900/60">
      <CardHeader>
        <CardTitle className="text-lg text-white">{CARD_TITLE}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className={infoClass}>
          <span className="text-slate-400">{NAME_LABEL}</span>
          <span>{bookerName}</span>
        </div>
        <div className={infoClass}>
          <span className="text-slate-400">{PHONE_LABEL}</span>
          <span>{phoneNumber}</span>
        </div>
        <div className={infoClass}>
          <span className="text-slate-400">{CREATED_AT_LABEL}</span>
          <span>{formatDateTime(createdAt)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
