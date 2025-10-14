import type { Hono } from 'hono';
import {
  failure,
  respond,
  type ErrorResult,
} from '@/backend/http/response';
import {
  getConfig,
  getLogger,
  getSupabase,
  type AppEnv,
} from '@/backend/hono/context';
import {
  bookingErrorCodes,
  type BookingServiceError,
} from '@/features/bookings/backend/error';
import {
  cancelBooking,
  createBooking,
  getBookingDetailById,
  verifyBookingAccess,
} from '@/features/bookings/backend/service';
import {
  BookingDetailParamSchema,
  BookingVerifyRequestSchema,
  CreateBookingRequestSchema,
} from '@/features/bookings/backend/schema';

const INVALID_JSON_MESSAGE = '요청 본문을 읽을 수 없습니다.';
const INVALID_AUTH_HEADER_MESSAGE = 'Authorization 헤더가 필요합니다.';
const INVALID_AUTH_FORMAT_MESSAGE = 'Authorization 헤더 형식이 올바르지 않습니다.';
const AUTH_SCHEME = 'Bearer ';

export const registerBookingRoutes = (app: Hono<AppEnv>) => {
  app.post('/bookings', async (c) => {
    const logger = getLogger(c);
    let body: unknown;

    try {
      body = await c.req.json();
    } catch (jsonError) {
      logger.warn('예매 생성 요청 본문 파싱에 실패했습니다.', jsonError);
      return respond(
        c,
        failure(400, bookingErrorCodes.validationError, INVALID_JSON_MESSAGE),
      );
    }

    const parsed = CreateBookingRequestSchema.safeParse(body);

    if (!parsed.success) {
      logger.warn('예매 생성 요청 검증 실패', parsed.error.flatten());
      return respond(
        c,
        failure(
          400,
          bookingErrorCodes.validationError,
          '요청 데이터가 올바르지 않습니다.',
          parsed.error.format(),
        ),
      );
    }

    const supabase = getSupabase(c);
    const result = await createBooking(supabase, parsed.data);

    if (!result.ok) {
      const errorResult = result as ErrorResult<BookingServiceError, unknown>;
      logger.error('예매 생성 중 오류 발생', errorResult.error);
      return respond(c, errorResult);
    }

    logger.info('예매 생성 성공', { bookingId: result.data.id });
    return respond(c, result);
  });

  app.post('/bookings/:bookingId/verify', async (c) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);
    const config = getConfig(c);

    const bookingIdParam = BookingDetailParamSchema.safeParse({
      bookingId: c.req.param('bookingId'),
    });

    if (!bookingIdParam.success) {
      logger.warn('예약 접근 검증 - 잘못된 파라미터', bookingIdParam.error.format());
      return respond(
        c,
        failure(
          400,
          bookingErrorCodes.validationError,
          '예약 식별자를 확인해주세요.',
          bookingIdParam.error.format(),
        ),
      );
    }

    let body: unknown;

    try {
      body = await c.req.json();
    } catch (parseError) {
      logger.warn('예약 접근 검증 본문 파싱 실패', parseError);
      return respond(
        c,
        failure(400, bookingErrorCodes.validationError, INVALID_JSON_MESSAGE),
      );
    }

    const payload = BookingVerifyRequestSchema.safeParse(body);

    if (!payload.success) {
      logger.warn('예약 접근 검증 스키마 실패', payload.error.format());
      return respond(
        c,
        failure(
          400,
          bookingErrorCodes.validationError,
          '인증 정보를 확인해주세요.',
          payload.error.format(),
        ),
      );
    }

    const result = await verifyBookingAccess(
      supabase,
      config,
      bookingIdParam.data.bookingId,
      payload.data,
    );

    if (!result.ok) {
      const errorResult = result as ErrorResult<BookingServiceError, unknown>;
      logger.warn('예약 접근 검증 실패', errorResult.error);
    }

    return respond(c, result);
  });

  app.get('/bookings/:bookingId/detail', async (c) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);
    const config = getConfig(c);
    const authorization = c.req.header('Authorization');

    if (!authorization) {
      return respond(
        c,
        failure(401, bookingErrorCodes.invalidAccessToken, INVALID_AUTH_HEADER_MESSAGE),
      );
    }

    if (!authorization.startsWith(AUTH_SCHEME)) {
      return respond(
        c,
        failure(401, bookingErrorCodes.invalidAccessToken, INVALID_AUTH_FORMAT_MESSAGE),
      );
    }

    const bookingIdParam = BookingDetailParamSchema.safeParse({
      bookingId: c.req.param('bookingId'),
    });

    if (!bookingIdParam.success) {
      logger.warn('예약 상세 조회 - 잘못된 파라미터', bookingIdParam.error.format());
      return respond(
        c,
        failure(
          400,
          bookingErrorCodes.validationError,
          '예약 식별자를 확인해주세요.',
          bookingIdParam.error.format(),
        ),
      );
    }

    const accessToken = authorization.slice(AUTH_SCHEME.length);
    const result = await getBookingDetailById(
      supabase,
      config,
      bookingIdParam.data.bookingId,
      accessToken,
    );

    if (!result.ok) {
      const errorResult = result as ErrorResult<BookingServiceError, unknown>;
      logger.warn('예약 상세 조회 실패', errorResult.error);
    }

    return respond(c, result);
  });

  app.delete('/bookings/:bookingId', async (c) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);
    const config = getConfig(c);
    const authorization = c.req.header('Authorization');

    if (!authorization) {
      return respond(
        c,
        failure(401, bookingErrorCodes.invalidAccessToken, INVALID_AUTH_HEADER_MESSAGE),
      );
    }

    if (!authorization.startsWith(AUTH_SCHEME)) {
      return respond(
        c,
        failure(401, bookingErrorCodes.invalidAccessToken, INVALID_AUTH_FORMAT_MESSAGE),
      );
    }

    const bookingIdParam = BookingDetailParamSchema.safeParse({
      bookingId: c.req.param('bookingId'),
    });

    if (!bookingIdParam.success) {
      logger.warn('예약 취소 - 잘못된 파라미터', bookingIdParam.error.format());
      return respond(
        c,
        failure(
          400,
          bookingErrorCodes.validationError,
          '예약 식별자를 확인해주세요.',
          bookingIdParam.error.format(),
        ),
      );
    }

    const accessToken = authorization.slice(AUTH_SCHEME.length);
    const result = await cancelBooking(
      supabase,
      config,
      bookingIdParam.data.bookingId,
      accessToken,
    );

    if (!result.ok) {
      const errorResult = result as ErrorResult<BookingServiceError, unknown>;
      logger.warn('예약 취소 실패', errorResult.error);
    }

    return respond(c, result);
  });
};
