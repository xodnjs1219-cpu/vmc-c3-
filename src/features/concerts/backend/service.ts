import type { SupabaseClient } from '@supabase/supabase-js';
import { match } from 'ts-pattern';
import {
  failure,
  success,
  type HandlerResult,
} from '@/backend/http/response';
import {
  ConcertQuerySchema,
  ConcertResponseSchema,
  ConcertTableRowSchema,
  ConcertsListResponseSchema,
  type ConcertQueryParams,
  type ConcertResponse,
  type ConcertsListResponse,
} from '@/features/concerts/backend/schema';
import {
  concertErrorCodes,
  type ConcertServiceError,
} from '@/features/concerts/backend/error';
import {
  CONCERT_DEFAULT_PAGE_SIZE,
  CONCERT_PLACEHOLDER_IMAGE_DIMENSIONS,
  CONCERT_SORT_OPTIONS,
} from '@/features/concerts/constants';

const CONCERTS_TABLE = 'concerts';
const PUBLISHED_STATUS = 'published';

const toPlaceholderImage = (seed: string) =>
  `https://picsum.photos/seed/${encodeURIComponent(seed)}/${CONCERT_PLACEHOLDER_IMAGE_DIMENSIONS.width}/${CONCERT_PLACEHOLDER_IMAGE_DIMENSIONS.height}`;

const sanitizeSearchTerm = (term: string) => term.replace(/%/g, '\\%').replace(/_/g, '\\_');

export const parseConcertQueryParams = (raw: Record<string, string | string[] | undefined>) =>
  ConcertQuerySchema.safeParse(
    Object.fromEntries(
      Object.entries(raw).map(([key, value]) => [
        key,
        Array.isArray(value) ? value.at(-1) : value,
      ]),
    ),
  );

export const getConcerts = async (
  client: SupabaseClient,
  params: ConcertQueryParams,
): Promise<HandlerResult<ConcertsListResponse, ConcertServiceError, unknown>> => {
  const page = params.page ?? 1;
  const limit = params.limit ?? CONCERT_DEFAULT_PAGE_SIZE;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = client
    .from(CONCERTS_TABLE)
    .select(
      'id, title, description, image_url, venue, start_date, end_date, status, created_at, updated_at',
      { count: 'exact' },
    )
    .eq('status', PUBLISHED_STATUS)
    .range(from, to);

  if (params.search) {
    const escaped = sanitizeSearchTerm(params.search);
    query = query.or(
      `title.ilike.%${escaped}%,description.ilike.%${escaped}%,venue.ilike.%${escaped}%`,
    );
  }

  if (params.genre) {
    query = query.eq('genre', params.genre);
  }

  if (params.region) {
    query = query.eq('region', params.region);
  }

  if (params.startDate) {
    query = query.gte('start_date', params.startDate);
  }

  if (params.endDate) {
    query = query.lte('end_date', params.endDate);
  }

  const sortOption = params.sort ?? CONCERT_SORT_OPTIONS.latest;

  query = match(sortOption)
    .with(CONCERT_SORT_OPTIONS.latest, () => query.order('created_at', { ascending: false }))
    .with(CONCERT_SORT_OPTIONS.deadline, () => query.order('start_date', { ascending: true }))
    .with(CONCERT_SORT_OPTIONS.alphabetical, () => query.order('title', { ascending: true }))
    .otherwise(() => query.order('created_at', { ascending: false }));

  const { data, error, count } = await query;

  if (error) {
    return failure(500, concertErrorCodes.fetchError, error.message);
  }

  const rowsParse = ConcertTableRowSchema.array().safeParse(data ?? []);

  if (!rowsParse.success) {
    return failure(
      500,
      concertErrorCodes.validationError,
      'Concert rows failed validation.',
      rowsParse.error.format(),
    );
  }

  const mapped = rowsParse.data.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    imageUrl: row.image_url ?? toPlaceholderImage(row.id),
    venue: row.venue,
    startDate: row.start_date,
    endDate: row.end_date,
  } satisfies ConcertResponse));

  const parsed = ConcertsListResponseSchema.safeParse({
    concerts: mapped,
    pagination: {
      currentPage: page,
      totalPages: count ? Math.ceil(count / limit) : 0,
      totalItems: count ?? 0,
      itemsPerPage: limit,
    },
  });

  if (!parsed.success) {
    return failure(
      500,
      concertErrorCodes.validationError,
      'Concert payload failed validation.',
      parsed.error.format(),
    );
  }

  return success(parsed.data);
};
