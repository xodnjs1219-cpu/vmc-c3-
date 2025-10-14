'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { useInterval } from 'react-use';
import { ROUTES } from '@/constants/app';
import {
  SEAT_TIMER_DANGER_THRESHOLD_SECONDS,
  SEAT_TIMER_WARNING_THRESHOLD_SECONDS,
  TIMER_TICK_INTERVAL_MS,
} from '@/features/seats/constants';
import {
  createInitialSeatSelectionState,
  seatSelectionReducer,
  type SeatSelectionState,
} from '@/features/seats/lib/reducer';
import type { Seat } from '@/features/seats/lib/dto';
import {
  calculateRemainingSeconds,
  canReleaseSeat,
  canSelectSeat,
  isSessionExpired,
} from '@/features/seats/lib/validation';
import {
  clearSelectionFromSession,
  loadSelectionFromSession,
  saveSelectionToSession,
} from '@/features/seats/lib/session-storage';
import { useSeatsQuery } from '@/features/seats/hooks/useSeatsQuery';
import { useSeatStatusQuery } from '@/features/seats/hooks/useSeatStatusQuery';
import { useReserveSeatMutation } from '@/features/seats/hooks/useReserveSeatMutation';
import { useReleaseSeatMutation } from '@/features/seats/hooks/useReleaseSeatMutation';
import { useValidateSelectionMutation } from '@/features/seats/hooks/useValidateSelectionMutation';
import { useToast } from '@/hooks/use-toast';

const SELECT_SEAT_ERROR_MESSAGE = '선택 가능한 좌석이 아닙니다.';
const CAPACITY_EXCEEDED_MESSAGE = '선택 가능한 좌석 수를 초과했습니다.';
const RELEASE_SEAT_ERROR_MESSAGE = '선택을 해제할 좌석을 찾을 수 없습니다.';
const VALIDATION_INCOMPLETE_MESSAGE = '선택한 좌석 수가 인원수와 일치해야 합니다.';
const VALIDATION_SUCCESS_TITLE = '좌석 검증이 완료되었습니다.';
const EXPIRATION_TOAST_TITLE = '선택 시간이 만료되었습니다.';
const EXPIRATION_TOAST_DESCRIPTION = '좌석을 다시 선택해주세요.';
const GENERIC_ERROR_TITLE = '문제가 발생했습니다.';

const generateSessionId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const formatRemainingTime = (seconds: number) => {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export type TimerVariant = 'default' | 'warning' | 'danger';

export type SeatSelectionContextValue = {
  state: SeatSelectionState;
  seatsQuery: ReturnType<typeof useSeatsQuery>;
  seatStatusQuery: ReturnType<typeof useSeatStatusQuery>;
  totalAmount: number;
  remainingSeatCount: number;
  canProceed: boolean;
  isOverCapacity: boolean;
  formattedTime: string;
  timerVariant: TimerVariant;
  isExpired: boolean;
  selectSeat: (seat: Seat) => Promise<void>;
  releaseSeat: (seatId: string) => Promise<void>;
  proceedToCheckout: () => Promise<void>;
  resetSelection: () => void;
  clearError: () => void;
};

const SeatSelectionContext = createContext<SeatSelectionContextValue | null>(null);

export type SeatSelectionProviderProps = {
  concertId: string;
  numberOfTickets: number;
  children: ReactNode;
};

export const SeatSelectionProvider = ({
  concertId,
  numberOfTickets,
  children,
}: SeatSelectionProviderProps) => {
  const [state, dispatch] = useReducer(seatSelectionReducer, undefined, createInitialSeatSelectionState);
  const router = useRouter();
  const { toast } = useToast();
  const expirationHandledRef = useRef(false);

  const seatsQuery = useSeatsQuery(concertId, Boolean(concertId));
  const seatStatusQuery = useSeatStatusQuery(concertId, seatsQuery.isSuccess);
  const reserveSeatMutation = useReserveSeatMutation();
  const releaseSeatMutation = useReleaseSeatMutation();
  const validateSelectionMutation = useValidateSelectionMutation();

  const sessionId = state.sessionId;

  useEffect(() => {
    const snapshot = loadSelectionFromSession();
    const baseSessionId = snapshot && snapshot.concertId === concertId ? snapshot.sessionId : generateSessionId();

    dispatch({
      type: 'INITIALIZE_CONTEXT',
      payload: {
        concertId,
        numberOfTickets,
        sessionId: baseSessionId,
      },
    });

    if (snapshot && snapshot.concertId === concertId) {
      const remainingSeconds = calculateRemainingSeconds(snapshot.expiresAt ?? null);
      dispatch({
        type: 'HYDRATE_SELECTION',
        payload: {
          selectedSeats: snapshot.selectedSeats,
          remainingSeconds,
          sessionExpiresAt: snapshot.expiresAt ?? null,
        },
      });
    } else {
      clearSelectionFromSession();
    }
  }, [concertId, numberOfTickets]);

  useEffect(() => {
    if (!seatStatusQuery.data) {
      return;
    }

    dispatch({
      type: 'SEATS_SYNCHRONIZED',
      payload: { statuses: seatStatusQuery.data.seats },
    });
  }, [seatStatusQuery.data]);

  useInterval(
    () => {
      dispatch({ type: 'TIMER_TICK' });
    },
    state.isTimerActive ? TIMER_TICK_INTERVAL_MS : null,
  );

  useEffect(() => {
    expirationHandledRef.current = false;
  }, [state.selectedSeats.length]);

  useEffect(() => {
    const expiredByTimer = state.remainingSeconds === 0;
    const expiredBySession = isSessionExpired(state.sessionExpiresAt);

    if (state.selectedSeats.length === 0 || !sessionId) {
      return;
    }

    if (!expiredByTimer && !expiredBySession) {
      return;
    }

    if (expirationHandledRef.current) {
      return;
    }

    expirationHandledRef.current = true;
    dispatch({ type: 'TIMER_EXPIRED' });
    clearSelectionFromSession();

    const seatIds = state.selectedSeats.map((seat) => seat.id);

    if (seatIds.length > 0) {
      releaseSeatMutation.mutate({
        concertId,
        seatIds,
        sessionId,
      });
    }

    toast({
      title: EXPIRATION_TOAST_TITLE,
      description: EXPIRATION_TOAST_DESCRIPTION,
    });
  }, [concertId, releaseSeatMutation, sessionId, state.remainingSeconds, state.selectedSeats, state.sessionExpiresAt, toast]);

  const totalAmount = useMemo(
    () => state.selectedSeats.reduce((sum, seat) => sum + seat.price, 0),
    [state.selectedSeats],
  );

  const canProceed = state.selectedSeats.length === numberOfTickets;
  const isOverCapacity = state.selectedSeats.length > numberOfTickets;
  const remainingSeatCount = Math.max(0, numberOfTickets - state.selectedSeats.length);

  const timerVariant: TimerVariant = useMemo(() => {
    if (state.remainingSeconds <= SEAT_TIMER_DANGER_THRESHOLD_SECONDS) {
      return 'danger';
    }

    if (state.remainingSeconds <= SEAT_TIMER_WARNING_THRESHOLD_SECONDS) {
      return 'warning';
    }

    return 'default';
  }, [state.remainingSeconds]);

  const formattedTime = useMemo(
    () => formatRemainingTime(state.remainingSeconds),
    [state.remainingSeconds],
  );

  const persistSelection = useCallback(
    (expiresAt: string | null, selectedSeats: Seat[]) => {
      if (!sessionId) {
        return;
      }

      saveSelectionToSession({
        concertId,
        sessionId,
        numberOfTickets,
        selectedSeats,
        totalAmount: selectedSeats.reduce((sum, seat) => sum + seat.price, 0),
        expiresAt,
        savedAt: new Date().toISOString(),
      });
    },
    [concertId, numberOfTickets, sessionId],
  );

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    if (state.selectedSeats.length === 0) {
      clearSelectionFromSession();
      return;
    }

    if (isSessionExpired(state.sessionExpiresAt)) {
      return;
    }

    persistSelection(state.sessionExpiresAt, state.selectedSeats);
  }, [persistSelection, sessionId, state.selectedSeats, state.sessionExpiresAt]);

  const handleSelectSeat = useCallback(
    async (seat: Seat) => {
      if (!sessionId) {
        toast({ title: GENERIC_ERROR_TITLE, description: SELECT_SEAT_ERROR_MESSAGE });
        return;
      }

      if (!canSelectSeat(seat, state.selectedSeats, numberOfTickets)) {
        toast({ title: GENERIC_ERROR_TITLE, description: SELECT_SEAT_ERROR_MESSAGE });
        return;
      }

      dispatch({ type: 'SET_RESERVING', payload: true });

      try {
        const response = await reserveSeatMutation.mutateAsync({
          concertId,
          seatIds: [seat.id],
          sessionId,
        });

        const selectedSeat = response.seats[0] ?? seat;
        const remainingSeconds = calculateRemainingSeconds(response.expiresAt);

        dispatch({ type: 'SEAT_SELECTED', payload: { seat: selectedSeat, sessionExpiresAt: response.expiresAt } });
        dispatch({ type: 'SET_SESSION_EXPIRATION', payload: { expiresAt: response.expiresAt } });
        dispatch({ type: 'TIMER_RESET', payload: { remainingSeconds } });
        dispatch({ type: 'SET_ERROR', payload: null });

        persistSelection(response.expiresAt, [...state.selectedSeats, selectedSeat]);
      } catch (error) {
        const message = error instanceof Error ? error.message : SELECT_SEAT_ERROR_MESSAGE;
        dispatch({ type: 'SET_ERROR', payload: message });
        toast({ title: GENERIC_ERROR_TITLE, description: message });
      } finally {
        dispatch({ type: 'SET_RESERVING', payload: false });
      }
    },
    [concertId, numberOfTickets, persistSelection, reserveSeatMutation, sessionId, state.selectedSeats, toast],
  );

  const handleReleaseSeat = useCallback(
    async (seatId: string) => {
      if (!sessionId) {
        toast({ title: GENERIC_ERROR_TITLE, description: RELEASE_SEAT_ERROR_MESSAGE });
        return;
      }

      if (!canReleaseSeat(seatId, state.selectedSeats)) {
        toast({ title: GENERIC_ERROR_TITLE, description: RELEASE_SEAT_ERROR_MESSAGE });
        return;
      }

      dispatch({ type: 'SET_RELEASING', payload: true });

      try {
        await releaseSeatMutation.mutateAsync({
          concertId,
          seatIds: [seatId],
          sessionId,
        });

        dispatch({ type: 'SEAT_RELEASED', payload: { seatId } });
  dispatch({ type: 'SET_ERROR', payload: null });
        const nextSeats = state.selectedSeats.filter((seat) => seat.id !== seatId);

        if (nextSeats.length === 0) {
          clearSelectionFromSession();
        } else {
          persistSelection(state.sessionExpiresAt, nextSeats);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : RELEASE_SEAT_ERROR_MESSAGE;
        dispatch({ type: 'SET_ERROR', payload: message });
        toast({ title: GENERIC_ERROR_TITLE, description: message });
      } finally {
        dispatch({ type: 'SET_RELEASING', payload: false });
      }
    },
    [concertId, persistSelection, releaseSeatMutation, sessionId, state.selectedSeats, state.sessionExpiresAt, toast],
  );

  const handleProceedToCheckout = useCallback(async () => {
    if (!sessionId) {
      toast({ title: GENERIC_ERROR_TITLE, description: VALIDATION_INCOMPLETE_MESSAGE });
      return;
    }

    if (!canProceed) {
      toast({ title: GENERIC_ERROR_TITLE, description: VALIDATION_INCOMPLETE_MESSAGE });
      return;
    }

    dispatch({ type: 'SET_VALIDATING', payload: true });

    try {
      const response = await validateSelectionMutation.mutateAsync({
        concertId,
        sessionId,
        seatIds: state.selectedSeats.map((seat) => seat.id),
      });

      persistSelection(response.expiresAt, response.seats);
      dispatch({ type: 'SET_ERROR', payload: null });
      toast({ title: VALIDATION_SUCCESS_TITLE });

      router.push(ROUTES.checkout(concertId, sessionId));
    } catch (error) {
      const message = error instanceof Error ? error.message : GENERIC_ERROR_TITLE;
      dispatch({ type: 'SET_ERROR', payload: message });
      toast({ title: GENERIC_ERROR_TITLE, description: message });
    } finally {
      dispatch({ type: 'SET_VALIDATING', payload: false });
    }
  }, [canProceed, concertId, persistSelection, router, sessionId, state.selectedSeats, toast, validateSelectionMutation]);

  const handleResetSelection = useCallback(() => {
    const seatIds = state.selectedSeats.map((seat) => seat.id);

    if (seatIds.length > 0 && sessionId) {
      releaseSeatMutation.mutate({ concertId, seatIds, sessionId });
    }

    clearSelectionFromSession();
    dispatch({ type: 'RESET_STATE' });
    expirationHandledRef.current = false;
    dispatch({
      type: 'INITIALIZE_CONTEXT',
      payload: {
        concertId,
        numberOfTickets,
        sessionId: generateSessionId(),
      },
    });
  }, [concertId, numberOfTickets, releaseSeatMutation, sessionId, state.selectedSeats]);

  const handleClearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  const isExpired = state.selectedSeats.length > 0 && (state.remainingSeconds === 0 || isSessionExpired(state.sessionExpiresAt));

  const contextValue = useMemo<SeatSelectionContextValue>(
    () => ({
      state,
      seatsQuery,
      seatStatusQuery,
      totalAmount,
      remainingSeatCount,
      canProceed,
      isOverCapacity,
      formattedTime,
      timerVariant,
      isExpired,
      selectSeat: handleSelectSeat,
      releaseSeat: handleReleaseSeat,
      proceedToCheckout: handleProceedToCheckout,
      resetSelection: handleResetSelection,
      clearError: handleClearError,
    }),
    [
      canProceed,
      formattedTime,
      handleClearError,
      handleProceedToCheckout,
      handleReleaseSeat,
      handleResetSelection,
      handleSelectSeat,
      isExpired,
      isOverCapacity,
      remainingSeatCount,
      seatStatusQuery,
      seatsQuery,
      state,
      timerVariant,
      totalAmount,
    ],
  );

  return <SeatSelectionContext.Provider value={contextValue}>{children}</SeatSelectionContext.Provider>;
};

export const useSeatSelectionContext = () => {
  const context = useContext(SeatSelectionContext);

  if (!context) {
    throw new Error('SeatSelectionContext를 Provider 내부에서만 사용할 수 있습니다.');
  }

  return context;
};
