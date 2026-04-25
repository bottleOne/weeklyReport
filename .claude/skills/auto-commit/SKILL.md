---
name: auto-commit
description: Stage uncommitted changes, group them into logical Conventional Commits, and commit (Korean style matching project history). User-invoked only — this is the explicit authorization to commit. Does NOT push by default; pass "push" as argument to also push to origin. Use when user says "/auto-commit", "자동 커밋", "스마트 커밋", or asks to commit current work in one shot.
---

# Auto Commit

사용자가 명시적으로 호출했을 때만 동작. 현재 변경분을 분석해 의미 있는 단위로 나눠 커밋.

## 인수

- (인수 없음): commit만 하고 push 안 함 (기본)
- `push`: commit 후 origin에 push까지

## 절차

### 1. 사전 점검

```bash
git status --short
git log --oneline -5    # 프로젝트 commit 스타일 파악
```

- **변경 없음** → "커밋할 변경이 없습니다." 보고하고 종료
- **변경 있음** → 다음 단계

### 2. 검증 (필수)

```bash
npm run check
```

실패 시:

- 사용자에게 실패 내용 보여주기
- 자동 수정 가능한 항목(format/lint --fix)은 적용 의사 묻기
- 그 외엔 commit 중단 — "수정 후 다시 호출해주세요"
- 사용자가 "그래도 commit해" 하면 진행 (단, 폴드된 lint 차단은 pre-commit hook에서 다시 잡힘)

### 3. 시크릿 / 민감 파일 검사

다음 패턴이 staged/unstaged에 있으면 **차단** (커밋 금지):

- `.env*` (단, `.env.example`은 허용)
- `*.key`, `*.pem`, `*.p12`, `*.pfx`
- `credentials.json`, `secrets.json`, `service-account*.json`
- `id_rsa`, `id_ed25519` 류 SSH 키
- `**/private/**`

발견 시: 사용자에게 알리고 commit 중단. 의도적이면 사용자가 직접 staging 후 재호출.

### 4. 변경분 분석 + 그룹핑

```bash
git diff --stat HEAD
git diff HEAD              # 또는 파일별로 git diff <file>
```

**그룹핑 원칙**:

- 같은 도메인/기능 → 하나의 commit
- 서로 다른 관심사 → 별도 commit
- 일반적 분리 기준:
  - `feat`: 신규 기능 (사용자 가치)
  - `fix`: 버그 수정
  - `refactor`: 동작 변경 없는 구조 개선
  - `test`: 테스트 추가/수정만
  - `chore`: 빌드/도구/설정 (package.json, eslint, CI 등)
  - `docs`: 문서만 (README, CLAUDE.md, 주석)
  - `style`: 포맷팅만 (실질 변경 X)
  - `perf`: 성능 개선

**파일 매핑 가이드**:

- `src/app/`, `src/components/`, `src/lib/` (구현) → `feat` 또는 `fix`
- `src/lib/*.test.ts`, `__snapshots__/` → `test`
- `package.json`, `*.config.*`, `.husky/`, `.github/` → `chore`
- `CLAUDE.md`, `*.md` → `docs`
- `.prettierrc.json` 등 포맷 설정 + 일괄 포맷 → `style` 또는 `chore`

**같은 파일이 여러 관심사를 담은 경우**:

- 우선 한 commit으로 묶기 — 메시지 본문에 두 관심사 모두 명시
- 진짜로 분리 가치 있으면 사용자에게 의견 묻기 (`git add -p`는 마지막 수단)

### 5. 커밋 메시지 작성 (한국어, Conventional Commits)

**제목 형식** (50자 이내 권장):

```
<type>: <간단한 요약>
```

**본문** (선택, 변경이 단순하지 않을 때):

- 무엇을 했는지 bullet
- 왜 필요했는지 (의도/배경)
- 부수 효과 / 주의사항

**예시** (이 프로젝트 history에서 차용):

```
feat: 프로젝트 기획서 + 마일스톤 일정 관리 (/plan)

별도 라우트 /plan에서 기초 기획서 작성 및 마일스톤+작업 2-tier 일정 관리.
DOCX / PDF / Markdown 3가지 포맷 다운로드.

도메인
- plan-types.ts: ProjectPlanData, Milestone, PlanTask
...
```

**Trailer**:

- 항상 끝에 `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>` 포함
- HEREDOC 사용 권장:

  ```bash
  git commit -m "$(cat <<'EOF'
  type: 요약

  본문...

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  ```

### 6. Staging + Commit

각 그룹별로:

```bash
git add <file1> <file2> ...   # 명시적 파일 (git add -A 금지)
git commit -m "..."
```

**금지**:

- `git add -A` / `git add .` (의도치 않은 파일 포함 위험)
- `--no-verify` (pre-commit hook 우회 금지)
- `--amend` (사용자가 명시적으로 amend 요청한 경우만)
- `-f` / `--force` 류

### 7. Push (인수 `push`인 경우만)

```bash
git push origin <current-branch>
```

**금지**:

- main/master에 force-push (`-f`)
- 사용자가 명시적으로 push를 요청하지 않았으면 push 안 함

### 8. 보고

```
✅ N개 commit 완료

| # | hash | type | 요약 |
|---|---|---|---|
| 1 | abc1234 | feat | ... |
| 2 | def5678 | test | ... |

(push 안 함 — `/auto-commit push`로 push까지 진행)
```

push까지 했으면:

```
✅ N개 commit + push 완료
원격: origin/<branch> 동기화됨
```

## 실패 처리

| 상황                                | 대응                                                                   |
| ----------------------------------- | ---------------------------------------------------------------------- |
| pre-commit hook 실패 (lint-staged)  | hook 출력 그대로 보여주고 사용자에게 수정 의사 묻기 — 자동 수정 시도 X |
| pre-push hook 실패 (typecheck/test) | push 중단, hook 출력 보여주기                                          |
| network 실패 (push 시)              | 재시도 의사 묻기, 자동 retry X                                         |
| commit 메시지 hook 거부             | 메시지 수정 후 재시도                                                  |

## 원칙

- **사용자 명시 호출만 동작** — 자동/배경에서 호출 금지
- **명시적 파일 staging** — 의도치 않은 파일 포함 위험 회피
- **Hook 우회 절대 금지** — `--no-verify` 등 사용 X
- **Push는 default off** — 사용자가 `push` 인수를 줄 때만
- **메시지 품질** — 자동 생성이라도 6개월 후 자신이 읽어 의미 파악되도록
