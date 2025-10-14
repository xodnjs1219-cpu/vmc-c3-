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
  parseConcertQueryParams,
} from '@/features/concerts/backend/service';

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
};
