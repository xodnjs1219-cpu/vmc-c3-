"use client";

import { Loader2 } from 'lucide-react';

const LOADING_TITLE = '예약을 처리하고 있습니다';
const LOADING_DESCRIPTION = '잠시만 기다려주세요. 좌석을 확정하고 예약번호를 발급하는 중입니다.';
const LOADING_NOTICE = '이 창을 닫지 마세요.';

export function BookingLoadingView() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 py-16 text-center">
      <Loader2 className="h-16 w-16 animate-spin text-amber-500" />
      <h1 className="text-2xl font-bold text-white">{LOADING_TITLE}</h1>
      <p className="text-sm text-slate-300">{LOADING_DESCRIPTION}</p>
      <p className="text-xs text-slate-400">{LOADING_NOTICE}</p>
    </div>
  );
}
