"use client";

import { useCallback, useEffect, useState } from 'react';
import { PrimaryHeader } from '@/components/layout/header';
import { BookingAuthForm } from '@/features/bookings/components/booking-auth-form';
import { BookingInfoSection } from '@/features/bookings/components/booking-info-section';
import { BookingInfoSkeleton } from '@/features/bookings/components/booking-info-skeleton';
import { ConcertErrorState } from '@/features/concerts/components/concert-error-state';
import { CancelConfirmationModal } from '@/features/bookings/components/cancel-confirmation-modal';
import { useBookingVerifyMutation } from '@/features/bookings/hooks/useBookingVerifyMutation';
import { useBookingDetailQuery } from '@/features/bookings/hooks/useBookingDetailQuery';
import { useCancelBookingMutation } from '@/features/bookings/hooks/useCancelBookingMutation';
import {
  getBookingAccessToken,
  saveBookingAccessToken,
  clearBookingAccessToken,
} from '@/features/bookings/lib/access-token';
import { canCancelBooking } from '@/features/bookings/lib/policy';
import type {
  BookingDetail,
} from '@/features/bookings/types';
import type { BookingLookupFormData } from '@/features/bookings/lib/validation';
import { BOOKING_STATUS } from '@/features/bookings/constants';

const PAGE_CLASS = 'min-h-screen bg-slate-950';
const AUTH_CONTAINER_CLASS = 'space-y-6';
const AUTH_TITLE_CLASS = 'text-2xl font-bold text-white';
const AUTH_DESCRIPTION_CLASS = 'text-slate-400';
const AUTH_MAIN_CLASS = 'container mx-auto max-w-md px-4 py-16';
const DETAIL_MAIN_CLASS = 'container mx-auto max-w-4xl px-4 py-8';
const UNAUTHORIZED_KEYWORDS = ['unauthorized', 'invalid access token'];
const AUTH_TITLE = '예약 정보 확인';
const AUTH_DESCRIPTION = '예약 정보를 확인하려면 인증이 필요합니다.';
const GENERIC_LOAD_FAILURE = '예약 정보를 불러올 수 없습니다.';

export type BookingInfoContainerProps = {
  bookingId: string;
};

export function BookingInfoContainer({ bookingId }: BookingInfoContainerProps) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingDetail | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const verifyMutation = useBookingVerifyMutation(bookingId);
  const detailQuery = useBookingDetailQuery(bookingId, accessToken);
  const cancelMutation = useCancelBookingMutation();

  useEffect(() => {
    const storedToken = getBookingAccessToken(bookingId);
    if (storedToken) {
      setAccessToken(storedToken);
      setIsAuthenticated(true);
    }
  }, [bookingId]);

  const detailErrorMessage = detailQuery.error?.message ?? '';

  useEffect(() => {
    if (!detailQuery.isError) {
      return;
    }

    const normalizedMessage = detailErrorMessage.toLowerCase();
    const isUnauthorized = UNAUTHORIZED_KEYWORDS.some((keyword) => normalizedMessage.includes(keyword));

    if (isUnauthorized) {
      clearBookingAccessToken(bookingId);
      setAccessToken(null);
      setIsAuthenticated(false);
      setSelectedBooking(null);
      setIsCancelModalOpen(false);
    }
  }, [bookingId, detailQuery.isError, detailErrorMessage]);

  const handleAuthSubmit = useCallback(
    async (formData: BookingLookupFormData) => {
      try {
        const result = await verifyMutation.mutateAsync({
          phoneNumber: formData.phoneNumber,
          password: formData.password,
        });

        saveBookingAccessToken(bookingId, result.accessToken);
        setAccessToken(result.accessToken);
        setIsAuthenticated(true);
      } catch (error) {
        // handled via mutation state
      }
    },
    [bookingId, verifyMutation],
  );

  const handleCancelClick = useCallback((booking: BookingDetail) => {
    setSelectedBooking(booking);
    setIsCancelModalOpen(true);
  }, []);

  const handleCancelConfirm = useCallback(async () => {
    if (!selectedBooking || !accessToken) {
      return;
    }

    try {
      await cancelMutation.mutateAsync({
        bookingId: selectedBooking.id,
        accessToken,
      });

      await detailQuery.refetch();
      setIsCancelModalOpen(false);
      setSelectedBooking(null);
    } catch (error) {
      // handled via mutation state
    }
  }, [accessToken, cancelMutation, detailQuery, selectedBooking]);

  const handleCloseModal = useCallback(() => {
    setIsCancelModalOpen(false);
    setSelectedBooking(null);
  }, []);

  const renderAuthView = () => (
    <div className={PAGE_CLASS}>
      <PrimaryHeader />
      <main className={AUTH_MAIN_CLASS}>
        <div className={AUTH_CONTAINER_CLASS}>
          <div className="space-y-2 text-center">
            <h1 className={AUTH_TITLE_CLASS}>{AUTH_TITLE}</h1>
            <p className={AUTH_DESCRIPTION_CLASS}>{AUTH_DESCRIPTION}</p>
          </div>
          <BookingAuthForm
            onSubmit={handleAuthSubmit}
            isLoading={verifyMutation.isPending}
            errorMessage={verifyMutation.error?.message}
          />
        </div>
      </main>
    </div>
  );

  if (!isAuthenticated) {
    return renderAuthView();
  }

  if (detailQuery.isLoading) {
    return <BookingInfoSkeleton />;
  }

  if (detailQuery.isError) {
    if (!detailErrorMessage || UNAUTHORIZED_KEYWORDS.some((keyword) => detailErrorMessage.toLowerCase().includes(keyword))) {
      return renderAuthView();
    }

    return (
      <div className={PAGE_CLASS}>
        <PrimaryHeader />
        <main className={DETAIL_MAIN_CLASS}>
          <ConcertErrorState message={detailErrorMessage} onRetry={() => detailQuery.refetch()} />
        </main>
      </div>
    );
  }

  if (!detailQuery.data) {
    return (
      <div className={PAGE_CLASS}>
        <PrimaryHeader />
        <main className={DETAIL_MAIN_CLASS}>
          <p className="text-center text-slate-400">{GENERIC_LOAD_FAILURE}</p>
        </main>
      </div>
    );
  }

  const booking = detailQuery.data.booking;
  const canCancel = booking.status === BOOKING_STATUS.confirmed && canCancelBooking(booking.concertStartDate);

  return (
    <div className={PAGE_CLASS}>
      <PrimaryHeader />
      <main className={DETAIL_MAIN_CLASS}>
        <BookingInfoSection
          booking={booking}
          canCancel={canCancel}
          onCancelClick={() => handleCancelClick(booking)}
        />
      </main>

      {selectedBooking ? (
        <CancelConfirmationModal
          isOpen={isCancelModalOpen}
          booking={selectedBooking}
          onConfirm={handleCancelConfirm}
          onClose={handleCloseModal}
          isLoading={cancelMutation.isPending}
          errorMessage={cancelMutation.error?.message}
        />
      ) : null}
    </div>
  );
}
