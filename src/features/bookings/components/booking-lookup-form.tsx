"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  bookingLookupFormSchema,
  type BookingLookupFormData,
} from '@/features/bookings/lib/validation';

const FORM_CONTAINER_CLASS = 'space-y-6 rounded-xl border border-slate-800 bg-slate-900/40 p-6 shadow-lg shadow-slate-950/30';
const FIELD_CONTAINER_CLASS = 'space-y-2';
const FIELD_LABEL_CLASS = 'text-sm font-medium text-slate-200';
const FIELD_INPUT_CLASS = 'border-slate-700 bg-slate-950/90 text-white placeholder:text-slate-600 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/60';
const FIELD_ERROR_CLASS = 'text-sm text-red-400';
const SUBMIT_BUTTON_CLASS = 'w-full bg-emerald-600 text-white hover:bg-emerald-500 focus-visible:ring-emerald-500/70';
const PHONE_FIELD_ID = 'phoneNumber';
const PASSWORD_FIELD_ID = 'password';
const SUBMIT_LABEL = '조회하기';
const SUBMIT_LOADING_LABEL = '조회 중...';

export type BookingLookupFormProps = {
  onSubmitAction: (data: BookingLookupFormData) => void;
  isLoading: boolean;
};

export function BookingLookupForm({ onSubmitAction, isLoading }: BookingLookupFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<BookingLookupFormData>({
    resolver: zodResolver(bookingLookupFormSchema),
    mode: 'onChange',
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmitAction)}
      className={FORM_CONTAINER_CLASS}
    >
      <div className={FIELD_CONTAINER_CLASS}>
        <Label htmlFor={PHONE_FIELD_ID} className={FIELD_LABEL_CLASS}>
          휴대폰 번호
        </Label>
        <Input
          id={PHONE_FIELD_ID}
          type="tel"
          placeholder="010-1234-5678"
          autoComplete="tel"
          inputMode="tel"
          className={FIELD_INPUT_CLASS}
          aria-invalid={Boolean(errors.phoneNumber)}
          {...register('phoneNumber')}
          disabled={isLoading}
        />
        {errors.phoneNumber ? (
          <p className={FIELD_ERROR_CLASS} role="alert">
            {errors.phoneNumber.message}
          </p>
        ) : null}
      </div>

      <div className={FIELD_CONTAINER_CLASS}>
        <Label htmlFor={PASSWORD_FIELD_ID} className={FIELD_LABEL_CLASS}>
          비밀번호 (4자리)
        </Label>
        <Input
          id={PASSWORD_FIELD_ID}
          type="password"
          placeholder="0000"
          maxLength={4}
          autoComplete="off"
          inputMode="numeric"
          className={FIELD_INPUT_CLASS}
          aria-invalid={Boolean(errors.password)}
          {...register('password')}
          disabled={isLoading}
        />
        {errors.password ? (
          <p className={FIELD_ERROR_CLASS} role="alert">
            {errors.password.message}
          </p>
        ) : null}
      </div>

      <Button
        type="submit"
        disabled={!isValid || isLoading}
        className={SUBMIT_BUTTON_CLASS}
      >
        {isLoading ? SUBMIT_LOADING_LABEL : SUBMIT_LABEL}
      </Button>
    </form>
  );
}
