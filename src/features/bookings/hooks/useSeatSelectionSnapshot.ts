"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  loadSelectionFromSession,
  clearSelectionFromSession,
  type SeatSelectionSessionSnapshot,
} from '@/features/seats/lib/session-storage';
import {
  calculateRemainingSeconds,
  isSessionExpired,
} from '@/features/seats/lib/validation';

const TICK_INTERVAL_MS = 1_000;

export type SeatSelectionSnapshotState = {
  snapshot: SeatSelectionSessionSnapshot | null;
  isHydrated: boolean;
  remainingSeconds: number;
  isExpired: boolean;
  seatIds: string[];
  seatCount: number;
  totalAmount: number;
  clearSnapshot: () => void;
  reloadSnapshot: () => void;
};

const formatSeatIds = (snapshot: SeatSelectionSessionSnapshot | null) =>
  snapshot?.selectedSeats?.map((seat) => seat.id) ?? [];

export const useSeatSelectionSnapshot = (
  concertId: string,
  sessionId: string,
): SeatSelectionSnapshotState => {
  const [snapshot, setSnapshot] = useState<SeatSelectionSessionSnapshot | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const applySnapshot = (nextSnapshot: SeatSelectionSessionSnapshot | null) => {
    setSnapshot(nextSnapshot);
    setRemainingSeconds(
      calculateRemainingSeconds(nextSnapshot?.expiresAt ?? null),
    );
  };

  const stopInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startInterval = (expiresAt: string | null) => {
    stopInterval();

    if (!expiresAt) {
      return;
    }

    intervalRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 0) {
          stopInterval();
          return 0;
        }

        return prev - 1;
      });
    }, TICK_INTERVAL_MS);
  };

  const resolveSnapshot = () => {
    const stored = loadSelectionFromSession();

    if (!stored) {
      applySnapshot(null);
      return;
    }

    if (stored.concertId !== concertId || stored.sessionId !== sessionId) {
      applySnapshot(null);
      return;
    }

    if (stored.selectedSeats.length === 0) {
      applySnapshot(null);
      return;
    }

    applySnapshot(stored);
    startInterval(stored.expiresAt);
  };

  useEffect(() => {
    resolveSnapshot();
    setIsHydrated(true);

    return () => {
      stopInterval();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [concertId, sessionId]);

  useEffect(() => {
    if (!snapshot?.expiresAt) {
      stopInterval();
      return;
    }

    startInterval(snapshot.expiresAt);

    return () => {
      stopInterval();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot?.expiresAt]);

  const isExpired = useMemo(() => {
    if (!snapshot) {
      return false;
    }

    if (remainingSeconds <= 0) {
      return true;
    }

    return isSessionExpired(snapshot.expiresAt);
  }, [remainingSeconds, snapshot]);

  const seatIds = useMemo(() => formatSeatIds(snapshot), [snapshot]);

  const seatCount = snapshot?.selectedSeats.length ?? 0;
  const totalAmount = snapshot?.totalAmount ?? 0;

  const clearSnapshot = () => {
    clearSelectionFromSession();
    stopInterval();
    applySnapshot(null);
  };

  const reloadSnapshot = () => {
    resolveSnapshot();
  };

  return {
    snapshot,
    isHydrated,
    remainingSeconds,
    isExpired,
    seatIds,
    seatCount,
    totalAmount,
    clearSnapshot,
    reloadSnapshot,
  };
};
