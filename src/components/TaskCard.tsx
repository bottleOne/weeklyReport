"use client";

import type { TaskItem, ContentLine } from "@/lib/types";
import { createEmptyContentLine, createEmptySubDetail } from "@/lib/types";

/** textarea 높이를 내용에 맞게 자동 조절 */
function autoResize(el: HTMLTextAreaElement) {
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
}

interface TaskCardProps {
  task: TaskItem;
  index: number;
  total: number;
  accentColor: "blue" | "emerald";
  placeholderContent: string;
  onChangeField: (id: string, field: string, value: string) => void;
  onChangeContentLines: (id: string, lines: ContentLine[]) => void;
  onRemove: (id: string) => void;
}

export default function TaskCard({
  task,
  index,
  total,
  accentColor,
  placeholderContent,
  onChangeField,
  onChangeContentLines,
  onRemove,
}: TaskCardProps) {
  const accentBg = accentColor === "blue" ? "bg-blue-600" : "bg-emerald-600";

  const updateLine = (lineId: string, field: "text" | "dateFrom" | "dateTo", value: string) => {
    const updated = task.contentLines.map((l) => (l.id === lineId ? { ...l, [field]: value } : l));
    onChangeContentLines(task.id, updated);
  };

  const addLine = () => {
    onChangeContentLines(task.id, [...task.contentLines, createEmptyContentLine()]);
  };

  const removeLine = (lineId: string) => {
    if (task.contentLines.length <= 1) return;
    onChangeContentLines(
      task.id,
      task.contentLines.filter((l) => l.id !== lineId)
    );
  };

  // ---- SubDetail helpers ----
  const updateSubDetail = (
    lineId: string,
    subId: string,
    field: "text" | "dateFrom" | "dateTo",
    value: string
  ) => {
    const updated = task.contentLines.map((l) => {
      if (l.id !== lineId) return l;
      return {
        ...l,
        subDetails: l.subDetails.map((s) => (s.id === subId ? { ...s, [field]: value } : s)),
      };
    });
    onChangeContentLines(task.id, updated);
  };

  const addSubDetail = (lineId: string) => {
    const updated = task.contentLines.map((l) => {
      if (l.id !== lineId) return l;
      return { ...l, subDetails: [...l.subDetails, createEmptySubDetail()] };
    });
    onChangeContentLines(task.id, updated);
  };

  const removeSubDetail = (lineId: string, subId: string) => {
    const updated = task.contentLines.map((l) => {
      if (l.id !== lineId) return l;
      return { ...l, subDetails: l.subDetails.filter((s) => s.id !== subId) };
    });
    onChangeContentLines(task.id, updated);
  };

  return (
    <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50/50 p-5">
      {/* Task Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex flex-1 items-center gap-3">
          <span
            className={`${accentBg} flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white`}
          >
            {index + 1}
          </span>
          <input
            type="text"
            placeholder="업무명 (예: 비즈메카 인사/영업재고/회계)"
            value={task.title}
            onChange={(e) => onChangeField(task.id, "title", e.target.value)}
            className="flex-1 border-b-2 border-gray-300 bg-transparent pb-1 text-base font-semibold transition-colors outline-none focus:border-blue-500"
          />
        </div>
        {total > 1 && (
          <button
            onClick={() => onRemove(task.id)}
            className="ml-3 cursor-pointer text-sm text-red-400 transition-colors hover:text-red-600"
          >
            ✕ 삭제
          </button>
        )}
      </div>

      {/* Content Lines */}
      <div className="rounded-lg border border-gray-100 bg-white p-4">
        <div className="space-y-2">
          {task.contentLines.map((line, lineIdx) => (
            <div key={line.id}>
              {/* 메인 내용 줄 */}
              <div className="flex items-start gap-2">
                <span className="mt-2.5 w-5 shrink-0 text-right text-xs text-gray-400">
                  {lineIdx + 1})
                </span>
                <textarea
                  rows={1}
                  placeholder={lineIdx === 0 ? placeholderContent : "업무 내용 입력"}
                  value={line.text}
                  onChange={(e) => {
                    updateLine(line.id, "text", e.target.value);
                    autoResize(e.target);
                  }}
                  onInput={(e) => autoResize(e.target as HTMLTextAreaElement)}
                  ref={(el) => {
                    if (el) autoResize(el);
                  }}
                  className="min-w-0 flex-1 resize-none overflow-hidden rounded-md border border-gray-200 p-2 text-sm transition-colors outline-none focus:border-blue-500"
                />
                <div className="mt-0.5 flex shrink-0 items-center gap-1">
                  <input
                    type="date"
                    value={line.dateFrom}
                    onChange={(e) => updateLine(line.id, "dateFrom", e.target.value)}
                    className="w-[125px] rounded-md border border-gray-200 p-2 text-xs transition-colors outline-none focus:border-blue-500"
                  />
                  <span className="text-xs text-gray-400">~</span>
                  <input
                    type="date"
                    value={line.dateTo}
                    onChange={(e) => updateLine(line.id, "dateTo", e.target.value)}
                    className="w-[125px] rounded-md border border-gray-200 p-2 text-xs transition-colors outline-none focus:border-blue-500"
                  />
                </div>
                <div className="mt-0.5 flex shrink-0 items-center gap-1.5">
                  <button
                    onClick={() => addSubDetail(line.id)}
                    className="cursor-pointer rounded-md border border-blue-300 px-2 py-1 text-sm font-medium text-blue-500 transition-colors hover:bg-blue-50 hover:text-blue-700"
                    title="세부내용 추가"
                  >
                    + 세부
                  </button>
                  {task.contentLines.length > 1 ? (
                    <button
                      onClick={() => removeLine(line.id)}
                      className="cursor-pointer rounded-md border border-red-300 px-2 py-1 text-sm font-medium text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      title="행 삭제"
                    >
                      삭제
                    </button>
                  ) : (
                    <div className="w-[52px]" />
                  )}
                </div>
              </div>

              {/* 세부내용 (- 으로 시작하는 항목) */}
              {line.subDetails.length > 0 && (
                <div className="mt-1 ml-7 space-y-1">
                  {line.subDetails.map((sub) => (
                    <div key={sub.id} className="flex items-start gap-2">
                      <span className="mt-2.5 shrink-0 text-xs text-gray-400">-</span>
                      <textarea
                        rows={1}
                        placeholder="세부 내용 입력"
                        value={sub.text}
                        onChange={(e) => {
                          updateSubDetail(line.id, sub.id, "text", e.target.value);
                          autoResize(e.target);
                        }}
                        onInput={(e) => autoResize(e.target as HTMLTextAreaElement)}
                        ref={(el) => {
                          if (el) autoResize(el);
                        }}
                        className="min-w-0 flex-1 resize-none overflow-hidden rounded-md border border-gray-200 bg-gray-50 p-1.5 text-sm transition-colors outline-none focus:border-blue-500"
                      />
                      <div className="mt-0.5 flex shrink-0 items-center gap-1">
                        <input
                          type="date"
                          value={sub.dateFrom}
                          onChange={(e) =>
                            updateSubDetail(line.id, sub.id, "dateFrom", e.target.value)
                          }
                          className="w-[125px] rounded-md border border-gray-200 p-1.5 text-xs transition-colors outline-none focus:border-blue-500"
                        />
                        <span className="text-xs text-gray-400">~</span>
                        <input
                          type="date"
                          value={sub.dateTo}
                          onChange={(e) =>
                            updateSubDetail(line.id, sub.id, "dateTo", e.target.value)
                          }
                          className="w-[125px] rounded-md border border-gray-200 p-1.5 text-xs transition-colors outline-none focus:border-blue-500"
                        />
                      </div>
                      <button
                        onClick={() => removeSubDetail(line.id, sub.id)}
                        className="mt-0.5 shrink-0 cursor-pointer rounded border border-red-300 px-1.5 py-0.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        title="세부내용 삭제"
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* + 행 추가 버튼 */}
        <button
          onClick={addLine}
          className="mt-2 w-full cursor-pointer rounded-md border-2 border-dashed border-gray-300 py-1.5 text-xs text-gray-400 transition-colors hover:border-gray-400 hover:text-gray-500"
        >
          + 내용 행 추가
        </button>
      </div>
    </div>
  );
}
