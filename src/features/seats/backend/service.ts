import type { SupabaseClient } from '@supabase/supabase-js';
import { addMilliseconds, isAfter } from 'date-fns';
import { z } from 'zod';
import {
  failure,
  success,
  type HandlerResult,
} from '@/backend/http/response';
import {
  seatErrorCodes,
  type SeatServiceError,
} from '@/features/seats/backend/error';
import {
  ReserveSeatRequestSchema,
  ReserveSeatResponseSchema,
  ReleaseSeatRequestSchema,
  ReleaseSeatResponseSchema,
  SeatSchema,
  SeatStatusItemSchema,
  SeatStatusResponseSchema,
  SeatsResponseSchema,
  ValidateSelectionRequestSchema,
  ValidateSelectionResponseSchema,
  type ReserveSeatRequest,
  type ReserveSeatResponse,
  type ReleaseSeatRequest,
  type ReleaseSeatResponse,
  type SeatStatusResponse,
  type SeatsResponse,
  type ValidateSelectionRequest,
  type ValidateSelectionResponse,
  type Seat,
} from '@/features/seats/backend/schema';
import {
  SEAT_STATUS,
  SESSION_TIMEOUT_MS,
} from '@/features/seats/constants';

const SEATS_TABLE = 'seats';
const CONCERTS_TABLE = 'concerts';
const SEAT_SELECT_FIELDS =
  'id, concert_id, section, row_number, seat_number, grade, price, status, session_id, reserved_at, booking_id';

const SeatRowSchema = z.object({
  id: z.string().uuid(),
  concert_id: z.string().uuid(),
  section: z.string(),
  row_number: z.string(),
  seat_number: z.string(),
  grade: z.string(),
  price: z.number().int(),
  status: z.string(),
  session_id: z.string().nullable(),
  reserved_at: z.string().datetime({ offset: true }).nullable(),
  booking_id: z.string().uuid().nullable(),
});

const SeatStatusRowSchema = z.object({
  id: z.string().uuid(),
  status: z.string(),
  session_id: z.string().nullable(),
});

const mapRowToSeat = (row: z.infer<typeof SeatRowSchema>): Seat => {
  const parsed = SeatSchema.safeParse({
    id: row.id,
    concertId: row.concert_id,
    section: row.section,
    rowNumber: row.row_number,
    seatNumber: row.seat_number,
    grade: row.grade,
    price: row.price,
    status: row.status,
    sessionId: row.session_id,
    reservedAt: row.reserved_at,
    bookingId: row.booking_id,
  });

  if (!parsed.success) {
    throw parsed.error;
  }

  return parsed.data;
};

const toSeatStatus = (row: z.infer<typeof SeatStatusRowSchema>) => {
  const parsed = SeatStatusItemSchema.safeParse({
    id: row.id,
    status: row.status,
    sessionId: row.session_id,
  });

  if (!parsed.success) {
    throw parsed.error;
  }

  return parsed.data;
};

const ensureConcertExists = async (client: SupabaseClient, concertId: string) => {
  const { error } = await client
    .from(CONCERTS_TABLE)
    .select('id')
    .eq('id', concertId)
    .single();

  return !error;
};

export const getSeats = async (
  client: SupabaseClient,
  concertId: string,
): Promise<HandlerResult<SeatsResponse, SeatServiceError, unknown>> => {
  const concertExists = await ensureConcertExists(client, concertId);

  if (!concertExists) {
    return failure(404, seatErrorCodes.seatFetchError, '콘서트 정보를 찾을 수 없습니다.');
  }

  const { data, error } = await client
    .from(SEATS_TABLE)
    .select(SEAT_SELECT_FIELDS)
    .eq('concert_id', concertId)
    .order('section', { ascending: true })
    .order('row_number', { ascending: true })
    .order('seat_number', { ascending: true });

  if (error) {
    return failure(500, seatErrorCodes.seatFetchError, error.message);
  }

  const parseResult = SeatRowSchema.array().safeParse(data ?? []);

  if (!parseResult.success) {
    return failure(
      500,
      seatErrorCodes.validationError,
      '좌석 데이터 검증에 실패했습니다.',
      parseResult.error.format(),
    );
  }

  try {
    const seats = parseResult.data.map(mapRowToSeat);
    const payload = SeatsResponseSchema.parse({ seats });
    return success(payload);
  } catch (parseError) {
    return failure(
      500,
      seatErrorCodes.validationError,
      '좌석 응답 생성에 실패했습니다.',
      parseError instanceof Error ? parseError.message : parseError,
    );
  }
};

export const getSeatStatus = async (
  client: SupabaseClient,
  concertId: string,
): Promise<HandlerResult<SeatStatusResponse, SeatServiceError, unknown>> => {
  const { data, error } = await client
    .from(SEATS_TABLE)
    .select('id, status, session_id')
    .eq('concert_id', concertId);

  if (error) {
    return failure(500, seatErrorCodes.seatStatusFetchError, error.message);
  }

  const parseResult = SeatStatusRowSchema.array().safeParse(data ?? []);

  if (!parseResult.success) {
    return failure(
      500,
      seatErrorCodes.validationError,
      '좌석 상태 데이터 검증에 실패했습니다.',
      parseResult.error.format(),
    );
  }

  try {
    const seats = parseResult.data.map(toSeatStatus);
    const payload = SeatStatusResponseSchema.parse({ seats });
    return success(payload);
  } catch (parseError) {
    return failure(
      500,
      seatErrorCodes.validationError,
      '좌석 상태 응답 생성에 실패했습니다.',
      parseError instanceof Error ? parseError.message : parseError,
    );
  }
};

const rollbackSeats = async (
  client: SupabaseClient,
  seatIds: string[],
  sessionId: string,
) => {
  if (seatIds.length === 0) {
    return;
  }

  await client
    .from(SEATS_TABLE)
    .update({
      status: SEAT_STATUS.available,
      session_id: null,
      reserved_at: null,
    })
    .in('id', seatIds)
    .eq('session_id', sessionId);
};

export const reserveSeats = async (
  client: SupabaseClient,
  payload: ReserveSeatRequest,
): Promise<HandlerResult<ReserveSeatResponse, SeatServiceError, unknown>> => {
  const parsedPayload = ReserveSeatRequestSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return failure(
      400,
      seatErrorCodes.validationError,
      '좌석 선점 요청이 잘못되었습니다.',
      parsedPayload.error.format(),
    );
  }

  const { seatIds, sessionId, concertId } = parsedPayload.data;

  const reservationTime = new Date().toISOString();

  const { data, error } = await client
    .from(SEATS_TABLE)
    .update({
      status: SEAT_STATUS.reserved,
      session_id: sessionId,
      reserved_at: reservationTime,
    })
    .eq('concert_id', concertId)
    .in('id', seatIds)
    .eq('status', SEAT_STATUS.available)
    .select(SEAT_SELECT_FIELDS);

  if (error) {
    return failure(500, seatErrorCodes.seatFetchError, error.message);
  }

  const updatedSeatIds = (data ?? []).map((row) => row.id);

  if (!data || data.length === 0) {
    return failure(409, seatErrorCodes.seatNotAvailable, '이미 선택된 좌석입니다.');
  }

  if (data.length !== seatIds.length) {
    await rollbackSeats(client, updatedSeatIds, sessionId);
    return failure(409, seatErrorCodes.seatReserveConflict, '일부 좌석이 이미 선택되었습니다.');
  }

  const parseResult = SeatRowSchema.array().safeParse(data);

  if (!parseResult.success) {
    await rollbackSeats(client, updatedSeatIds, sessionId);
    return failure(
      500,
      seatErrorCodes.validationError,
      '좌석 선점 결과 검증에 실패했습니다.',
      parseResult.error.format(),
    );
  }

  try {
    const seats = parseResult.data.map(mapRowToSeat);
    const totalAmount = seats.reduce((sum, seat) => sum + seat.price, 0);
    const expiresAt = addMilliseconds(new Date(reservationTime), SESSION_TIMEOUT_MS).toISOString();

    const response = ReserveSeatResponseSchema.parse({
      seats,
      totalAmount,
      expiresAt,
    });

    return success(response);
  } catch (parseError) {
    await rollbackSeats(client, updatedSeatIds, sessionId);
    return failure(
      500,
      seatErrorCodes.validationError,
      '좌석 선점 응답 생성에 실패했습니다.',
      parseError instanceof Error ? parseError.message : parseError,
    );
  }
};

export const releaseSeats = async (
  client: SupabaseClient,
  payload: ReleaseSeatRequest,
): Promise<HandlerResult<ReleaseSeatResponse, SeatServiceError, unknown>> => {
  const parsedPayload = ReleaseSeatRequestSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return failure(
      400,
      seatErrorCodes.validationError,
      '좌석 해제 요청이 잘못되었습니다.',
      parsedPayload.error.format(),
    );
  }

  const { concertId, seatIds, sessionId } = parsedPayload.data;

  const { data, error } = await client
    .from(SEATS_TABLE)
    .update({
      status: SEAT_STATUS.available,
      session_id: null,
      reserved_at: null,
    })
    .eq('concert_id', concertId)
    .in('id', seatIds)
    .eq('session_id', sessionId)
    .select('id');

  if (error) {
    return failure(500, seatErrorCodes.seatFetchError, error.message);
  }

  const releasedSeatIds = (data ?? []).map((row) => row.id);
  const response = ReleaseSeatResponseSchema.parse({ releasedSeatIds });
  return success(response);
};

const isSeatExpired = (seat: Seat) => {
  if (!seat.reservedAt) {
    return false;
  }

  const expiresAt = addMilliseconds(new Date(seat.reservedAt), SESSION_TIMEOUT_MS);
  return isAfter(new Date(), expiresAt);
};

export const validateSeatSelection = async (
  client: SupabaseClient,
  payload: ValidateSelectionRequest,
): Promise<HandlerResult<ValidateSelectionResponse, SeatServiceError, unknown>> => {
  const parsedPayload = ValidateSelectionRequestSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return failure(
      400,
      seatErrorCodes.validationError,
      '좌석 검증 요청이 잘못되었습니다.',
      parsedPayload.error.format(),
    );
  }

  const { concertId, seatIds, sessionId } = parsedPayload.data;

  const { data, error } = await client
    .from(SEATS_TABLE)
    .select(SEAT_SELECT_FIELDS)
    .eq('concert_id', concertId)
    .in('id', seatIds)
    .eq('session_id', sessionId)
    .eq('status', SEAT_STATUS.reserved);

  if (error) {
    return failure(500, seatErrorCodes.seatFetchError, error.message);
  }

  const parseResult = SeatRowSchema.array().safeParse(data ?? []);

  if (!parseResult.success) {
    return failure(
      500,
      seatErrorCodes.validationError,
      '좌석 검증 데이터 검증에 실패했습니다.',
      parseResult.error.format(),
    );
  }

  try {
    const seats = parseResult.data.map(mapRowToSeat);

    if (seats.length !== seatIds.length) {
      await rollbackSeats(
        client,
        seats.map((seat) => seat.id),
        sessionId,
      );
      return failure(409, seatErrorCodes.invalidSelection, '선택한 좌석 중 일부가 유효하지 않습니다.');
    }

    const expiredSeatIds = seats.filter(isSeatExpired).map((seat) => seat.id);

    if (expiredSeatIds.length > 0) {
      await rollbackSeats(client, expiredSeatIds, sessionId);
      return failure(410, seatErrorCodes.sessionExpired, '좌석 선택 시간이 만료되었습니다.');
    }

    const totalAmount = seats.reduce((sum, seat) => sum + seat.price, 0);
    const expirationTimestamps = seats
      .map((seat) => {
        if (!seat.reservedAt) {
          return null;
        }

        return addMilliseconds(new Date(seat.reservedAt), SESSION_TIMEOUT_MS).getTime();
      })
      .filter((value): value is number => value !== null);

    const expiresAt = expirationTimestamps.length > 0
      ? new Date(Math.min(...expirationTimestamps)).toISOString()
      : addMilliseconds(new Date(), SESSION_TIMEOUT_MS).toISOString();

    const response = ValidateSelectionResponseSchema.parse({
      isValid: true,
      seats,
      totalAmount,
      expiresAt,
    });

    return success(response);
  } catch (parseError) {
    return failure(
      500,
      seatErrorCodes.validationError,
      '좌석 검증 응답 생성에 실패했습니다.',
      parseError instanceof Error ? parseError.message : parseError,
    );
  }
};
