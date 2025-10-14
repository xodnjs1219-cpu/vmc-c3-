"use client";

import { FormEvent } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const FORM_CLASS = "flex w-full items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/80 p-4 shadow-sm";
const INPUT_WRAPPER_CLASS = "flex w-full items-center gap-3";
const SEARCH_ICON_CLASS = "h-5 w-5 text-emerald-300";
const SUBMIT_BUTTON_VARIANT = "outline" as const;
const SUBMIT_BUTTON_CLASS = "border-emerald-500/60 text-emerald-200 hover:border-emerald-400 hover:bg-emerald-500/10";
const SEARCH_PLACEHOLDER = "콘서트 제목, 설명 또는 공연장을 입력하세요";
const SEARCH_ARIA_LABEL = "콘서트 검색";
const SUBMIT_BUTTON_TEXT = "검색";

export type ConcertSearchBarProps = {
  value: string;
  onChange: (next: string) => void;
  onSubmit: () => void;
};

export function ConcertSearchBar({ value, onChange, onSubmit }: ConcertSearchBarProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form className={FORM_CLASS} onSubmit={handleSubmit} aria-label={SEARCH_ARIA_LABEL}>
      <div className={INPUT_WRAPPER_CLASS}>
        <Search className={SEARCH_ICON_CLASS} aria-hidden />
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={SEARCH_PLACEHOLDER}
        />
      </div>

      <Button type="submit" variant={SUBMIT_BUTTON_VARIANT} className={SUBMIT_BUTTON_CLASS}>
        {SUBMIT_BUTTON_TEXT}
      </Button>
    </form>
  );
}
