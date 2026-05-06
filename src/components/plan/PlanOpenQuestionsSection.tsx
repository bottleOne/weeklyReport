"use client";

import { useEffect, useRef } from "react";
import { sortOpenQuestions, type OpenQuestionItem } from "@/lib/plan-types";

interface PlanOpenQuestionsSectionProps {
  items: OpenQuestionItem[];
  onAdd: () => void;
  onChange: (id: string, patch: Partial<OpenQuestionItem>) => void;
  onRemove: (id: string) => void;
  /** 새로 추가된 항목 id — 마운트 시 question input에 자동 focus. 부모가 추가 직후 설정. */
  focusId?: string | null;
  onFocused?: () => void;
}

/**
 * 미결사항 — 답이 없는 질문을 체크박스 row로 추적.
 * resolved 토글 시 답변(resolution) 입력 펼쳐짐. 미해결을 위로 정렬.
 */
export default function PlanOpenQuestionsSection({
  items,
  onAdd,
  onChange,
  onRemove,
  focusId,
  onFocused,
}: PlanOpenQuestionsSectionProps) {
  const sorted = sortOpenQuestions(items);
  const unresolvedCount = items.filter((q) => !q.resolved).length;

  return (
    <div className="mb-5 rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-3 flex items-center gap-2 rounded-lg bg-indigo-50 px-4 py-2.5 text-sm font-bold text-indigo-600">
        ❓ 미결 사항
        <span className="ml-auto text-xs font-normal text-indigo-500">
          {items.length === 0
            ? "답이 정해지지 않은 질문"
            : `미해결 ${unresolvedCount} / ${items.length}`}
        </span>
      </div>

      {items.length === 0 ? (
        <EmptyHint />
      ) : (
        <ul className="space-y-2">
          {sorted.map((item) => (
            <OpenQuestionRow
              key={item.id}
              item={item}
              autoFocus={focusId === item.id}
              onAutoFocused={onFocused}
              onChange={(patch) => onChange(item.id, patch)}
              onRemove={() => onRemove(item.id)}
            />
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={onAdd}
        className="mt-3 w-full cursor-pointer rounded-md border border-dashed border-gray-300 py-2 text-sm text-gray-500 transition-colors hover:border-indigo-400 hover:text-indigo-600"
      >
        + 질문 추가
      </button>
    </div>
  );
}

function EmptyHint() {
  return (
    <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 p-4 text-xs text-gray-400">
      <p className="mb-1.5 font-medium text-gray-500">예시</p>
      <ul className="list-inside list-disc space-y-0.5">
        <li>인증은 자체 구현 vs OAuth 위탁 중 무엇이 적절한가?</li>
        <li>출시 전 외부 보안 검토를 받을 것인가?</li>
        <li>레거시 데이터 마이그레이션 범위는?</li>
      </ul>
    </div>
  );
}

interface RowProps {
  item: OpenQuestionItem;
  autoFocus: boolean;
  onAutoFocused?: () => void;
  onChange: (patch: Partial<OpenQuestionItem>) => void;
  onRemove: () => void;
}

function OpenQuestionRow({ item, autoFocus, onAutoFocused, onChange, onRemove }: RowProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
      onAutoFocused?.();
    }
  }, [autoFocus, onAutoFocused]);

  return (
    <li
      className={`group rounded-md border border-gray-200 p-3 transition-colors ${
        item.resolved ? "bg-gray-50" : "bg-white"
      }`}
    >
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={item.resolved}
          onChange={(e) => onChange({ resolved: e.target.checked })}
          className="mt-1 h-4 w-4 cursor-pointer accent-indigo-600"
          title={item.resolved ? "해결됨 — 미해결로 되돌리기" : "해결됨으로 표시"}
        />
        <input
          ref={inputRef}
          type="text"
          placeholder="질문을 입력하세요"
          value={item.question}
          onChange={(e) => onChange({ question: e.target.value })}
          className={`flex-1 border-b border-transparent bg-transparent pb-0.5 text-sm outline-none focus:border-indigo-500 ${
            item.resolved ? "text-gray-400 line-through" : "font-medium text-gray-900"
          }`}
        />
        <button
          type="button"
          onClick={onRemove}
          className="cursor-pointer rounded-md px-1.5 py-0.5 text-xs text-red-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-600"
          title="삭제"
          aria-label="질문 삭제"
        >
          ✕
        </button>
      </div>
      {item.resolved && (
        <div className="mt-2 ml-6">
          <textarea
            placeholder="결정/답변을 적어두면 나중에 근거가 됩니다"
            value={item.resolution}
            onChange={(e) => onChange({ resolution: e.target.value })}
            className="min-h-[48px] w-full resize-y rounded-md border border-gray-200 bg-white p-2 text-xs text-gray-700 outline-none focus:border-indigo-500"
          />
        </div>
      )}
    </li>
  );
}
