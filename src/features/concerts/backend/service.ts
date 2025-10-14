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
  ConcertDetailResponseSchema,
  SeatAvailabilityResponseSchema,
  type ConcertQueryParams,
  type ConcertResponse,
  type ConcertsListResponse,
  type ConcertDetailResponse,
  type SeatAvailabilityResponse,
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
const SEATS_TABLE = 'seats';
const AVAILABLE_STATUS = 'available';

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

export const getConcertById = async (
  client: SupabaseClient,
  concertId: string,
): Promise<HandlerResult<ConcertDetailResponse, ConcertServiceError, unknown>> => {
  const { data, error } = await client
    .from(CONCERTS_TABLE)
    .select('id, title, description, image_url, venue, start_date, end_date, status, max_tickets_per_booking')
    .eq('id', concertId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return failure(404, concertErrorCodes.notFound, 'Concert not found.');
    }

    return failure(500, concertErrorCodes.fetchError, error.message);
  }

  if (data.status !== PUBLISHED_STATUS) {
    return failure(400, concertErrorCodes.notAvailable, 'This concert is not available for booking.');
  }

  const parsed = ConcertDetailResponseSchema.safeParse({
    id: data.id,
    title: data.title,
    description: data.description,
    imageUrl: data.image_url ?? toPlaceholderImage(data.id),
    venue: data.venue,
    startDate: data.start_date,
    endDate: data.end_date,
    status: data.status,
    maxTicketsPerBooking: data.max_tickets_per_booking,
  });

  if (!parsed.success) {
    return failure(
      500,
      concertErrorCodes.validationError,
      'Concert detail failed validation.',
      parsed.error.format(),
    );
  }

  return success(parsed.data);
};

export const getConcertSeatAvailability = async (
  client: SupabaseClient,
  concertId: string,
): Promise<HandlerResult<SeatAvailabilityResponse, ConcertServiceError, unknown>> => {
  const { error: concertError } = await client
    .from(CONCERTS_TABLE)
    .select('id')
    .eq('id', concertId)
    .single();

  if (concertError) {
    if (concertError.code === 'PGRST116') {
      return failure(404, concertErrorCodes.notFound, 'Concert not found.');
    }

    return failure(500, concertErrorCodes.fetchError, concertError.message);
  }

  const { data, error } = await client
    .from(SEATS_TABLE)
    .select('grade, price')
    .eq('concert_id', concertId)
    .eq('status', AVAILABLE_STATUS);

  if (error) {
    return failure(500, concertErrorCodes.seatAvailabilityFetchError, error.message);
  }

  const gradeMap = new Map<string, { price: number; count: number }>();

  (data ?? []).forEach((row) => {
    const current = gradeMap.get(row.grade);

    if (current) {
      current.count += 1;
      return;
    }

    gradeMap.set(row.grade, { price: row.price, count: 1 });
  });

  const gradeOrder = ['vip', 'r', 's', 'a'];
  const grades = Array.from(gradeMap.entries())
    .map(([grade, info]) => ({
      grade,
      price: info.price,
      availableCount: info.count,
    }))
    .sort((a, b) => {
      const indexA = gradeOrder.indexOf(a.grade);
      const indexB = gradeOrder.indexOf(b.grade);

      const safeIndexA = indexA === -1 ? Number.MAX_SAFE_INTEGER : indexA;
      const safeIndexB = indexB === -1 ? Number.MAX_SAFE_INTEGER : indexB;

      return safeIndexA - safeIndexB;
    });

  const totalAvailable = grades.reduce((sum, item) => sum + item.availableCount, 0);

  const parsed = SeatAvailabilityResponseSchema.safeParse({
    grades,
    totalAvailable,
  });

  if (!parsed.success) {
    return failure(
      500,
      concertErrorCodes.validationError,
      'Seat availability failed validation.',
      parsed.error.format(),
    );
  }

  return success(parsed.data);
};
