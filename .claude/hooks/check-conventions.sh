#!/usr/bin/env bash
# Convention checker — runs after Edit/Write/MultiEdit on .ts/.tsx in src/.
# Blocks (exit 2) on forbidden patterns so Claude must fix immediately.
#
# Hook receives JSON on stdin via Claude Code's hook protocol:
#   { "tool_input": { "file_path": "..." }, ... }

set -uo pipefail

# Parse file_path from stdin JSON (python3 is universal on macOS)
FILE_PATH=$(python3 -c '
import json, sys
try:
    d = json.load(sys.stdin)
    print(d.get("tool_input", {}).get("file_path", ""))
except Exception:
    pass
')

# Skip if not a ts/tsx file in src/
[[ -z "$FILE_PATH" ]] && exit 0
[[ ! "$FILE_PATH" =~ \.(ts|tsx)$ ]] && exit 0
[[ ! "$FILE_PATH" =~ /src/ ]] && exit 0
[[ ! -f "$FILE_PATH" ]] && exit 0

# Allow types.ts itself to define the helpers (otherwise it'd self-flag)
BASENAME=$(basename "$FILE_PATH")
IS_TYPES_FILE=false
if [[ "$BASENAME" == "types.ts" ]]; then
    IS_TYPES_FILE=true
fi

VIOLATIONS=""
add_violation() {
    VIOLATIONS+="$1"$'\n'
}

check() {
    local pattern="$1"
    local message="$2"
    local matches
    matches=$(grep -nE "$pattern" "$FILE_PATH" 2>/dev/null || true)
    if [[ -n "$matches" ]]; then
        add_violation "❌ $message"
        while IFS= read -r line; do
            add_violation "    $line"
        done <<< "$matches"
        add_violation ""
    fi
}

# 1. UTC "today" anti-pattern
check 'new Date\(\)\.toISOString\(\)\.split\(' \
    "UTC \"오늘\" 패턴. \`getTodayLocal()\` 사용 (src/lib/types.ts)"

# 2. Date.now()-based ID generation
if [[ "$IS_TYPES_FILE" == false ]]; then
    check 'id:[[:space:]]*Date\.now\(\)' \
        "Date.now() 기반 ID. \`newId()\` 사용 (src/lib/types.ts)"
    check 'Date\.now\(\)[[:space:]]*\+[[:space:]]*Math\.random' \
        "Date.now()+random ID. \`newId()\` 사용"
fi

# 3. Explicit any (allow eslint-disable as escape hatch)
check '(:[[:space:]]*any[[:space:]]*[=,;)>]|<any>|[[:space:]]as[[:space:]]+any\b)' \
    "\`any\` 사용. \`unknown\` + 검증 또는 정확한 타입 사용"

# 4. alert() / confirm()
check '\b(alert|confirm)[[:space:]]*\(' \
    "\`alert/confirm\` 사용. 토스트 또는 인라인 UI로 대체"

# 5. Unsafe API casting
check '\bas[[:space:]]+ReportData\b' \
    "ReportData 무검증 캐스팅. zod \`safeParse\` 사용"

# 6. React import inside lib/
if [[ "$FILE_PATH" =~ /src/lib/ ]]; then
    check '^import .* from "react"' \
        "lib/ 내부에서 React import. components/ 또는 hooks/로 이동"
fi

if [[ -n "$VIOLATIONS" ]]; then
    echo "[convention-check] $FILE_PATH" >&2
    echo "" >&2
    echo "$VIOLATIONS" >&2
    echo "📖 전체 규칙: CLAUDE.md" >&2
    exit 2
fi

exit 0
