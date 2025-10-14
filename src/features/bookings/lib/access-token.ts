import { ACCESS_TOKEN_STORAGE_KEY } from '@/features/bookings/constants';
import {
  clearToken,
  getToken,
  saveToken,
} from '@/lib/auth/token-storage';

const resolveStorageKey = (bookingId: string) => `${ACCESS_TOKEN_STORAGE_KEY}_${bookingId}`;

export const saveBookingAccessToken = (bookingId: string, token: string) =>
  saveToken(resolveStorageKey(bookingId), token);

export const getBookingAccessToken = (bookingId: string) =>
  getToken(resolveStorageKey(bookingId));

export const clearBookingAccessToken = (bookingId: string) =>
  clearToken(resolveStorageKey(bookingId));
