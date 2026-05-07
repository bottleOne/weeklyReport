"use client";

import { useEffect, useRef } from "react";
import type { PlanScheduleEntry, TaskStatus } from "@/lib/plan-types";
import { TASK_STATUS_LABEL } from "@/lib/plan-types";
import { formatDateRange } from "@/lib/types";

interface PlanScheduleEntryCardProps {
  entry: PlanScheduleEntry;
  index: number;
  /** patch 객체로 변경 — value 타입이 필드별로 정확히 narrow됨 (예: status는 TaskStatus). */
  onChange: (id: string, patch: Partial<PlanScheduleEntry>) => void;
  onRemove: (id: string) => void;
  onHover: (id: string | null) => void;
  /** 담당자 input 자동완성 옵션 — Phase 4에서 stakeholders 이름 목록을 전달. */
  assigneeOptions?: string[];
}

const STATUS_COLOR: Record<TaskStatus, string> = {
  todo: "bg-gray-100 text-gray-700 border-gray-300",
  in_progress: "bg-blue-50 text-blue-700 border-blue-300",
  done: "bg-emerald-50 text-emerald-700 border-emerald-300",
  blocked: "bg-red-50 text-red-700 border-red-300",
};

export default function PlanScheduleEntryCard({
  entry,
  index,
  onChange,
  onRemove,
  onHover,
  assigneeOptions,
}: PlanScheduleEntryCardProps) {
  const datalistId = `assignee-options-${entry.id}`;
  const range =
    formatDateRange({ dateFrom: entry.dateFrom, dateTo: entry.dateTo }) || "(기간 미정)";

  // 마운트: 빈 제목 카드는 제목 input에 자동 focus → 사용자가 다른 곳을 클릭하면
  // input의 onBlur가 트리거되어 빈 제목이면 자동 삭제됨.
  //
  // unmount cleanup은 의도적으로 두지 않는다 — React Strict Mode에서
  // mount→unmount→re-mount 사이클의 첫 unmount가 cleanup을 즉시 호출해
  // 방금 추가한 일정이 사라지는 문제가 발생함.
  const titleInputRef = useRef<HTMLInputElement>(null);
  const initialTitleRef = useRef(entry.title);
  useEffect(() => {
    if (initialTitleRef.current === "") {
      titleInputRef.current?.focus();
    }
  }, []);

  return (
    <div
      onMouseEnter={() => onHover(entry.id)}
      onMouseLeave={() => onHover(null)}
      className="rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
    >
      <div className="mb-3 flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
          {index + 1}
        </span>
        <input
          ref={titleInputRef}
          type="text"
          placeholder="일정 제목 (예: 요구사항 정의 마감)"
          value={entry.title}
          onChange={(e) => onChange(entry.id, { title: e.target.value })}
          className="flex-1 border-b-2 border-gray-300 bg-transparent pb-1 text-base font-semibold transition-colors outline-none focus:border-indigo-500"
        />
        <button
          onClick={() => onRemove(entry.id)}
          className="cursor-pointer text-sm text-red-400 transition-colors hover:text-red-600"
          title="삭제"
          aria-label="일정 삭제"
        >
          ✕ 삭제
        </button>
      </div>

      <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-gray-700">기간</label>
          <div className="flex items-center gap-1">
            <input
              type="date"
              value={entry.dateFrom}
              onChange={(e) => onChange(entry.id, { dateFrom: e.target.value })}
              className="min-w-0 flex-1 rounded-md border border-gray-200 p-2 text-sm outline-none focus:border-indigo-500"
            />
            <span className="text-xs text-gray-400">~</span>
            <input
              type="date"
              value={entry.dateTo}
              onChange={(e) => onChange(entry.id, { dateTo: e.target.value })}
              className="min-w-0 flex-1 rounded-md border border-gray-200 p-2 text-sm outline-none focus:border-indigo-500"
            />
          </div>
        </div>
        <div className="flex items-end justify-end">
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
            📅 {range}
          </span>
        </div>
      </div>

      <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-700">담당자</label>
          <input
            type="text"
            placeholder="예: 전병일"
            value={entry.assignee}
            onChange={(e) => onChange(entry.id, { assignee: e.target.value })}
            list={assigneeOptions && assigneeOptions.length > 0 ? datalistId : undefined}
            className="w-full rounded-md border border-gray-200 p-2 text-sm outline-none focus:border-indigo-500"
          />
          {assigneeOptions && assigneeOptions.length > 0 && (
            <datalist id={datalistId}>
              {assigneeOptions.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          )}
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-700">상태</label>
          <select
            value={entry.status}
            onChange={(e) => onChange(entry.id, { status: e.target.value as TaskStatus })}
            className={`w-full rounded-md border p-2 text-sm font-medium outline-none ${STATUS_COLOR[entry.status]}`}
          >
            {(Object.keys(TASK_STATUS_LABEL) as TaskStatus[]).map((s) => (
              <option key={s} value={s}>
                {TASK_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-gray-700">상세 내용</label>
        <textarea
          placeholder="이 기간의 활동/회의/마감 등 상세 내용"
          value={entry.details}
          onChange={(e) => onChange(entry.id, { details: e.target.value })}
          className="min-h-[60px] w-full resize-y rounded-md border border-gray-200 p-2.5 text-sm outline-none focus:border-indigo-500"
        />
      </div>
    </div>
  );
}
