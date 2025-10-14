export const SEATS_FEATURE_KEY = 'seats' as const;

export const SEAT_STATUS = {
  available: 'available',
  reserved: 'reserved',
  booked: 'booked',
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

export const SEAT_GRADE_COLORS: Record<string, string> = {
  [SEAT_GRADES.vip]: '#FFD700',
  [SEAT_GRADES.r]: '#FF6B6B',
  [SEAT_GRADES.s]: '#4ECDC4',
  [SEAT_GRADES.a]: '#95E1D3',
};

export const SEAT_POLLING_INTERVAL_MS = 5_000;

export const SESSION_TIMEOUT_MINUTES = 10;

export const SESSION_TIMEOUT_MS = SESSION_TIMEOUT_MINUTES * 60_000;

export const SESSION_TIMEOUT_SECONDS = SESSION_TIMEOUT_MS / 1_000;

export const TIMER_TICK_INTERVAL_MS = 1_000;

export const SEAT_SELECTION_SESSION_STORAGE_KEY = 'vmc-seat-selection';

export const SEAT_SELECTION_QUERY_KEYS = {
  seats: 'seat-layout',
  status: 'seat-status',
} as const;

export const SEAT_TIMER_WARNING_THRESHOLD_SECONDS = 180;

export const SEAT_TIMER_DANGER_THRESHOLD_SECONDS = 60;

export const SEAT_SELECTION_LAYOUT_CONFIG = {
  maxGridColumns: 30,
  buttonSize: '2.25rem',
} as const;
