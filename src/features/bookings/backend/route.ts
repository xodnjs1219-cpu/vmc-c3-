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
import { bookingErrorCodes } from '@/features/bookings/backend/error';
import { createBooking } from '@/features/bookings/backend/service';
import { CreateBookingRequestSchema } from '@/features/bookings/backend/schema';
import type { BookingServiceError } from '@/features/bookings/backend/error';

const INVALID_JSON_MESSAGE = '요청 본문을 읽을 수 없습니다.';

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
};
