'use client';

export function SeatSelectionSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-4 rounded-lg border border-slate-800 bg-slate-900/40 p-6">
        <div className="h-6 w-40 animate-pulse rounded bg-slate-800" />
        <div className="grid gap-3">
          {Array.from({ length: 6 }).map((_, rowIndex) => (
            <div
              key={`skeleton-row-${rowIndex}`}
              className="flex items-center gap-3"
            >
              <div className="h-4 w-20 animate-pulse rounded bg-slate-800" />
              <div className="flex flex-1 flex-wrap gap-2">
                {Array.from({ length: 12 }).map((__, seatIndex) => (
                  <div
                    key={`skeleton-seat-${rowIndex}-${seatIndex}`}
                    className="h-8 w-8 animate-pulse rounded bg-slate-800"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4 rounded-lg border border-slate-800 bg-slate-900/40 p-6">
        <div className="h-6 w-32 animate-pulse rounded bg-slate-800" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`skeleton-selection-${index}`}
              className="h-10 animate-pulse rounded bg-slate-800"
            />
          ))}
        </div>
        <div className="h-12 w-full animate-pulse rounded bg-slate-800" />
      </div>
    </div>
  );
}
