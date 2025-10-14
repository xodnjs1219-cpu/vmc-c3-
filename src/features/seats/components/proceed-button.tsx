'use client';

import { Button } from '@/components/ui/button';

const PROCEED_LABEL = '예약하기';
const PROCESSING_LABEL = '확인 중...';

export type ProceedButtonProps = {
  disabled: boolean;
  onClick: () => void;
  isProcessing: boolean;
};

export function ProceedButton({ disabled, onClick, isProcessing }: ProceedButtonProps) {
  return (
    <Button
      size="lg"
      className="w-full"
      onClick={onClick}
      disabled={disabled || isProcessing}
    >
      {isProcessing ? PROCESSING_LABEL : PROCEED_LABEL}
    </Button>
  );
}
