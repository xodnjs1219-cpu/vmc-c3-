-- Migration: fix finalize_booking function to avoid FOR UPDATE with array_agg
-- Description: Rewrites finalize_booking to properly lock seats before aggregation

create or replace function public.finalize_booking(
  p_concert_id uuid,
  p_seat_ids uuid[],
  p_session_id text,
  p_booker_name text,
  p_phone_number text,
  p_password_hash text
)
returns jsonb
language plpgsql
as $$
declare
  v_concert public.concerts%rowtype;
  v_booking public.bookings%rowtype;
  v_seat public.seats%rowtype;
  v_total_amount integer := 0;
  v_seat_payload jsonb := '[]'::jsonb;
  v_timeout_interval interval := interval '10 minutes';
  v_expected_count integer;
  v_actual_count integer;
begin
  v_expected_count := coalesce(array_length(p_seat_ids, 1), 0);

  if v_expected_count <= 0 then
    raise exception using message = 'BOOKING_VALIDATION_ERROR', detail = 'Seat identifiers must be provided.';
  end if;

  -- Lock concert row
  select *
  into v_concert
  from public.concerts
  where id = p_concert_id
  for share;

  if not found then
    raise exception using message = 'CONCERT_NOT_FOUND';
  end if;

  -- Lock seat rows individually and validate
  -- First, verify all seats exist and can be locked
  select count(*)
  into v_actual_count
  from public.seats
  where id = any(p_seat_ids)
  for update;

  if v_actual_count <> v_expected_count then
    raise exception using message = 'SEAT_UNAVAILABLE', detail = 'Some seats were not found.';
  end if;

  -- Now process each seat
  for v_seat in
    select *
    from public.seats
    where id = any(p_seat_ids)
    for update
  loop
    if v_seat.concert_id <> p_concert_id then
      raise exception using message = 'SEAT_UNAVAILABLE', detail = 'Seat does not belong to the requested concert.';
    end if;

    if v_seat.status <> 'reserved' then
      raise exception using message = 'SEAT_UNAVAILABLE', detail = 'Seat is not reserved.';
    end if;

    if v_seat.session_id is distinct from p_session_id then
      raise exception using message = 'SESSION_MISMATCH';
    end if;

    if v_seat.reserved_at is null or v_seat.reserved_at + v_timeout_interval < now() then
      raise exception using message = 'SESSION_EXPIRED';
    end if;

    v_total_amount := v_total_amount + v_seat.price;

    v_seat_payload := v_seat_payload || jsonb_build_array(
      jsonb_build_object(
        'id', v_seat.id,
        'section', v_seat.section,
        'rowNumber', v_seat.row_number,
        'seatNumber', v_seat.seat_number,
        'grade', v_seat.grade,
        'price', v_seat.price
      )
    );
  end loop;

  -- Create booking record
  insert into public.bookings (
    concert_id,
    booker_name,
    phone_number,
    password_hash,
    total_amount,
    status
  )
  values (
    p_concert_id,
    p_booker_name,
    p_phone_number,
    p_password_hash,
    v_total_amount,
    'confirmed'
  )
  returning * into v_booking;

  -- Update seats to booked status
  update public.seats
  set status = 'booked',
      booking_id = v_booking.id,
      session_id = null,
      reserved_at = null
  where id = any(p_seat_ids);

  -- Return booking details
  return jsonb_build_object(
    'id', v_booking.id,
    'concertId', v_concert.id,
    'concertTitle', v_concert.title,
    'venue', v_concert.venue,
    'startDate', v_concert.start_date,
    'bookerName', v_booking.booker_name,
    'phoneNumber', v_booking.phone_number,
    'seats', v_seat_payload,
    'totalAmount', v_booking.total_amount,
    'status', v_booking.status,
    'createdAt', v_booking.created_at
  );
exception
  when others then
    raise;
end;
$$;

comment on function public.finalize_booking(
  uuid,
  uuid[],
  text,
  text,
  text,
  text
) is 'Confirms reserved seats by creating a booking and marking seats as booked with transactional safety. Fixed to avoid FOR UPDATE with aggregate functions.';
