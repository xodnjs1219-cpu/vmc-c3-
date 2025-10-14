import { z } from 'zod';
import {
  CONCERT_DEFAULT_PAGE_SIZE,
  CONCERT_MAX_PAGE_SIZE,
  CONCERT_SORT_OPTIONS,
} from '@/features/concerts/constants';

const sortValues = Object.values(CONCERT_SORT_OPTIONS) as [string, ...string[]];

export const ConcertSortSchema = z.enum(sortValues);

export const ConcertQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
  genre: z.string().trim().min(1).optional(),
  region: z.string().trim().min(1).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  sort: ConcertSortSchema.optional().default(CONCERT_SORT_OPTIONS.latest),
  page: z
    .coerce
    .number()
    .int()
    .positive()
    .optional()
    .default(1),
  limit: z
    .coerce
    .number()
    .int()
    .positive()
    .max(CONCERT_MAX_PAGE_SIZE)
    .optional()
    .default(CONCERT_DEFAULT_PAGE_SIZE),
});

export type ConcertQueryParams = z.infer<typeof ConcertQuerySchema>;

export const ConcertTableRowSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  image_url: z.string().url().nullable(),
  venue: z.string(),
  start_date: z.string(),
  end_date: z.string(),
  status: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type ConcertTableRow = z.infer<typeof ConcertTableRowSchema>;

export const ConcertResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  imageUrl: z.string().url(),
  venue: z.string(),
  startDate: z.string(),
  endDate: z.string(),
});

export type ConcertResponse = z.infer<typeof ConcertResponseSchema>;

export const ConcertIdParamSchema = z.object({
  concertId: z.string().uuid(),
});

export type ConcertIdParam = z.infer<typeof ConcertIdParamSchema>;

export const SeatGradeSchema = z.enum(['vip', 'r', 's', 'a']);

export type SeatGrade = z.infer<typeof SeatGradeSchema>;

export const ConcertDetailResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  imageUrl: z.string().url(),
  venue: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  status: z.string(),
  maxTicketsPerBooking: z.number().int().positive(),
});

export type ConcertDetailResponse = z.infer<typeof ConcertDetailResponseSchema>;

export const SeatAvailabilitySchema = z.object({
  grade: SeatGradeSchema,
  price: z.number().int().nonnegative(),
  availableCount: z.number().int().nonnegative(),
});

export type SeatAvailability = z.infer<typeof SeatAvailabilitySchema>;

export const SeatAvailabilityResponseSchema = z.object({
  grades: z.array(SeatAvailabilitySchema),
  totalAvailable: z.number().int().nonnegative(),
});

export type SeatAvailabilityResponse = z.infer<typeof SeatAvailabilityResponseSchema>;

export const PaginationSchema = z.object({
  currentPage: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  totalItems: z.number().int().nonnegative(),
  itemsPerPage: z.number().int().positive(),
});

export type ConcertPagination = z.infer<typeof PaginationSchema>;

export const ConcertsListResponseSchema = z.object({
  concerts: z.array(ConcertResponseSchema),
  pagination: PaginationSchema,
});

export type ConcertsListResponse = z.infer<typeof ConcertsListResponseSchema>;
