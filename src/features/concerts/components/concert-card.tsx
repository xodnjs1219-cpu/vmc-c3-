"use client";

import Image from "next/image";
import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { ROUTES } from "@/constants/app";
import { formatConcertPeriod } from "@/lib/utils/date";
import { cn } from "@/lib/utils";
import type { ConcertResponse } from "@/features/concerts/lib/dto";

const CARD_CONTAINER_CLASS = "group flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-lg";
const IMAGE_WRAPPER_CLASS = "relative h-56 w-full overflow-hidden";
const IMAGE_CLASS = "object-cover transition duration-300 group-hover:scale-105";
const HEADER_CLASS = "flex flex-col gap-2 p-4";
const TITLE_CLASS = "line-clamp-2 text-lg font-bold text-gray-900";
const DESCRIPTION_CLASS = "line-clamp-2 text-sm text-gray-600";
const CONTENT_CLASS = "flex flex-col gap-2 px-4 pb-4";
const META_ROW_CLASS = "flex items-center gap-2 text-sm text-gray-600";
const ICON_CLASS = "h-4 w-4 text-indigo-600";
const FOOTER_CLASS = "mt-auto border-t border-gray-100 bg-gray-50 px-4 py-3";
const LINK_CLASS = "inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 transition hover:text-indigo-700";
const LINK_LABEL = "자세히 보기";

export type ConcertCardProps = {
  concert: ConcertResponse;
  className?: string;
};

export function ConcertCard({ concert, className }: ConcertCardProps) {
  const periodLabel = formatConcertPeriod(concert.startDate, concert.endDate);

  return (
    <Card className={cn(CARD_CONTAINER_CLASS, className)}>
      <div className={IMAGE_WRAPPER_CLASS}>
        <Image
          src={concert.imageUrl}
          alt={`${concert.title} 대표 이미지`}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          className={IMAGE_CLASS}
          priority={false}
        />
      </div>
      <CardHeader className={HEADER_CLASS}>
        <h3 className={TITLE_CLASS}>{concert.title}</h3>
        {concert.description ? (
          <p className={DESCRIPTION_CLASS}>{concert.description}</p>
        ) : null}
      </CardHeader>
      <CardContent className={CONTENT_CLASS}>
        <div className={META_ROW_CLASS}>
          <CalendarDays className={ICON_CLASS} aria-hidden />
          <span>{periodLabel}</span>
        </div>
        <div className={META_ROW_CLASS}>
          <MapPin className={ICON_CLASS} aria-hidden />
          <span>{concert.venue}</span>
        </div>
      </CardContent>
      <CardFooter className={FOOTER_CLASS}>
        <Link href={ROUTES.concertDetail(concert.id)} className={LINK_CLASS}>
          {LINK_LABEL}
        </Link>
      </CardFooter>
    </Card>
  );
}
