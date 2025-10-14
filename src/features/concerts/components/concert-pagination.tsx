"use client";

import { Button } from "@/components/ui/button";
import type { ConcertPagination } from "@/features/concerts/lib/dto";
import { cn } from "@/lib/utils";

const CONTAINER_CLASS = "flex flex-col gap-3 border-t border-slate-800 pt-6";
const CONTROL_WRAPPER_CLASS = "flex items-center justify-between";
const SUMMARY_CLASS = "text-sm text-slate-300";
const BUTTON_VARIANT = "outline" as const;
const BUTTON_CLASS = "border-slate-700 text-slate-200 hover:border-emerald-400 hover:bg-emerald-500/10";
const PREV_LABEL = "이전 페이지";
const NEXT_LABEL = "다음 페이지";
const PAGE_SUMMARY_TEMPLATE = (current: number, total: number) => `페이지 ${current} / ${total}`;

export type ConcertPaginationProps = {
  pagination: ConcertPagination;
  onChange: (nextPage: number) => void;
  className?: string;
};

export function ConcertPagination({ pagination, onChange, className }: ConcertPaginationProps) {
  const { currentPage, totalPages, totalItems, itemsPerPage } = pagination;
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;
  const firstItemIndex = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const lastItemIndex = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className={cn(CONTAINER_CLASS, className)}>
      <div className={CONTROL_WRAPPER_CLASS}>
        <Button
          type="button"
          variant={BUTTON_VARIANT}
          className={BUTTON_CLASS}
          onClick={() => onChange(currentPage - 1)}
          disabled={!hasPrev}
        >
          {PREV_LABEL}
        </Button>
        <span className={SUMMARY_CLASS}>{PAGE_SUMMARY_TEMPLATE(currentPage, Math.max(totalPages, 1))}</span>
        <Button
          type="button"
          variant={BUTTON_VARIANT}
          className={BUTTON_CLASS}
          onClick={() => onChange(currentPage + 1)}
          disabled={!hasNext}
        >
          {NEXT_LABEL}
        </Button>
      </div>
      <span className={SUMMARY_CLASS}>
        총 {totalItems.toLocaleString()}개 중 {firstItemIndex.toLocaleString()}–{lastItemIndex.toLocaleString()} 표시
      </span>
    </div>
  );
}
