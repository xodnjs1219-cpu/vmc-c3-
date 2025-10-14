export const APP_NAME = 'VMC Concert';
export const APP_TAGLINE = '비회원 실시간 콘서트 예매 서비스';

export const ROUTES = {
  home: '/',
  bookingLookup: '/lookup',
  concertDetail: (id: string) => `/concerts/${id}`,
  seatSelection: (concertId: string, count: number) =>
    `/booking/seats?concertId=${concertId}&numberOfTickets=${count}`,
  checkout: (concertId: string, sessionId: string) =>
    `/booking/checkout?concertId=${concertId}&sessionId=${sessionId}`,
} as const;
