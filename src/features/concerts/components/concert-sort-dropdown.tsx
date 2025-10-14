"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CONCERT_SORT_OPTIONS } from "@/features/concerts/constants";

const CONTAINER_CLASS = "flex w-full flex-col gap-2";
const LABEL_CLASS = "text-sm font-medium text-slate-200";
const TRIGGER_CLASS = "w-full rounded-lg border border-slate-800 bg-slate-950/60 text-slate-100";
const PLACEHOLDER_LABEL = "정렬 기준";
const LABEL_TEXT = "정렬";

const SORT_LABELS: Record<(typeof CONCERT_SORT_OPTIONS)[keyof typeof CONCERT_SORT_OPTIONS], string> = {
  [CONCERT_SORT_OPTIONS.latest]: "최신순",
  [CONCERT_SORT_OPTIONS.deadline]: "마감 임박순",
  [CONCERT_SORT_OPTIONS.alphabetical]: "가나다순",
};

export type ConcertSortValue = (typeof CONCERT_SORT_OPTIONS)[keyof typeof CONCERT_SORT_OPTIONS];

export type ConcertSortDropdownProps = {
  value: ConcertSortValue;
  onChange: (value: ConcertSortValue) => void;
};

export function ConcertSortDropdown({ value, onChange }: ConcertSortDropdownProps) {
  return (
    <div className={CONTAINER_CLASS}>
      <span className={LABEL_CLASS}>{LABEL_TEXT}</span>
      <Select value={value} onValueChange={(next) => onChange(next as ConcertSortValue)}>
        <SelectTrigger className={TRIGGER_CLASS} aria-label={PLACEHOLDER_LABEL}>
          <SelectValue placeholder={PLACEHOLDER_LABEL} />
        </SelectTrigger>
        <SelectContent>
          {Object.values(CONCERT_SORT_OPTIONS).map((option) => (
            <SelectItem key={option} value={option}>
              {SORT_LABELS[option]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
