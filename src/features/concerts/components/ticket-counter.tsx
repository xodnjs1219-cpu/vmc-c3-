'use client';

import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const WRAPPER_CLASS = 'flex items-center justify-center gap-4';
const BUTTON_CLASS = 'h-12 w-12 rounded-full border-gray-300 hover:bg-gray-100';
const COUNT_WRAPPER_CLASS = 'flex min-w-[80px] items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-3';
const COUNT_TEXT_CLASS = 'text-2xl font-semibold text-gray-900';
const COUNT_SUFFIX_CLASS = 'ml-1 text-sm text-gray-600';
const COUNT_SUFFIX = '매';
const DECREMENT_LABEL = '인원 감소';
const INCREMENT_LABEL = '인원 증가';

export type TicketCounterProps = {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  disabled?: boolean;
};

export function TicketCounter({ value, min, max, onChange, disabled = false }: TicketCounterProps) {
  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  return (
    <div className={WRAPPER_CLASS}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={handleDecrement}
        disabled={disabled || value <= min}
        aria-label={DECREMENT_LABEL}
        className={BUTTON_CLASS}
      >
        <Minus className="h-5 w-5" />
      </Button>

      <div className={COUNT_WRAPPER_CLASS}>
        <span className={COUNT_TEXT_CLASS}>{value}</span>
        <span className={COUNT_SUFFIX_CLASS}>{COUNT_SUFFIX}</span>
      </div>

      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={handleIncrement}
        disabled={disabled || value >= max}
        aria-label={INCREMENT_LABEL}
        className={BUTTON_CLASS}
      >
        <Plus className="h-5 w-5" />
      </Button>
    </div>
  );
}
