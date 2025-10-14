import { SEAT_STATUS, SESSION_TIMEOUT_SECONDS } from '@/features/seats/constants';
import type { Seat, SeatStatusItem } from '@/features/seats/lib/dto';

export type SeatSelectionState = {
  concertId: string;
  numberOfTickets: number;
  sessionId: string;
  sessionExpiresAt: string | null;
  selectedSeats: Seat[];
  isReserving: boolean;
  isReleasing: boolean;
  isValidating: boolean;
  isTimerActive: boolean;
  timerStartedAt: string | null;
  remainingSeconds: number;
  error: string | null;
};

export const createInitialSeatSelectionState = (): SeatSelectionState => ({
  concertId: '',
  numberOfTickets: 0,
  sessionId: '',
  sessionExpiresAt: null,
  selectedSeats: [],
  isReserving: false,
  isReleasing: false,
  isValidating: false,
  isTimerActive: false,
  timerStartedAt: null,
  remainingSeconds: SESSION_TIMEOUT_SECONDS,
  error: null,
});

export type SeatSelectionAction =
  | { type: 'INITIALIZE_CONTEXT'; payload: { concertId: string; numberOfTickets: number; sessionId: string } }
  | { type: 'HYDRATE_SELECTION'; payload: { selectedSeats: Seat[]; remainingSeconds: number; sessionExpiresAt: string | null } }
  | { type: 'SEAT_SELECTED'; payload: { seat: Seat; sessionExpiresAt?: string | null } }
  | { type: 'SEAT_RELEASED'; payload: { seatId: string } }
  | { type: 'SEATS_SYNCHRONIZED'; payload: { statuses: SeatStatusItem[] } }
  | { type: 'SET_RESERVING'; payload: boolean }
  | { type: 'SET_RELEASING'; payload: boolean }
  | { type: 'SET_VALIDATING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'TIMER_TICK' }
  | { type: 'TIMER_RESET'; payload: { remainingSeconds: number } }
  | { type: 'TIMER_STOP' }
  | { type: 'TIMER_EXPIRED' }
  | { type: 'SET_SESSION_EXPIRATION'; payload: { expiresAt: string | null } }
  | { type: 'RESET_STATE' };

const uniqueSeats = (seats: Seat[]) => {
  const seen = new Set<string>();
  return seats.filter((seat) => {
    if (seen.has(seat.id)) {
      return false;
    }

    seen.add(seat.id);
    return true;
  });
};

export const seatSelectionReducer = (
  state: SeatSelectionState,
  action: SeatSelectionAction,
): SeatSelectionState => {
  switch (action.type) {
    case 'INITIALIZE_CONTEXT': {
      return {
        ...state,
        concertId: action.payload.concertId,
        numberOfTickets: action.payload.numberOfTickets,
        sessionId: action.payload.sessionId,
        sessionExpiresAt: null,
        selectedSeats: [],
        isTimerActive: false,
        timerStartedAt: null,
        remainingSeconds: SESSION_TIMEOUT_SECONDS,
        error: null,
      };
    }

    case 'HYDRATE_SELECTION': {
      const safeRemaining = Math.max(0, action.payload.remainingSeconds);
      return {
        ...state,
        selectedSeats: uniqueSeats(action.payload.selectedSeats),
        isTimerActive: action.payload.selectedSeats.length > 0 && safeRemaining > 0,
        timerStartedAt: action.payload.selectedSeats.length > 0 ? new Date().toISOString() : null,
        remainingSeconds: safeRemaining,
        sessionExpiresAt: action.payload.sessionExpiresAt,
      };
    }

    case 'SEAT_SELECTED': {
      const nextSeats = uniqueSeats([...state.selectedSeats, action.payload.seat]);
      return {
        ...state,
        selectedSeats: nextSeats,
        isTimerActive: true,
        timerStartedAt: state.timerStartedAt ?? new Date().toISOString(),
        sessionExpiresAt: action.payload.sessionExpiresAt ?? state.sessionExpiresAt,
      };
    }

    case 'SEAT_RELEASED': {
      const nextSeats = state.selectedSeats.filter((seat) => seat.id !== action.payload.seatId);
      const hasSeats = nextSeats.length > 0;
      return {
        ...state,
        selectedSeats: nextSeats,
        isTimerActive: hasSeats && state.remainingSeconds > 0,
        timerStartedAt: hasSeats ? state.timerStartedAt : null,
        sessionExpiresAt: hasSeats ? state.sessionExpiresAt : null,
        remainingSeconds: hasSeats ? state.remainingSeconds : SESSION_TIMEOUT_SECONDS,
      };
    }

    case 'SEATS_SYNCHRONIZED': {
      if (state.selectedSeats.length === 0) {
        return state;
      }

      const allowedSeatIds = new Set(
        action.payload.statuses
          .filter((status) => status.status === SEAT_STATUS.reserved && status.sessionId === state.sessionId)
          .map((status) => status.id),
      );

      const nextSeats = state.selectedSeats.filter((seat) => allowedSeatIds.has(seat.id));
      const hasSeats = nextSeats.length > 0;

      return {
        ...state,
        selectedSeats: nextSeats,
        isTimerActive: hasSeats && state.remainingSeconds > 0,
        timerStartedAt: hasSeats ? state.timerStartedAt : null,
        sessionExpiresAt: hasSeats ? state.sessionExpiresAt : null,
        remainingSeconds: hasSeats ? state.remainingSeconds : SESSION_TIMEOUT_SECONDS,
      };
    }

    case 'SET_RESERVING':
      return { ...state, isReserving: action.payload };

    case 'SET_RELEASING':
      return { ...state, isReleasing: action.payload };

    case 'SET_VALIDATING':
      return { ...state, isValidating: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'TIMER_TICK': {
      const nextRemaining = Math.max(0, state.remainingSeconds - 1);
      return {
        ...state,
        remainingSeconds: nextRemaining,
        isTimerActive: nextRemaining > 0 && state.selectedSeats.length > 0,
      };
    }

    case 'TIMER_RESET':
      return {
        ...state,
        remainingSeconds: Math.max(0, action.payload.remainingSeconds),
        isTimerActive: state.selectedSeats.length > 0 && action.payload.remainingSeconds > 0,
        timerStartedAt: state.selectedSeats.length > 0 ? state.timerStartedAt ?? new Date().toISOString() : null,
      };

    case 'TIMER_STOP':
      return {
        ...state,
        isTimerActive: false,
      };

    case 'TIMER_EXPIRED':
      return {
        ...state,
        isTimerActive: false,
        remainingSeconds: 0,
        selectedSeats: [],
        sessionExpiresAt: null,
        timerStartedAt: null,
      };

    case 'SET_SESSION_EXPIRATION':
      return {
        ...state,
        sessionExpiresAt: action.payload.expiresAt,
      };

    case 'RESET_STATE':
      return createInitialSeatSelectionState();

    default:
      return state;
  }
};
