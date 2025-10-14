import { ROUTES } from '@/constants/app';
import { SESSION_TIMEOUT_MS } from '@/features/seats/constants';

const MINUTES_IN_MS = 60_000;
const FIVE_MINUTES = 5;
const SEAT_SELECTION_ROUTE = '/booking/seats';
const CURRENCY_UNIT = '원';
const PHONE_NUMBER_PATTERN = /^010-\d{4}-\d{4}$/;
const PASSWORD_PATTERN = /^\d{4}$/;
const ACCESS_TOKEN_PREFIX = 'booking_access_token';
const DEFAULT_CANCELLATION_WINDOW_HOURS = 24;
const STATUS_CONFIRMED_CLASS = 'text-emerald-400';
const STATUS_CANCELLED_CLASS = 'text-red-400';

export const BOOKING_FEATURE_KEY = 'bookings' as const;
export const BOOKING_API_PATH = '/bookings' as const;
export const BOOKING_CACHE_TIME_MS = FIVE_MINUTES * MINUTES_IN_MS;
export const BOOKING_SESSION_TIMEOUT_MS = SESSION_TIMEOUT_MS;

export const BOOKING_STATUS = {
  confirmed: 'confirmed',
  cancelled: 'cancelled',
} as const;

export const BOOKING_ERROR_CODES = {
  seatUnavailable: 'SEAT_UNAVAILABLE',
  sessionExpired: 'SESSION_EXPIRED',
  sessionMismatch: 'SESSION_MISMATCH',
} as const;

export const BOOKING_STATUS_LABELS = {
  [BOOKING_STATUS.confirmed]: '예매 확정',
  [BOOKING_STATUS.cancelled]: '예매 취소',
} as const;

export const BOOKING_STATUS_COLORS = {
  [BOOKING_STATUS.confirmed]: STATUS_CONFIRMED_CLASS,
  [BOOKING_STATUS.cancelled]: STATUS_CANCELLED_CLASS,
} as const;

export const BOOKING_SEAT_GRADE_LABELS = {
  vip: 'VIP석',
  r: 'R석',
  s: 'S석',
  a: 'A석',
} as const;

export const BOOKING_REDIRECT_ROUTES = {
  home: ROUTES.home,
  lookup: ROUTES.bookingLookup,
  seatSelection: SEAT_SELECTION_ROUTE,
} as const;

export const BOOKING_ERROR_REDIRECTS: Record<string, string> = {
  [BOOKING_ERROR_CODES.seatUnavailable]: BOOKING_REDIRECT_ROUTES.seatSelection,
  [BOOKING_ERROR_CODES.sessionExpired]: BOOKING_REDIRECT_ROUTES.seatSelection,
  [BOOKING_ERROR_CODES.sessionMismatch]: BOOKING_REDIRECT_ROUTES.seatSelection,
};

export const BOOKING_ERROR_FALLBACK_MESSAGE = '예매 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
export const BOOKING_TOTAL_LABEL = '총 결제 금액';
export const BOOKING_CURRENCY_SUFFIX = CURRENCY_UNIT;

export const BOOKING_SEAT_IDS_DELIMITER = ',';
export const BOOKING_MIN_SEAT_COUNT = 1;
export const BOOKING_MAX_SEAT_COUNT = 6;
export const BOOKING_PHONE_NUMBER_REGEX = PHONE_NUMBER_PATTERN;
export const BOOKING_PASSWORD_REGEX = PASSWORD_PATTERN;
export const BOOKING_PASSWORD_LENGTH = 4;
export const ACCESS_TOKEN_STORAGE_KEY = ACCESS_TOKEN_PREFIX;
export const BOOKING_CANCELLATION_WINDOW_HOURS = DEFAULT_CANCELLATION_WINDOW_HOURS;
