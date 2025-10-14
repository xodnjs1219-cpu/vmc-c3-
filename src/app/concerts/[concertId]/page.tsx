'use client';

import { use } from 'react';
import { ConcertDetailContainer } from '@/features/concerts/components/concert-detail-container';

const INVALID_PARAM_MESSAGE = '콘서트 식별자가 필요합니다.';

type PageParams = {
  concertId?: string;
};

type ConcertDetailPageProps = {
  params: Promise<PageParams>;
};

export default function ConcertDetailPage({ params }: ConcertDetailPageProps) {
  const resolvedParams = use(params);
  const concertId = resolvedParams.concertId;

  if (!concertId) {
    throw new Error(INVALID_PARAM_MESSAGE);
  }

  return <ConcertDetailContainer concertId={concertId} />;
}
