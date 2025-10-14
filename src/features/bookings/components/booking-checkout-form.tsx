"use client";

import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { CreateBookingRequestSchema } from '@/features/bookings/backend/schema';

const CheckoutFormSchema = CreateBookingRequestSchema.pick({
  bookerName: true,
  phoneNumber: true,
  password: true,
});

export type BookingCheckoutFormValues = z.infer<typeof CheckoutFormSchema>;

export type BookingCheckoutFormProps = {
  onSubmit: (values: BookingCheckoutFormValues) => void;
  isSubmitting?: boolean;
  isDisabled?: boolean;
};

const FORM_TITLE = '예약자 정보 입력';
const FORM_DESCRIPTION = '예매 완료를 위해 아래 정보를 정확히 입력해주세요.';
const NAME_LABEL = '이름';
const NAME_PLACEHOLDER = '홍길동';
const PHONE_LABEL = '휴대폰 번호';
const PHONE_PLACEHOLDER = '010-1234-5678';
const PASSWORD_LABEL = '조회용 비밀번호 (4자리 숫자)';
const PASSWORD_PLACEHOLDER = '0000';
const SUBMIT_BUTTON_LABEL = '입력 완료하기';
const DISABLED_MESSAGE = '좌석 정보가 유효하지 않습니다. 처음부터 다시 진행해주세요.';

const normalizePhoneNumber = (value: string) => {
  const digits = value.replace(/[^0-9]/g, '');

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 7) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }

  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
};

export function BookingCheckoutForm({ onSubmit, isSubmitting = false, isDisabled = false }: BookingCheckoutFormProps) {
  const form = useForm<BookingCheckoutFormValues>({
    resolver: zodResolver(CheckoutFormSchema),
    defaultValues: {
      bookerName: '',
      phoneNumber: '',
      password: '',
    },
    mode: 'onBlur',
  });

  const handleSubmit = form.handleSubmit(onSubmit);

  useEffect(() => {
    if (!isDisabled) {
      return;
    }

    form.reset();
  }, [form, isDisabled]);

  return (
    <div className="space-y-6 rounded-xl border border-slate-700 bg-slate-800/70 p-6 text-slate-200">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-white">{FORM_TITLE}</h2>
        <p className="text-sm text-slate-300">{FORM_DESCRIPTION}</p>
      </div>

      {isDisabled ? (
        <p className="rounded-md border border-red-800 bg-red-900/30 p-4 text-sm text-red-200">
          {DISABLED_MESSAGE}
        </p>
      ) : null}

      <Form {...form}>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <FormField
            control={form.control}
            name="bookerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{NAME_LABEL}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={NAME_PLACEHOLDER}
                    disabled={isSubmitting || isDisabled}
                    autoComplete="name"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{PHONE_LABEL}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={PHONE_PLACEHOLDER}
                    disabled={isSubmitting || isDisabled}
                    inputMode="tel"
                    maxLength={13}
                    autoComplete="tel-national"
                    onChange={(event) => field.onChange(normalizePhoneNumber(event.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{PASSWORD_LABEL}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={PASSWORD_PLACEHOLDER}
                    disabled={isSubmitting || isDisabled}
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    autoComplete="off"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full bg-amber-500 text-slate-950 hover:bg-amber-600"
            disabled={isSubmitting || isDisabled}
          >
            {SUBMIT_BUTTON_LABEL}
          </Button>
        </form>
      </Form>
    </div>
  );
}
