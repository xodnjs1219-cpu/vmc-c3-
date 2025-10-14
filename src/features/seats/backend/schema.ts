import { z } from 'zod';
import {
  SEAT_GRADES,
  SEAT_STATUS,
  SESSION_TIMEOUT_MS,
} from '@/features/seats/constants';

export const SeatStatusSchema = z.enum([
  SEAT_STATUS.available,
  SEAT_STATUS.reserved,
  SEAT_STATUS.booked,
]);

export const SeatGradeSchema = z.enum([
  SEAT_GRADES.vip,
  SEAT_GRADES.r,
  SEAT_GRADES.s,
  SEAT_GRADES.a,
]);

export const SeatSchema = z.object({
  id: z.string().uuid(),
  concertId: z.string().uuid(),
  section: z.string().min(1),
  rowNumber: z.string().min(1),
  seatNumber: z.string().min(1),
  grade: SeatGradeSchema,
  price: z.number().int().nonnegative(),
  status: SeatStatusSchema,
  sessionId: z.string().nullable().optional(),
  reservedAt: z.string().datetime({ offset: true }).nullable().optional(),
  bookingId: z.string().uuid().nullable().optional(),
});

export const SeatStatusItemSchema = z.object({
  id: z.string().uuid(),
  status: SeatStatusSchema,
  sessionId: z.string().nullable().optional(),
});

export const SeatsResponseSchema = z.object({
  seats: SeatSchema.array(),
});

export const SeatStatusResponseSchema = z.object({
  seats: SeatStatusItemSchema.array(),
});

export const SeatQuerySchema = z.object({
  concertId: z.string().uuid(),
});

export const ReserveSeatRequestSchema = z.object({
  concertId: z.string().uuid(),
  seatIds: z.array(z.string().uuid()).min(1),
  sessionId: z.string().min(1),
});

export const ReserveSeatResponseSchema = z.object({
  seats: SeatSchema.array(),
  totalAmount: z.number().int().nonnegative(),
  expiresAt: z.string().datetime({ offset: true }),
});

export const ReleaseSeatRequestSchema = z.object({
  concertId: z.string().uuid(),
  seatIds: z.array(z.string().uuid()).min(1),
  sessionId: z.string().min(1),
});

export const ReleaseSeatResponseSchema = z.object({
  releasedSeatIds: z.array(z.string().uuid()),
});

export const ValidateSelectionRequestSchema = z.object({
  concertId: z.string().uuid(),
  seatIds: z.array(z.string().uuid()).min(1),
  sessionId: z.string().min(1),
});

export const ValidateSelectionResponseSchema = z.object({
  isValid: z.literal(true),
  seats: SeatSchema.array(),
  totalAmount: z.number().int().nonnegative(),
  expiresAt: z.string().datetime({ offset: true }),
});

export const SeatSessionSchema = z.object({
  sessionId: z.string().min(1),
  expiresAt: z.string().datetime({ offset: true }),
});

export const SessionTimeoutSchema = z.object({
  timeoutMs: z.number().int().positive().default(SESSION_TIMEOUT_MS),
});

export type Seat = z.infer<typeof SeatSchema>;
export type SeatStatusItem = z.infer<typeof SeatStatusItemSchema>;
export type SeatsResponse = z.infer<typeof SeatsResponseSchema>;
export type SeatStatusResponse = z.infer<typeof SeatStatusResponseSchema>;
export type ReserveSeatRequest = z.infer<typeof ReserveSeatRequestSchema>;
export type ReserveSeatResponse = z.infer<typeof ReserveSeatResponseSchema>;
export type ReleaseSeatRequest = z.infer<typeof ReleaseSeatRequestSchema>;
export type ReleaseSeatResponse = z.infer<typeof ReleaseSeatResponseSchema>;
export type ValidateSelectionRequest = z.infer<typeof ValidateSelectionRequestSchema>;
export type ValidateSelectionResponse = z.infer<typeof ValidateSelectionResponseSchema>;
