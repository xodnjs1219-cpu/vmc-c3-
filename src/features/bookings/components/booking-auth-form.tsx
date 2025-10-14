"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  bookingLookupSchema,
  type BookingLookupFormData,
} from '@/features/bookings/lib/validation';

const PHONE_NUMBER_FIELD_ID = 'phoneNumber';
const PASSWORD_FIELD_ID = 'password';
const AUTH_SUBMIT_LABEL = '확인';
const AUTH_SUBMIT_LOADING_LABEL = '인증 중...';

type BookingAuthFormProps = {
  onSubmit: (data: BookingLookupFormData) => void;
  isLoading: boolean;
  errorMessage?: string;
};

export function BookingAuthForm({ onSubmit, isLoading, errorMessage }: BookingAuthFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<BookingLookupFormData>({
    resolver: zodResolver(bookingLookupSchema),
    mode: 'onChange',
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 rounded-lg border border-slate-800 bg-slate-900/40 p-6"
    >
      <div className="space-y-2">
        <Label htmlFor={PHONE_NUMBER_FIELD_ID} className="text-slate-200">
          휴대폰 번호
        </Label>
        <Input
          id={PHONE_NUMBER_FIELD_ID}
          type="tel"
          placeholder="010-1234-5678"
          autoComplete="tel"
          disabled={isLoading}
          className="border-slate-700 bg-slate-950 text-white placeholder:text-slate-600"
          {...register('phoneNumber')}
        />
        {errors.phoneNumber ? (
          <p className="text-sm text-red-400">{errors.phoneNumber.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor={PASSWORD_FIELD_ID} className="text-slate-200">
          비밀번호 (4자리)
        </Label>
        <Input
          id={PASSWORD_FIELD_ID}
          type="password"
          placeholder="0000"
          maxLength={4}
          autoComplete="off"
          inputMode="numeric"
          disabled={isLoading}
          className="border-slate-700 bg-slate-950 text-white placeholder:text-slate-600"
          {...register('password')}
        />
        {errors.password ? (
          <p className="text-sm text-red-400">{errors.password.message}</p>
        ) : null}
      </div>

      {errorMessage ? (
        <p className="text-sm text-red-400" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={!isValid || isLoading}
        className="w-full bg-emerald-600 text-white hover:bg-emerald-500"
      >
        {isLoading ? AUTH_SUBMIT_LOADING_LABEL : AUTH_SUBMIT_LABEL}
      </Button>
    </form>
  );
}
