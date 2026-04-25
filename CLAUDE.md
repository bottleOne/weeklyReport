# weeklyReport — 프로젝트 원칙

Next.js 16 (App Router) + React 19 + TypeScript 6 기반 문서 작성 도구.

**두 도메인** (라우트로 분리):

- `/` — **주간업무 보고서**: 폼 입력 → DOCX/PDF, 기존 DOCX 업로드 → 복원
- `/plan` — **프로젝트 기획서**: 기획 본문 + 캘린더 기반 일정 → DOCX/PDF/Markdown

## 기술 스택 고정값

- **Next.js 16 App Router** (Pages Router 추가 금지)
- **React 19** + **TypeScript 6 strict**
- **Tailwind CSS 4** (CSS 모듈/styled-components 금지)
- **docx** (서버), **jspdf + html2canvas** (클라 동적 import)
- 새 의존성 추가 시 [bundlephobia](https://bundlephobia.com)에서 크기 확인

## 디렉터리 규약

```
src/
├── app/                # 라우트만. 비즈니스 로직 X
│   └── api/*/route.ts  # 입력 검증 + lib 호출 + 응답
├── components/         # 표현 컴포넌트 (도메인 로직 X)
├── lib/                # 순수 함수, 도메인 로직 (React import 금지)
└── hooks/              # custom React hooks
```

- `lib/`에 React를 import하면 잘못된 위치
- 같은 Tailwind 클래스 스트링이 3번 이상 반복되면 컴포넌트로 추출

## 필수 규칙 (위반 시 hook이 차단)

### 1. ID는 `newId()`로

```ts
// ❌ 금지
id: Date.now() + Math.random() * 10000;

// ✅ 사용
import { newId } from "@/lib/types";
id: newId();
```

이유: React key 충돌 방지, 타입 일관성 (`id: string`).

### 2. "오늘"은 `getTodayLocal()`

```ts
// ❌ 금지 (UTC 기준이라 KST 오전엔 어제)
new Date().toISOString().split("T")[0];

// ✅ 사용
import { getTodayLocal } from "@/lib/types";
getTodayLocal();
```

### 3. API 입력은 zod로 검증

```ts
// ❌ 금지
const data = await request.json() as ReportData;

// ✅ 사용
const parsed = ReportDataSchema.safeParse(await request.json());
if (!parsed.success) return NextResponse.json({ error: ... }, { status: 400 });
```

### 4. `any` 금지

- 외부 데이터는 `unknown`으로 받고 검증 후 좁히기
- 정 필요하면 `// eslint-disable-next-line` + 이유 주석

### 5. `alert()` / `confirm()` 금지

- 토스트 컴포넌트 또는 인라인 UI로 대체
- 모바일/접근성 모두 망가짐

## 도메인 규칙

- **날짜 내부 포맷**: 항상 `YYYY-MM-DD` 문자열. 표시 변환은 `formatDateRange` 등 헬퍼만 통과
- **ID 타입**: 모두 `string` (UUID)
- **주간보고서 모드**: `"employee"` (사원) / `"leader"` (팀장). 분기는 `mode` 한 곳에서만
- **도메인 타입 위치**:
  - 주간보고서: [src/lib/types.ts](src/lib/types.ts) (`ReportData`) + [src/lib/schemas.ts](src/lib/schemas.ts)
  - 프로젝트 기획서: [src/lib/plan-types.ts](src/lib/plan-types.ts) (`ProjectPlanData`, `PlanScheduleEntry`) + [src/lib/plan-schemas.ts](src/lib/plan-schemas.ts)
- **자동저장 키 규칙**: `weeklyReport:<domain>FormState:v<n>` (스키마 깨짐 방지 버전 prefix)
- **자동저장 hook**: 제네릭 [src/hooks/usePersistedState.ts](src/hooks/usePersistedState.ts) 사용. 도메인 wrapper는 선택

## 코드 스타일

- 함수 시그니처는 입출력 타입 모두 명시
- `useState` 5개 이상이 같은 도메인이면 `useReducer` 또는 custom hook으로
- 컴포넌트 prop 콜백은 `onChange`, `onSubmit` 표준 네이밍
- bool prop은 `isLoading`, `hasError` 같은 동사형
- 주석은 WHY만. WHAT은 코드/이름으로 표현

## 안티패턴

| 패턴                                           | 대안                                       |
| ---------------------------------------------- | ------------------------------------------ |
| `: any`, `as any`                              | `unknown` + 검증, 또는 정확한 타입         |
| `useEffect`에서 fetch (의존성 누락)            | `useSWR`/`useQuery` 또는 정확한 deps       |
| 인라인 `style={{...}}` 남발                    | Tailwind 클래스                            |
| 거대한 객체 리터럴을 컴포넌트 내에서 매번 생성 | `useMemo` 또는 모듈 스코프 상수            |
| 무한 옵셔널 체이닝 (`a?.b?.c?.d`)              | 타입 설계 재검토                           |
| 클라 번들에 무거운 라이브러리                  | 서버 라우트에서만 import, 또는 동적 import |

## 작업 완료 체크리스트 (필수)

**비자명한 코드 변경 후 반드시 실행:**

### 우선: Codex 독립 검증

```
/codex-verify
```

다른 AI 모델(OpenAI Codex)이 독립적으로 검증합니다 — typecheck/lint/test 자동 실행 + diff에 대한 코드 리뷰 + 컨벤션 위반 감지. "AI가 자기 코드 검증" 함정을 피하기 위함.

### 폴백: 자체 검증

codex가 사용 불가(인증/오프라인/비용 회피)거나 사용자가 명시적으로 자체 검증 요청 시:

```
/feature-complete
```

또는 직접:

```bash
npm run check        # typecheck + lint + format:check + test 한 방에
```

### 무엇이 비자명한 변경인가

- 새 기능 추가, 도메인 로직 수정
- API route 추가/수정
- 타입 정의 변경
- 의존성 추가/제거

오타 수정, 주석 변경, 단순 리네임은 `typecheck`만으로 충분.

### 검증 우선순위

1. **codex가 fail 보고** → 코드 수정 후 재검증
2. **codex가 pass인데 의심스러운 경고** → 사용자에게 결정 위임
3. **codex가 pass + 자체 판단도 OK** → 머지 진행 가능

## 새 기능 추가 시 테스트 정책

**필수:**

- `src/lib/`에 추가하는 **순수 함수**는 단위 테스트 작성 (`*.test.ts` co-locate)
- API 라우트 추가 시 입력 검증 로직 테스트
- 기존 테스트가 있는 파일 수정 시 테스트도 같이 업데이트

**권장:**

- `src/components/`의 복잡한 인터랙션은 `@testing-library/react`로 테스트
- 회귀 위험 큰 파싱/생성 코드(`parse-docx`, `generate-docx`)는 픽스처 기반 테스트

**테스트 파일 위치:**

- `src/lib/foo.ts` → `src/lib/foo.test.ts` (co-located)
- 픽스처는 `src/lib/__fixtures__/` (README 참조)

**빠른 명령:**

```bash
npm run test          # 한 번 실행
npm run test:watch    # 파일 변경 시 자동 재실행 (개발 중)
npm run test:ui       # Vitest UI 대시보드
npm run test:coverage # 커버리지 리포트
```

## 자동화

- **컨벤션 위반 차단**: `.claude/hooks/check-conventions.sh` (PostToolUse 후크, 자동)
- **수동 컨벤션 감사**: `/convention-check` 슬래시 커맨드
- **🌟 독립 검증 (권장)**: `/codex-verify` — OpenAI Codex CLI에 위임, 다른 모델이 독립적으로 typecheck/lint/test/리뷰
- **자체 검증 (폴백)**: `/feature-complete` — Claude가 직접 typecheck + lint + format + test
- **리뷰 위임 (Claude 내부)**: `convention-reviewer` 에이전트

**규칙**: 새 기능 추가 또는 비자명한 수정 후에는 **반드시** `/codex-verify` (또는 폴백 `/feature-complete`) 실행하고 결과 보고.

**검증 컨벤션의 단일 진실 공급원**: 이 파일 (`CLAUDE.md`). codex는 `AGENTS.md`(이 파일의 심볼릭 링크)를 통해 같은 규칙을 사용함.

## 참고 파일

### 주간보고서 (`/`)

- 도메인 타입: [src/lib/types.ts](src/lib/types.ts), 스키마: [src/lib/schemas.ts](src/lib/schemas.ts)
- 페이지: [src/app/page.tsx](src/app/page.tsx)
- DOCX 파싱: [src/lib/parse-docx.ts](src/lib/parse-docx.ts)
- DOCX 생성: [src/lib/generate-docx.ts](src/lib/generate-docx.ts)

### 프로젝트 기획서 (`/plan`)

- 도메인 타입: [src/lib/plan-types.ts](src/lib/plan-types.ts), 스키마: [src/lib/plan-schemas.ts](src/lib/plan-schemas.ts)
- 페이지: [src/app/plan/page.tsx](src/app/plan/page.tsx)
- DOCX 생성: [src/lib/generate-plan-docx.ts](src/lib/generate-plan-docx.ts)
- Markdown 생성: [src/lib/generate-plan-markdown.ts](src/lib/generate-plan-markdown.ts)
- 컴포넌트: `src/components/plan/` (PlanInfoSection, PlanTextSection, PlanScheduleCalendar, PlanScheduleEntryCard, PlanPreview)
- 캘린더: `react-day-picker` (mode="range") + `date-fns` (locale=ko)
- 캘린더 entry 시각화 CSS: [src/app/globals.css](src/app/globals.css)의 `.rdp-day-entry`, `.rdp-day-highlighted`

### 공통

- 자동저장 hook: [src/hooks/usePersistedState.ts](src/hooks/usePersistedState.ts)
- 주간보고서 wrapper: [src/hooks/useFormPersistence.ts](src/hooks/useFormPersistence.ts)
