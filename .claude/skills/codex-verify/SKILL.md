---
name: codex-verify
description: Delegate code verification to OpenAI Codex CLI as an independent reviewer. Codex runs npm typecheck/lint/test, reviews uncommitted diff against CLAUDE.md/AGENTS.md conventions, and looks for logic bugs the implementer may have missed. Use after completing a non-trivial feature, or whenever the user asks to "codex verify", "codex review", or wants independent verification. PREFERRED over self-verification — different model catches different bugs.
---

# Codex Verify

비자명한 코드 변경을 완료한 후 **OpenAI Codex CLI**에 독립적인 검증을 위임합니다.
"AI가 자기 코드 검증" 함정을 피하기 위해 다른 모델이 검토합니다.

## 사전 조건

- `codex` CLI 설치 (`which codex`로 확인)
- OpenAI 인증 완료 (실패 시 `codex login` 안내)
- 프로젝트 루트에 `AGENTS.md` (이미 `CLAUDE.md` 심볼릭 링크로 생성됨)

## 절차

### 1. 변경 사항 확인

```bash
git status --short
```

- 변경 없음 → "검증할 변경이 없습니다"라고 보고하고 종료
- 변경 있음 → 다음 단계

### 2. Codex 호출

```bash
codex review --uncommitted "$(cat <<'EOF'
당신은 weeklyReport 프로젝트의 독립 코드 리뷰어다.
프로젝트 루트의 AGENTS.md (CLAUDE.md와 동일)를 정독하라.

다음을 순서대로 실행하고 보고하라:

1. `npm run typecheck` 실행 → PASS/FAIL + 에러 요약
2. `npm run lint` 실행 → PASS/FAIL + 위반 건수 (CLAUDE.md 어떤 규칙인지 매핑)
3. `npm run test` 실행 → PASS/FAIL + 실패 테스트 요약
4. `npm run format:check` 실행 → PASS/FAIL
5. uncommitted diff를 정독하고:
   a. CLAUDE.md "필수 규칙" 위반이 자동 검사로 잡히지 않은 게 있는가?
   b. 의도한 변경과 실제 코드가 일치하는가?
   c. 새 기능에 대응되는 테스트가 누락되지 않았는가? (`src/lib/`의 새 .ts는 .test.ts 필수)
   d. 회귀 위험이 있는가? (특히 parse-docx, generate-docx, 도메인 타입)
   e. UX 영향 (alert/confirm 신규 도입, 접근성 누락 등)

보고서 형식:
=== 자동 검사 ===
| 단계 | 결과 | 비고 |

=== 수동 리뷰 ===
🚨 차단 (Blocking): ...
⚠️  권고 (Should Fix): ...
💡 제안 (Could Improve): ...

=== 종합 ===
- 머지 가능: YES / NO
- 핵심 액션: (1~3개)

500단어 이내. 코드 수정은 하지 말고 보고만.
EOF
)" 2>&1
```

옵션:

- 모델 변경 필요 시: `-c model=gpt-5-codex` 추가
- 출력이 너무 길면 사용자에게 핵심 요약만 전달

### 3. 결과 해석 및 사용자 보고

Codex 출력을 그대로 덤프하지 말고:

- 자동 검사 결과(typecheck/lint/test) 표로 요약
- 수동 리뷰 차단 항목은 그대로 인용
- 제 판단도 한 줄 추가 ("동의" 또는 "이 항목은 의도적이라 무시 가능" 등)
- 다음 단계 명확히: "수정할까요? 아니면 머지?"

### 4. 실패 처리

- **codex 명령 자체가 실패** (인증 등) → 사용자에게 `codex login` 안내, 그 동안 `/feature-complete`로 폴백
- **codex 출력 중 일부가 실패** (예: lint FAIL) → 그 부분만 사용자에게 강조
- **codex 응답이 모호** → 핵심만 정리해 다시 한번 codex에게 명확화 요청 가능

## 비용/시간 안내

- 호출당 OpenAI 토큰 비용 발생 (작은 diff: 몇 센트, 큰 diff: 수십 센트)
- 실행 시간 30초~3분
- 매 변경마다 호출하지 말고, **비자명한 단위 작업 완료 시점**에만

## 폴백

codex 사용이 부적절한 경우:

- 오프라인 / 인증 안 됨 → `/feature-complete` 사용
- 단순 수정 (오타, 주석) → 검증 생략 가능
- 사용자가 "codex 말고" 명시 → `/feature-complete` 사용

## 원칙

- **Codex의 verdict를 그대로 신뢰하지는 않음** — 한 번 더 사람이 판단해야 함
- **수정은 절대 codex가 자동으로 하게 하지 않음** — review만, 수정은 별도 작업으로
- **컨벤션의 단일 진실 공급원은 CLAUDE.md/AGENTS.md** — codex가 다른 의견을 내면 CLAUDE.md를 우선
