# 좌석 선택 페이지 요구사항

## 1. 개요

좌석 선택 페이지는 사용자가 콘서트 상세 페이지에서 선택한 인원수에 맞춰 좌석 배치도를 확인하고, 원하는 좌석을 직접 선택하여 임시 선점하는 기능을 제공합니다. 실시간 좌석 상태 동기화를 통해 다른 사용자의 예매 현황을 반영하며, 세션 타임아웃 관리를 통해 좌석 재고의 정합성을 유지합니다.

## 2. 페이지 진입 조건

### 2.1 Precondition
- 사용자가 콘서트 상세 페이지에서 예매 인원수를 선택한 상태여야 합니다.
- 선택한 인원수는 1 이상, 콘서트의 `max_tickets_per_booking` 이하여야 합니다.
- 해당 콘서트에 예매 가능한 좌석이 최소 1석 이상 존재해야 합니다.

### 2.2 페이지 진입 시 전달 데이터
- **concertId**: 선택한 콘서트 ID (uuid)
- **numberOfTickets**: 예매 인원수 (1 ~ 6)
- **sessionId**: 현재 사용자의 세션 ID (uuid)

## 3. 기능 요구사항

### 3.1 좌석 배치도 조회 및 표시

#### 행동
- 페이지 진입 시 자동으로 좌석 배치도를 조회합니다.

#### 데이터 흐름
1. Frontend → Backend: `GET /api/seats?concertId={concertId}`
2. Backend → Database:
   ```sql
   SELECT id, concert_id, section, row_number, seat_number,
          grade, price, status, session_id, reserved_at
   FROM seats
   WHERE concert_id = :concert_id
   ORDER BY section, row_number, seat_number;
   ```
3. Backend → Frontend: 좌석 목록 반환 (200 OK)
4. Frontend: 좌석 배치도 렌더링

#### 화면 표시
- **등급별 색상 구분**:
  - VIP: 금색 (#FFD700)
  - R석: 빨강 (#FF6B6B)
  - S석: 파랑 (#4ECDC4)
  - A석: 초록 (#95E1D3)

- **상태별 시각화**:
  - `available`: 밝은 색상, 클릭 가능, 테두리 없음
  - `reserved` (다른 사용자): 회색, 클릭 불가, 자물쇠 아이콘
  - `reserved` (내 선택): 강조 색상 (주황 #FF9F43), 클릭 가능, 체크 아이콘
  - `booked`: 진한 회색, 클릭 불가, X 아이콘

- **우측 패널 표시**:
  - 선택한 인원수 / 필요한 인원수
  - 선택한 좌석 목록 (구역, 행/열, 등급, 가격)
  - 총 결제 금액
  - 남은 시간 타이머
  - '예약하기' 버튼 (활성화/비활성화)

### 3.2 좌석 선택 (임시 선점)

#### 행동
- 사용자가 예매 가능한 좌석을 클릭합니다.

#### 검증 로직 (Frontend)
1. 해당 좌석이 `available` 상태인지 확인
2. 현재 선택한 좌석 총 개수가 `numberOfTickets`를 초과하지 않는지 확인
3. 검증 실패 시 토스트 메시지 표시 및 클릭 무시

#### 데이터 흐름 (검증 통과 시)
1. Frontend → Backend: `POST /api/seats/reserve`
   ```json
   {
     "seatIds": ["seat-uuid-1"],
     "sessionId": "session-uuid"
   }
   ```
2. Backend → Database: 트랜잭션 시작
   ```sql
   BEGIN;
   SELECT id, status FROM seats
   WHERE id = ANY(:seat_ids) AND status = 'available'
   FOR UPDATE NOWAIT;

   UPDATE seats
   SET status = 'reserved',
       session_id = :session_id,
       reserved_at = NOW()
   WHERE id = ANY(:seat_ids);
   COMMIT;
   ```
3. Backend → Frontend:
   - **성공 시 (200 OK)**: 선점된 좌석 정보 및 총 금액 반환
   - **실패 시 (409 Conflict)**: 동시 선점 충돌 메시지 반환

#### 화면 변화
- **성공 시**:
  - 해당 좌석 UI를 '내 선택' 상태로 변경 (주황색, 체크 아이콘)
  - 우측 패널에 선택한 좌석 추가
  - 총 금액 업데이트
  - 타이머 시작 (첫 선택 시) 또는 기존 타이머 유지
  - 선택한 좌석 수 == `numberOfTickets` 이면 '예약하기' 버튼 활성화

- **실패 시**:
  - 토스트 메시지: "이미 다른 사용자가 선택한 좌석입니다. 다른 좌석을 선택해주세요."
  - 좌석 배치도를 실시간으로 갱신하여 해당 좌석을 '선택 불가' 상태로 변경

### 3.3 좌석 선택 해제

#### 행동
- 사용자가 이미 선택한 좌석(내 선택 상태)을 다시 클릭합니다.

#### 데이터 흐름
1. Frontend → Backend: `POST /api/seats/release`
   ```json
   {
     "seatIds": ["seat-uuid-1"],
     "sessionId": "session-uuid"
   }
   ```
2. Backend → Database:
   ```sql
   UPDATE seats
   SET status = 'available',
       session_id = NULL,
       reserved_at = NULL
   WHERE id = ANY(:seat_ids) AND session_id = :session_id;
   ```
3. Backend → Frontend: 해제 성공 (200 OK)

#### 화면 변화
- 해당 좌석 UI를 'available' 상태로 복원
- 우측 패널에서 해당 좌석 제거
- 총 금액 재계산
- 선택한 좌석 수가 `numberOfTickets`보다 적으면 '예약하기' 버튼 비활성화
- 모든 좌석을 해제하면 타이머 중지

### 3.4 실시간 좌석 상태 동기화

#### 행동
- 백그라운드에서 주기적으로 좌석 상태를 갱신합니다 (5초마다).

#### 데이터 흐름
1. Frontend → Backend: `GET /api/seats/status?concertId={concertId}`
2. Backend → Database:
   ```sql
   SELECT id, status, session_id
   FROM seats
   WHERE concert_id = :concert_id;
   ```
3. Backend → Frontend: 좌석 상태 목록 반환 (200 OK)

#### 화면 변화
- 다른 사용자가 예매한 좌석 (`booked` 상태로 변경)을 UI에 반영
- 다른 사용자가 선점한 좌석 (`reserved` 상태로 변경)을 UI에 반영
- 만약 내가 선택했던 좌석이 다른 사용자에 의해 변경되었다면 (극히 드문 경우):
  - 토스트 메시지: "선택하신 좌석 중 일부가 다른 사용자에 의해 예매되었습니다."
  - 해당 좌석을 내 선택 목록에서 제거

### 3.5 세션 타이머 관리

#### 행동
- 첫 번째 좌석 선택 시 10분 타이머를 시작합니다.
- 타이머는 화면 우측 패널에 "MM:SS" 형식으로 표시됩니다.

#### 타이머 UI 규칙
- 10분 ~ 3분: 일반 색상 (검정색)
- 3분 ~ 1분: 경고 색상 (주황색)
- 1분 ~ 0분: 위험 색상 (빨강색), 깜빡이는 애니메이션

#### 세션 만료 시
- **Frontend 동작**:
  - 타이머가 00:00에 도달하면 알림 모달 표시
  - 모달 메시지: "선택 시간이 만료되었습니다. 좌석을 다시 선택해주세요."
  - 모달 버튼: "다시 선택하기" (클릭 시 페이지 새로고침)

- **Backend 동작 (백그라운드 스케줄러)**:
  - 매 1분마다 실행:
    ```sql
    UPDATE seats
    SET status = 'available',
        session_id = NULL,
        reserved_at = NULL
    WHERE status = 'reserved'
      AND reserved_at + interval '10 minutes' < NOW();
    ```

### 3.6 예약 진행 (다음 단계로 이동)

#### 행동
- 사용자가 '예약하기' 버튼을 클릭합니다.

#### 버튼 활성화 조건
- 선택한 좌석 수 == `numberOfTickets`

#### 데이터 흐름
1. Frontend → Backend: `POST /api/bookings/validate`
   ```json
   {
     "seatIds": ["seat-uuid-1", "seat-uuid-2"],
     "sessionId": "session-uuid"
   }
   ```
2. Backend → Database:
   ```sql
   SELECT id FROM seats
   WHERE id = ANY(:seat_ids)
     AND status = 'reserved'
     AND session_id = :session_id
     AND reserved_at + interval '10 minutes' > NOW();
   ```
3. Backend → Frontend:
   - **검증 성공 (200 OK)**: 유효한 좌석 목록 반환
   - **검증 실패 (400 Bad Request)**: 세션 만료 또는 좌석 상태 변경 메시지

#### 화면 변화
- **검증 성공 시**:
  - 선택한 좌석 정보를 세션 스토리지에 저장:
    ```json
    {
      "concertId": "concert-uuid",
      "sessionId": "session-uuid",
      "selectedSeats": [
        {
          "id": "seat-uuid-1",
          "section": "A",
          "rowNumber": "1",
          "seatNumber": "5",
          "grade": "vip",
          "price": 150000
        }
      ],
      "totalAmount": 150000,
      "expiresAt": "2025-10-14T12:00:00Z"
    }
    ```
  - 예약 정보 입력 페이지로 이동 (`/booking/checkout`)

- **검증 실패 시**:
  - 에러 모달 표시: "선택한 좌석의 유효 시간이 만료되었습니다. 좌석을 다시 선택해주세요."
  - 모달 버튼: "다시 선택하기" (클릭 시 페이지 새로고침)

## 4. 비기능 요구사항

### 4.1 성능
- 좌석 배치도 초기 로딩 시간: 2초 이내
- 좌석 선택/해제 응답 시간: 500ms 이내
- 실시간 동기화 주기: 5초

### 4.2 사용성
- 좌석 등급별 색상은 명확하게 구분되어야 합니다.
- 선택 가능/불가능 상태가 직관적으로 표시되어야 합니다.
- 타이머는 항상 눈에 잘 띄는 위치에 표시되어야 합니다.
- 선택한 좌석 정보와 총 금액은 실시간으로 업데이트되어야 합니다.

### 4.3 보안
- 세션 ID는 UUID v4 형식으로 생성되어야 합니다.
- 좌석 선점 API는 Rate Limiting이 적용되어야 합니다 (1초당 10회).
- 모든 좌석 상태 변경은 트랜잭션으로 보호되어야 합니다.

### 4.4 데이터 정합성
- 동시 선점 시도 시 `FOR UPDATE NOWAIT`을 사용하여 충돌을 즉시 감지합니다.
- 세션 타임아웃은 백그라운드 스케줄러와 프론트엔드 타이머 양쪽에서 관리됩니다.
- 좌석 상태는 항상 데이터베이스가 단일 진실 공급원(Single Source of Truth)입니다.

## 5. 에러 처리

### 5.1 네트워크 오류
- **상황**: API 호출 중 네트워크 오류 발생
- **처리**:
  - 토스트 메시지: "네트워크 오류가 발생했습니다. 다시 시도해주세요."
  - 재시도 버튼 제공
  - 좌석 UI 상태를 이전 상태로 롤백

### 5.2 동시 선점 충돌
- **상황**: 다른 사용자가 동일한 좌석을 먼저 선점함
- **처리**:
  - Backend에서 409 Conflict 반환
  - 토스트 메시지: "이미 다른 사용자가 선택한 좌석입니다. 다른 좌석을 선택해주세요."
  - 좌석 배치도 실시간 갱신

### 5.3 세션 타임아웃
- **상황**: 10분 경과 또는 검증 실패
- **처리**:
  - 알림 모달: "선택 시간이 만료되었습니다. 좌석을 다시 선택해주세요."
  - 모달 버튼: "다시 선택하기" (페이지 새로고침)

### 5.4 인원수 초과
- **상황**: 사용자가 인원수보다 많은 좌석을 선택하려 함
- **처리**:
  - 클릭 무시
  - 토스트 메시지: "선택 가능한 좌석 수를 초과했습니다. (현재: N/M석)"

### 5.5 데이터베이스 오류
- **상황**: 트랜잭션 중 DB 오류 발생
- **처리**:
  - Backend에서 자동 롤백
  - Frontend에 500 Internal Server Error 반환
  - 토스트 메시지: "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
  - 에러 로깅 및 관리자 알림

## 6. 상태 관리 요구사항

### 6.1 로컬 상태 (React State)
- 좌석 배치도 데이터 (전체 좌석 목록)
- 선택한 좌석 목록
- 총 결제 금액
- 타이머 남은 시간 (초 단위)
- 로딩 상태 (좌석 조회, 선점, 해제, 검증)
- 에러 상태

### 6.2 세션 스토리지
- 콘서트 ID
- 세션 ID
- 예매 인원수
- 선택한 좌석 정보 (검증 통과 후)
- 만료 시각

### 6.3 서버 상태 (@tanstack/react-query)
- 좌석 배치도 조회 (useQuery)
- 좌석 실시간 상태 조회 (useQuery, refetchInterval: 5000ms)
- 좌석 선점 (useMutation)
- 좌석 해제 (useMutation)
- 선택 검증 (useMutation)

## 7. 데이터베이스 의존성

이 페이지는 다음 테이블에 의존합니다:

### 7.1 seats 테이블
- **읽기**: 좌석 배치도 조회, 실시간 상태 동기화
- **쓰기**: 좌석 선점, 좌석 해제, 세션 타임아웃 정리

### 7.2 concerts 테이블
- **읽기**: 콘서트 기본 정보 조회 (`max_tickets_per_booking` 검증용)

## 8. API 엔드포인트 요약

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/seats?concertId={id}` | 좌석 배치도 조회 |
| GET | `/api/seats/status?concertId={id}` | 좌석 상태 조회 (실시간 동기화) |
| POST | `/api/seats/reserve` | 좌석 임시 선점 |
| POST | `/api/seats/release` | 좌석 선점 해제 |
| POST | `/api/bookings/validate` | 선택 검증 |

## 9. 페이지 이탈 시 처리

### 9.1 뒤로가기 또는 페이지 이탈
- `beforeunload` 이벤트 감지
- 선택한 좌석이 있을 경우 확인 메시지 표시: "선택한 좌석이 해제됩니다. 정말로 나가시겠습니까?"
- 이탈 시 자동으로 선점 해제 API 호출 (Best Effort)

### 9.2 브라우저 종료
- 세션 타임아웃 스케줄러가 10분 후 자동으로 좌석을 해제합니다.

## 10. 접근성 (Accessibility)

- 좌석 버튼에 aria-label 추가 (예: "A구역 1행 5번 좌석, VIP석, 150,000원, 선택 가능")
- 키보드 탐색 지원 (Tab, Enter, Space)
- 색각 이상자를 위한 패턴 또는 아이콘 추가 (색상만으로 구분하지 않음)
- 타이머 남은 시간을 스크린 리더가 읽을 수 있도록 aria-live 영역 설정
