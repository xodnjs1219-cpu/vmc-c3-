-- Migration: create cancel_booking function for atomic booking cancellations
-- Description: Provides transactional booking cancellation with seat restoration and policy enforcement.

create or replace function public.cancel_booking(
  p_booking_id uuid,
  p_cancellation_window_hours integer default 24
)
returns jsonb
language plpgsql
as $$
declare
  v_booking record;
  v_deadline timestamptz;
  v_cancelled_at timestamptz;
begin
  select
    b.*,
    c.start_date as concert_start_date
  into v_booking
  from public.bookings b
  join public.concerts c on c.id = b.concert_id
  where b.id = p_booking_id
  for update;

  if not found then
    raise exception using message = 'BOOKING_NOT_FOUND';
  end if;

  if v_booking.status = 'cancelled' then
    raise exception using message = 'BOOKING_ALREADY_CANCELLED';
  end if;

  if p_cancellation_window_hours is null or p_cancellation_window_hours < 0 then
    raise exception using message = 'BOOKING_CANCEL_NOT_ALLOWED', detail = 'Invalid cancellation window provided.';
  end if;

  v_deadline := v_booking.concert_start_date - make_interval(hours => p_cancellation_window_hours);

  if v_deadline <= now() then
    raise exception using message = 'BOOKING_CANCEL_NOT_ALLOWED', detail = jsonb_build_object(
      'cancellationDeadline', v_deadline,
      'concertStartDate', v_booking.concert_start_date
    )::text;
  end if;

  update public.bookings
  set status = 'cancelled',
      cancelled_at = now()
  where id = p_booking_id
  returning cancelled_at into v_cancelled_at;

  update public.seats
  set status = 'available',
      booking_id = null
  where booking_id = p_booking_id;

  return jsonb_build_object(
    'bookingId', v_booking.id,
    'status', 'cancelled',
    'cancelledAt', v_cancelled_at,
    'cancellationDeadline', v_deadline,
    'concertStartDate', v_booking.concert_start_date,
    'message', '예약이 취소되었습니다.'
  );
exception
  when others then
    raise;
end;
$$;

comment on function public.cancel_booking(uuid, integer) is 'Cancels a booking with policy validation and restores associated seats.';
