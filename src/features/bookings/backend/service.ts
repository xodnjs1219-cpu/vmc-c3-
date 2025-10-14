import type { SupabaseClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { match } from 'ts-pattern';
import {
  failure,
  success,
  type HandlerResult,
} from '@/backend/http/response';
import type { AppConfig } from '@/backend/hono/context';
import {
  bookingErrorCodes,
  type BookingServiceError,
} from '@/features/bookings/backend/error';
import {
  BookingDetailResponseSchema,
  BookingDetailWithSeatSchema,
  BookingResponseSchema,
  BookingVerifyRequestSchema,
  CancelBookingResponseSchema,
  CreateBookingRequestSchema,
  type BookingDetailResponse,
  type BookingDetailWithSeat,
  type BookingResponse,
  type BookingVerifyRequest,
  type BookingVerifyResponse,
  type CancelBookingResponse,
  type CreateBookingRequest,
} from '@/features/bookings/backend/schema';
import { generateAccessToken, verifyAccessToken } from '@/features/bookings/backend/jwt';
import { BOOKING_STATUS } from '@/features/bookings/constants';

const BOOKING_FINALIZE_FUNCTION = 'finalize_booking';
const CANCEL_BOOKING_FUNCTION = 'cancel_booking';
const BOOKINGS_TABLE = 'bookings';
const SEATS_TABLE = 'seats';
const PASSWORD_SALT_ROUNDS = 12;
const VALIDATION_FAILURE_MESSAGE = '예매 요청 데이터 검증에 실패했습니다.';
const HASHING_FAILURE_MESSAGE = '비밀번호 처리 중 오류가 발생했습니다.';
const RESPONSE_PARSE_FAILURE_MESSAGE = '예매 응답 데이터 검증에 실패했습니다.';
const ACCESS_DENIED_MESSAGE = '예약 인증 정보가 일치하지 않습니다.';
const BOOKING_FETCH_FAILURE_MESSAGE = '예약 정보를 불러오는 중 오류가 발생했습니다.';
const BOOKING_DETAIL_FETCH_FAILURE_MESSAGE = '예약 상세 정보를 불러오지 못했습니다.';
const BOOKING_NOT_FOUND_MESSAGE = '예약 정보를 찾을 수 없습니다.';
const INVALID_ACCESS_TOKEN_MESSAGE = '유효하지 않은 접근 토큰입니다.';
const CANCELLATION_FAILURE_MESSAGE = '예약 취소 처리 중 오류가 발생했습니다.';

type BookingDetailRow = {
  id: string;
  concert_id: string;
  booker_name: string;
  phone_number: string;
  total_amount: number;
  status: (typeof BOOKING_STATUS)[keyof typeof BOOKING_STATUS];
  created_at: string;
  cancelled_at: string | null;
  concerts: {
    id: string;
    title: string;
    venue: string;
    start_date: string;
    end_date: string;
  } | null;
};

type BookingSeatRow = {
  id: string;
  section: string;
  row_number: string;
  seat_number: string;
  grade: string;
  price: number;
};

const toFinalizeParams = (
  request: CreateBookingRequest,
  passwordHash: string,
) => ({
  p_concert_id: request.concertId,
  p_seat_ids: request.seatIds,
  p_session_id: request.sessionId,
  p_booker_name: request.bookerName,
  p_phone_number: request.phoneNumber,
  p_password_hash: passwordHash,
});

const toBookingError = (
  message: string,
  details?: unknown,
): HandlerResult<BookingResponse, BookingServiceError> =>
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

const parseRpcDetails = (details: unknown) => {
  if (typeof details !== 'string') {
    return details;
  }

  try {
    return JSON.parse(details);
  } catch (error) {
    return details;
  }
};

const handlePostgrestNotFound = () =>
  failure(404, bookingErrorCodes.notFound, BOOKING_NOT_FOUND_MESSAGE);

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

  const { data, error } = await supabase.rpc(BOOKING_FINALIZE_FUNCTION, rpcInput);

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

export const verifyBookingAccess = async (
  supabase: SupabaseClient,
  config: AppConfig,
  bookingId: string,
  payload: BookingVerifyRequest,
): Promise<HandlerResult<BookingVerifyResponse, BookingServiceError>> => {
  const parsedPayload = BookingVerifyRequestSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return failure(
      400,
      bookingErrorCodes.validationError,
      '입력값을 확인해주세요.',
      parsedPayload.error.format(),
    );
  }

  const { data: bookingRow, error } = await supabase
    .from(BOOKINGS_TABLE)
    .select('id, phone_number, password_hash')
    .eq('id', bookingId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return handlePostgrestNotFound();
    }

    return failure(
      500,
      bookingErrorCodes.fetchError,
      BOOKING_FETCH_FAILURE_MESSAGE,
      error.message ?? error,
    );
  }

  if (bookingRow.phone_number !== parsedPayload.data.phoneNumber) {
    return failure(403, bookingErrorCodes.accessDenied, ACCESS_DENIED_MESSAGE);
  }

  const isPasswordValid = await bcrypt.compare(
    parsedPayload.data.password,
    bookingRow.password_hash,
  );

  if (!isPasswordValid) {
    return failure(403, bookingErrorCodes.accessDenied, ACCESS_DENIED_MESSAGE);
  }

  const accessToken = generateAccessToken(
    config,
    bookingRow.id,
    bookingRow.phone_number,
  );

  return success({ accessToken });
};

export const getBookingDetailById = async (
  supabase: SupabaseClient,
  config: AppConfig,
  bookingId: string,
  accessToken: string,
): Promise<HandlerResult<BookingDetailResponse, BookingServiceError>> => {
  const tokenPayload = verifyAccessToken(config, accessToken);

  if (!tokenPayload || tokenPayload.bookingId !== bookingId) {
    return failure(401, bookingErrorCodes.invalidAccessToken, INVALID_ACCESS_TOKEN_MESSAGE);
  }

  const { data: bookingRow, error: bookingError } = await supabase
    .from(BOOKINGS_TABLE)
    .select(
      `
        id,
        concert_id,
        booker_name,
        phone_number,
        total_amount,
        status,
        created_at,
        cancelled_at,
        concerts:concert_id (
          id,
          title,
          venue,
          start_date,
          end_date
        )
      `,
    )
    .eq('id', bookingId)
    .single();

  if (bookingError) {
    if (bookingError.code === 'PGRST116') {
      return handlePostgrestNotFound();
    }

    return failure(
      500,
      bookingErrorCodes.detailFetchError,
      BOOKING_DETAIL_FETCH_FAILURE_MESSAGE,
      bookingError.message ?? bookingError,
    );
  }

  const bookingRowTyped = bookingRow as unknown as BookingDetailRow | null;

  if (!bookingRowTyped || !bookingRowTyped.concerts) {
    return failure(
      500,
      bookingErrorCodes.detailFetchError,
      BOOKING_DETAIL_FETCH_FAILURE_MESSAGE,
    );
  }

  const { data: seats, error: seatError } = await supabase
    .from(SEATS_TABLE)
    .select('id, section, row_number, seat_number, grade, price')
    .eq('booking_id', bookingId);

  if (seatError) {
    return failure(
      500,
      bookingErrorCodes.detailFetchError,
      BOOKING_DETAIL_FETCH_FAILURE_MESSAGE,
      seatError.message ?? seatError,
    );
  }

  const seatRows = (seats as unknown as BookingSeatRow[] | null) ?? [];

  const assembled: BookingDetailWithSeat = {
    id: bookingRowTyped.id,
    concertId: bookingRowTyped.concert_id,
    concertTitle: bookingRowTyped.concerts.title,
    concertVenue: bookingRowTyped.concerts.venue,
    concertStartDate: bookingRowTyped.concerts.start_date,
    concertEndDate: bookingRowTyped.concerts.end_date,
    bookerName: bookingRowTyped.booker_name,
    phoneNumber: bookingRowTyped.phone_number,
    totalAmount: bookingRowTyped.total_amount,
    status: bookingRowTyped.status,
    seats: seatRows.map((seat) => ({
      id: seat.id,
      section: seat.section,
      rowNumber: seat.row_number,
      seatNumber: seat.seat_number,
      grade: seat.grade,
      price: seat.price,
    })),
    createdAt: bookingRowTyped.created_at,
    cancelledAt: bookingRowTyped.cancelled_at,
  };

  const validated = BookingDetailWithSeatSchema.safeParse(assembled);

  if (!validated.success) {
    return failure(
      500,
      bookingErrorCodes.validationError,
      RESPONSE_PARSE_FAILURE_MESSAGE,
      validated.error.format(),
    );
  }

  return success(BookingDetailResponseSchema.parse({ booking: validated.data }));
};

export const cancelBooking = async (
  supabase: SupabaseClient,
  config: AppConfig,
  bookingId: string,
  accessToken: string,
): Promise<HandlerResult<CancelBookingResponse, BookingServiceError>> => {
  const tokenPayload = verifyAccessToken(config, accessToken);

  if (!tokenPayload || tokenPayload.bookingId !== bookingId) {
    return failure(401, bookingErrorCodes.invalidAccessToken, INVALID_ACCESS_TOKEN_MESSAGE);
  }

  const { data: bookingRow, error: bookingError } = await supabase
    .from(BOOKINGS_TABLE)
    .select('id, phone_number')
    .eq('id', bookingId)
    .single();

  if (bookingError) {
    if (bookingError.code === 'PGRST116') {
      return handlePostgrestNotFound();
    }

    return failure(
      500,
      bookingErrorCodes.fetchError,
      BOOKING_FETCH_FAILURE_MESSAGE,
      bookingError.message ?? bookingError,
    );
  }

  if (bookingRow.phone_number !== tokenPayload.phoneNumber) {
    return failure(403, bookingErrorCodes.accessDenied, ACCESS_DENIED_MESSAGE);
  }

  const { data, error } = await supabase.rpc(CANCEL_BOOKING_FUNCTION, {
    booking_id: bookingId,
    cancellation_window_hours: config.booking.cancellationWindowHours,
  });

  if (error) {
    const details = parseRpcDetails(error.details ?? error.message);

    switch (error.message) {
      case bookingErrorCodes.cancelNotAllowed: {
        return failure(
          403,
          bookingErrorCodes.cancelNotAllowed,
          `공연 시작 ${config.booking.cancellationWindowHours}시간 전까지만 취소할 수 있습니다.`,
          details,
        );
      }
      case bookingErrorCodes.alreadyCancelled: {
        return failure(
          409,
          bookingErrorCodes.alreadyCancelled,
          '이미 취소된 예약입니다.',
          details,
        );
      }
      case bookingErrorCodes.notFound: {
        return handlePostgrestNotFound();
      }
      default: {
        return failure(
          500,
          bookingErrorCodes.cancelError,
          CANCELLATION_FAILURE_MESSAGE,
          details,
        );
      }
    }
  }

  const parsed = CancelBookingResponseSchema.safeParse(data);

  if (!parsed.success) {
    return failure(
      500,
      bookingErrorCodes.validationError,
      RESPONSE_PARSE_FAILURE_MESSAGE,
      parsed.error.format(),
    );
  }

  return success(parsed.data);
};
