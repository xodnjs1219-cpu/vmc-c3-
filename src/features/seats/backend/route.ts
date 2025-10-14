import type { Hono } from 'hono';
import {
  failure,
  respond,
  type ErrorResult,
} from '@/backend/http/response';
import {
  getLogger,
  getSupabase,
  type AppEnv,
} from '@/backend/hono/context';
import {
  seatErrorCodes,
  type SeatServiceError,
} from '@/features/seats/backend/error';
import {
  getSeatStatus,
  getSeats,
  releaseSeats,
  reserveSeats,
  validateSeatSelection,
} from '@/features/seats/backend/service';
import {
  ReserveSeatRequestSchema,
  ReleaseSeatRequestSchema,
  SeatQuerySchema,
  ValidateSelectionRequestSchema,
} from '@/features/seats/backend/schema';

const INVALID_CONCERT_ID_MESSAGE = '콘서트 식별자가 필요합니다.';
const INVALID_PAYLOAD_MESSAGE = '요청 본문 형식이 올바르지 않습니다.';

export const registerSeatRoutes = (app: Hono<AppEnv>) => {
  app.get('/seats', async (c) => {
    const logger = getLogger(c);
    const concertId = c.req.query('concertId');
    const parsed = SeatQuerySchema.safeParse({ concertId });

    if (!parsed.success) {
      logger.warn('Invalid seat query params received', parsed.error.flatten());
      return respond(
        c,
        failure(400, seatErrorCodes.validationError, INVALID_CONCERT_ID_MESSAGE, parsed.error.format()),
      );
    }

    const supabase = getSupabase(c);
    const result = await getSeats(supabase, parsed.data.concertId);

    if (!result.ok) {
      const errorResult = result as ErrorResult<SeatServiceError, unknown>;
      logger.error('좌석 배치도 조회 중 오류 발생', errorResult.error.message);
    }

    return respond(c, result);
  });

  app.get('/seats/status', async (c) => {
    const logger = getLogger(c);
    const concertId = c.req.query('concertId');
    const parsed = SeatQuerySchema.safeParse({ concertId });

    if (!parsed.success) {
      logger.warn('Invalid seat status query params received', parsed.error.flatten());
      return respond(
        c,
        failure(400, seatErrorCodes.validationError, INVALID_CONCERT_ID_MESSAGE, parsed.error.format()),
      );
    }

    const supabase = getSupabase(c);
    const result = await getSeatStatus(supabase, parsed.data.concertId);

    if (!result.ok) {
      const errorResult = result as ErrorResult<SeatServiceError, unknown>;
      logger.error('좌석 상태 조회 중 오류 발생', errorResult.error.message);
    }

    return respond(c, result);
  });

  app.post('/seats/reserve', async (c) => {
    const logger = getLogger(c);
    const body = await c.req.json().catch(() => null);

    if (!body) {
      logger.warn('Seat reserve request body is missing or invalid JSON');
      return respond(
        c,
        failure(400, seatErrorCodes.validationError, INVALID_PAYLOAD_MESSAGE),
      );
    }

    const parsedBody = ReserveSeatRequestSchema.safeParse(body);

    if (!parsedBody.success) {
      logger.warn('Invalid seat reserve payload received', parsedBody.error.flatten());
      return respond(
        c,
        failure(400, seatErrorCodes.validationError, INVALID_PAYLOAD_MESSAGE, parsedBody.error.format()),
      );
    }

    const supabase = getSupabase(c);
    const result = await reserveSeats(supabase, parsedBody.data);

    if (!result.ok) {
      const errorResult = result as ErrorResult<SeatServiceError, unknown>;
      logger.warn('좌석 선점 처리 중 실패', errorResult.error.message);
    }

    return respond(c, result);
  });

  app.post('/seats/release', async (c) => {
    const logger = getLogger(c);
    const body = await c.req.json().catch(() => null);

    if (!body) {
      logger.warn('Seat release request body is missing or invalid JSON');
      return respond(
        c,
        failure(400, seatErrorCodes.validationError, INVALID_PAYLOAD_MESSAGE),
      );
    }

    const parsedBody = ReleaseSeatRequestSchema.safeParse(body);

    if (!parsedBody.success) {
      logger.warn('Invalid seat release payload received', parsedBody.error.flatten());
      return respond(
        c,
        failure(400, seatErrorCodes.validationError, INVALID_PAYLOAD_MESSAGE, parsedBody.error.format()),
      );
    }

    const supabase = getSupabase(c);
    const result = await releaseSeats(supabase, parsedBody.data);

    if (!result.ok) {
      const errorResult = result as ErrorResult<SeatServiceError, unknown>;
      logger.warn('좌석 해제 처리 중 실패', errorResult.error.message);
    }

    return respond(c, result);
  });

  app.post('/bookings/validate', async (c) => {
    const logger = getLogger(c);
    const body = await c.req.json().catch(() => null);

    if (!body) {
      logger.warn('Booking validate request body is missing or invalid JSON');
      return respond(
        c,
        failure(400, seatErrorCodes.validationError, INVALID_PAYLOAD_MESSAGE),
      );
    }

    const parsedBody = ValidateSelectionRequestSchema.safeParse(body);

    if (!parsedBody.success) {
      logger.warn('Invalid booking validate payload received', parsedBody.error.flatten());
      return respond(
        c,
        failure(400, seatErrorCodes.validationError, INVALID_PAYLOAD_MESSAGE, parsedBody.error.format()),
      );
    }

    const supabase = getSupabase(c);
    const result = await validateSeatSelection(supabase, parsedBody.data);

    if (!result.ok) {
      const errorResult = result as ErrorResult<SeatServiceError, unknown>;
      logger.warn('좌석 검증 처리 중 실패', errorResult.error.message);
    }

    return respond(c, result);
  });
};
