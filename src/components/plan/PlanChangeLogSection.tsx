"use client";

import { useEffect, useRef, useState } from "react";
import { sortChangeLogDesc, type ChangeLogEntry } from "@/lib/plan-types";

interface PlanChangeLogSectionProps {
  items: ChangeLogEntry[];
  /** 기본 author값 — page.tsx의 plan.authorName 전달. */
  defaultAuthor: string;
  onAdd: (author: string, summary: string) => void;
  onRemove: (id: string) => void;
}

/**
 * 변경 이력 — 상태 전환 시 자동으로 항목이 추가되고, 사용자가 수동 메모도 추가 가능.
 * 기본 펼친 카드. 최신 이력이 위로.
 */
export default function PlanChangeLogSection({
  items,
  defaultAuthor,
  onAdd,
  onRemove,
}: PlanChangeLogSectionProps) {
  const [draftSummary, setDraftSummary] = useState("");
  const [draftAuthor, setDraftAuthor] = useState(defaultAuthor);
  // 사용자가 input을 직접 편집하기 전까지는 defaultAuthor 변경을 반영.
  // 직접 편집 후엔 사용자 입력이 우선 — defaultAuthor가 바뀌어도 덮어쓰지 않음.
  const userEditedAuthor = useRef(false);
  useEffect(() => {
    if (!userEditedAuthor.current) setDraftAuthor(defaultAuthor);
  }, [defaultAuthor]);
  const sorted = sortChangeLogDesc(items);

  const handleAdd = () => {
    const summary = draftSummary.trim();
    if (!summary) return;
    onAdd(draftAuthor.trim() || defaultAuthor, summary);
    setDraftSummary("");
  };

  return (
    <div className="mb-5 rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-3 flex items-center gap-2 rounded-lg bg-indigo-50 px-4 py-2.5 text-sm font-bold text-indigo-600">
        📜 변경 이력
        <span className="ml-auto text-xs font-normal text-indigo-500">
          {items.length === 0 ? "상태를 바꾸거나 메모를 추가하면 기록됩니다" : `${items.length}건`}
        </span>
      </div>

      {items.length > 0 && (
        <ul className="mb-3 divide-y divide-gray-100 rounded-md border border-gray-200">
          {sorted.map((e) => (
            <li key={e.id} className="group flex items-start gap-3 px-3 py-2 text-sm">
              <span className="w-24 shrink-0 font-mono text-xs text-gray-400">{e.date}</span>
              <span className="w-20 shrink-0 truncate text-xs font-semibold text-gray-700">
                {e.author || "-"}
              </span>
              <span className="flex-1 leading-relaxed text-gray-800">{e.summary}</span>
              <button
                type="button"
                onClick={() => onRemove(e.id)}
                className="cursor-pointer rounded-md px-1.5 py-0.5 text-xs text-red-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-600"
                title="삭제"
                aria-label="이력 삭제"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-end gap-2">
        <div className="w-24 shrink-0">
          <label className="mb-0.5 block text-[11px] font-semibold text-gray-500">작성자</label>
          <input
            type="text"
            placeholder="이름"
            value={draftAuthor}
            onChange={(e) => {
              userEditedAuthor.current = true;
              setDraftAuthor(e.target.value);
            }}
            className="w-full rounded-md border border-gray-200 px-2 py-1 text-sm outline-none focus:border-indigo-500"
          />
        </div>
        <div className="flex-1">
          <label className="mb-0.5 block text-[11px] font-semibold text-gray-500">변경 요약</label>
          <input
            type="text"
            placeholder="예: 검토 의견 반영, 일정 재조정 등"
            value={draftSummary}
            onChange={(e) => setDraftSummary(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
            }}
            className="w-full rounded-md border border-gray-200 px-2 py-1 text-sm outline-none focus:border-indigo-500"
          />
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={draftSummary.trim() === ""}
          className="cursor-pointer rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          + 추가
        </button>
      </div>
    </div>
  );
}
