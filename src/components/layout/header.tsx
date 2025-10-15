"use client";

import Link from "next/link";
import { ArrowRight, Ticket } from "lucide-react";
import { APP_NAME, APP_TAGLINE, ROUTES } from "@/constants/app";

const HEADER_CONTAINER_CLASS = "sticky top-0 z-50 flex flex-col gap-4 border-b border-gray-200 bg-white/95 px-6 py-4 shadow-sm backdrop-blur-sm md:flex-row md:items-center md:justify-between";
const BRAND_CONTAINER_CLASS = "flex items-center gap-3";
const BRAND_TITLE_CLASS = "text-xl font-bold tracking-tight text-gray-900";
const BRAND_TAGLINE_CLASS = "hidden text-sm text-gray-600 md:block";
const ACTION_BUTTON_CLASS = "inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700";
const NAV_LINK_CLASS = "inline-flex items-center gap-2 text-sm font-medium text-gray-700 transition hover:text-gray-900";
const NAV_CONTAINER_CLASS = "flex flex-wrap items-center gap-4";
const HOME_LINK_LABEL = "홈";
const HOME_LINK_SR_LABEL = "홈으로 이동";
const LOOKUP_BUTTON_LABEL = "예약 조회";
const NAV_ARIA_LABEL = "주요 메뉴";

export function PrimaryHeader() {
  return (
    <header className={HEADER_CONTAINER_CLASS}>
      <div className={BRAND_CONTAINER_CLASS}>
        <Link href={ROUTES.home} className="flex items-center gap-2">
          <Ticket className="h-6 w-6 text-indigo-600" />
          <h1 className={BRAND_TITLE_CLASS}>{APP_NAME}</h1>
        </Link>
        <span className="hidden text-gray-300 md:block">|</span>
        <p className={BRAND_TAGLINE_CLASS}>{APP_TAGLINE}</p>
      </div>

      <nav className={NAV_CONTAINER_CLASS} aria-label={NAV_ARIA_LABEL}>
        <Link href={ROUTES.home} className={NAV_LINK_CLASS}>
          {HOME_LINK_LABEL}
        </Link>
        <Link href={ROUTES.bookingLookup} className={ACTION_BUTTON_CLASS}>
          {LOOKUP_BUTTON_LABEL}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </nav>
    </header>
  );
}
