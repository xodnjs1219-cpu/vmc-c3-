"use client";

import { PrimaryHeader } from "@/components/layout/header";
import { ConcertListContainer } from "@/features/concerts/components/concert-list-container";

const PAGE_CLASS = "min-h-screen bg-gray-50";
const INNER_WRAPPER_CLASS = "flex min-h-screen flex-col";

export default function HomePage() {
  return (
    <main className={PAGE_CLASS}>
      <div className={INNER_WRAPPER_CLASS}>
        <PrimaryHeader />
        <ConcertListContainer />
      </div>
    </main>
  );
}
