"use client";

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PrimaryHeader } from '@/components/layout/header';
import { ROUTES } from '@/constants/app';
import { BookingLookupForm } from '@/features/bookings/components/booking-lookup-form';
import { BookingListItem } from '@/features/bookings/components/booking-list-item';
import { BookingEmptyState } from '@/features/bookings/components/booking-empty-state';
import { CancelConfirmationModal } from '@/features/bookings/components/cancel-confirmation-modal';
import { useBookingLookupMutation } from '@/features/bookings/hooks/useBookingLookupMutation';
import { useBookingVerifyMutation } from '@/features/bookings/hooks/useBookingVerifyMutation';
import { useCancelBookingMutation } from '@/features/bookings/hooks/useCancelBookingMutation';
import { saveBookingAccessToken } from '@/features/bookings/lib/access-token';
import type { BookingDetail } from '@/features/bookings/types';
import type { BookingLookupFormData } from '@/features/bookings/lib/validation';
import { useToast } from '@/hooks/use-toast';

const PAGE_CONTAINER_CLASS = 'min-h-screen bg-gray-50';
const MAIN_CONTAINER_CLASS = 'container mx-auto max-w-5xl px-4 py-12';
const HEADER_SECTION_CLASS = 'mb-8 space-y-3 text-center md:text-left';
const HEADER_TITLE_CLASS = 'text-3xl font-bold tracking-tight text-gray-900';
const HEADER_DESCRIPTION_CLASS = 'text-sm text-gray-600';
const RESULT_SECTION_CLASS = 'mt-10 space-y-4';
const RESULT_TITLE_CLASS = 'text-xl font-semibold text-gray-900';
const RESULT_LIST_CLASS = 'space-y-5';
const ERROR_ALERT_CLASS = 'rounded-lg border border-red-800/60 bg-red-950/40 px-4 py-3 text-sm text-red-300';
const EMPTY_STATE_MESSAGE = '입력하신 정보와 일치하는 예매 내역이 없습니다.';
const VERIFY_FAILURE_MESSAGE = '예약 인증에 실패했습니다. 다시 시도해주세요.';
const CREDENTIALS_REQUIRED_MESSAGE = '먼저 예약 조회를 완료해주세요.';
const CANCEL_SUCCESS_MESSAGE = '예약이 취소되었습니다.';

export function BookingLookupContainer() {
  const router = useRouter();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<BookingDetail[]>([]);
  const [hasAttemptedLookup, setHasAttemptedLookup] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingDetail | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [credentials, setCredentials] = useState<BookingLookupFormData | null>(null);

  const lookupMutation = useBookingLookupMutation();
  const verifyMutation = useBookingVerifyMutation();
  const cancelMutation = useCancelBookingMutation();

  const handleLookupAction = useCallback(
    async (formData: BookingLookupFormData) => {
      setHasAttemptedLookup(true);
      setCredentials({ ...formData });
      lookupMutation.reset();

      try {
        const result = await lookupMutation.mutateAsync(formData);
        setBookings(result.bookings);
      } catch (error) {
        setBookings([]);
      }
    },
    [lookupMutation],
  );

  const handleViewDetailAction = useCallback(
    async (booking: BookingDetail) => {
      if (!credentials) {
        toast({ description: CREDENTIALS_REQUIRED_MESSAGE });
        return;
      }

      try {
        verifyMutation.reset();
        const { accessToken } = await verifyMutation.mutateAsync({
          bookingId: booking.id,
          phoneNumber: credentials.phoneNumber,
          password: credentials.password,
        });

        saveBookingAccessToken(booking.id, accessToken);
        router.push(ROUTES.bookingInfo(booking.id));
      } catch (error) {
        const message = error instanceof Error ? error.message : VERIFY_FAILURE_MESSAGE;
        toast({ description: message });
      }
    },
    [credentials, router, toast, verifyMutation],
  );

  const handleCancelOpenAction = useCallback((booking: BookingDetail) => {
    cancelMutation.reset();
    setSelectedBooking(booking);
    setIsCancelModalOpen(true);
  }, [cancelMutation]);

  const handleCancelCloseAction = useCallback(() => {
    cancelMutation.reset();
    setIsCancelModalOpen(false);
    setSelectedBooking(null);
  }, [cancelMutation]);

  const handleCancelConfirmAction = useCallback(async () => {
    if (!selectedBooking || !credentials) {
      toast({ description: CREDENTIALS_REQUIRED_MESSAGE });
      return;
    }

    try {
      verifyMutation.reset();
      const { accessToken } = await verifyMutation.mutateAsync({
        bookingId: selectedBooking.id,
        phoneNumber: credentials.phoneNumber,
        password: credentials.password,
      });

      await cancelMutation.mutateAsync({
        bookingId: selectedBooking.id,
        accessToken,
      });

      setBookings((prev) => prev.filter((item) => item.id !== selectedBooking.id));
      setIsCancelModalOpen(false);
      setSelectedBooking(null);
      toast({ description: CANCEL_SUCCESS_MESSAGE });
    } catch (error) {
      const message = error instanceof Error ? error.message : VERIFY_FAILURE_MESSAGE;
      toast({ description: message });
    }
  }, [cancelMutation, credentials, selectedBooking, toast, verifyMutation]);

  const hasResults = bookings.length > 0;
  const showEmptyState = hasAttemptedLookup && !lookupMutation.isPending && !hasResults && lookupMutation.isSuccess;

  const resultTitle = useMemo(() => {
    if (!hasResults) {
      return '';
    }

    return `예약 내역 (${bookings.length}건)`;
  }, [bookings.length, hasResults]);

  return (
    <div className={PAGE_CONTAINER_CLASS}>
      <PrimaryHeader />

      <main className={MAIN_CONTAINER_CLASS}>
        <section className={HEADER_SECTION_CLASS}>
          <h1 className={HEADER_TITLE_CLASS}>예약 조회</h1>
          <p className={HEADER_DESCRIPTION_CLASS}>
            예매 시 입력하신 휴대폰 번호와 비밀번호를 입력하시면 예약 내역을 확인할 수 있습니다.
          </p>
        </section>

        <BookingLookupForm
          onSubmitAction={handleLookupAction}
          isLoading={lookupMutation.isPending}
        />

        {lookupMutation.isError ? (
          <div className={ERROR_ALERT_CLASS} role="alert">
            {lookupMutation.error?.message}
          </div>
        ) : null}

        {showEmptyState ? (
          <BookingEmptyState message={EMPTY_STATE_MESSAGE} />
        ) : null}

        {hasResults ? (
          <section className={RESULT_SECTION_CLASS}>
            <h2 className={RESULT_TITLE_CLASS}>{resultTitle}</h2>
            <div className={RESULT_LIST_CLASS}>
              {bookings.map((booking) => (
                <BookingListItem
                  key={booking.id}
                  booking={booking}
                  onViewDetailAction={() => handleViewDetailAction(booking)}
                  onCancelAction={() => handleCancelOpenAction(booking)}
                />
              ))}
            </div>
          </section>
        ) : null}
      </main>

      {selectedBooking ? (
        <CancelConfirmationModal
          isOpen={isCancelModalOpen}
          booking={selectedBooking}
          onConfirm={handleCancelConfirmAction}
          onClose={handleCancelCloseAction}
          isLoading={cancelMutation.isPending}
          errorMessage={cancelMutation.error?.message}
        />
      ) : null}
    </div>
  );
}
