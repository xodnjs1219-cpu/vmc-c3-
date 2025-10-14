"use client";

import { Frown } from "lucide-react";
import { cn } from "@/lib/utils";

const CONTAINER_CLASS = "flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-800 bg-slate-950/60 px-6 py-16 text-center";
const ICON_CLASS = "h-12 w-12 text-slate-500";
const TITLE_CLASS = "text-lg font-semibold text-slate-200";
const DESCRIPTION_CLASS = "max-w-md text-sm text-slate-400";
const DEFAULT_TITLE = "조건에 맞는 콘서트를 찾지 못했어요.";
const DEFAULT_DESCRIPTION = "검색어나 필터 조건을 변경해 다시 시도해보세요.";

export type ConcertEmptyStateProps = {
  title?: string;
  description?: string;
  className?: string;
};

export function ConcertEmptyState({ title = DEFAULT_TITLE, description = DEFAULT_DESCRIPTION, className }: ConcertEmptyStateProps) {
  return (
    <div className={cn(CONTAINER_CLASS, className)}>
      <Frown className={ICON_CLASS} aria-hidden />
      <div className="space-y-2">
        <h3 className={TITLE_CLASS}>{title}</h3>
        <p className={DESCRIPTION_CLASS}>{description}</p>
      </div>
    </div>
  );
}
