"use client";

import type { TaskItem, ContentLine, SubDetail } from "@/lib/types";
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
    const updated = task.contentLines.map((l) =>
      l.id === lineId ? { ...l, [field]: value } : l
    );
    onChangeContentLines(task.id, updated);
  };

  const addLine = () => {
    onChangeContentLines(task.id, [
      ...task.contentLines,
      createEmptyContentLine(),
    ]);
  };

  const removeLine = (lineId: string) => {
    if (task.contentLines.length <= 1) return;
    onChangeContentLines(
      task.id,
      task.contentLines.filter((l) => l.id !== lineId)
    );
  };

  // ---- SubDetail helpers ----
  const updateSubDetail = (lineId: string, subId: string, field: "text" | "dateFrom" | "dateTo", value: string) => {
    const updated = task.contentLines.map((l) => {
      if (l.id !== lineId) return l;
      return {
        ...l,
        subDetails: l.subDetails.map((s) =>
          s.id === subId ? { ...s, [field]: value } : s
        ),
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
    <div className="border border-gray-200 rounded-xl p-5 mb-4 bg-gray-50/50">
      {/* Task Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3 flex-1">
          <span
            className={`${accentBg} text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shrink-0`}
          >
            {index + 1}
          </span>
          <input
            type="text"
            placeholder="업무명 (예: 비즈메카 인사/영업재고/회계)"
            value={task.title}
            onChange={(e) => onChangeField(task.id, "title", e.target.value)}
            className="flex-1 text-base font-semibold bg-transparent border-b-2 border-gray-300 focus:border-blue-500 outline-none pb-1 transition-colors"
          />
        </div>
        {total > 1 && (
          <button
            onClick={() => onRemove(task.id)}
            className="text-red-400 hover:text-red-600 text-sm ml-3 transition-colors cursor-pointer"
          >
            ✕ 삭제
          </button>
        )}
      </div>

      {/* Content Lines */}
      <div className="bg-white rounded-lg p-4 border border-gray-100">
        <div className="space-y-2">
          {task.contentLines.map((line, lineIdx) => (
            <div key={line.id}>
              {/* 메인 내용 줄 */}
              <div className="flex items-start gap-2">
                <span className="text-xs text-gray-400 w-5 text-right shrink-0 mt-2.5">
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
                  ref={(el) => { if (el) autoResize(el); }}
                  className="flex-1 p-2 border border-gray-200 rounded-md text-sm focus:border-blue-500 outline-none transition-colors min-w-0 resize-none overflow-hidden"
                />
                <div className="flex items-center gap-1 shrink-0 mt-0.5">
                  <input
                    type="date"
                    value={line.dateFrom}
                    onChange={(e) => updateLine(line.id, "dateFrom", e.target.value)}
                    className="w-[125px] p-2 border border-gray-200 rounded-md text-xs focus:border-blue-500 outline-none transition-colors"
                  />
                  <span className="text-gray-400 text-xs">~</span>
                  <input
                    type="date"
                    value={line.dateTo}
                    onChange={(e) => updateLine(line.id, "dateTo", e.target.value)}
                    className="w-[125px] p-2 border border-gray-200 rounded-md text-xs focus:border-blue-500 outline-none transition-colors"
                  />
                </div>
                <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                  <button
                    onClick={() => addSubDetail(line.id)}
                    className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 text-sm font-medium transition-colors cursor-pointer px-2 py-1 border border-blue-300 rounded-md"
                    title="세부내용 추가"
                  >
                    + 세부
                  </button>
                  {task.contentLines.length > 1 ? (
                    <button
                      onClick={() => removeLine(line.id)}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 text-sm font-medium transition-colors cursor-pointer px-2 py-1 border border-red-300 rounded-md"
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
                <div className="ml-7 mt-1 space-y-1">
                  {line.subDetails.map((sub) => (
                    <div key={sub.id} className="flex items-start gap-2">
                      <span className="text-xs text-gray-400 shrink-0 mt-2.5">-</span>
                      <textarea
                        rows={1}
                        placeholder="세부 내용 입력"
                        value={sub.text}
                        onChange={(e) => {
                          updateSubDetail(line.id, sub.id, "text", e.target.value);
                          autoResize(e.target);
                        }}
                        onInput={(e) => autoResize(e.target as HTMLTextAreaElement)}
                        ref={(el) => { if (el) autoResize(el); }}
                        className="flex-1 p-1.5 border border-gray-200 rounded-md text-sm focus:border-blue-500 outline-none transition-colors min-w-0 resize-none overflow-hidden bg-gray-50"
                      />
                      <div className="flex items-center gap-1 shrink-0 mt-0.5">
                        <input
                          type="date"
                          value={sub.dateFrom}
                          onChange={(e) => updateSubDetail(line.id, sub.id, "dateFrom", e.target.value)}
                          className="w-[125px] p-1.5 border border-gray-200 rounded-md text-xs focus:border-blue-500 outline-none transition-colors"
                        />
                        <span className="text-gray-400 text-xs">~</span>
                        <input
                          type="date"
                          value={sub.dateTo}
                          onChange={(e) => updateSubDetail(line.id, sub.id, "dateTo", e.target.value)}
                          className="w-[125px] p-1.5 border border-gray-200 rounded-md text-xs focus:border-blue-500 outline-none transition-colors"
                        />
                      </div>
                      <button
                        onClick={() => removeSubDetail(line.id, sub.id)}
                        className="text-red-400 hover:text-red-600 hover:bg-red-50 text-xs font-medium transition-colors cursor-pointer shrink-0 px-1.5 py-0.5 border border-red-300 rounded mt-0.5"
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
          className="mt-2 w-full py-1.5 border-2 border-dashed border-gray-300 rounded-md text-xs text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors cursor-pointer"
        >
          + 내용 행 추가
        </button>
      </div>
    </div>
  );
}
