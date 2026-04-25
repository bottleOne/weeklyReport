---
name: feature-complete
description: Run the full quality pipeline for the weeklyReport project — typecheck, lint, format check, unit tests, and a brief test-coverage check. Use after completing a feature or non-trivial change, before declaring done. Reports each step's pass/fail with concrete next actions for failures.
---

# Feature Complete Verification

기능을 완료했다고 선언하기 전에 실행하는 통합 검증 skill입니다. CLAUDE.md "작업 완료 체크리스트"의 자동화 버전.

## 실행 순서

순서대로 실행하되, 실패 시 그 단계 결과를 분명히 보고하고 사용자에게 수정 의사를 묻습니다. 이전 단계가 통과해야 다음 단계로.

### 1. TypeScript 타입체크

```bash
npm run typecheck
```

실패 시: 에러 메시지 그대로 보여주고 어느 파일/라인이 문제인지 안내.

### 2. ESLint 검사

```bash
npm run lint
```

실패 시:

- 각 위반을 CLAUDE.md 규칙과 매핑 (예: `no-alert` → 필수 #5)
- 자동 수정 가능한 항목은 `npm run lint:fix` 안내
- 수동 수정 필요한 항목은 구체적 방향 제시

### 3. Prettier 포맷 검사

```bash
npm run format:check
```

실패 시: `npm run format`으로 일괄 정리할지 묻기 (보통 yes).

### 4. 단위 테스트

```bash
npm run test
```

실패 시:

- 실패한 테스트와 에러 메시지 보여줌
- 의도적 동작 변경이면 테스트 업데이트 제안
- 회귀면 코드 수정 필요

### 5. 새 코드 테스트 커버리지 점검 (선택)

방금 추가/수정한 파일이 `src/lib/`의 순수 함수라면 대응되는 `*.test.ts`가 있는지 확인:

```bash
git diff --name-only HEAD | grep -E '^src/lib/.*\.ts$' | grep -v '\.test\.' | while read f; do
  test_file="${f%.ts}.test.ts"
  if [[ ! -f "$test_file" ]]; then
    echo "⚠️  테스트 누락: $f → $test_file"
  fi
done
```

테스트가 누락된 파일이 있으면 사용자에게 알리고 작성 의사 묻기 (작은 유틸이면 skip 동의 OK).

### 6. (대규모 변경 시) 빌드

`page.tsx`, `layout.tsx`, `next.config.ts`, 또는 `package.json` 변경이 있을 때만:

```bash
npm run build
```

## 최종 보고 형식

```
## Feature Complete 결과

| 단계 | 결과 |
|---|---|
| TypeScript | ✅ |
| ESLint | ✅ |
| Prettier | ✅ |
| 단위 테스트 | ✅ (N passed) |
| 신규 파일 테스트 | ⚠️ src/lib/foo.ts 테스트 없음 |
| 빌드 | (skip — UI 변경 없음) |

**총평**: 머지 가능 / 추가 작업 필요
**다음 단계**: ...
```

## 원칙

- **수정은 절대 자동으로 하지 않음** — 보고만 하고 사용자 결정 받기
- 단, 자명한 자동 수정(prettier --write, lint --fix)은 사용자 확인 후 실행 OK
- **빠른 피드백** — 첫 실패에서 멈추지 말고 가능하면 모든 단계 결과를 모아 한 번에 보고
- 단, typecheck 실패는 후속 단계 의미 없을 수 있으니 우선 보고 후 진행 의사 묻기
