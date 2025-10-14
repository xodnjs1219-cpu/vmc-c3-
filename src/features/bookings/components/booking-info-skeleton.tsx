"use client";

import { PrimaryHeader } from '@/components/layout/header';

const PAGE_CLASS = 'min-h-screen bg-slate-950';
const MAIN_CLASS = 'container mx-auto max-w-4xl px-4 py-8';
const CARD_CLASS = 'rounded-xl border border-slate-800 bg-slate-900/40 p-6';
const GRID_CLASS = 'grid gap-6 md:grid-cols-2';
const LINE_BASE_CLASS = 'h-4 w-full animate-pulse rounded bg-slate-800/60';
const SMALL_LINE_CLASS = 'h-3 w-32 animate-pulse rounded bg-slate-800/60';
const LARGE_LINE_CLASS = 'h-6 w-1/2 animate-pulse rounded bg-slate-800/60';

const renderLines = (count: number, className: string) =>
  Array.from({ length: count }, (_, index) => <div key={index} className={className} />);

export function BookingInfoSkeleton() {
  return (
    <div className={PAGE_CLASS}>
      <PrimaryHeader />
      <main className={MAIN_CLASS}>
        <div className="space-y-6">
          <div className={CARD_CLASS}>
            <div className="space-y-3">
              <div className="flex justify-between gap-4">
                <div className="space-y-2">
                  {renderLines(2, SMALL_LINE_CLASS)}
                </div>
                <div className="h-6 w-24 animate-pulse rounded-full bg-slate-800/60" />
              </div>
              {renderLines(1, LINE_BASE_CLASS)}
            </div>
          </div>

          <div className={GRID_CLASS}>
            <div className={CARD_CLASS}>
              <div className="space-y-3">
                {renderLines(1, LARGE_LINE_CLASS)}
                {renderLines(3, LINE_BASE_CLASS)}
              </div>
            </div>
            <div className={CARD_CLASS}>
              <div className="space-y-3">
                {renderLines(1, LARGE_LINE_CLASS)}
                {renderLines(3, LINE_BASE_CLASS)}
              </div>
            </div>
          </div>

          <div className={GRID_CLASS}>
            <div className={CARD_CLASS}>
              <div className="space-y-3">
                {renderLines(1, LARGE_LINE_CLASS)}
                {renderLines(2, LINE_BASE_CLASS)}
              </div>
            </div>
            <div className={CARD_CLASS}>
              <div className="space-y-3">
                {renderLines(1, LARGE_LINE_CLASS)}
                {renderLines(2, LINE_BASE_CLASS)}
              </div>
            </div>
          </div>

          <div className={CARD_CLASS}>
            <div className="flex flex-wrap gap-4">
              <div className="h-10 w-full animate-pulse rounded bg-slate-800/60 md:w-auto md:flex-1" />
              <div className="h-10 w-full animate-pulse rounded bg-slate-800/60 md:w-auto md:flex-1" />
              <div className="h-10 w-full animate-pulse rounded bg-slate-800/60 md:w-auto md:flex-1" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
