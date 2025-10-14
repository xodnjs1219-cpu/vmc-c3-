"use client";

import Link from "next/link";
import { ArrowRight, Ticket } from "lucide-react";
import { APP_NAME, APP_TAGLINE, ROUTES } from "@/constants/app";

const HEADER_CONTAINER_CLASS = "flex flex-col gap-4 border-b border-slate-800 bg-slate-950/80 px-6 py-6 md:flex-row md:items-center md:justify-between";
const BRAND_CONTAINER_CLASS = "flex flex-col gap-2";
const BRAND_TITLE_CLASS = "text-2xl font-semibold tracking-tight text-white";
const BRAND_TAGLINE_CLASS = "text-sm text-slate-300";
const ACTION_BUTTON_CLASS = "inline-flex items-center gap-2 rounded-md border border-emerald-500/60 px-4 py-2 text-sm font-medium text-emerald-200 transition hover:border-emerald-400 hover:bg-emerald-500/10";
const NAV_LINK_CLASS = "inline-flex items-center gap-2 text-sm font-medium text-slate-200 transition hover:text-white";
const NAV_CONTAINER_CLASS = "flex flex-wrap items-center gap-4";
const HOME_LINK_LABEL = "홈";
const HOME_LINK_SR_LABEL = "홈으로 이동";
const LOOKUP_BUTTON_LABEL = "예약 조회하기";
const NAV_ARIA_LABEL = "주요 메뉴";

export function PrimaryHeader() {
  return (
    <header className={HEADER_CONTAINER_CLASS}>
      <div className={BRAND_CONTAINER_CLASS}>
        <Link href={ROUTES.home} className={NAV_LINK_CLASS}>
          <Ticket className="h-5 w-5" />
          <span className="sr-only">{HOME_LINK_SR_LABEL}</span>
        </Link>
        <h1 className={BRAND_TITLE_CLASS}>{APP_NAME}</h1>
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
