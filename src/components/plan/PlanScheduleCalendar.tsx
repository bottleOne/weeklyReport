"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ButtonHTMLAttributes } from "react";
import { DayPicker, type DateRange, type CalendarDay, type Modifiers } from "react-day-picker";
import { ko } from "date-fns/locale";
import "react-day-picker/style.css";
import type { PlanScheduleEntry } from "@/lib/plan-types";

const VISIBLE_MONTHS = 12;
const MONTHS_BEFORE_TODAY = 1;

interface PlanScheduleCalendarProps {
  entries: PlanScheduleEntry[];
  onRangeCommit: (range: { from: Date; to: Date }) => void;
  onEntryClick?: (entryId: string) => void;
  highlightedEntryId?: string | null;
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
  lane: number;
  isStart: boolean;
  isEnd: boolean;
}

const STRIP_TOP = 22; // 일자 라벨 아래 시작 지점(px)
const STRIP_HEIGHT = 16; // 띠 안에 제목 텍스트가 들어갈 만큼
const STRIP_GAP = 2;

/** lane별 컬러 팔레트 — 겹치는 일정은 서로 다른 lane으로 가므로 자연스럽게 색이 달라짐.
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
  highlightedEntryId,
}: PlanScheduleCalendarProps) {
  const months = useMemo(() => {
    const today = new Date();
    const first = addMonths(firstOfMonth(today), -MONTHS_BEFORE_TODAY);
    return Array.from({ length: VISIBLE_MONTHS }, (_, i) => addMonths(first, i));
  }, []);

  // 날짜 → 그 날을 덮는 entry들. lane은 시간순으로 가장 작은 빈 lane을 할당
  // (interval scheduling) — 겹치지 않으면 같은 lane 재사용해서 셀 밖으로 넘치지 않음.
  const entriesByDateKey = useMemo(() => {
    const map = new Map<string, EntryOnDate[]>();

    type Resolved = { entry: PlanScheduleEntry; from: Date; to: Date };
    const resolved: Resolved[] = [];
    for (const entry of entries) {
      const from = parseLocalDate(entry.dateFrom);
      if (!from) continue;
      const to = parseLocalDate(entry.dateTo) ?? from;
      resolved.push({ entry, from: from <= to ? from : to, to: from <= to ? to : from });
    }
    // 시작일 빠른 순으로 정렬 (안정적인 lane 할당)
    resolved.sort((a, b) => a.from.getTime() - b.from.getTime());

    // lane별로 가장 마지막에 끝나는 날짜 추적 → 빈 lane 찾기
    const laneEndDates: Date[] = [];
    const laneByEntryId = new Map<string, number>();
    for (const r of resolved) {
      let lane = laneEndDates.findIndex((endDate) => endDate < r.from);
      if (lane === -1) {
        lane = laneEndDates.length;
        laneEndDates.push(r.to);
      } else {
        laneEndDates[lane] = r.to;
      }
      laneByEntryId.set(r.entry.id, lane);
    }

    // 원래 entries 순서대로 dateKey map 생성 (레인은 위에서 계산된 값 사용)
    for (const entry of entries) {
      const lane = laneByEntryId.get(entry.id);
      if (lane === undefined) continue;
      const from = parseLocalDate(entry.dateFrom);
      if (!from) continue;
      const to = parseLocalDate(entry.dateTo) ?? from;
      const dates = rangeDates(from, to);
      dates.forEach((d, i) => {
        const key = dateKey(d);
        const arr = map.get(key) ?? [];
        arr.push({
          entry,
          lane,
          isStart: i === 0,
          isEnd: i === dates.length - 1,
        });
        map.set(key, arr);
      });
    }
    return map;
  }, [entries]);

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

  // 최신 entries/onEntryClick을 finishDrag 안에서 참조하기 위해 ref로 보관
  const entriesRef = useRef(entries);
  const onEntryClickRef = useRef(onEntryClick);
  useEffect(() => {
    entriesRef.current = entries;
    onEntryClickRef.current = onEntryClick;
  }, [entries, onEntryClick]);

  const finishDrag = useCallback(() => {
    const s = stateRef.current;
    if (!s.isDragging) return;
    s.isDragging = false;
    s.start = null;
    const final = s.draft;
    setDraft(undefined);
    if (final?.from && final.to) {
      // 움직임 없는 단일 클릭: 기존 일정 위면 선택, 빈 날짜면 1일짜리 추가
      if (final.from.getTime() === final.to.getTime()) {
        const hit = findEntryAtDate(final.from, entriesRef.current);
        if (hit && onEntryClickRef.current) {
          onEntryClickRef.current(hit.id);
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
        void modifiers;
        const isOutside = day.date.getMonth() !== day.displayMonth.getMonth();
        const key = dateKey(day.date);
        const cellEntries = isOutside ? [] : (entriesByDateKey.get(key) ?? []);
        const hl = highlightedEntryId;
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
            <span
              style={{
                position: "absolute",
                top: 6,
                left: 8,
                fontSize: "0.8125rem",
                fontWeight: 500,
                lineHeight: 1,
                color: "inherit",
              }}
            >
              {day.date.getDate()}
            </span>
            {cellEntries.map((ce) => {
              const isHl = hl === ce.entry.id;
              const palette = LANE_COLORS[ce.lane % LANE_COLORS.length];
              return (
                <div
                  key={ce.entry.id}
                  style={{
                    position: "absolute",
                    top: STRIP_TOP + ce.lane * (STRIP_HEIGHT + STRIP_GAP),
                    left: ce.isStart ? 2 : 0,
                    right: ce.isEnd ? 2 : 0,
                    height: STRIP_HEIGHT,
                    backgroundColor: isHl ? palette.bgHl : palette.bg,
                    borderTopLeftRadius: ce.isStart ? 4 : 0,
                    borderBottomLeftRadius: ce.isStart ? 4 : 0,
                    borderTopRightRadius: ce.isEnd ? 4 : 0,
                    borderBottomRightRadius: ce.isEnd ? 4 : 0,
                    pointerEvents: "none",
                    overflow: "hidden",
                    color: palette.text,
                    fontSize: "0.6875rem", // 11px
                    lineHeight: `${STRIP_HEIGHT}px`,
                    fontWeight: 500,
                    paddingLeft: ce.isStart ? 6 : 4,
                    paddingRight: ce.isEnd ? 6 : 4,
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                  }}
                >
                  {ce.isStart ? ce.entry.title || "일정" : ""}
                </div>
              );
            })}
          </button>
        );
      },
    [startDrag, continueDrag, entriesByDateKey, highlightedEntryId]
  );

  // 드래그 중 range만 모디파이어로 처리 (전체 셀 색칠로 명확한 피드백)
  const modifiersClassNames = {
    range_start: "rdp-day-range-start",
    range_middle: "rdp-day-range-middle",
    range_end: "rdp-day-range-end",
  };
  const modifiersStyles = {
    range_start: {
      backgroundColor: "#6366f1",
      color: "white",
      borderTopLeftRadius: "0.5rem",
      borderBottomLeftRadius: "0.5rem",
    },
    range_middle: {
      backgroundColor: "#6366f1",
      color: "white",
    },
    range_end: {
      backgroundColor: "#6366f1",
      color: "white",
      borderTopRightRadius: "0.5rem",
      borderBottomRightRadius: "0.5rem",
    },
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
            modifiersStyles={modifiersStyles}
            components={{ DayButton: DayButtonComponent }}
            showOutsideDays
            weekStartsOn={0}
          />
        ))}
      </div>
    </div>
  );
}
