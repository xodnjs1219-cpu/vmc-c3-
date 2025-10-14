"use client";

const GRID_CLASS = "grid gap-6 sm:grid-cols-2 xl:grid-cols-3";
const CARD_CLASS = "h-72 w-full rounded-2xl border border-slate-800 bg-slate-950/60";
const IMAGE_SKELETON_CLASS = "h-40 w-full animate-pulse rounded-t-2xl bg-slate-800";
const CONTENT_SKELETON_CLASS = "space-y-3 p-5";
const LINE_CLASS = "h-4 w-full animate-pulse rounded bg-slate-800";

export function ConcertListSkeleton() {
  return (
    <div className={GRID_CLASS}>
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className={CARD_CLASS}>
          <div className={IMAGE_SKELETON_CLASS} />
          <div className={CONTENT_SKELETON_CLASS}>
            <div className={LINE_CLASS} />
            <div className={`${LINE_CLASS} w-3/4`} />
            <div className={`${LINE_CLASS} w-1/2`} />
          </div>
        </div>
      ))}
    </div>
  );
}
