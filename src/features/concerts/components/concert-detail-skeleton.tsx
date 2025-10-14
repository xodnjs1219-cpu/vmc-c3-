'use client';

import { PrimaryHeader } from '@/components/layout/header';

const PAGE_CLASS = 'min-h-screen bg-slate-950';
const MAIN_CLASS = 'container mx-auto max-w-5xl space-y-10 px-4 py-10';
const SECTION_CLASS = 'space-y-6';
const CARD_CLASS = 'rounded-lg border border-slate-800 bg-slate-900/40 p-6';
const PULSE_BLOCK = 'h-full w-full animate-pulse rounded-lg bg-slate-800/60';
const SMALL_PULSE = 'h-5 w-full animate-pulse rounded bg-slate-800/60';
const MEDIUM_PULSE = 'h-10 w-3/4 animate-pulse rounded bg-slate-800/60';
const LARGE_PULSE = 'h-48 w-full animate-pulse rounded-lg bg-slate-800/60';
const GRID_CLASS = 'grid gap-4 md:grid-cols-2';
const CTA_PULSE = 'h-24 w-full animate-pulse rounded-lg bg-slate-800/60';

export function ConcertDetailSkeleton() {
  return (
    <div className={PAGE_CLASS}>
      <PrimaryHeader />
      <main className={MAIN_CLASS}>
        <section className={SECTION_CLASS}>
          <div className="aspect-[16/9] w-full overflow-hidden rounded-lg">
            <div className={LARGE_PULSE} />
          </div>
          <div className="space-y-4">
            <div className={MEDIUM_PULSE} />
            <div className="space-y-2">
              <div className={SMALL_PULSE} />
              <div className={SMALL_PULSE} />
              <div className={SMALL_PULSE} />
            </div>
          </div>
        </section>

        <section className={CARD_CLASS}>
          <div className="space-y-3">
            <div className={SMALL_PULSE} />
            <div className={GRID_CLASS}>
              <div className={`${PULSE_BLOCK} h-16`} />
              <div className={`${PULSE_BLOCK} h-16`} />
            </div>
          </div>
        </section>

        <section className={CARD_CLASS}>
          <div className="space-y-4">
            <div className={SMALL_PULSE} />
            <div className={CTA_PULSE} />
          </div>
        </section>
      </main>
    </div>
  );
}
