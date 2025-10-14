'use client';

import Image from 'next/image';
import { Calendar, MapPin } from 'lucide-react';
import { formatConcertPeriod } from '@/lib/utils/date';
import type { ConcertDetailResponse } from '@/features/concerts/lib/dto';

const PERIOD_ICON_CLASS = 'h-5 w-5 text-emerald-400';
const VENUE_ICON_CLASS = 'h-5 w-5 text-emerald-400';
const TITLE_CLASS = 'text-3xl font-bold text-white md:text-4xl';
const DESCRIPTION_CLASS = 'whitespace-pre-wrap leading-relaxed text-slate-300';
const INFO_ROW_CLASS = 'flex items-center gap-2 text-slate-300';
const SECTION_CLASS = 'space-y-6';
const IMAGE_WRAPPER_CLASS = 'relative aspect-[16/9] w-full overflow-hidden rounded-lg';
const IMAGE_CLASS = 'object-cover';

export type ConcertInfoSectionProps = {
  concert: ConcertDetailResponse;
};

export function ConcertInfoSection({ concert }: ConcertInfoSectionProps) {
  const dateRange = formatConcertPeriod(concert.startDate, concert.endDate);

  return (
    <section className={SECTION_CLASS}>
      <div className={IMAGE_WRAPPER_CLASS}>
        <Image
          src={concert.imageUrl}
          alt={concert.title}
          fill
          priority
          className={IMAGE_CLASS}
          sizes="(max-width: 1280px) 100vw, 1280px"
        />
      </div>

      <div className="space-y-4">
        <h1 className={TITLE_CLASS}>{concert.title}</h1>

        {concert.description && <p className={DESCRIPTION_CLASS}>{concert.description}</p>}

        <div className="flex flex-col gap-3">
          <div className={INFO_ROW_CLASS}>
            <Calendar className={PERIOD_ICON_CLASS} />
            <span>{dateRange}</span>
          </div>
          <div className={INFO_ROW_CLASS}>
            <MapPin className={VENUE_ICON_CLASS} />
            <span>{concert.venue}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
