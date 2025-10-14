export const CONCERT_FEATURE_KEY = 'concerts' as const;

export const CONCERT_CACHE_TIME_MS = 60_000;

export const CONCERT_DEFAULT_PAGE_SIZE = 20;

export const CONCERT_MAX_PAGE_SIZE = 100;

export const CONCERT_SORT_OPTIONS = {
  latest: 'latest',
  deadline: 'deadline',
  alphabetical: 'alphabetical',
} as const;

export const CONCERT_GENRE_OPTIONS = [
  { value: 'k-pop', label: 'K-POP' },
  { value: 'ballad', label: '발라드' },
  { value: 'rock', label: '록' },
  { value: 'hiphop', label: '힙합' },
  { value: 'indie', label: '인디' },
] as const;

export const CONCERT_REGION_OPTIONS = [
  { value: 'seoul', label: '서울' },
  { value: 'gyeonggi', label: '경기' },
  { value: 'incheon', label: '인천' },
  { value: 'busan', label: '부산' },
  { value: 'daegu', label: '대구' },
  { value: 'daejeon', label: '대전' },
] as const;

export const CONCERT_FILTER_RESET_VALUE = 'all' as const;

export const CONCERT_QUERY_PARAM_KEYS = {
  search: 'search',
  genre: 'genre',
  region: 'region',
  startDate: 'startDate',
  endDate: 'endDate',
  sort: 'sort',
  page: 'page',
  limit: 'limit',
} as const;

export const CONCERT_PLACEHOLDER_IMAGE_DIMENSIONS = {
  width: 800,
  height: 450,
} as const;

export const SEAT_GRADES = {
  vip: 'vip',
  r: 'r',
  s: 's',
  a: 'a',
} as const;

export const SEAT_GRADE_LABELS: Record<string, string> = {
  [SEAT_GRADES.vip]: 'VIP',
  [SEAT_GRADES.r]: 'R석',
  [SEAT_GRADES.s]: 'S석',
  [SEAT_GRADES.a]: 'A석',
};

export const SEAT_AVAILABILITY_POLLING_INTERVAL = 10_000;

export const MIN_TICKET_COUNT = 1;

export const DEFAULT_MAX_TICKETS_PER_BOOKING = 6;

export const CONCERT_DETAIL_QUERY_KEY = 'concert-detail';

export const CONCERT_SEAT_AVAILABILITY_QUERY_KEY = 'concert-seat-availability';
