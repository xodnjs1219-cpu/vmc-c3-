import type { SupabaseClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { match } from 'ts-pattern';
import {
  failure,
  success,
  type HandlerResult,
} from '@/backend/http/response';
import {
  bookingErrorCodes,
  type BookingServiceError,
} from '@/features/bookings/backend/error';
import {
  CreateBookingRequestSchema,
  BookingResponseSchema,
  type CreateBookingRequest,
  type BookingResponse,
} from '@/features/bookings/backend/schema';

const BOOKING_FINALIZE_FUNCTION = 'finalize_booking';
const PASSWORD_SALT_ROUNDS = 12;
const VALIDATION_FAILURE_MESSAGE = '예매 요청 데이터 검증에 실패했습니다.';
const HASHING_FAILURE_MESSAGE = '비밀번호 처리 중 오류가 발생했습니다.';
const RESPONSE_PARSE_FAILURE_MESSAGE = '예매 응답 데이터 검증에 실패했습니다.';

const toFinalizeParams = (
  request: CreateBookingRequest,
  passwordHash: string,
) => ({
  concert_id: request.concertId,
  seat_ids: request.seatIds,
  session_id: request.sessionId,
  booker_name: request.bookerName,
  phone_number: request.phoneNumber,
  password_hash: passwordHash,
});

const toBookingError = (message: string, details?: unknown): HandlerResult<BookingResponse, BookingServiceError> =>
  match(message)
    .with(
      bookingErrorCodes.seatUnavailable,
      () =>
        failure(
          409,
          bookingErrorCodes.seatUnavailable,
          '선택하신 좌석이 이미 예매되었습니다.',
          details,
        ),
    )
    .with(
      bookingErrorCodes.sessionExpired,
      () =>
        failure(
          410,
          bookingErrorCodes.sessionExpired,
          '예약 시간이 만료되었습니다. 다시 좌석을 선택해주세요.',
          details,
        ),
    )
    .with(
      bookingErrorCodes.sessionMismatch,
      () =>
        failure(
          400,
          bookingErrorCodes.sessionMismatch,
          '유효하지 않은 예약 세션입니다. 처음부터 다시 진행해주세요.',
          details,
        ),
    )
    .with(
      bookingErrorCodes.concertNotFound,
      () =>
        failure(
          404,
          bookingErrorCodes.concertNotFound,
          '콘서트 정보를 찾을 수 없습니다.',
          details,
        ),
    )
    .with(
      bookingErrorCodes.validationError,
      () =>
        failure(
          400,
          bookingErrorCodes.validationError,
          '요청 데이터가 올바르지 않습니다.',
          details,
        ),
    )
    .with(
      bookingErrorCodes.transactionFailed,
      () =>
        failure(
          500,
          bookingErrorCodes.transactionFailed,
          '예매 처리 중 오류가 발생했습니다.',
          details,
        ),
    )
    .with(
      bookingErrorCodes.databaseError,
      () =>
        failure(
          500,
          bookingErrorCodes.databaseError,
          '예약 처리 중 알 수 없는 오류가 발생했습니다.',
          details,
        ),
    )
    .otherwise(() =>
      failure(
        500,
        bookingErrorCodes.transactionFailed,
        '예매 처리 중 오류가 발생했습니다.',
        details,
      ),
    );

export const createBooking = async (
  supabase: SupabaseClient,
  payload: CreateBookingRequest,
): Promise<HandlerResult<BookingResponse, BookingServiceError>> => {
  const parsed = CreateBookingRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return failure(
      400,
      bookingErrorCodes.validationError,
      VALIDATION_FAILURE_MESSAGE,
      parsed.error.format(),
    );
  }

  let passwordHash: string;

  try {
    passwordHash = await bcrypt.hash(parsed.data.password, PASSWORD_SALT_ROUNDS);
  } catch (hashError) {
    return failure(
      500,
      bookingErrorCodes.hashingFailed,
      HASHING_FAILURE_MESSAGE,
      hashError instanceof Error ? hashError.message : hashError,
    );
  }

  const rpcInput = toFinalizeParams(parsed.data, passwordHash);

  const { data, error, status } = await supabase.rpc(BOOKING_FINALIZE_FUNCTION, rpcInput);

  if (error) {
    const rpcMessage = typeof error.message === 'string' ? error.message : '';
    const rpcDetails = error.details ?? error;

    if (rpcMessage) {
      return toBookingError(rpcMessage, rpcDetails);
    }

    return failure(
      500,
      bookingErrorCodes.databaseError,
      '예약 처리 중 알 수 없는 오류가 발생했습니다.',
      rpcDetails,
    );
  }

  const parseResult = BookingResponseSchema.safeParse(data);

  if (!parseResult.success) {
    return failure(
      500,
      bookingErrorCodes.validationError,
      RESPONSE_PARSE_FAILURE_MESSAGE,
      parseResult.error.format(),
    );
  }

  return success(parseResult.data, 201);
};
