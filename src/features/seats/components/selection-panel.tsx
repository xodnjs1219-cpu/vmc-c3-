'use client';

import type { Seat } from '@/features/seats/lib/dto';
import type { TimerVariant } from '@/features/seats/context/seat-selection-context';
import { Timer } from '@/features/seats/components/timer';
import { SelectedSeatList } from '@/features/seats/components/selected-seat-list';
import { ProceedButton } from '@/features/seats/components/proceed-button';

const currencyFormatter = new Intl.NumberFormat('ko-KR', {
  style: 'currency',
  currency: 'KRW',
});

const PANEL_TITLE = '선택 정보';
const REMAINING_LABEL = '남은 선택 석 수';
const TOTAL_LABEL = '총 결제 금액';
const COMPLETE_MESSAGE = '모든 좌석을 선택했습니다.';

export type SelectionPanelProps = {
  selectedSeats: Seat[];
  remainingSeatCount: number;
  totalAmount: number;
  formattedTime: string;
  timerVariant: TimerVariant;
  isExpired: boolean;
  isReserving: boolean;
  isReleasing: boolean;
  isValidating: boolean;
  canProceed: boolean;
  onSeatRemove: (seatId: string) => void;
  onProceed: () => void;
};

export function SelectionPanel({
  selectedSeats,
  remainingSeatCount,
  totalAmount,
  formattedTime,
  timerVariant,
  isExpired,
  isReserving,
  isReleasing,
  isValidating,
  canProceed,
  onSeatRemove,
  onProceed,
}: SelectionPanelProps) {
  const remainingMessage = remainingSeatCount > 0 ? `${remainingSeatCount}석을 더 선택해주세요.` : COMPLETE_MESSAGE;
  const isProcessing = isReserving || isReleasing || isValidating;

  return (
    <aside className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">{PANEL_TITLE}</h2>

      <Timer formattedTime={formattedTime} variant={timerVariant} isExpired={isExpired} />

      <div className="space-y-1 text-sm">
        <p className="font-medium text-gray-900">{REMAINING_LABEL}</p>
        <p className="text-gray-600">{remainingMessage}</p>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-900">선택한 좌석</p>
        <SelectedSeatList seats={selectedSeats} onRemove={onSeatRemove} isRemoving={isReleasing} />
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm font-medium text-gray-600">{TOTAL_LABEL}</p>
        <p className="mt-2 text-2xl font-bold text-gray-900">{currencyFormatter.format(totalAmount)}</p>
      </div>

      <ProceedButton
        disabled={!canProceed || isExpired}
        isProcessing={isProcessing}
        onClick={onProceed}
      />
    </aside>
  );
}
