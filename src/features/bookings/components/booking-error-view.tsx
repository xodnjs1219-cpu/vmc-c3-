"use client";

import { useMemo } from 'react';
import { XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  BOOKING_ERROR_REDIRECTS,
  BOOKING_REDIRECT_ROUTES,
} from '@/features/bookings/constants';

const ERROR_TITLE = '예약 처리에 실패했습니다';
const GUIDE_TITLE = '다음 사항을 확인해 주세요';
const GUIDE_ITEMS = [
  '선택하신 좌석이 여전히 예매 가능한지 확인하세요.',
  '네트워크 연결 상태를 확인하세요.',
  '잠시 후 다시 시도해 주세요.',
] as const;
const RETRY_BUTTON_LABEL = '다시 시도';
const NAV_SEAT_BUTTON_LABEL = '좌석 선택으로';
const NAV_HOME_BUTTON_LABEL = '홈으로 돌아가기';

const resolveRedirectPath = (errorCode?: string) => {
  if (!errorCode) {
    return BOOKING_REDIRECT_ROUTES.home;
  }

  return BOOKING_ERROR_REDIRECTS[errorCode] ?? BOOKING_REDIRECT_ROUTES.home;
};

type BookingErrorViewProps = {
  errorMessage: string;
  errorCode?: string;
  onRetry?: () => void;
};

export function BookingErrorView({ errorMessage, errorCode, onRetry }: BookingErrorViewProps) {
  const router = useRouter();
  const redirectPath = useMemo(
    () => resolveRedirectPath(errorCode),
    [errorCode],
  );

  const isSeatRedirect = redirectPath === BOOKING_REDIRECT_ROUTES.seatSelection;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <XCircle className="h-16 w-16 text-red-500" />
        <h1 className="text-2xl font-bold text-white">{ERROR_TITLE}</h1>
        <p className="text-sm text-slate-300">{errorMessage}</p>
      </div>

      <Card className="border-red-800 bg-red-900/20">
        <CardContent className="pt-6">
          <div className="space-y-2 text-sm text-slate-300">
            <p>{GUIDE_TITLE}:</p>
            <ul className="list-inside list-disc space-y-1 pl-2">
              {GUIDE_ITEMS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row">
        {onRetry ? (
          <Button
            variant="outline"
            className="flex-1 border-slate-600 bg-slate-800 text-white hover:bg-slate-700"
            onClick={onRetry}
          >
            {RETRY_BUTTON_LABEL}
          </Button>
        ) : null}
        <Button
          className="flex-1 bg-amber-500 text-slate-950 hover:bg-amber-600"
          onClick={() => router.push(redirectPath)}
        >
          {isSeatRedirect ? NAV_SEAT_BUTTON_LABEL : NAV_HOME_BUTTON_LABEL}
        </Button>
      </div>
    </div>
  );
}
