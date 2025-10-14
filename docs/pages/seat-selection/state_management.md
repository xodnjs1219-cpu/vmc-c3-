# 좌석 선택 페이지 상태 관리 문서

## 1. 개요

이 문서는 좌석 선택 페이지의 상태 관리 설계를 정의합니다. Context API + useReducer 패턴을 사용하여 Flux 아키텍처를 구현하며, @tanstack/react-query를 활용하여 서버 상태를 관리합니다.

## 2. 상태 데이터 분류

### 2.1 관리해야 할 상태 데이터

#### 2.1.1 로컬 UI 상태 (Context + useReducer)

| 상태 | 타입 | 초기값 | 설명 |
|------|------|--------|------|
| `selectedSeats` | `Seat[]` | `[]` | 사용자가 선택한 좌석 목록 |
| `sessionId` | `string` | `uuid v4` | 현재 세션 ID |
| `timerStartedAt` | `Date \| null` | `null` | 타이머 시작 시각 (첫 좌석 선택 시) |
| `remainingSeconds` | `number` | `600` | 남은 시간 (초 단위, 10분 = 600초) |
| `isTimerActive` | `boolean` | `false` | 타이머 활성화 여부 |
| `numberOfTickets` | `number` | `0` | 예매 인원수 (이전 페이지에서 전달받음) |
| `concertId` | `string` | `""` | 콘서트 ID (이전 페이지에서 전달받음) |

#### 2.1.2 서버 상태 (@tanstack/react-query)

| 쿼리 키 | 타입 | 설명 |
|---------|------|------|
| `['seats', concertId]` | `Seat[]` | 전체 좌석 배치도 데이터 |
| `['seats', 'status', concertId]` | `SeatStatus[]` | 실시간 좌석 상태 (5초마다 폴링) |

#### 2.1.3 로딩 및 에러 상태

| 상태 | 타입 | 초기값 | 설명 |
|------|------|--------|------|
| `isReserving` | `boolean` | `false` | 좌석 선점 중 |
| `isReleasing` | `boolean` | `false` | 좌석 해제 중 |
| `isValidating` | `boolean` | `false` | 선택 검증 중 |
| `error` | `string \| null` | `null` | 에러 메시지 |

### 2.2 화면에 보여지지만 상태가 아닌 것 (Derived State)

이들은 상태로부터 계산되는 값으로, 별도로 저장하지 않습니다:

| 계산값 | 계산식 | 설명 |
|--------|--------|------|
| `totalAmount` | `selectedSeats.reduce((sum, seat) => sum + seat.price, 0)` | 총 결제 금액 |
| `canProceed` | `selectedSeats.length === numberOfTickets` | 예약하기 버튼 활성화 여부 |
| `isOverCapacity` | `selectedSeats.length > numberOfTickets` | 인원수 초과 여부 |
| `seatsByStatus` | `seats.groupBy(seat => seat.status)` | 상태별 좌석 그룹 |
| `timerColor` | `remainingSeconds > 180 ? 'black' : remainingSeconds > 60 ? 'orange' : 'red'` | 타이머 색상 |
| `formattedTime` | `formatTime(remainingSeconds)` | MM:SS 형식 시간 |

### 2.3 세션 스토리지 데이터

페이지 간 데이터 전달 및 새로고침 시 복구를 위해 세션 스토리지에 저장합니다:

```typescript
interface SessionData {
  concertId: string;
  sessionId: string;
  numberOfTickets: number;
  selectedSeats: Seat[];
  expiresAt: string; // ISO 8601 format
}
```

## 3. 상태 변경 조건 및 화면 변화

### 3.1 좌석 배치도 조회

| 상태 | 변경 조건 | 변경 후 값 | 화면 변화 |
|------|-----------|-----------|----------|
| `seats` | 페이지 진입 시 자동 조회 | API 응답 데이터 | 좌석 배치도 렌더링, 등급별 색상 구분 |
| `isLoading` | 조회 시작 | `true` | 스켈레톤 로딩 표시 |
| `isLoading` | 조회 완료/실패 | `false` | 좌석 배치도 표시 또는 에러 메시지 |
| `error` | 조회 실패 | 에러 메시지 | 에러 토스트 표시, 재시도 버튼 제공 |

### 3.2 좌석 선택 (임시 선점)

| 상태 | 변경 조건 | 변경 후 값 | 화면 변화 |
|------|-----------|-----------|----------|
| `selectedSeats` | 좌석 선점 성공 | `[...prev, newSeat]` | 좌석 UI를 '내 선택' 상태로 변경 (주황색, 체크 아이콘) |
| `isReserving` | 선점 시작 | `true` | 해당 좌석에 로딩 스피너 표시 |
| `isReserving` | 선점 완료/실패 | `false` | 로딩 스피너 제거 |
| `timerStartedAt` | 첫 좌석 선점 성공 | `new Date()` | - |
| `isTimerActive` | 첫 좌석 선점 성공 | `true` | 타이머 시작 (10:00부터 카운트다운) |
| `remainingSeconds` | 매 1초마다 | `prev - 1` | 타이머 UI 업데이트 (MM:SS 형식) |
| `error` | 동시 선점 충돌 (409) | "이미 다른 사용자가 선택한 좌석입니다." | 에러 토스트 표시, 좌석 배치도 갱신 |
| `error` | 네트워크 오류 | "네트워크 오류가 발생했습니다." | 에러 토스트 표시, 재시도 버튼 |

### 3.3 좌석 선택 해제

| 상태 | 변경 조건 | 변경 후 값 | 화면 변화 |
|------|-----------|-----------|----------|
| `selectedSeats` | 좌석 해제 성공 | `prev.filter(s => s.id !== releasedSeatId)` | 좌석 UI를 'available' 상태로 복원 |
| `isReleasing` | 해제 시작 | `true` | 해당 좌석에 로딩 스피너 표시 |
| `isReleasing` | 해제 완료/실패 | `false` | 로딩 스피너 제거 |
| `isTimerActive` | 모든 좌석 해제 | `false` | 타이머 중지, UI에서 타이머 숨김 |
| `timerStartedAt` | 모든 좌석 해제 | `null` | - |

### 3.4 실시간 좌석 상태 동기화

| 상태 | 변경 조건 | 변경 후 값 | 화면 변화 |
|------|-----------|-----------|----------|
| `seats` | 5초마다 폴링 | 최신 좌석 상태 | 변경된 좌석 UI 업데이트 (예매 완료 → 회색) |
| `selectedSeats` | 내가 선택한 좌석이 다른 사용자에 의해 변경됨 | 해당 좌석 제거 | 토스트 메시지: "선택하신 좌석 중 일부가 예매되었습니다." |

### 3.5 세션 타임아웃

| 상태 | 변경 조건 | 변경 후 값 | 화면 변화 |
|------|-----------|-----------|----------|
| `remainingSeconds` | 타이머가 0에 도달 | `0` | 알림 모달 표시: "선택 시간이 만료되었습니다." |
| `isTimerActive` | 타이머 만료 | `false` | 타이머 중지 |
| `selectedSeats` | 타이머 만료 | `[]` | 모든 선택 해제 (서버에서는 백그라운드 스케줄러가 처리) |

### 3.6 예약 진행

| 상태 | 변경 조건 | 변경 후 값 | 화면 변화 |
|------|-----------|-----------|----------|
| `isValidating` | '예약하기' 버튼 클릭 | `true` | 버튼에 로딩 스피너 표시, 클릭 비활성화 |
| `isValidating` | 검증 완료/실패 | `false` | 로딩 스피너 제거 |
| - | 검증 성공 | 세션 스토리지에 저장 | 예약 정보 입력 페이지로 이동 (`/booking/checkout`) |
| `error` | 검증 실패 (세션 만료) | "선택한 좌석의 유효 시간이 만료되었습니다." | 에러 모달 표시, 재선택 유도 |

## 4. Flux 패턴 설계

### 4.1 액션 정의 (Actions)

```typescript
// 액션 타입 정의
type SeatAction =
  | { type: 'SEAT_SELECTED'; payload: Seat }
  | { type: 'SEAT_RELEASED'; payload: string } // seatId
  | { type: 'SEATS_UPDATED'; payload: Seat[] }
  | { type: 'TIMER_START'; payload: Date }
  | { type: 'TIMER_TICK' }
  | { type: 'TIMER_STOP' }
  | { type: 'TIMER_EXPIRED' }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_RESERVING'; payload: boolean }
  | { type: 'SET_RELEASING'; payload: boolean }
  | { type: 'SET_VALIDATING'; payload: boolean }
  | { type: 'RESET_STATE' };
```

### 4.2 스토어 (Store) - useReducer

```typescript
interface SeatSelectionState {
  selectedSeats: Seat[];
  sessionId: string;
  timerStartedAt: Date | null;
  remainingSeconds: number;
  isTimerActive: boolean;
  numberOfTickets: number;
  concertId: string;
  isReserving: boolean;
  isReleasing: boolean;
  isValidating: boolean;
  error: string | null;
}

const initialState: SeatSelectionState = {
  selectedSeats: [],
  sessionId: '',
  timerStartedAt: null,
  remainingSeconds: 600,
  isTimerActive: false,
  numberOfTickets: 0,
  concertId: '',
  isReserving: false,
  isReleasing: false,
  isValidating: false,
  error: null,
};

function seatSelectionReducer(
  state: SeatSelectionState,
  action: SeatAction
): SeatSelectionState {
  switch (action.type) {
    case 'SEAT_SELECTED':
      return {
        ...state,
        selectedSeats: [...state.selectedSeats, action.payload],
        timerStartedAt: state.timerStartedAt || new Date(),
        isTimerActive: true,
      };

    case 'SEAT_RELEASED':
      const newSelectedSeats = state.selectedSeats.filter(
        seat => seat.id !== action.payload
      );
      return {
        ...state,
        selectedSeats: newSelectedSeats,
        isTimerActive: newSelectedSeats.length > 0,
        timerStartedAt: newSelectedSeats.length > 0 ? state.timerStartedAt : null,
      };

    case 'SEATS_UPDATED':
      // 실시간 동기화로 인해 내가 선택한 좌석이 변경된 경우 제거
      const validSelectedSeats = state.selectedSeats.filter(selected =>
        action.payload.some(
          seat => seat.id === selected.id && seat.status === 'reserved' && seat.sessionId === state.sessionId
        )
      );
      return {
        ...state,
        selectedSeats: validSelectedSeats,
      };

    case 'TIMER_START':
      return {
        ...state,
        timerStartedAt: action.payload,
        isTimerActive: true,
        remainingSeconds: 600,
      };

    case 'TIMER_TICK':
      return {
        ...state,
        remainingSeconds: Math.max(0, state.remainingSeconds - 1),
      };

    case 'TIMER_STOP':
      return {
        ...state,
        isTimerActive: false,
      };

    case 'TIMER_EXPIRED':
      return {
        ...state,
        isTimerActive: false,
        remainingSeconds: 0,
        selectedSeats: [],
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };

    case 'SET_RESERVING':
      return {
        ...state,
        isReserving: action.payload,
      };

    case 'SET_RELEASING':
      return {
        ...state,
        isReleasing: action.payload,
      };

    case 'SET_VALIDATING':
      return {
        ...state,
        isValidating: action.payload,
      };

    case 'RESET_STATE':
      return initialState;

    default:
      return state;
  }
}
```

### 4.3 뷰 (View) - React Components

```
SeatSelectionPage
├── SeatLayout (좌석 배치도)
│   ├── SeatGrid (좌석 그리드)
│   │   └── SeatButton (개별 좌석 버튼)
│   └── SeatLegend (등급별 색상 범례)
├── SelectionPanel (선택 정보 패널)
│   ├── Timer (타이머)
│   ├── SelectedSeatList (선택한 좌석 목록)
│   ├── TotalAmount (총 결제 금액)
│   └── ProceedButton (예약하기 버튼)
└── ErrorModal (에러 모달)
```

## 5. Context + useReducer 설계

### 5.1 Context 구조

```typescript
interface SeatSelectionContextValue {
  // State
  state: SeatSelectionState;

  // Derived State
  totalAmount: number;
  canProceed: boolean;
  isOverCapacity: boolean;
  formattedTime: string;
  timerColor: 'black' | 'orange' | 'red';

  // Actions
  selectSeat: (seat: Seat) => Promise<void>;
  releaseSeat: (seatId: string) => Promise<void>;
  proceedToCheckout: () => Promise<void>;
  clearError: () => void;
}

const SeatSelectionContext = createContext<SeatSelectionContextValue | null>(null);
```

### 5.2 Provider 데이터 흐름

```
[페이지 진입]
    ↓
[useQuery로 좌석 배치도 조회]
    ↓
[세션 ID 생성 (UUID v4)]
    ↓
[세션 스토리지에서 복구 시도]
    ↓ (복구 실패 시)
[초기 상태로 시작]
    ↓
[useEffect: 타이머 인터벌 설정]
    ↓
[5초마다 useQuery로 실시간 상태 조회]
```

### 5.3 Context Provider 구현 개요

```typescript
function SeatSelectionProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(seatSelectionReducer, initialState);
  const { concertId, numberOfTickets } = useParams(); // 또는 props로 전달

  // 1. 좌석 배치도 조회
  const { data: seats, isLoading } = useQuery({
    queryKey: ['seats', concertId],
    queryFn: () => fetchSeats(concertId),
    staleTime: 0, // 항상 최신 데이터 조회
  });

  // 2. 실시간 좌석 상태 동기화 (5초마다 폴링)
  const { data: seatStatus } = useQuery({
    queryKey: ['seats', 'status', concertId],
    queryFn: () => fetchSeatStatus(concertId),
    refetchInterval: 5000,
    enabled: !!concertId,
  });

  // 3. 좌석 선점 Mutation
  const reserveSeatMutation = useMutation({
    mutationFn: (seatIds: string[]) =>
      reserveSeats({ seatIds, sessionId: state.sessionId }),
    onMutate: () => dispatch({ type: 'SET_RESERVING', payload: true }),
    onSuccess: (data) => {
      dispatch({ type: 'SEAT_SELECTED', payload: data.seat });
      dispatch({ type: 'SET_RESERVING', payload: false });
    },
    onError: (error) => {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      dispatch({ type: 'SET_RESERVING', payload: false });
    },
  });

  // 4. 좌석 해제 Mutation
  const releaseSeatMutation = useMutation({
    mutationFn: (seatIds: string[]) =>
      releaseSeats({ seatIds, sessionId: state.sessionId }),
    onMutate: () => dispatch({ type: 'SET_RELEASING', payload: true }),
    onSuccess: (_, seatIds) => {
      seatIds.forEach(id => dispatch({ type: 'SEAT_RELEASED', payload: id }));
      dispatch({ type: 'SET_RELEASING', payload: false });
    },
    onError: (error) => {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      dispatch({ type: 'SET_RELEASING', payload: false });
    },
  });

  // 5. 선택 검증 Mutation
  const validateSelectionMutation = useMutation({
    mutationFn: () =>
      validateBooking({
        seatIds: state.selectedSeats.map(s => s.id),
        sessionId: state.sessionId,
      }),
    onMutate: () => dispatch({ type: 'SET_VALIDATING', payload: true }),
    onSuccess: (data) => {
      // 세션 스토리지에 저장
      saveToSessionStorage({
        concertId: state.concertId,
        sessionId: state.sessionId,
        numberOfTickets: state.numberOfTickets,
        selectedSeats: state.selectedSeats,
        expiresAt: new Date(Date.now() + 600000).toISOString(),
      });
      // 다음 페이지로 이동
      router.push('/booking/checkout');
    },
    onError: (error) => {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      dispatch({ type: 'SET_VALIDATING', payload: false });
    },
  });

  // 6. 타이머 효과
  useEffect(() => {
    if (!state.isTimerActive) return;

    const interval = setInterval(() => {
      dispatch({ type: 'TIMER_TICK' });

      if (state.remainingSeconds <= 1) {
        dispatch({ type: 'TIMER_EXPIRED' });
        // 만료 모달 표시
        showExpirationModal();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [state.isTimerActive, state.remainingSeconds]);

  // 7. 실시간 상태 동기화 효과
  useEffect(() => {
    if (seatStatus) {
      dispatch({ type: 'SEATS_UPDATED', payload: seatStatus });
    }
  }, [seatStatus]);

  // 8. 페이지 이탈 시 처리
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state.selectedSeats.length > 0) {
        e.preventDefault();
        e.returnValue = '선택한 좌석이 해제됩니다. 정말로 나가시겠습니까?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state.selectedSeats.length]);

  // 9. Derived State 계산
  const totalAmount = useMemo(
    () => state.selectedSeats.reduce((sum, seat) => sum + seat.price, 0),
    [state.selectedSeats]
  );

  const canProceed = useMemo(
    () => state.selectedSeats.length === state.numberOfTickets && state.remainingSeconds > 0,
    [state.selectedSeats.length, state.numberOfTickets, state.remainingSeconds]
  );

  const isOverCapacity = state.selectedSeats.length > state.numberOfTickets;

  const formattedTime = useMemo(() => {
    const minutes = Math.floor(state.remainingSeconds / 60);
    const seconds = state.remainingSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [state.remainingSeconds]);

  const timerColor: 'black' | 'orange' | 'red' = useMemo(() => {
    if (state.remainingSeconds > 180) return 'black';
    if (state.remainingSeconds > 60) return 'orange';
    return 'red';
  }, [state.remainingSeconds]);

  // 10. 액션 함수
  const selectSeat = async (seat: Seat) => {
    // 검증
    if (seat.status !== 'available') {
      dispatch({ type: 'SET_ERROR', payload: '이미 선택된 좌석입니다.' });
      return;
    }

    if (state.selectedSeats.length >= state.numberOfTickets) {
      dispatch({
        type: 'SET_ERROR',
        payload: `선택 가능한 좌석 수를 초과했습니다. (${state.selectedSeats.length}/${state.numberOfTickets}석)`
      });
      return;
    }

    // API 호출
    await reserveSeatMutation.mutateAsync([seat.id]);
  };

  const releaseSeat = async (seatId: string) => {
    await releaseSeatMutation.mutateAsync([seatId]);
  };

  const proceedToCheckout = async () => {
    if (!canProceed) {
      dispatch({
        type: 'SET_ERROR',
        payload: `${state.numberOfTickets - state.selectedSeats.length}석을 더 선택해주세요.`
      });
      return;
    }

    await validateSelectionMutation.mutateAsync();
  };

  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  const value: SeatSelectionContextValue = {
    state,
    totalAmount,
    canProceed,
    isOverCapacity,
    formattedTime,
    timerColor,
    selectSeat,
    releaseSeat,
    proceedToCheckout,
    clearError,
  };

  return (
    <SeatSelectionContext.Provider value={value}>
      {children}
    </SeatSelectionContext.Provider>
  );
}
```

### 5.4 하위 컴포넌트에 노출되는 인터페이스

#### 5.4.1 노출 변수

| 변수명 | 타입 | 설명 |
|--------|------|------|
| `state.selectedSeats` | `Seat[]` | 선택한 좌석 목록 |
| `state.sessionId` | `string` | 세션 ID |
| `state.numberOfTickets` | `number` | 예매 인원수 |
| `state.concertId` | `string` | 콘서트 ID |
| `state.isReserving` | `boolean` | 좌석 선점 중 |
| `state.isReleasing` | `boolean` | 좌석 해제 중 |
| `state.isValidating` | `boolean` | 선택 검증 중 |
| `state.error` | `string \| null` | 에러 메시지 |
| `totalAmount` | `number` | 총 결제 금액 |
| `canProceed` | `boolean` | 예약하기 버튼 활성화 여부 |
| `isOverCapacity` | `boolean` | 인원수 초과 여부 |
| `formattedTime` | `string` | MM:SS 형식 시간 |
| `timerColor` | `'black' \| 'orange' \| 'red'` | 타이머 색상 |

#### 5.4.2 노출 함수

| 함수명 | 시그니처 | 설명 |
|--------|----------|------|
| `selectSeat` | `(seat: Seat) => Promise<void>` | 좌석 선택 (임시 선점) |
| `releaseSeat` | `(seatId: string) => Promise<void>` | 좌석 선택 해제 |
| `proceedToCheckout` | `() => Promise<void>` | 예약 진행 (검증 후 다음 페이지로 이동) |
| `clearError` | `() => void` | 에러 메시지 클리어 |

### 5.5 Hook 사용 예시

```typescript
function useSeatSelection() {
  const context = useContext(SeatSelectionContext);
  if (!context) {
    throw new Error('useSeatSelection must be used within SeatSelectionProvider');
  }
  return context;
}

// 컴포넌트에서 사용
function SeatButton({ seat }: { seat: Seat }) {
  const { selectSeat, releaseSeat, state } = useSeatSelection();

  const isSelected = state.selectedSeats.some(s => s.id === seat.id);
  const isMySelection = isSelected && seat.sessionId === state.sessionId;

  const handleClick = async () => {
    if (isMySelection) {
      await releaseSeat(seat.id);
    } else if (seat.status === 'available') {
      await selectSeat(seat);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={seat.status !== 'available' && !isMySelection}
      className={cn(
        'seat-button',
        getSeatColorClass(seat.grade),
        isMySelection && 'selected',
        seat.status === 'booked' && 'booked'
      )}
    >
      {seat.seatNumber}
    </button>
  );
}

function ProceedButton() {
  const { proceedToCheckout, canProceed, state } = useSeatSelection();

  return (
    <button
      onClick={proceedToCheckout}
      disabled={!canProceed || state.isValidating}
    >
      {state.isValidating ? '검증 중...' : '예약하기'}
    </button>
  );
}
```

## 6. 타입 정의

```typescript
// 좌석 정보
interface Seat {
  id: string; // uuid
  concertId: string;
  section: string; // A, B, C
  rowNumber: string; // 1, 2, 3
  seatNumber: string; // 1, 2, 3
  grade: 'vip' | 'r' | 's' | 'a';
  price: number;
  status: 'available' | 'reserved' | 'booked';
  sessionId?: string; // reserved 상태일 때만
  reservedAt?: string; // ISO 8601 format
}

// 좌석 상태 (실시간 동기화용)
interface SeatStatus {
  id: string;
  status: 'available' | 'reserved' | 'booked';
  sessionId?: string;
}

// API 요청/응답
interface ReserveSeatRequest {
  seatIds: string[];
  sessionId: string;
}

interface ReserveSeatResponse {
  seat: Seat;
  totalAmount: number;
}

interface ReleaseSeatRequest {
  seatIds: string[];
  sessionId: string;
}

interface ValidateBookingRequest {
  seatIds: string[];
  sessionId: string;
}

interface ValidateBookingResponse {
  valid: boolean;
  seats: Seat[];
}
```

## 7. 에러 처리 전략

### 7.1 에러 타입별 처리

| 에러 타입 | HTTP 상태 | 처리 방법 |
|-----------|-----------|-----------|
| 동시 선점 충돌 | 409 Conflict | 토스트 메시지 표시, 좌석 배치도 갱신 |
| 세션 만료 | 400 Bad Request | 알림 모달 표시, 페이지 새로고침 유도 |
| 네트워크 오류 | - | 토스트 메시지 표시, 재시도 버튼 제공 |
| 서버 오류 | 500 Internal Server Error | 토스트 메시지 표시, 관리자에게 알림 |
| 인원수 초과 | - (클라이언트 검증) | 토스트 메시지 표시, 클릭 무시 |

### 7.2 React Query 에러 처리

```typescript
const reserveSeatMutation = useMutation({
  mutationFn: reserveSeats,
  onError: (error: AxiosError<{ message: string }>) => {
    if (error.response?.status === 409) {
      dispatch({
        type: 'SET_ERROR',
        payload: '이미 다른 사용자가 선택한 좌석입니다. 다른 좌석을 선택해주세요.'
      });
      // 좌석 배치도 즉시 갱신
      queryClient.invalidateQueries(['seats', 'status', concertId]);
    } else if (error.response?.status === 400) {
      dispatch({
        type: 'SET_ERROR',
        payload: '세션이 만료되었습니다. 페이지를 새로고침해주세요.'
      });
    } else {
      dispatch({
        type: 'SET_ERROR',
        payload: '네트워크 오류가 발생했습니다. 다시 시도해주세요.'
      });
    }
  },
});
```

## 8. 성능 최적화

### 8.1 메모이제이션

```typescript
// 좌석 그리드 렌더링 최적화
const MemoizedSeatButton = React.memo(SeatButton, (prevProps, nextProps) => {
  return (
    prevProps.seat.id === nextProps.seat.id &&
    prevProps.seat.status === nextProps.seat.status &&
    prevProps.seat.sessionId === nextProps.seat.sessionId
  );
});

// Derived State 메모이제이션
const totalAmount = useMemo(
  () => selectedSeats.reduce((sum, seat) => sum + seat.price, 0),
  [selectedSeats]
);
```

### 8.2 React Query 최적화

```typescript
// 좌석 배치도 조회: 초기 로딩만 수행, 이후 실시간 상태 동기화로 업데이트
useQuery({
  queryKey: ['seats', concertId],
  queryFn: () => fetchSeats(concertId),
  staleTime: Infinity, // 한 번 로딩 후 계속 사용
  cacheTime: 600000, // 10분 캐시
});

// 실시간 상태 동기화: 5초마다 폴링, 변경된 좌석만 업데이트
useQuery({
  queryKey: ['seats', 'status', concertId],
  queryFn: () => fetchSeatStatus(concertId),
  refetchInterval: 5000,
  select: (data) => {
    // 변경된 좌석만 필터링
    return data.filter(seat =>
      seat.status !== seats.find(s => s.id === seat.id)?.status
    );
  },
});
```

### 8.3 가상 스크롤링

대규모 좌석(10,000석 이상)의 경우 `react-window` 또는 `react-virtual`을 사용하여 가상 스크롤링 적용:

```typescript
import { FixedSizeGrid } from 'react-window';

function SeatGrid({ seats }: { seats: Seat[] }) {
  return (
    <FixedSizeGrid
      columnCount={20}
      rowCount={Math.ceil(seats.length / 20)}
      columnWidth={50}
      rowHeight={50}
      height={600}
      width={1000}
    >
      {({ columnIndex, rowIndex, style }) => {
        const seat = seats[rowIndex * 20 + columnIndex];
        return seat ? (
          <div style={style}>
            <SeatButton seat={seat} />
          </div>
        ) : null;
      }}
    </FixedSizeGrid>
  );
}
```

## 9. 테스트 전략

### 9.1 단위 테스트 (Unit Tests)

```typescript
describe('seatSelectionReducer', () => {
  it('should add seat to selectedSeats on SEAT_SELECTED', () => {
    const state = initialState;
    const action = { type: 'SEAT_SELECTED', payload: mockSeat };
    const newState = seatSelectionReducer(state, action);

    expect(newState.selectedSeats).toHaveLength(1);
    expect(newState.isTimerActive).toBe(true);
  });

  it('should start timer on first seat selection', () => {
    const state = initialState;
    const action = { type: 'SEAT_SELECTED', payload: mockSeat };
    const newState = seatSelectionReducer(state, action);

    expect(newState.timerStartedAt).toBeTruthy();
    expect(newState.isTimerActive).toBe(true);
  });

  it('should remove seat from selectedSeats on SEAT_RELEASED', () => {
    const state = {
      ...initialState,
      selectedSeats: [mockSeat],
    };
    const action = { type: 'SEAT_RELEASED', payload: mockSeat.id };
    const newState = seatSelectionReducer(state, action);

    expect(newState.selectedSeats).toHaveLength(0);
  });
});
```

### 9.2 통합 테스트 (Integration Tests)

```typescript
describe('SeatSelectionProvider', () => {
  it('should select and release seats', async () => {
    const { result } = renderHook(() => useSeatSelection(), {
      wrapper: SeatSelectionProvider,
    });

    // 좌석 선택
    await act(async () => {
      await result.current.selectSeat(mockSeat);
    });

    expect(result.current.state.selectedSeats).toHaveLength(1);

    // 좌석 해제
    await act(async () => {
      await result.current.releaseSeat(mockSeat.id);
    });

    expect(result.current.state.selectedSeats).toHaveLength(0);
  });

  it('should validate selection before proceeding', async () => {
    const { result } = renderHook(() => useSeatSelection(), {
      wrapper: SeatSelectionProvider,
    });

    await act(async () => {
      await result.current.selectSeat(mockSeat1);
      await result.current.selectSeat(mockSeat2);
    });

    expect(result.current.canProceed).toBe(true);

    await act(async () => {
      await result.current.proceedToCheckout();
    });

    expect(mockRouter.push).toHaveBeenCalledWith('/booking/checkout');
  });
});
```

### 9.3 E2E 테스트 (End-to-End Tests)

```typescript
describe('Seat Selection E2E', () => {
  it('should complete seat selection flow', async () => {
    // 페이지 진입
    await page.goto('/booking/seats?concertId=123&numberOfTickets=2');

    // 좌석 배치도 로딩 대기
    await page.waitForSelector('.seat-grid');

    // 2개 좌석 선택
    await page.click('[data-seat-id="seat-1"]');
    await page.click('[data-seat-id="seat-2"]');

    // 선택 정보 확인
    expect(await page.textContent('.selected-count')).toBe('2 / 2석 선택');

    // 예약하기 버튼 활성화 확인
    expect(await page.isEnabled('.proceed-button')).toBe(true);

    // 예약하기 버튼 클릭
    await page.click('.proceed-button');

    // 다음 페이지로 이동 확인
    await page.waitForURL('/booking/checkout');
  });

  it('should handle timer expiration', async () => {
    // 타이머를 1초로 설정 (테스트용)
    await page.goto('/booking/seats?concertId=123&numberOfTickets=1&timerSeconds=1');

    // 좌석 선택
    await page.click('[data-seat-id="seat-1"]');

    // 타이머 만료 대기
    await page.waitForSelector('.expiration-modal', { timeout: 2000 });

    // 모달 메시지 확인
    expect(await page.textContent('.expiration-modal')).toContain('선택 시간이 만료되었습니다');
  });
});
```

## 10. 접근성 (Accessibility)

### 10.1 ARIA 속성

```typescript
function SeatButton({ seat }: { seat: Seat }) {
  const isSelected = /* ... */;
  const isDisabled = seat.status !== 'available' && !isSelected;

  return (
    <button
      aria-label={`${seat.section}구역 ${seat.rowNumber}행 ${seat.seatNumber}번 좌석, ${seat.grade}석, ${seat.price.toLocaleString()}원, ${
        isSelected ? '선택됨' : seat.status === 'available' ? '선택 가능' : '선택 불가'
      }`}
      aria-pressed={isSelected}
      aria-disabled={isDisabled}
      disabled={isDisabled}
    >
      {seat.seatNumber}
    </button>
  );
}

function Timer({ formattedTime, remainingSeconds }: TimerProps) {
  return (
    <div aria-live="polite" aria-atomic="true">
      <span className="sr-only">남은 시간: </span>
      {formattedTime}
      {remainingSeconds <= 60 && (
        <span className="sr-only">1분 이하 남음</span>
      )}
    </div>
  );
}
```

### 10.2 키보드 네비게이션

```typescript
function SeatGrid({ seats }: { seats: Seat[] }) {
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    const columns = 20;
    let nextIndex = index;

    switch (e.key) {
      case 'ArrowRight':
        nextIndex = index + 1;
        break;
      case 'ArrowLeft':
        nextIndex = index - 1;
        break;
      case 'ArrowDown':
        nextIndex = index + columns;
        break;
      case 'ArrowUp':
        nextIndex = index - columns;
        break;
      default:
        return;
    }

    e.preventDefault();
    const nextButton = document.querySelector(`[data-seat-index="${nextIndex}"]`) as HTMLButtonElement;
    nextButton?.focus();
  };

  return (
    <div className="seat-grid" role="grid">
      {seats.map((seat, index) => (
        <SeatButton
          key={seat.id}
          seat={seat}
          data-seat-index={index}
          onKeyDown={(e) => handleKeyDown(e, index)}
        />
      ))}
    </div>
  );
}
```

## 11. 마이그레이션 가이드

기존 상태 관리 방식에서 새로운 방식으로 마이그레이션하는 경우:

### 11.1 useState → useReducer + Context

```typescript
// Before
const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
const [timer, setTimer] = useState(600);

// After
const [state, dispatch] = useReducer(seatSelectionReducer, initialState);
// state.selectedSeats, state.remainingSeconds
```

### 11.2 Props Drilling → Context

```typescript
// Before
<SeatLayout selectedSeats={selectedSeats} onSelectSeat={handleSelectSeat}>
  <SeatGrid selectedSeats={selectedSeats} onSelectSeat={handleSelectSeat}>
    <SeatButton selectedSeats={selectedSeats} onSelectSeat={handleSelectSeat} />
  </SeatGrid>
</SeatLayout>

// After
<SeatSelectionProvider>
  <SeatLayout>
    <SeatGrid>
      <SeatButton /> {/* useSeatSelection() 훅으로 접근 */}
    </SeatGrid>
  </SeatLayout>
</SeatSelectionProvider>
```

## 12. 참고 자료

- [React useReducer 공식 문서](https://react.dev/reference/react/useReducer)
- [React Context 공식 문서](https://react.dev/reference/react/createContext)
- [TanStack Query 공식 문서](https://tanstack.com/query/latest/docs/react/overview)
- [Flux 아키텍처 개념](https://facebook.github.io/flux/docs/in-depth-overview/)
- [좌석 선택 유스케이스 문서](C:\Users\xodnj\OneDrive\바탕 화면\vmc\vmc-c3-\docs\usecases\003\usecase.md)
- [데이터베이스 설계 문서](C:\Users\xodnj\OneDrive\바탕 화면\vmc\vmc-c3-\docs\database.md)
