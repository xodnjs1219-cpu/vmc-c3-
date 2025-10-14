"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CONCERT_FILTER_RESET_VALUE,
  CONCERT_GENRE_OPTIONS,
  CONCERT_REGION_OPTIONS,
} from "@/features/concerts/constants";
import { toDateInputValue, toIsoFromDateInput } from "@/lib/utils/date";

const PANEL_CLASS = "grid gap-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-5 md:grid-cols-4";
const FIELD_CLASS = "flex flex-col gap-2";
const LABEL_CLASS = "text-sm font-medium text-slate-200";
const SELECT_TRIGGER_CLASS = "w-full rounded-lg border border-slate-800 bg-slate-950/60 text-slate-100";
const DATE_INPUT_CLASS = "rounded-lg border border-slate-800 bg-slate-950/60 text-slate-100";
const RESET_BUTTON_VARIANT = "ghost" as const;
const RESET_BUTTON_CLASS = "justify-self-end self-end rounded-lg border border-slate-800/60 bg-slate-900/40 px-3 text-sm text-slate-300 transition hover:border-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-200";
const GENRE_LABEL = "장르";
const REGION_LABEL = "지역";
const START_DATE_LABEL = "시작일";
const END_DATE_LABEL = "종료일";
const GENRE_PLACEHOLDER = "장르 선택";
const REGION_PLACEHOLDER = "지역 선택";
const RESET_LABEL = "필터 초기화";

export type ConcertFilterValues = {
  genre?: string;
  region?: string;
  startDate?: string;
  endDate?: string;
};

export type ConcertFilterPanelProps = {
  filters: ConcertFilterValues;
  onChange: (next: ConcertFilterValues) => void;
};

export function ConcertFilterPanel({ filters, onChange }: ConcertFilterPanelProps) {
  const handleGenreChange = (value: string) => {
    onChange({
      ...filters,
      genre: value === CONCERT_FILTER_RESET_VALUE ? undefined : value,
    });
  };

  const handleRegionChange = (value: string) => {
    onChange({
      ...filters,
      region: value === CONCERT_FILTER_RESET_VALUE ? undefined : value,
    });
  };

  const handleStartDateChange = (value: string) => {
    onChange({
      ...filters,
      startDate: toIsoFromDateInput(value),
    });
  };

  const handleEndDateChange = (value: string) => {
    onChange({
      ...filters,
      endDate: toIsoFromDateInput(value),
    });
  };

  const handleReset = () => {
    onChange({});
  };

  return (
    <div className={PANEL_CLASS}>
      <div className={FIELD_CLASS}>
        <span className={LABEL_CLASS}>{GENRE_LABEL}</span>
        <Select value={filters.genre ?? CONCERT_FILTER_RESET_VALUE} onValueChange={handleGenreChange}>
          <SelectTrigger className={SELECT_TRIGGER_CLASS} aria-label={GENRE_PLACEHOLDER}>
            <SelectValue placeholder={GENRE_PLACEHOLDER} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={CONCERT_FILTER_RESET_VALUE}>{GENRE_PLACEHOLDER}</SelectItem>
            {CONCERT_GENRE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className={FIELD_CLASS}>
        <span className={LABEL_CLASS}>{REGION_LABEL}</span>
        <Select value={filters.region ?? CONCERT_FILTER_RESET_VALUE} onValueChange={handleRegionChange}>
          <SelectTrigger className={SELECT_TRIGGER_CLASS} aria-label={REGION_PLACEHOLDER}>
            <SelectValue placeholder={REGION_PLACEHOLDER} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={CONCERT_FILTER_RESET_VALUE}>{REGION_PLACEHOLDER}</SelectItem>
            {CONCERT_REGION_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className={FIELD_CLASS}>
        <span className={LABEL_CLASS}>{START_DATE_LABEL}</span>
        <Input
          type="date"
          className={DATE_INPUT_CLASS}
          value={toDateInputValue(filters.startDate)}
          onChange={(event) => handleStartDateChange(event.target.value)}
        />
      </div>

      <div className={FIELD_CLASS}>
        <span className={LABEL_CLASS}>{END_DATE_LABEL}</span>
        <Input
          type="date"
          className={DATE_INPUT_CLASS}
          value={toDateInputValue(filters.endDate)}
          onChange={(event) => handleEndDateChange(event.target.value)}
        />
      </div>

      <Button type="button" variant={RESET_BUTTON_VARIANT} className={RESET_BUTTON_CLASS} onClick={handleReset}>
        {RESET_LABEL}
      </Button>
    </div>
  );
}
