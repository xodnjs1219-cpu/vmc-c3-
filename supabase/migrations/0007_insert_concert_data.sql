-- Migration: insert actual concert data from docs/concert.md
-- Description: Insert 11 real-world concerts with proper data
-- Note: This migration is idempotent and checks for existing titles before inserting

-- ============================================================================
-- 1. INSERT CONCERT DATA
-- ============================================================================
-- Insert concerts from docs/concert.md using DO block for idempotency
do $$
begin
  -- Insert each concert only if it doesn't already exist
  insert into public.concerts (title, description, image_url, venue, start_date, end_date, status, max_tickets_per_booking)
  select * from (values
    (
      '2025 Coldplay Music of the Spheres 월드투어',
      '전 세계적인 록 밴드 콜드플레이의 대규모 내한공연으로 ''Viva La Vida'', ''Yellow'', ''Fix You'' 등 히트곡을 선보입니다.',
      'https://i.namu.wiki/i/Fx222kKig7-1T7W0gW95C07D18pGrucTRX_qm4vJX6AL43xooa8B7mo8hxI2s-kmyJB1nOEu6smBLHhcbfb74w.webp',
      '고양종합운동장 주경기장',
      '2025-12-10 19:00:00+09'::timestamptz,
      '2025-12-10 22:00:00+09'::timestamptz,
      'published',
      4
    ),
    (
      '2025 TEDDY SWIMS I''ve Tried Everything But Therapy Tour',
      '빌보드 핫 100 차트 1위 ''Lose Control''의 주인공, 파워풀한 보컬의 싱어송라이터 테디 스윔스의 첫 내한공연입니다.',
      'https://i.namu.wiki/i/465jbIaswhOBePRLnZEQDXB-iYiIf9hpukc6Bi94Koov4aKRSvDAVd7NQNWGKYmYWYfnNCodqQDCmk356Og6Ow.webp',
      'KBS 아레나',
      '2025-11-15 19:00:00+09'::timestamptz,
      '2025-11-15 21:30:00+09'::timestamptz,
      'published',
      6
    ),
    (
      '2025 NATORI ASIA TOUR in SEOUL',
      '일본의 인기 아티스트 NATORI의 아시아 투어 서울 공연입니다.',
      'https://lh3.googleusercontent.com/2yJuboYEXjU5hbpJhX7HlglKpayzafa2Wn9b2luRqHeAATt3H4DlVts9CmSVoQ0gG3WN-Ii-JLVafDA=w2880-h1200-p-l90-rj',
      '예스24 라이브홀',
      '2025-11-21 19:00:00+09'::timestamptz,
      '2025-11-22 21:30:00+09'::timestamptz,
      'published',
      2
    ),
    (
      '2025 MIKU EXPO ASIA in SEOUL',
      '세계에서 가장 상징적인 버추얼 팝스타 하츠네 미쿠의 대규모 아시아 투어 서울 공연입니다.',
      'https://i.namu.wiki/i/_FyRO0DHf-vSKM3WnbA1pgpOpNTbI2ZJdcDGjW-o8IK2JO6nm98QjwyFjMYWlcP_IWRs-eXFJ6maUhNHF2RYog.webp',
      '고려대학교 화정체육관',
      '2025-11-29 18:00:00+09'::timestamptz,
      '2025-11-29 21:00:00+09'::timestamptz,
      'published',
      4
    ),
    (
      '2025 DOJA CAT Ma Vie World Tour',
      '글로벌 팝 아이콘 도자 캣의 첫 내한공연으로 ''Say So'', ''Kiss Me More'', ''Paint The Town Red'' 등 히트곡을 선보입니다.',
      'https://d2u1z1lopyfwlx.cloudfront.net/thumbnails/7a53100f-71a6-5392-a824-eb481fb884c5/35954d60-dfbb-5abd-ad61-726431056f09.jpg',
      'KINTEX 제2전시장 10홀',
      '2025-12-13 19:00:00+09'::timestamptz,
      '2025-12-13 22:00:00+09'::timestamptz,
      'published',
      2
    ),
    (
      '2025 카즈미 타테이시 트리오 - 지브리, 재즈를 만나다',
      '지브리 애니메이션 OST를 재즈로 재해석한 특별한 공연입니다.',
      'https://image-cdn.hypb.st/https%3A%2F%2Fkr.hypebeast.com%2Ffiles%2F2020%2F03%2Fstudio-ghibli-movies-coming-netflix-april-1-2020-1.jpg?q=75&w=800&cbr=1&fit=max',
      '용산아트홀 대극장 미르',
      '2025-12-13 19:30:00+09'::timestamptz,
      '2025-12-13 21:30:00+09'::timestamptz,
      'published',
      3
    ),
    (
      '2025 태연 (TAEYEON) CONCERT ''The TENSE''',
      '소녀시대 태연의 솔로 데뷔 10주년 기념 감성 가득한 단독 콘서트입니다.',
      'https://d2u1z1lopyfwlx.cloudfront.net/thumbnails/c7749fe9-3682-5e9d-a265-efad725dc3d4/aa0eb04c-eed9-54de-bb4c-22ec83de7321.jpg',
      '올림픽공원 KSPO DOME',
      '2025-12-28 18:00:00+09'::timestamptz,
      '2025-12-28 21:00:00+09'::timestamptz,
      'published',
      4
    ),
    (
      '2025 윤종신 전국투어 ''그때''',
      '국내 발라드의 대가 윤종신의 감성 가득한 전국투어 서울 공연입니다.',
      'https://d2u1z1lopyfwlx.cloudfront.net/thumbnails/174511a8-ca5d-50a0-beea-fa9ec4f61869/35954d60-dfbb-5abd-ad61-726431056f09.jpg',
      '우리금융아트홀',
      '2025-12-15 19:00:00+09'::timestamptz,
      '2025-12-15 21:30:00+09'::timestamptz,
      'published',
      4
    ),
    (
      '2025 SMTOWN LIVE TOUR',
      'SM 소속 인기 아티스트들의 초호화 콜라보 무대가 펼쳐지는 SM 30주년 기념 콘서트입니다.',
      'https://d2u1z1lopyfwlx.cloudfront.net/thumbnails/38adf95b-f7f9-52df-9f96-69c59adb1783/11b422f8-5fe4-598b-8faf-f1021ef29c35.jpg',
      '고척스카이돔',
      '2025-12-20 18:00:00+09'::timestamptz,
      '2025-12-20 22:00:00+09'::timestamptz,
      'published',
      4
    ),
    (
      '2025 LOVE IN SEOUL - Clean Bandit',
      '영국의 일렉트로닉 팝 그룹 클린 밴딧의 서울 단독 공연입니다.',
      'https://i.namu.wiki/i/fkoqKsBkhpUrIR0biSKsjnr1gkdJLtf7zq0TCpHQlnKv75OxHEDJMXGjJMsE_pDINTS7wNdyfDNUFEzHtt_Iqw.webp',
      '예스24 라이브홀',
      '2025-11-14 19:00:00+09'::timestamptz,
      '2025-11-14 21:30:00+09'::timestamptz,
      'published',
      2
    ),
    (
      '2025 유키 구라모토 크리스마스 콘서트',
      '일본의 유명 피아니스트 유키 구라모토의 따뜻한 크리스마스 특별 공연입니다.',
      'https://d2u1z1lopyfwlx.cloudfront.net/thumbnails/fb8ad9df-7256-569a-9d65-c2c9352d93fe/f4f5b771-c592-5ac2-9963-8014d106deb0.jpg',
      '롯데콘서트홀',
      '2025-12-24 19:00:00+09'::timestamptz,
      '2025-12-24 21:00:00+09'::timestamptz,
      'published',
      3
    )
  ) as new_concerts(title, description, image_url, venue, start_date, end_date, status, max_tickets_per_booking)
  where not exists (
    select 1 from public.concerts c where c.title = new_concerts.title
  );
end $$;

-- ============================================================================
-- 2. CREATE SEATS FOR NEW CONCERTS
-- ============================================================================
-- Create seats for each new concert
do $$
declare
  concert_rec record;
  row_num integer;
  seat_num integer;
begin
  -- Loop through all published concerts that don't have seats yet
  for concert_rec in
    select c.id, c.title
    from public.concerts c
    left join public.seats s on c.id = s.concert_id
    where c.status = 'published'
      and c.title in (
        '2025 Coldplay Music of the Spheres 월드투어',
        '2025 TEDDY SWIMS I''ve Tried Everything But Therapy Tour',
        '2025 NATORI ASIA TOUR in SEOUL',
        '2025 MIKU EXPO ASIA in SEOUL',
        '2025 DOJA CAT Ma Vie World Tour',
        '2025 카즈미 타테이시 트리오 - 지브리, 재즈를 만나다',
        '2025 태연 (TAEYEON) CONCERT ''The TENSE''',
        '2025 윤종신 전국투어 ''그때''',
        '2025 SMTOWN LIVE TOUR',
        '2025 LOVE IN SEOUL - Clean Bandit',
        '2025 유키 구라모토 크리스마스 콘서트'
      )
    group by c.id, c.title
    having count(s.id) = 0
  loop
    -- VIP seats (Section A, 3 rows x 10 seats = 30 seats, 150,000 KRW)
    for row_num in 1..3 loop
      for seat_num in 1..10 loop
        insert into public.seats (concert_id, section, row_number, seat_number, grade, price, status)
        values (concert_rec.id, 'A', row_num::text, seat_num::text, 'vip', 150000, 'available')
        on conflict (concert_id, section, row_number, seat_number) do nothing;
      end loop;
    end loop;

    -- R seats (Section B, 5 rows x 15 seats = 75 seats, 120,000 KRW)
    for row_num in 1..5 loop
      for seat_num in 1..15 loop
        insert into public.seats (concert_id, section, row_number, seat_number, grade, price, status)
        values (concert_rec.id, 'B', row_num::text, seat_num::text, 'r', 120000, 'available')
        on conflict (concert_id, section, row_number, seat_number) do nothing;
      end loop;
    end loop;

    -- S seats (Section C, 8 rows x 20 seats = 160 seats, 90,000 KRW)
    for row_num in 1..8 loop
      for seat_num in 1..20 loop
        insert into public.seats (concert_id, section, row_number, seat_number, grade, price, status)
        values (concert_rec.id, 'C', row_num::text, seat_num::text, 's', 90000, 'available')
        on conflict (concert_id, section, row_number, seat_number) do nothing;
      end loop;
    end loop;

    -- A seats (Section D, 10 rows x 25 seats = 250 seats, 60,000 KRW)
    for row_num in 1..10 loop
      for seat_num in 1..25 loop
        insert into public.seats (concert_id, section, row_number, seat_number, grade, price, status)
        values (concert_rec.id, 'D', row_num::text, seat_num::text, 'a', 60000, 'available')
        on conflict (concert_id, section, row_number, seat_number) do nothing;
      end loop;
    end loop;

    raise notice 'Created seats for concert: %', concert_rec.title;
  end loop;
end $$;

-- ============================================================================
-- 3. VERIFICATION QUERIES (commented out, for reference)
-- ============================================================================
-- Check all concerts
-- select id, title, venue, start_date, status from public.concerts order by start_date;

-- Check seats count by concert
-- select
--   c.title,
--   c.venue,
--   s.grade,
--   s.price,
--   count(*) as seat_count,
--   sum(case when s.status = 'available' then 1 else 0 end) as available_count
-- from public.concerts c
-- left join public.seats s on c.id = s.concert_id
-- where c.title in (
--   '2025 Coldplay Music of the Spheres 월드투어',
--   '2025 TEDDY SWIMS I''ve Tried Everything But Therapy Tour',
--   '2025 NATORI ASIA TOUR in SEOUL',
--   '2025 MIKU EXPO ASIA in SEOUL',
--   '2025 DOJA CAT Ma Vie World Tour',
--   '2025 카즈미 타테이시 트리오 - 지브리, 재즈를 만나다',
--   '2025 태연 (TAEYEON) CONCERT ''The TENSE''',
--   '2025 윤종신 전국투어 ''그때''',
--   '2025 SMTOWN LIVE TOUR',
--   '2025 LOVE IN SEOUL - Clean Bandit',
--   '2025 유키 구라모토 크리스마스 콘서트'
-- )
-- group by c.title, c.venue, s.grade, s.price
-- order by c.title, s.grade;

-- ============================================================================
-- Migration completed successfully
-- ============================================================================
