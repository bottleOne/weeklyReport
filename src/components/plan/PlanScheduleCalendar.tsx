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

export default function PlanScheduleCalendar({
  entries,
  onRangeCommit,
  highlightedEntryId,
}: PlanScheduleCalendarProps) {
  const months = useMemo(() => {
    const today = new Date();
    const first = addMonths(firstOfMonth(today), -MONTHS_BEFORE_TODAY);
    return Array.from({ length: VISIBLE_MONTHS }, (_, i) => addMonths(first, i));
  }, []);

  const { entryStartDates, entryMiddleDates, entryEndDates, highlightedDates } = useMemo(() => {
    const starts: Date[] = [];
    const middles: Date[] = [];
    const ends: Date[] = [];
    let highlighted: Date[] = [];
    for (const e of entries) {
      const from = parseLocalDate(e.dateFrom);
      if (!from) continue;
      const to = parseLocalDate(e.dateTo) ?? from;
      const dates = rangeDates(from, to);
      if (dates.length === 0) continue;
      starts.push(dates[0]);
      ends.push(dates[dates.length - 1]);
      if (dates.length > 2) {
        middles.push(...dates.slice(1, -1));
      }
      if (e.id === highlightedEntryId) {
        highlighted = dates;
      }
    }
    return {
      entryStartDates: starts,
      entryMiddleDates: middles,
      entryEndDates: ends,
      highlightedDates: highlighted,
    };
  }, [entries, highlightedEntryId]);

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

  const finishDrag = useCallback(() => {
    const s = stateRef.current;
    if (!s.isDragging) return;
    s.isDragging = false;
    s.start = null;
    const final = s.draft;
    setDraft(undefined);
    if (final?.from && final.to) {
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
        // modifiers는 button DOM에 누수되지 않도록 destructuring으로 분리만
        void modifiers;
        return (
          <button
            {...rest}
            onMouseDown={(e) => {
              e.preventDefault(); // 텍스트 선택 방지
              startDrag(day.date);
            }}
            onMouseEnter={() => continueDrag(day.date)}
          />
        );
      },
    [startDrag, continueDrag]
  );

  const modifiers = {
    entryStart: entryStartDates,
    entryMiddle: entryMiddleDates,
    entryEnd: entryEndDates,
    highlighted: highlightedDates,
  };

  // 디버깅 보조용으로 className도 유지 (브라우저 인스펙터에서 확인 가능)
  const modifiersClassNames = {
    entryStart: "rdp-day-entry-start",
    entryMiddle: "rdp-day-entry-middle",
    entryEnd: "rdp-day-entry-end",
    highlighted: "rdp-day-highlighted",
    range_start: "rdp-day-range-start",
    range_middle: "rdp-day-range-middle",
    range_end: "rdp-day-range-end",
  };

  // 인라인 스타일 — CSS 빌드/캐시/specificity 영향 없이 확실하게 적용.
  // RDP가 활성 모디파이어의 style을 Object.assign으로 합침 → 정의 순서가 우선순위 (뒤가 위에 덮음).
  const modifiersStyles = {
    // 1. 등록된 일정 (가장 약함, 라벤더)
    entryStart: {
      backgroundColor: "#ede9fe",
      borderTopLeftRadius: "0.5rem",
      borderBottomLeftRadius: "0.5rem",
    },
    entryMiddle: {
      backgroundColor: "#ede9fe",
    },
    entryEnd: {
      backgroundColor: "#ede9fe",
      borderTopRightRadius: "0.5rem",
      borderBottomRightRadius: "0.5rem",
    },
    // 2. hover 강조 (entry 위에 덮음)
    highlighted: {
      backgroundColor: "#a5b4fc",
    },
    // 3. 드래그 중 range (모든 것 위에 덮음, 진한 인디고 + 흰 글자)
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
      <div className="flex flex-col items-center gap-6 pb-4">
        {months.map((month) => (
          <DayPicker
            key={month.toISOString()}
            mode="range"
            locale={ko}
            month={month}
            disableNavigation
            selected={draftRange}
            onSelect={() => {}}
            modifiers={modifiers}
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
