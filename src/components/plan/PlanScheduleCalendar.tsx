"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ButtonHTMLAttributes, CSSProperties } from "react";
import { DayPicker, type DateRange, type CalendarDay, type Modifiers } from "react-day-picker";
import { ko } from "date-fns/locale";
import "react-day-picker/style.css";
import type { PlanScheduleEntry } from "@/lib/plan-types";

const VISIBLE_MONTHS = 12;
const MONTHS_BEFORE_TODAY = 1;

interface PlanScheduleCalendarProps {
  entries: PlanScheduleEntry[];
  onRangeCommit: (range: { from: Date; to: Date }) => void;
  /** entry 띠 / 더보기 항목 클릭 시 — entry 자체 + 클릭한 셀의 YYYY-MM-DD 전달.
   *  caller는 entry.title 검사 등 추가 분기를 할 수 있다. */
  onEntryClick?: (entry: PlanScheduleEntry, cellDate: string) => void;
  /** 일정이 있는 셀의 빈 영역 단일 클릭 시 — 그 날 모든 일정 보기 모드 */
  onDayClick?: (cellDate: string) => void;
  onEntryHover?: (entryId: string | null) => void;
  highlightedEntryId?: string | null;
}

/** Date → YYYY-MM-DD (로컬, padded). page.tsx의 formatLocalDate와 동일 형식. */
function ymdLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function firstOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, n: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + n, 1);
}

/** YYYY-MM-DD → Date (로컬 자정). 빈 문자열이면 null. */
function parseLocalDate(s: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

/** 시작/끝 사이의 모든 Date 배열 (양 끝 포함). */
function rangeDates(from: Date, to: Date): Date[] {
  const dates: Date[] = [];
  const start = from <= to ? from : to;
  const end = from <= to ? to : from;
  const cursor = new Date(start);
  while (cursor <= end) {
    dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

type DayButtonProps = {
  day: CalendarDay;
  modifiers: Modifiers;
} & ButtonHTMLAttributes<HTMLButtonElement>;

/** date가 entry의 [dateFrom, dateTo] 범위에 포함되는지. */
function isDateInEntry(date: Date, entry: PlanScheduleEntry): boolean {
  const from = parseLocalDate(entry.dateFrom);
  if (!from) return false;
  const to = parseLocalDate(entry.dateTo) ?? from;
  const start = from <= to ? from : to;
  const end = from <= to ? to : from;
  return date >= start && date <= end;
}

/** date 위에 있는 entry 중 가장 최근 추가본을 반환 (배열 마지막 우선). */
function findEntryAtDate(date: Date, entries: PlanScheduleEntry[]): PlanScheduleEntry | null {
  for (let i = entries.length - 1; i >= 0; i--) {
    if (isDateInEntry(date, entries[i])) return entries[i];
  }
  return null;
}

/** Date → "YYYY-M-D" 키 (로컬). 일자별 entry 조회용. */
function dateKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

interface EntryOnDate {
  entry: PlanScheduleEntry;
  colorIndex: number; // 색상 팔레트 선택용
  durationDays: number; // 정렬 보조용
  stackIdx: number; // entry별 전역 stack 깊이 (셀 경계 끊김 방지)
  isStart: boolean;
  isEnd: boolean;
}

const STRIP_TOP = 22; // 일자 라벨 아래 시작 지점(px)
const STRIP_HEIGHT = 16; // 띠 안에 제목 텍스트가 들어갈 만큼
const STRIP_GAP = 2;

// 매 렌더마다 동일한 스타일 객체 리터럴 생성 비용 회피를 위해 모듈 스코프 상수로 추출.
// 동적 값(top/left/right/borderRadius/색상 등)은 호출부에서 spread + 덮어쓰기.
const STRIP_BASE_STYLE: CSSProperties = {
  position: "absolute",
  height: STRIP_HEIGHT,
  boxSizing: "border-box",
  pointerEvents: "auto",
  cursor: "pointer",
  overflow: "hidden",
  fontSize: "0.6875rem", // 11px
  lineHeight: `${STRIP_HEIGHT}px`,
  fontWeight: 500,
  whiteSpace: "nowrap",
  textOverflow: "ellipsis",
  transition:
    "transform 0.12s ease, box-shadow 0.12s ease, background-color 0.12s ease, border-color 0.12s ease",
};

const DAY_LABEL_STYLE: CSSProperties = {
  position: "absolute",
  top: 6,
  left: 8,
  fontSize: "0.8125rem",
  fontWeight: 500,
  lineHeight: 1,
  color: "inherit",
};

const OVERFLOW_STRIP_STYLE: CSSProperties = {
  position: "absolute",
  bottom: 2,
  left: 2,
  right: 2,
  height: STRIP_HEIGHT,
  border: "1px solid #d1d5db",
  borderRadius: 4,
  boxSizing: "border-box",
  cursor: "pointer",
  overflow: "hidden",
  color: "#4b5563",
  fontSize: "0.6875rem",
  lineHeight: `${STRIP_HEIGHT}px`,
  fontWeight: 600,
  paddingLeft: 6,
  paddingRight: 6,
  whiteSpace: "nowrap",
  textAlign: "center",
  letterSpacing: "0.5px",
};

const DROPDOWN_STYLE: CSSProperties = {
  position: "absolute",
  top: "calc(100% + 4px)",
  left: 0,
  minWidth: 220,
  maxWidth: 280,
  maxHeight: 280,
  overflowY: "auto",
  zIndex: 50,
  backgroundColor: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
  padding: 6,
  textAlign: "left",
};

const DROPDOWN_ITEM_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  width: "100%",
  padding: "6px 8px",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: "0.8125rem",
  textAlign: "left",
  color: "#111827",
};

const DRAFT_STRIP_BASE_STYLE: CSSProperties = {
  position: "absolute",
  height: STRIP_HEIGHT,
  backgroundColor: "#6366f1",
  color: "white",
  pointerEvents: "none",
  overflow: "hidden",
  fontSize: "0.6875rem",
  lineHeight: `${STRIP_HEIGHT}px`,
  fontWeight: 500,
  whiteSpace: "nowrap",
  textOverflow: "ellipsis",
};

// 셀에 표시되는 띠 개수 컷오프. stackIdx 0..MAX_VISIBLE_LANES-1 까지 띠로 보이고,
// stackIdx >= MAX_VISIBLE_LANES인 entry는 셀 하단의 "..." 띠 하나에 묶여 클릭 시 드롭다운으로 펼쳐진다.
// 같은 entry는 모든 셀에서 동일 stackIdx라 다중일 띠가 끊기지 않는다.
const MAX_VISIBLE_LANES = 5;

/** entry별 컬러 팔레트 — 겹치는 일정이 서로 다른 색으로 보이도록 entry 인덱스 기준 순환.
 *  배경/hover/텍스트 색상을 같은 hue 계열로 묶어 가독성 유지. */
const LANE_COLORS: { bg: string; bgHl: string; text: string }[] = [
  { bg: "#c7d2fe", bgHl: "#a5b4fc", text: "#3730a3" }, // indigo
  { bg: "#a7f3d0", bgHl: "#6ee7b7", text: "#065f46" }, // emerald
  { bg: "#fde68a", bgHl: "#fcd34d", text: "#92400e" }, // amber
  { bg: "#fecdd3", bgHl: "#fda4af", text: "#9f1239" }, // rose
  { bg: "#bae6fd", bgHl: "#7dd3fc", text: "#075985" }, // sky
  { bg: "#ddd6fe", bgHl: "#c4b5fd", text: "#5b21b6" }, // violet
];

export default function PlanScheduleCalendar({
  entries,
  onRangeCommit,
  onEntryClick,
  onDayClick,
  onEntryHover,
  highlightedEntryId,
}: PlanScheduleCalendarProps) {
  const months = useMemo(() => {
    const today = new Date();
    const first = addMonths(firstOfMonth(today), -MONTHS_BEFORE_TODAY);
    return Array.from({ length: VISIBLE_MONTHS }, (_, i) => addMonths(first, i));
  }, []);

  // 날짜 → 그 날을 덮는 entry들. 각 entry에 전역 stackIdx를 부여해 셀 경계에서 끊김 방지.
  // stackIdx: 자기보다 긴 entry 중 시간이 겹치는 것의 stackIdx 최대값 + 1 (없으면 0).
  const entriesByDateKey = useMemo(() => {
    const map = new Map<string, EntryOnDate[]>();

    type Resolved = {
      entry: PlanScheduleEntry;
      colorIndex: number;
      from: Date;
      to: Date;
      durationDays: number;
    };
    const resolved: Resolved[] = [];
    entries.forEach((entry, colorIndex) => {
      const from = parseLocalDate(entry.dateFrom);
      if (!from) return;
      const to0 = parseLocalDate(entry.dateTo) ?? from;
      const start = from <= to0 ? from : to0;
      const end = from <= to0 ? to0 : from;
      resolved.push({
        entry,
        colorIndex,
        from: start,
        to: end,
        durationDays: rangeDates(start, end).length,
      });
    });

    // 길이 내림차순으로 처리 → 자기보다 먼저 처리된(=긴) entry 중 겹치는 것의 stackIdx max + 1
    const sortedDesc = [...resolved].sort((a, b) => b.durationDays - a.durationDays);
    const stackIdxByEntryId = new Map<string, number>();
    for (let i = 0; i < sortedDesc.length; i++) {
      const r = sortedDesc[i];
      let maxIdx = -1;
      for (let j = 0; j < i; j++) {
        const other = sortedDesc[j];
        // 시간 겹침: r.from <= other.to && other.from <= r.to
        if (r.from <= other.to && other.from <= r.to) {
          const otherIdx = stackIdxByEntryId.get(other.entry.id) ?? 0;
          if (otherIdx > maxIdx) maxIdx = otherIdx;
        }
      }
      stackIdxByEntryId.set(r.entry.id, maxIdx + 1);
    }

    // 원래 entries 순서대로 dateKey map 채우기
    for (const r of resolved) {
      const stackIdx = stackIdxByEntryId.get(r.entry.id) ?? 0;
      const dates = rangeDates(r.from, r.to);
      dates.forEach((d, i) => {
        const key = dateKey(d);
        const arr = map.get(key) ?? [];
        arr.push({
          entry: r.entry,
          colorIndex: r.colorIndex,
          durationDays: r.durationDays,
          stackIdx,
          isStart: i === 0,
          isEnd: i === dates.length - 1,
        });
        map.set(key, arr);
      });
    }

    // 셀별 정렬: stackIdx 오름차순 (낮은 idx가 DOM 먼저 = 뒤에 깔림)
    for (const arr of map.values()) {
      arr.sort((a, b) => a.stackIdx - b.stackIdx);
    }
    return map;
  }, [entries]);

  // 어떤 셀의 "더보기" 드롭다운이 열려 있는지. dateKey 기준으로 1개만 열림.
  const [openCell, setOpenCell] = useState<{ dateKey: string; cellDate: string } | null>(null);

  // 드롭다운 외부 클릭 시 닫기. document에 native listener라 React stopPropagation으로 못 막음 →
  // target이 드롭다운/일정 띠/"..." 띠 안이면 무시 (그쪽 자체 onClick에서 토글/항목 처리).
  useEffect(() => {
    if (!openCell) return;
    const close = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest(".rdp-day-dropdown")) return;
      if (target.closest(".rdp-day-strip")) return;
      setOpenCell(null);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [openCell]);

  // 드래그 상태: 시각적 피드백용 useState + 핸들러용 ref (stale closure 회피)
  const [draftRange, setDraftRange] = useState<DateRange | undefined>(undefined);
  const stateRef = useRef<{
    isDragging: boolean;
    start: Date | null;
    draft: DateRange | undefined;
  }>({ isDragging: false, start: null, draft: undefined });

  const setDraft = useCallback((range: DateRange | undefined) => {
    stateRef.current.draft = range;
    setDraftRange(range);
  }, []);

  const startDrag = useCallback(
    (date: Date) => {
      stateRef.current.isDragging = true;
      stateRef.current.start = date;
      setDraft({ from: date, to: date });
    },
    [setDraft]
  );

  const continueDrag = useCallback(
    (date: Date) => {
      const s = stateRef.current;
      if (!s.isDragging || !s.start) return;
      const start = s.start;
      setDraft(date >= start ? { from: start, to: date } : { from: date, to: start });
    },
    [setDraft]
  );

  // 최신 entries/onEntryClick/onEntryHover/onDayClick 을 핸들러 안에서 stale 없이 참조하기 위한 ref
  const entriesRef = useRef(entries);
  const onEntryClickRef = useRef(onEntryClick);
  const onEntryHoverRef = useRef(onEntryHover);
  const onDayClickRef = useRef(onDayClick);
  useEffect(() => {
    entriesRef.current = entries;
    onEntryClickRef.current = onEntryClick;
    onEntryHoverRef.current = onEntryHover;
    onDayClickRef.current = onDayClick;
  }, [entries, onEntryClick, onEntryHover, onDayClick]);

  const finishDrag = useCallback(() => {
    const s = stateRef.current;
    if (!s.isDragging) return;
    s.isDragging = false;
    s.start = null;
    const final = s.draft;
    setDraft(undefined);
    if (final?.from && final.to) {
      // 움직임 없는 단일 클릭:
      // - 일정 있는 날의 빈 영역 클릭 → 그 날 전체 일정 모드 (onDayClick)
      // - 일정 없는 날 클릭 → 1일짜리 새 일정 추가 (onRangeCommit)
      if (final.from.getTime() === final.to.getTime()) {
        const hit = findEntryAtDate(final.from, entriesRef.current);
        if (hit) {
          onDayClickRef.current?.(ymdLocal(final.from));
          return;
        }
      }
      onRangeCommit({ from: final.from, to: final.to });
    }
  }, [onRangeCommit, setDraft]);

  // 윈도우 mouseup으로 캘린더 밖에서 떼는 경우도 캡처
  useEffect(() => {
    window.addEventListener("mouseup", finishDrag);
    return () => window.removeEventListener("mouseup", finishDrag);
  }, [finishDrag]);

  const DayButtonComponent = useMemo(
    () =>
      function CustomDayButton({ day, modifiers, ...rest }: DayButtonProps) {
        const isOutside = day.date.getMonth() !== day.displayMonth.getMonth();
        const key = dateKey(day.date);
        const cellEntries = isOutside ? [] : (entriesByDateKey.get(key) ?? []);
        const visibleEntries = cellEntries.filter((ce) => ce.stackIdx < MAX_VISIBLE_LANES);
        const overflowEntries = cellEntries.filter((ce) => ce.stackIdx >= MAX_VISIBLE_LANES);
        const hasOverflow = overflowEntries.length > 0;
        const isDropdownOpen = openCell?.dateKey === key;
        const cellYmd = ymdLocal(day.date);
        const hl = highlightedEntryId;
        // 드래그 중인 임시 범위 — 기존 stack 가장 아래에 별도 띠로 표시
        const dragStart = !!modifiers.range_start;
        const dragEnd = !!modifiers.range_end;
        const inDraft = !isOutside && (dragStart || dragEnd || !!modifiers.range_middle);
        return (
          <button
            {...rest}
            onMouseDown={(e) => {
              e.preventDefault(); // 텍스트 선택 방지
              startDrag(day.date);
            }}
            onMouseEnter={() => continueDrag(day.date)}
            style={{ position: "relative" }}
          >
            <span style={DAY_LABEL_STYLE}>{day.date.getDate()}</span>
            {visibleEntries.map((ce) => {
              const isHl = hl === ce.entry.id;
              const palette = LANE_COLORS[ce.colorIndex % LANE_COLORS.length];
              // entry별 전역 stackIdx 기반 오프셋 — 같은 entry는 모든 셀에서 동일 위치라 끊기지 않음.
              // 아래로 8%, 시작 셀에서만 오른쪽 5%. middle/end 셀은 셀 경계(left:0)에 붙여 연속됨.
              const stackIdx = ce.stackIdx;
              const topOffset = `calc(${STRIP_TOP}px + ${stackIdx * 8}%)`;
              const leftOffset = ce.isStart ? `calc(2px + ${stackIdx * 5}%)` : 0;
              return (
                <div
                  key={ce.entry.id}
                  className="rdp-day-strip"
                  onMouseDown={(e) => e.stopPropagation()}
                  onMouseEnter={() => onEntryHoverRef.current?.(ce.entry.id)}
                  onMouseLeave={() => onEntryHoverRef.current?.(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEntryClickRef.current?.(ce.entry, ymdLocal(day.date));
                  }}
                  title={ce.entry.title || "일정"}
                  style={{
                    ...STRIP_BASE_STYLE,
                    top: topOffset,
                    left: leftOffset,
                    right: ce.isEnd ? 2 : 0,
                    backgroundColor: isHl ? palette.bgHl : palette.bg,
                    borderTopLeftRadius: ce.isStart ? 4 : 0,
                    borderBottomLeftRadius: ce.isStart ? 4 : 0,
                    borderTopRightRadius: ce.isEnd ? 4 : 0,
                    borderBottomRightRadius: ce.isEnd ? 4 : 0,
                    // 살짝 보이는 테두리 — 인접 셀과 이어지는 면(left/right)은 hidden 처리해 다중일 띠가 끊기지 않게
                    borderTop: `1px solid ${palette.text}${isHl ? "55" : "22"}`,
                    borderBottom: `1px solid ${palette.text}${isHl ? "55" : "22"}`,
                    borderLeft: ce.isStart
                      ? `1px solid ${palette.text}${isHl ? "55" : "22"}`
                      : "none",
                    borderRight: ce.isEnd
                      ? `1px solid ${palette.text}${isHl ? "55" : "22"}`
                      : "none",
                    // hover 시 살짝 떠오르는 효과
                    transform: isHl ? "translateY(-2px)" : undefined,
                    boxShadow: isHl
                      ? "0 6px 12px rgba(0,0,0,0.18)"
                      : stackIdx > 0
                        ? "0 1px 2px rgba(0,0,0,0.08)"
                        : undefined,
                    zIndex: isHl ? 10 : undefined,
                    color: palette.text,
                    paddingLeft: ce.isStart ? 6 : 4,
                    paddingRight: ce.isEnd ? 6 : 4,
                  }}
                >
                  {ce.isStart ? ce.entry.title || "일정" : ""}
                </div>
              );
            })}
            {inDraft && (
              <div
                style={{
                  ...DRAFT_STRIP_BASE_STYLE,
                  // 기존 visible stack의 가장 깊은 stackIdx + 한 칸 띄워서 아래에 표시.
                  // "..." 띠는 셀 하단에 따로 고정되므로 여기서는 visibleEntries만 고려.
                  top:
                    visibleEntries.length === 0
                      ? `${STRIP_TOP}px`
                      : `calc(${STRIP_TOP}px + ${
                          Math.max(...visibleEntries.map((c) => c.stackIdx)) * 8
                        }% + ${STRIP_HEIGHT + STRIP_GAP}px)`,
                  left: dragStart ? 2 : 0,
                  right: dragEnd ? 2 : 0,
                  borderTopLeftRadius: dragStart ? 4 : 0,
                  borderBottomLeftRadius: dragStart ? 4 : 0,
                  borderTopRightRadius: dragEnd ? 4 : 0,
                  borderBottomRightRadius: dragEnd ? 4 : 0,
                  paddingLeft: dragStart ? 6 : 4,
                  paddingRight: dragEnd ? 6 : 4,
                }}
              >
                {dragStart ? "새 일정" : ""}
              </div>
            )}
            {hasOverflow && (
              <div
                className="rdp-day-strip"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenCell((prev) =>
                    prev?.dateKey === key ? null : { dateKey: key, cellDate: cellYmd }
                  );
                }}
                title={`숨겨진 일정 ${overflowEntries.length}개`}
                style={{
                  ...OVERFLOW_STRIP_STYLE,
                  backgroundColor: isDropdownOpen ? "#d1d5db" : "#e5e7eb",
                  zIndex: isDropdownOpen ? 11 : undefined,
                }}
              >
                {`··· +${overflowEntries.length}`}
              </div>
            )}
            {isDropdownOpen && (
              <div
                className="rdp-day-dropdown"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                style={DROPDOWN_STYLE}
              >
                <div
                  style={{
                    padding: "4px 8px",
                    fontSize: "0.6875rem",
                    color: "#6b7280",
                    fontWeight: 600,
                  }}
                >
                  숨겨진 일정 {overflowEntries.length}개
                </div>
                {overflowEntries.map((ce) => {
                  const palette = LANE_COLORS[ce.colorIndex % LANE_COLORS.length];
                  const isHlItem = hl === ce.entry.id;
                  return (
                    // div + role=button: 부모가 이미 <button>이라 button 중첩 시 hydration 경고 발생
                    <div
                      key={ce.entry.id}
                      role="button"
                      tabIndex={0}
                      onMouseEnter={() => onEntryHoverRef.current?.(ce.entry.id)}
                      onMouseLeave={() => onEntryHoverRef.current?.(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEntryClickRef.current?.(ce.entry, cellYmd);
                        setOpenCell(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          onEntryClickRef.current?.(ce.entry, cellYmd);
                          setOpenCell(null);
                        }
                      }}
                      style={{
                        ...DROPDOWN_ITEM_STYLE,
                        backgroundColor: isHlItem ? "#f3f4f6" : "transparent",
                      }}
                    >
                      <span
                        aria-hidden
                        style={{
                          display: "inline-block",
                          width: 10,
                          height: 10,
                          borderRadius: 2,
                          backgroundColor: palette.bg,
                          border: `1px solid ${palette.text}33`,
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          flex: 1,
                        }}
                      >
                        {ce.entry.title || "(제목 없음)"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </button>
        );
      },
    [startDrag, continueDrag, entriesByDateKey, highlightedEntryId, openCell]
  );

  // range_start/middle/end 모디파이어는 RDP가 selected={draftRange}로 자동 부여 →
  // CustomDayButton에서 직접 읽어 별도 lane의 띠로 렌더한다 (기존 일정 위에 겹쳐 표시).
  const modifiersClassNames = {
    range_start: "rdp-day-range-start",
    range_middle: "rdp-day-range-middle",
    range_end: "rdp-day-range-end",
  };

  return (
    <div className="space-y-2 select-none">
      <p className="rounded-md bg-gray-50 px-3 py-2 text-center text-xs text-gray-500">
        시작일에서 마우스를 누른 채 드래그 → 종료일에서 떼세요. 한 칸 클릭은 단일 일정.
      </p>
      <div className="flex flex-col gap-6 pb-4">
        {months.map((month) => (
          <DayPicker
            key={month.toISOString()}
            mode="range"
            locale={ko}
            month={month}
            disableNavigation
            selected={draftRange}
            onSelect={() => {}}
            modifiersClassNames={modifiersClassNames}
            components={{ DayButton: DayButtonComponent }}
            showOutsideDays
            weekStartsOn={0}
          />
        ))}
      </div>
    </div>
  );
}
