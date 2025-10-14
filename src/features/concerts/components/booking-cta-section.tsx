'use client';

import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CONTAINER_CLASS = 'space-y-4 rounded-lg border border-slate-800 bg-slate-900/40 p-6';
const ROW_CLASS = 'flex items-center justify-between';
const LABEL_CLASS = 'text-sm text-slate-400';
const VALUE_CLASS = 'text-lg font-semibold text-white';
const VALIDATION_CLASS = 'text-sm text-amber-400';
const CTA_BUTTON_CLASS = 'w-full gap-2 bg-emerald-600 py-6 text-base font-semibold hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500';
const SELECTED_LABEL = '선택한 인원';
const CTA_LABEL = '좌석 선택하기';
const COUNT_SUFFIX = '매';

export type BookingCTASectionProps = {
  ticketCount: number;
  isDisabled: boolean;
  onBooking: () => void;
  validationMessage: string | null;
};

export function BookingCTASection({ ticketCount, isDisabled, onBooking, validationMessage }: BookingCTASectionProps) {
  return (
    <div className={CONTAINER_CLASS}>
      <div className={ROW_CLASS}>
        <span className={LABEL_CLASS}>{SELECTED_LABEL}</span>
        <span className={VALUE_CLASS}>
          {ticketCount}
          {COUNT_SUFFIX}
        </span>
      </div>

      {validationMessage && <p className={VALIDATION_CLASS} role="alert">{validationMessage}</p>}

      <Button type="button" onClick={onBooking} disabled={isDisabled} className={CTA_BUTTON_CLASS}>
        {CTA_LABEL}
        <ArrowRight className="h-5 w-5" />
      </Button>
    </div>
  );
}
