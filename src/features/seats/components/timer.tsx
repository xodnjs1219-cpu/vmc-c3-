'use client';

import { cn } from '@/lib/utils';
import type { TimerVariant } from '@/features/seats/context/seat-selection-context';

export type TimerProps = {
  formattedTime: string;
  variant: TimerVariant;
  isExpired: boolean;
};

const TIMER_LABEL = '남은 시간';

export function Timer({ formattedTime, variant, isExpired }: TimerProps) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-wider text-slate-400">{TIMER_LABEL}</p>
      <div
        className={cn(
          'flex items-center gap-2 text-2xl font-bold',
          variant === 'default' && 'text-emerald-300',
          variant === 'warning' && 'text-amber-300',
          variant === 'danger' && 'text-red-400 animate-pulse',
        )}
      >
        <span>{isExpired ? '00:00' : formattedTime}</span>
      </div>
    </div>
  );
}
