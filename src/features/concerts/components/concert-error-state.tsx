"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CONTAINER_CLASS = "flex flex-col items-center justify-center gap-4 rounded-xl border border-red-200 bg-red-50 px-6 py-16 text-center";
const ICON_CLASS = "h-12 w-12 text-red-500";
const TITLE_CLASS = "text-lg font-semibold text-red-900";
const DESCRIPTION_CLASS = "max-w-md text-sm text-red-700";
const BUTTON_VARIANT = "outline" as const;
const BUTTON_CLASS = "border-red-300 text-red-700 hover:bg-red-100";
const DEFAULT_TITLE = "콘서트 목록을 불러오지 못했어요.";
const DEFAULT_DESCRIPTION = "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
const RETRY_LABEL = "다시 시도";

export type ConcertErrorStateProps = {
  message?: string;
  onRetry: () => void;
  className?: string;
};

export function ConcertErrorState({ message = DEFAULT_DESCRIPTION, onRetry, className }: ConcertErrorStateProps) {
  return (
    <div className={cn(CONTAINER_CLASS, className)}>
      <AlertTriangle className={ICON_CLASS} aria-hidden />
      <div className="space-y-2">
        <h3 className={TITLE_CLASS}>{DEFAULT_TITLE}</h3>
        <p className={DESCRIPTION_CLASS}>{message}</p>
      </div>
      <Button type="button" variant={BUTTON_VARIANT} className={BUTTON_CLASS} onClick={onRetry}>
        <RotateCcw className="h-4 w-4" />
        {RETRY_LABEL}
      </Button>
    </div>
  );
}
