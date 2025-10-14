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
  concertErrorCodes,
  type ConcertServiceError,
} from '@/features/concerts/backend/error';
import {
  getConcerts,
  getConcertById,
  getConcertSeatAvailability,
  parseConcertQueryParams,
} from '@/features/concerts/backend/service';
import { ConcertIdParamSchema } from '@/features/concerts/backend/schema';

const INVALID_CONCERT_ID_CODE = 'INVALID_CONCERT_ID';

export const registerConcertRoutes = (app: Hono<AppEnv>) => {
  app.get('/concerts', async (c) => {
    const logger = getLogger(c);
    const rawQuery = c.req.queries();
    const parsed = parseConcertQueryParams(
      rawQuery as Record<string, string | string[] | undefined>,
    );

    if (!parsed.success) {
      logger.warn('Invalid concert query params received', parsed.error.flatten());
      return respond(
        c,
        failure(
          400,
          concertErrorCodes.validationError,
          '잘못된 콘서트 조회 파라미터입니다.',
          parsed.error.format(),
        ),
      );
    }

    const supabase = getSupabase(c);
    const result = await getConcerts(supabase, parsed.data);

    if (!result.ok) {
      const errorResult = result as ErrorResult<ConcertServiceError, unknown>;

      if (errorResult.error.code === concertErrorCodes.fetchError) {
        logger.error('콘서트 목록 조회 중 오류가 발생했습니다.', errorResult.error.message);
      }

      return respond(c, result);
    }

    return respond(c, result);
  });

  app.get('/concerts/:concertId', async (c) => {
    const logger = getLogger(c);
    const concertId = c.req.param('concertId');
    const parsedParam = ConcertIdParamSchema.safeParse({ concertId });

    if (!parsedParam.success) {
      logger.warn('Invalid concertId received', parsedParam.error.flatten());
      return respond(
        c,
        failure(
          400,
          INVALID_CONCERT_ID_CODE,
          '유효하지 않은 콘서트 식별자입니다.',
          parsedParam.error.format(),
        ),
      );
    }

    const supabase = getSupabase(c);
    const result = await getConcertById(supabase, parsedParam.data.concertId);

    if (!result.ok) {
      const errorResult = result as ErrorResult<ConcertServiceError, unknown>;
      logger.error('콘서트 상세 조회에 실패했습니다.', errorResult.error.message);
    }

    return respond(c, result);
  });

  app.get('/concerts/:concertId/seats/availability', async (c) => {
    const logger = getLogger(c);
    const concertId = c.req.param('concertId');
    const parsedParam = ConcertIdParamSchema.safeParse({ concertId });

    if (!parsedParam.success) {
      logger.warn('Invalid concertId received for seat availability', parsedParam.error.flatten());
      return respond(
        c,
        failure(
          400,
          INVALID_CONCERT_ID_CODE,
          '유효하지 않은 콘서트 식별자입니다.',
          parsedParam.error.format(),
        ),
      );
    }

    const supabase = getSupabase(c);
    const result = await getConcertSeatAvailability(supabase, parsedParam.data.concertId);

    if (!result.ok) {
      const errorResult = result as ErrorResult<ConcertServiceError, unknown>;
      logger.error('좌석 가용성 조회에 실패했습니다.', errorResult.error.message);
    }

    return respond(c, result);
  });
};
