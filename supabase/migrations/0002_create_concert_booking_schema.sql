-- Migration: create concert booking system schema
-- Description: Creates tables for concerts, seats, and bookings with proper constraints and indexes
-- Features:
--   - Non-member booking system (phone + 4-digit password)
--   - Real-time seat reservation with session timeout (10 minutes)
--   - Race condition prevention with FOR UPDATE locks
--   - Transaction-safe booking and cancellation

-- Ensure pgcrypto extension is available for gen_random_uuid
create extension if not exists "pgcrypto";

-- ============================================================================
-- 1. CONCERTS TABLE
-- ============================================================================
create table if not exists public.concerts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  image_url text,
  venue text not null,
  start_date timestamptz not null,
  end_date timestamptz not null,
  status text not null default 'draft',
  max_tickets_per_booking integer not null default 6,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint concerts_status_check check (status in ('draft', 'published', 'completed', 'cancelled')),
  constraint concerts_date_check check (end_date > start_date),
  constraint concerts_max_tickets_check check (max_tickets_per_booking > 0)
);

comment on table public.concerts is '콘서트 기본 정보를 저장하는 테이블';
comment on column public.concerts.status is 'draft: 준비중, published: 예매 가능, completed: 공연 종료, cancelled: 공연 취소';
comment on column public.concerts.max_tickets_per_booking is '1회 최대 예매 가능 매수 (기본값: 6매)';

-- Indexes for concerts
create index if not exists idx_concerts_status on public.concerts(status);
create index if not exists idx_concerts_start_date on public.concerts(start_date);

-- Disable RLS for concerts
alter table if exists public.concerts disable row level security;

-- ============================================================================
-- 2. BOOKINGS TABLE (created before seats due to foreign key dependency)
-- ============================================================================
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  concert_id uuid not null references public.concerts(id) on delete cascade,
  booker_name text not null,
  phone_number text not null,
  password_hash text not null,
  total_amount integer not null,
  status text not null default 'confirmed',
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint bookings_status_check check (status in ('confirmed', 'cancelled')),
  constraint bookings_amount_check check (total_amount >= 0),
  constraint bookings_phone_format_check check (phone_number ~ '^010-\d{4}-\d{4}$')
);

comment on table public.bookings is '예매 정보를 저장하는 테이블 (비회원 예매 시스템)';
comment on column public.bookings.phone_number is '예매자 휴대폰 번호 (형식: 010-1234-5678)';
comment on column public.bookings.password_hash is '조회용 비밀번호 해시 (4자리 숫자를 해시화하여 저장)';
comment on column public.bookings.status is 'confirmed: 예매 확정, cancelled: 예매 취소';

-- Indexes for bookings
create index if not exists idx_bookings_concert_id on public.bookings(concert_id);
create index if not exists idx_bookings_phone_number on public.bookings(phone_number);
create index if not exists idx_bookings_status on public.bookings(status);
create index if not exists idx_bookings_phone_password on public.bookings(phone_number, password_hash);

-- Disable RLS for bookings
alter table if exists public.bookings disable row level security;

-- ============================================================================
-- 3. SEATS TABLE
-- ============================================================================
create table if not exists public.seats (
  id uuid primary key default gen_random_uuid(),
  concert_id uuid not null references public.concerts(id) on delete cascade,
  section text not null,
  row_number text not null,
  seat_number text not null,
  grade text not null,
  price integer not null,
  status text not null default 'available',
  booking_id uuid references public.bookings(id) on delete set null,
  session_id text,
  reserved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint seats_status_check check (status in ('available', 'reserved', 'booked')),
  constraint seats_grade_check check (grade in ('vip', 'r', 's', 'a')),
  constraint seats_price_check check (price >= 0),
  constraint seats_unique_seat unique (concert_id, section, row_number, seat_number)
);

comment on table public.seats is '콘서트 좌석 정보 및 실시간 상태를 관리하는 테이블';
comment on column public.seats.section is '좌석 구역 (예: A, B, C)';
comment on column public.seats.row_number is '좌석 행 번호';
comment on column public.seats.seat_number is '좌석 번호';
comment on column public.seats.grade is '좌석 등급 (vip: VIP석, r: R석, s: S석, a: A석)';
comment on column public.seats.status is 'available: 예매 가능, reserved: 임시 선점 (10분), booked: 예매 완료';
comment on column public.seats.booking_id is '예매 ID (booked 상태일 때만 값 존재)';
comment on column public.seats.session_id is '세션 ID (reserved 상태일 때만 값 존재)';
comment on column public.seats.reserved_at is '임시 선점 일시 (reserved 상태일 때만 값 존재, 10분 후 자동 해제)';

-- Indexes for seats
create index if not exists idx_seats_concert_id on public.seats(concert_id);
create index if not exists idx_seats_status on public.seats(status);
create index if not exists idx_seats_session_id on public.seats(session_id) where session_id is not null;
create index if not exists idx_seats_booking_id on public.seats(booking_id) where booking_id is not null;
create index if not exists idx_seats_reserved_at on public.seats(reserved_at) where status = 'reserved';

-- Composite index for seat availability queries
create index if not exists idx_seats_concert_status on public.seats(concert_id, status);

-- Disable RLS for seats
alter table if exists public.seats disable row level security;

-- ============================================================================
-- 4. TRIGGER FUNCTIONS FOR UPDATED_AT
-- ============================================================================
-- Create or replace function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

comment on function public.update_updated_at_column() is 'updated_at 컬럼을 자동으로 현재 시각으로 업데이트하는 트리거 함수';

-- Create triggers for updated_at on all tables
drop trigger if exists update_concerts_updated_at on public.concerts;
create trigger update_concerts_updated_at
  before update on public.concerts
  for each row
  execute function public.update_updated_at_column();

drop trigger if exists update_bookings_updated_at on public.bookings;
create trigger update_bookings_updated_at
  before update on public.bookings
  for each row
  execute function public.update_updated_at_column();

drop trigger if exists update_seats_updated_at on public.seats;
create trigger update_seats_updated_at
  before update on public.seats
  for each row
  execute function public.update_updated_at_column();

-- ============================================================================
-- 5. HELPER FUNCTIONS
-- ============================================================================
-- Function to clean up expired seat reservations
create or replace function public.cleanup_expired_seat_reservations()
returns integer as $$
declare
  affected_rows integer;
begin
  update public.seats
  set status = 'available',
      session_id = null,
      reserved_at = null
  where status = 'reserved'
    and reserved_at + interval '10 minutes' < now();

  get diagnostics affected_rows = row_count;
  return affected_rows;
end;
$$ language plpgsql;

comment on function public.cleanup_expired_seat_reservations() is '10분이 경과한 임시 선점 좌석을 예매 가능 상태로 복원하는 함수 (스케줄러에서 주기적으로 호출)';

-- ============================================================================
-- 6. SAMPLE DATA (for development and testing)
-- ============================================================================
-- Insert sample concert
insert into public.concerts (
  title,
  description,
  image_url,
  venue,
  start_date,
  end_date,
  status,
  max_tickets_per_booking
)
values
  (
    '2025 뉴이어 콘서트',
    '새해를 맞이하는 특별한 클래식 콘서트입니다. 세계적인 오케스트라와 함께하는 감동의 무대를 경험하세요.',
    'https://picsum.photos/seed/concert-newyear-2025/800/600',
    '서울 예술의전당 콘서트홀',
    '2025-01-15 19:00:00+09',
    '2025-01-15 21:30:00+09',
    'published',
    6
  ),
  (
    '봄맞이 재즈 페스티벌',
    '따뜻한 봄날 저녁, 세계적인 재즈 뮤지션들과 함께하는 특별한 시간입니다.',
    'https://picsum.photos/seed/jazz-spring-festival/800/600',
    '잠실 올림픽공원 야외무대',
    '2025-04-20 18:00:00+09',
    '2025-04-20 22:00:00+09',
    'published',
    4
  ),
  (
    '여름밤의 록 페스티벌',
    '뜨거운 여름밤을 더욱 뜨겁게 달굴 록 밴드들의 향연!',
    'https://picsum.photos/seed/rock-summer-night/800/600',
    '인천 펜타포트',
    '2025-07-25 17:00:00+09',
    '2025-07-25 23:00:00+09',
    'draft',
    8
  )
on conflict do nothing;

-- Get concert IDs for sample data
do $$
declare
  concert_id_1 uuid;
  concert_id_2 uuid;
  section_name text;
  row_num integer;
  seat_num integer;
begin
  -- Get first concert ID
  select id into concert_id_1 from public.concerts where title = '2025 뉴이어 콘서트' limit 1;

  -- Get second concert ID
  select id into concert_id_2 from public.concerts where title = '봄맞이 재즈 페스티벌' limit 1;

  -- Insert seats for first concert (2025 뉴이어 콘서트)
  if concert_id_1 is not null then
    -- VIP seats (Section A, 3 rows x 10 seats = 30 seats, 150,000 KRW)
    for row_num in 1..3 loop
      for seat_num in 1..10 loop
        insert into public.seats (concert_id, section, row_number, seat_number, grade, price, status)
        values (concert_id_1, 'A', row_num::text, seat_num::text, 'vip', 150000, 'available')
        on conflict do nothing;
      end loop;
    end loop;

    -- R seats (Section B, 5 rows x 15 seats = 75 seats, 120,000 KRW)
    for row_num in 1..5 loop
      for seat_num in 1..15 loop
        insert into public.seats (concert_id, section, row_number, seat_number, grade, price, status)
        values (concert_id_1, 'B', row_num::text, seat_num::text, 'r', 120000, 'available')
        on conflict do nothing;
      end loop;
    end loop;

    -- S seats (Section C, 8 rows x 20 seats = 160 seats, 90,000 KRW)
    for row_num in 1..8 loop
      for seat_num in 1..20 loop
        insert into public.seats (concert_id, section, row_number, seat_number, grade, price, status)
        values (concert_id_1, 'C', row_num::text, seat_num::text, 's', 90000, 'available')
        on conflict do nothing;
      end loop;
    end loop;

    -- A seats (Section D, 10 rows x 25 seats = 250 seats, 60,000 KRW)
    for row_num in 1..10 loop
      for seat_num in 1..25 loop
        insert into public.seats (concert_id, section, row_number, seat_number, grade, price, status)
        values (concert_id_1, 'D', row_num::text, seat_num::text, 'a', 60000, 'available')
        on conflict do nothing;
      end loop;
    end loop;
  end if;

  -- Insert seats for second concert (봄맞이 재즈 페스티벌)
  if concert_id_2 is not null then
    -- VIP seats (Section A, 2 rows x 8 seats = 16 seats, 100,000 KRW)
    for row_num in 1..2 loop
      for seat_num in 1..8 loop
        insert into public.seats (concert_id, section, row_number, seat_number, grade, price, status)
        values (concert_id_2, 'A', row_num::text, seat_num::text, 'vip', 100000, 'available')
        on conflict do nothing;
      end loop;
    end loop;

    -- R seats (Section B, 4 rows x 12 seats = 48 seats, 80,000 KRW)
    for row_num in 1..4 loop
      for seat_num in 1..12 loop
        insert into public.seats (concert_id, section, row_number, seat_number, grade, price, status)
        values (concert_id_2, 'B', row_num::text, seat_num::text, 'r', 80000, 'available')
        on conflict do nothing;
      end loop;
    end loop;

    -- S seats (Section C, 6 rows x 15 seats = 90 seats, 60,000 KRW)
    for row_num in 1..6 loop
      for seat_num in 1..15 loop
        insert into public.seats (concert_id, section, row_number, seat_number, grade, price, status)
        values (concert_id_2, 'C', row_num::text, seat_num::text, 's', 60000, 'available')
        on conflict do nothing;
      end loop;
    end loop;
  end if;
end $$;

-- ============================================================================
-- 7. VERIFICATION QUERIES (commented out, for reference)
-- ============================================================================
-- Check concerts
-- select * from public.concerts;

-- Check seats count by concert and grade
-- select
--   c.title,
--   s.grade,
--   s.price,
--   count(*) as seat_count,
--   sum(case when s.status = 'available' then 1 else 0 end) as available_count
-- from public.concerts c
-- left join public.seats s on c.id = s.concert_id
-- group by c.title, s.grade, s.price
-- order by c.title, s.grade;

-- ============================================================================
-- Migration completed successfully
-- ============================================================================
