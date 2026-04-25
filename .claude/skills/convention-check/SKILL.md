---
name: convention-check
description: Audit the entire codebase against weeklyReport project conventions defined in CLAUDE.md. Use when the user asks to check, audit, or verify project compliance, or before a release/PR. Reports violations grouped by rule with file:line references.
---

# Convention Check

프로젝트 전반을 컨벤션 위반 패턴으로 스캔하고 보고서를 작성합니다.

## 검사 항목

1. **UTC 날짜 패턴** — `new Date().toISOString().split("T")` (사용해야 함: `getTodayLocal()`)
2. **Date.now() 기반 ID** — `id: Date.now()`, `Date.now() + Math.random()` (사용해야 함: `newId()`)
3. **`any` 타입** — `: any`, `as any`, `<any>`
4. **`alert()` / `confirm()`** — 토스트나 인라인 UI로 대체
5. **무검증 캐스팅** — `as ReportData` (zod 사용)
6. **lib/에서 React import** — `lib/`는 React 무관해야 함
7. **빈 export / 사용되지 않는 import**
8. **inline `style={{}}` 남발** — Tailwind로 대체
9. **Tailwind 클래스 중복** — 같은 클래스 스트링이 3+회 반복되면 컴포넌트 추출 후보

## 실행 순서

1. `src/` 아래 모든 `.ts/.tsx` 파일 대상으로 패턴 검색:

```bash
echo "=== 1. UTC 날짜 패턴 ==="
grep -rnE 'new Date\(\)\.toISOString\(\)\.split\(' src/ --include="*.ts" --include="*.tsx" || echo "(없음)"

echo "=== 2. Date.now() ID ==="
grep -rnE 'id:\s*Date\.now\(\)|Date\.now\(\)\s*\+\s*Math\.random' src/ --include="*.ts" --include="*.tsx" || echo "(없음)"

echo "=== 3. any 타입 ==="
grep -rnE '(:\s*any\s*[=,;)>]|<any>|\sas\s+any\b)' src/ --include="*.ts" --include="*.tsx" || echo "(없음)"

echo "=== 4. alert/confirm ==="
grep -rnE '\b(alert|confirm)\s*\(' src/ --include="*.ts" --include="*.tsx" || echo "(없음)"

echo "=== 5. as ReportData 캐스팅 ==="
grep -rnE '\bas\s+ReportData\b' src/ --include="*.ts" --include="*.tsx" || echo "(없음)"

echo "=== 6. lib/에서 React import ==="
grep -rn 'from "react"' src/lib/ --include="*.ts" --include="*.tsx" 2>/dev/null || echo "(없음)"

echo "=== 7. inline style 남발 ==="
grep -rn 'style={{' src/ --include="*.tsx" || echo "(없음)"
```

2. **Tailwind 클래스 중복 분석** — 같은 긴 클래스 스트링이 3+회 반복되는지 확인:

```bash
grep -rhoE 'className="[^"]{60,}"' src/ --include="*.tsx" | sort | uniq -c | sort -rn | awk '$1 >= 3'
```

3. **타입체크 + 빌드 통과 여부**:

```bash
npx tsc --noEmit
```

## 보고서 형식

위반이 있으면:

```
## 컨벤션 감사 결과 — N건 위반

### 🚨 [규칙명]
- `path/to/file.ts:42` — 한 줄 컨텍스트
- `path/to/file.ts:88` — 한 줄 컨텍스트
**조치**: [구체적인 수정 방향]
```

위반이 없으면:

```
✅ 모든 컨벤션 통과 (검사 항목 N개)
```

## 후속 조치 제안

리포트 마지막에 우선순위별 수정 순서 제안:

1. 차단성 위반 (any, 무검증 캐스팅) 먼저
2. UX 영향 (alert/confirm)
3. 구조 (lib에서 React, 중복 클래스)

위반 수정은 **자동 진행 X** — 사용자에게 보고 후 승인 받고 진행.
