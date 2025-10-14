export const APP_NAME = 'VMC Concert';
export const APP_TAGLINE = '비회원 실시간 콘서트 예매 서비스';

export const ROUTES = {
  home: '/',
  bookingLookup: '/lookup',
  concertDetail: (id: string) => `/concerts/${id}`,
  seatSelection: (concertId: string, count: number) => `/booking/seats?concertId=${concertId}&count=${count}`,
} as const;
