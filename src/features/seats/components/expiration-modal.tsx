'use client';

import { Button } from '@/components/ui/button';

const TITLE = '선택 시간이 만료되었습니다.';
const DESCRIPTION = '현재 선택한 좌석이 모두 해제되었습니다. 다시 좌석을 선택해주세요.';
const RESET_BUTTON_LABEL = '다시 선택하기';

export type ExpirationModalProps = {
  isOpen: boolean;
  onReset: () => void;
};

export function ExpirationModal({ isOpen, onReset }: ExpirationModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur"
    >
      <div className="w-full max-w-md space-y-4 rounded-lg border border-slate-800 bg-slate-900 p-6 text-center shadow-2xl shadow-amber-500/10">
        <h3 className="text-xl font-semibold text-white">{TITLE}</h3>
        <p className="text-sm text-slate-300">{DESCRIPTION}</p>
        <Button size="lg" className="w-full" onClick={onReset}>
          {RESET_BUTTON_LABEL}
        </Button>
      </div>
    </div>
  );
}
