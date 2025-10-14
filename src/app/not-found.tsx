'use client';

import Link from 'next/link';
import { PrimaryHeader } from '@/components/layout/header';
import { ROUTES } from '@/constants/app';

const TITLE = '페이지를 찾을 수 없습니다.';
const DESCRIPTION = '요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.';
const CTA_LABEL = '홈으로 돌아가기';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <PrimaryHeader />
      <main className="mx-auto flex max-w-4xl flex-col items-center justify-center gap-6 px-4 py-24 text-center">
        <h1 className="text-3xl font-bold">{TITLE}</h1>
        <p className="max-w-xl text-sm text-slate-300">{DESCRIPTION}</p>
        <Link
          href={ROUTES.home}
          className="rounded-lg border border-amber-400 px-6 py-2 text-sm font-semibold text-amber-300 transition hover:border-amber-300 hover:text-amber-200"
        >
          {CTA_LABEL}
        </Link>
      </main>
    </div>
  );
}
