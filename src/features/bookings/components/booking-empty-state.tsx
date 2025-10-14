"use client";

import { SearchX } from 'lucide-react';

const EMPTY_STATE_CONTAINER_CLASS = 'flex flex-col items-center justify-center rounded-lg border border-slate-800 bg-slate-900/40 px-6 py-16 text-center';
const EMPTY_STATE_ICON_CLASS = 'mb-4 h-12 w-12 text-slate-600';
const EMPTY_STATE_MESSAGE_CLASS = 'text-base font-medium text-slate-300';
const EMPTY_STATE_HINT_CLASS = 'mt-2 text-sm text-slate-500';
const EMPTY_STATE_HINT = '입력하신 정보를 다시 확인해주세요.';

export type BookingEmptyStateProps = {
  message: string;
};

export function BookingEmptyState({ message }: BookingEmptyStateProps) {
  return (
    <div className={EMPTY_STATE_CONTAINER_CLASS}>
      <SearchX className={EMPTY_STATE_ICON_CLASS} aria-hidden="true" />
      <p className={EMPTY_STATE_MESSAGE_CLASS}>{message}</p>
      <p className={EMPTY_STATE_HINT_CLASS}>{EMPTY_STATE_HINT}</p>
    </div>
  );
}
