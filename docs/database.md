# 데이터베이스 설계 문서

## 1. 개요

이 문서는 콘서트 예매 시스템의 데이터베이스 스키마를 정의합니다.
비회원 예매 시스템으로 설계되었으며, 좌석 실시간 선점 및 Race Condition 방지를 위한 트랜잭션 처리가 포함되어 있습니다.

## 2. 데이터 플로우

### 2.1 콘서트 목록 조회
```
User → GET /concerts
→ SELECT * FROM concerts WHERE status = 'published'
→ Response: Concert List
```

### 2.2 콘서트 상세 확인
```
User → GET /concerts/:id
→ SELECT c.*, COUNT(s.id) as total_seats
  FROM concerts c
  LEFT JOIN seats s ON c.id = s.concert_id AND s.status = 'available'
  GROUP BY c.id, s.grade
→ Response: Concert Detail + Available Seats by Grade
```

### 2.3 좌석 선택 (임시 선점)
```
User → POST /seats/reserve
→ BEGIN TRANSACTION
→ SELECT * FROM seats WHERE id IN (:seat_ids) AND status = 'available' FOR UPDATE
→ UPDATE seats SET status = 'reserved', session_id = :session_id, reserved_at = NOW() WHERE id IN (:seat_ids)
→ COMMIT
→ Response: Reserved Seats (10분 타임아웃 설정)
```

### 2.4 예약 정보 입력 (세션 유효성 검증)
```
User → POST /bookings/validate
→ SELECT * FROM seats WHERE session_id = :session_id AND status = 'reserved'
→ Check: reserved_at + interval '10 minutes' > NOW()
→ Response: Validation Result
```

### 2.5 예약 완료 (영구 예매)
```
User → POST /bookings
→ BEGIN TRANSACTION
→ SELECT * FROM seats WHERE id IN (:seat_ids) AND status = 'reserved' AND session_id = :session_id FOR UPDATE
→ INSERT INTO bookings (concert_id, phone_number, password_hash, total_amount, status)
  VALUES (:concert_id, :phone_number, :password_hash, :total_amount, 'confirmed')
→ UPDATE seats SET status = 'booked', booking_id = :booking_id, session_id = NULL WHERE id IN (:seat_ids)
→ COMMIT
→ Response: Booking Confirmation (booking_id)
```

### 2.6 예약 조회
```
User → POST /bookings/lookup
→ SELECT b.*, array_agg(s.*) as seats
  FROM bookings b
  LEFT JOIN seats s ON b.id = s.booking_id
  WHERE b.phone_number = :phone_number AND b.password_hash = :password_hash AND b.status = 'confirmed'
  GROUP BY b.id
→ Response: Booking List with Seats
```

### 2.7 예약 취소
```
User → DELETE /bookings/:id
→ BEGIN TRANSACTION
→ SELECT * FROM bookings WHERE id = :booking_id FOR UPDATE
→ Check: concert start time - NOW() > 정책 기간 (예: 24시간)
→ UPDATE bookings SET status = 'cancelled', cancelled_at = NOW() WHERE id = :booking_id
→ UPDATE seats SET status = 'available', booking_id = NULL WHERE booking_id = :booking_id
→ COMMIT
→ Response: Cancellation Success
```

### 2.8 세션 타임아웃 처리 (백그라운드 Job)
```
Scheduler (매 1분마다)
→ SELECT * FROM seats WHERE status = 'reserved' AND reserved_at + interval '10 minutes' < NOW()
→ UPDATE seats SET status = 'available', session_id = NULL, reserved_at = NULL WHERE id IN (:expired_seat_ids)
```

## 3. 데이터베이스 스키마

### 3.1 concerts (콘서트)

콘서트의 기본 정보를 저장하는 테이블입니다.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY | 콘서트 고유 ID |
| title | text | NOT NULL | 콘서트 제목 |
| description | text | | 콘서트 설명 |
| image_url | text | | 대표 이미지 URL |
| venue | text | NOT NULL | 공연 장소 |
| start_date | timestamptz | NOT NULL | 공연 시작 일시 |
| end_date | timestamptz | NOT NULL | 공연 종료 일시 |
| status | text | NOT NULL, DEFAULT 'draft' | 콘서트 상태 (draft, published, completed, cancelled) |
| max_tickets_per_booking | integer | NOT NULL, DEFAULT 6 | 1회 최대 예매 가능 매수 |
| created_at | timestamptz | NOT NULL, DEFAULT NOW() | 생성 일시 |
| updated_at | timestamptz | NOT NULL, DEFAULT NOW() | 수정 일시 |

**인덱스:**
- `idx_concerts_status` ON (status)
- `idx_concerts_start_date` ON (start_date)

**제약조건:**
- CHECK (status IN ('draft', 'published', 'completed', 'cancelled'))
- CHECK (end_date > start_date)
- CHECK (max_tickets_per_booking > 0)

### 3.2 seats (좌석)

콘서트의 좌석 정보 및 실시간 상태를 관리하는 테이블입니다.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY | 좌석 고유 ID |
| concert_id | uuid | NOT NULL, FOREIGN KEY → concerts(id) | 콘서트 ID |
| section | text | NOT NULL | 구역 (예: A, B, C) |
| row_number | text | NOT NULL | 행 번호 (예: 1, 2, 3) |
| seat_number | text | NOT NULL | 좌석 번호 (예: 1, 2, 3) |
| grade | text | NOT NULL | 좌석 등급 (vip, r, s, a) |
| price | integer | NOT NULL | 좌석 가격 (원) |
| status | text | NOT NULL, DEFAULT 'available' | 좌석 상태 (available, reserved, booked) |
| booking_id | uuid | FOREIGN KEY → bookings(id) | 예매 ID (booked 상태일 때만) |
| session_id | text | | 세션 ID (reserved 상태일 때만) |
| reserved_at | timestamptz | | 임시 선점 일시 (reserved 상태일 때만) |
| created_at | timestamptz | NOT NULL, DEFAULT NOW() | 생성 일시 |
| updated_at | timestamptz | NOT NULL, DEFAULT NOW() | 수정 일시 |

**인덱스:**
- `idx_seats_concert_id` ON (concert_id)
- `idx_seats_status` ON (status)
- `idx_seats_session_id` ON (session_id) WHERE session_id IS NOT NULL
- `idx_seats_booking_id` ON (booking_id) WHERE booking_id IS NOT NULL
- `idx_seats_reserved_at` ON (reserved_at) WHERE status = 'reserved'

**제약조건:**
- CHECK (status IN ('available', 'reserved', 'booked'))
- CHECK (grade IN ('vip', 'r', 's', 'a'))
- CHECK (price >= 0)
- UNIQUE (concert_id, section, row_number, seat_number)

### 3.3 bookings (예매)

사용자의 예매 정보를 저장하는 테이블입니다.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY | 예매 고유 ID |
| concert_id | uuid | NOT NULL, FOREIGN KEY → concerts(id) | 콘서트 ID |
| booker_name | text | NOT NULL | 예매자 이름 |
| phone_number | text | NOT NULL | 예매자 휴대폰 번호 (010-1234-5678) |
| password_hash | text | NOT NULL | 조회용 비밀번호 해시 (4자리 숫자) |
| total_amount | integer | NOT NULL | 총 결제 금액 (원) |
| status | text | NOT NULL, DEFAULT 'confirmed' | 예매 상태 (confirmed, cancelled) |
| cancelled_at | timestamptz | | 취소 일시 |
| created_at | timestamptz | NOT NULL, DEFAULT NOW() | 예매 생성 일시 |
| updated_at | timestamptz | NOT NULL, DEFAULT NOW() | 수정 일시 |

**인덱스:**
- `idx_bookings_concert_id` ON (concert_id)
- `idx_bookings_phone_number` ON (phone_number)
- `idx_bookings_status` ON (status)
- `idx_bookings_phone_password` ON (phone_number, password_hash)

**제약조건:**
- CHECK (status IN ('confirmed', 'cancelled'))
- CHECK (total_amount >= 0)
- CHECK (phone_number ~ '^010-\d{4}-\d{4}$') -- 휴대폰 번호 형식 검증

## 4. 주요 쿼리 패턴

### 4.1 등급별 잔여 좌석 수 조회
```sql
SELECT
  grade,
  COUNT(*) as available_count,
  MIN(price) as price
FROM seats
WHERE concert_id = :concert_id AND status = 'available'
GROUP BY grade, price;
```

### 4.2 좌석 임시 선점 (Race Condition 방지)
```sql
BEGIN;
SELECT id, status FROM seats
WHERE id = ANY(:seat_ids) AND status = 'available'
FOR UPDATE NOWAIT; -- 다른 트랜잭션이 이미 락을 걸었다면 즉시 실패

UPDATE seats
SET status = 'reserved',
    session_id = :session_id,
    reserved_at = NOW()
WHERE id = ANY(:seat_ids);
COMMIT;
```

### 4.3 예매 완료 (트랜잭션)
```sql
BEGIN;
-- 1. 좌석 상태 재검증
SELECT id FROM seats
WHERE id = ANY(:seat_ids)
  AND status = 'reserved'
  AND session_id = :session_id
  AND reserved_at + interval '10 minutes' > NOW()
FOR UPDATE;

-- 2. 예매 레코드 생성
INSERT INTO bookings (concert_id, booker_name, phone_number, password_hash, total_amount)
VALUES (:concert_id, :booker_name, :phone_number, :password_hash, :total_amount)
RETURNING id;

-- 3. 좌석 상태를 booked로 변경
UPDATE seats
SET status = 'booked',
    booking_id = :booking_id,
    session_id = NULL,
    reserved_at = NULL
WHERE id = ANY(:seat_ids);
COMMIT;
```

### 4.4 예매 취소 (트랜잭션)
```sql
BEGIN;
-- 1. 예매 정보 조회 및 취소 가능 여부 확인
SELECT b.*, c.start_date
FROM bookings b
JOIN concerts c ON b.concert_id = c.id
WHERE b.id = :booking_id
  AND b.status = 'confirmed'
FOR UPDATE;

-- 2. 취소 정책 검증 (예: 공연 24시간 전까지만 취소 가능)
-- 애플리케이션 레이어에서 처리

-- 3. 예매 상태 변경
UPDATE bookings
SET status = 'cancelled',
    cancelled_at = NOW()
WHERE id = :booking_id;

-- 4. 좌석 상태 복원
UPDATE seats
SET status = 'available',
    booking_id = NULL
WHERE booking_id = :booking_id;
COMMIT;
```

### 4.5 만료된 임시 선점 좌석 정리 (스케줄러)
```sql
UPDATE seats
SET status = 'available',
    session_id = NULL,
    reserved_at = NULL
WHERE status = 'reserved'
  AND reserved_at + interval '10 minutes' < NOW();
```

## 5. 데이터 무결성 규칙

1. **좌석 고유성**: 하나의 콘서트 내에서 (section, row_number, seat_number) 조합은 고유해야 함
2. **예매 상태 일관성**:
   - `seats.status = 'booked'` 인 경우 반드시 `seats.booking_id` 가 존재해야 함
   - `seats.status = 'reserved'` 인 경우 반드시 `seats.session_id` 와 `reserved_at` 가 존재해야 함
3. **좌석 수량 제한**: 한 번에 예매 가능한 좌석 수는 `concerts.max_tickets_per_booking` 을 초과할 수 없음
4. **세션 타임아웃**: `reserved_at + 10분` 이 경과한 좌석은 자동으로 `available` 상태로 복원
5. **취소 정책**: 공연 시작 시간 전 일정 기간(예: 24시간) 이내에는 취소 불가

## 6. 성능 최적화 고려사항

1. **인덱스 전략**:
   - 좌석 조회: `(concert_id, status)` 복합 인덱스
   - 예매 조회: `(phone_number, password_hash, status)` 복합 인덱스
   - 세션 정리: `(status, reserved_at)` 복합 인덱스

2. **트랜잭션 격리 수준**:
   - `FOR UPDATE NOWAIT` 를 사용하여 동시 선점 시도 시 즉시 실패 처리
   - 예매 완료 트랜잭션은 최소한의 시간만 유지

3. **연결 풀링**:
   - Supabase의 기본 연결 풀 사용
   - 긴 트랜잭션 방지를 위한 타임아웃 설정

4. **캐싱 전략**:
   - 콘서트 목록: 1분 캐시
   - 콘서트 상세 정보: 30초 캐시
   - 좌석 상태: 실시간 조회 (캐시 없음)

## 7. 보안 고려사항

1. **비밀번호 저장**: 4자리 숫자 비밀번호는 반드시 해시화하여 저장 (bcrypt, argon2 등)
2. **개인정보 보호**: 휴대폰 번호는 마스킹 처리하여 로그에 기록 금지
3. **SQL Injection 방지**: 모든 쿼리는 Prepared Statement 사용
4. **Rate Limiting**: 예매 조회 API에 대한 속도 제한 적용 (brute-force 방지)

## 8. 마이그레이션 파일

데이터베이스 스키마는 다음 마이그레이션 파일로 적용됩니다:
- `supabase/migrations/0002_create_concert_booking_schema.sql`

마이그레이션 실행 방법:
```bash
# Supabase CLI를 통한 마이그레이션 적용
supabase db push

# 또는 Supabase Dashboard에서 SQL Editor를 통해 직접 실행
```
