"use client";

import type { MemberData, TaskItem, ContentLine, SubDetail, ReportData } from "@/lib/types";
import { createEmptyTask, createEmptyContentLine, createEmptySubDetail } from "@/lib/types";
import { useCallback, useRef, useState } from "react";

/** textarea 높이를 내용에 맞게 자동 조절 */
function autoResize(el: HTMLTextAreaElement) {
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
}

interface MemberCardProps {
  member: MemberData;
  index: number;
  total: number;
  onUpdate: (id: number, updated: Partial<MemberData>) => void;
  onRemove: (id: number) => void;
}

export default function MemberCard({
  member,
  index,
  total,
  onUpdate,
  onRemove,
}: MemberCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/parse-docx", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "파일 파싱 실패");
      }

      const data: ReportData = await res.json();

      onUpdate(member.id, {
        name: data.authorName || member.name,
        thisWeekTasks: data.thisWeekTasks,
        nextWeekTasks: data.nextWeekTasks,
      });
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error
          ? error.message
          : "파일을 불러오는 중 오류가 발생했습니다."
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const updateTasks = useCallback(
    (
      which: "thisWeekTasks" | "nextWeekTasks",
      updater: (prev: TaskItem[]) => TaskItem[]
    ) => {
      onUpdate(member.id, { [which]: updater(member[which]) });
    },
    [member, onUpdate]
  );

  const addTask = (which: "thisWeekTasks" | "nextWeekTasks") =>
    updateTasks(which, (prev) => [...prev, createEmptyTask()]);

  const removeTask = (which: "thisWeekTasks" | "nextWeekTasks", id: number) =>
    updateTasks(which, (prev) =>
      prev.length <= 1 ? prev : prev.filter((t) => t.id !== id)
    );

  const changeField = (
    which: "thisWeekTasks" | "nextWeekTasks",
    taskId: number,
    field: string,
    value: string
  ) =>
    updateTasks(which, (prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, [field]: value } : t))
    );

  const changeContentLines = (
    which: "thisWeekTasks" | "nextWeekTasks",
    taskId: number,
    lines: ContentLine[]
  ) =>
    updateTasks(which, (prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, contentLines: lines } : t
      )
    );

  return (
    <div className="border border-gray-200 rounded-xl p-5 mb-4 bg-white">
      {/* 팀원 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          <span className="bg-indigo-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shrink-0">
            {index + 1}
          </span>
          <input
            type="text"
            placeholder="팀원 이름"
            value={member.name}
            onChange={(e) => onUpdate(member.id, { name: e.target.value })}
            className="w-40 text-base font-semibold bg-transparent border-b-2 border-gray-300 focus:border-indigo-500 outline-none pb-1 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            accept=".docx"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="text-indigo-500 hover:text-indigo-700 text-xs border border-indigo-200 rounded-md px-2.5 py-1 hover:bg-indigo-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            {uploading ? "⏳ 불러오는 중..." : "📂 이전 보고서"}
          </button>
          {total > 1 && (
            <button
              onClick={() => onRemove(member.id)}
              className="text-red-400 hover:text-red-600 text-sm transition-colors cursor-pointer"
            >
              ✕ 삭제
            </button>
          )}
        </div>
      </div>

      {/* 금주/차주 좌우 배치 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 금주 실적 */}
        <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-blue-600">금주 실적</span>
            <button
              onClick={() => addTask("thisWeekTasks")}
              className="bg-blue-600 text-white text-[10px] px-2 py-1 rounded hover:bg-blue-700 transition-colors cursor-pointer"
            >
              + 업무
            </button>
          </div>
          {member.thisWeekTasks.map((task, tIdx) => (
            <TaskMini
              key={task.id}
              task={task}
              index={tIdx}
              total={member.thisWeekTasks.length}
              accent="blue"
              onChangeField={(id, f, v) => changeField("thisWeekTasks", id, f, v)}
              onChangeContentLines={(id, l) =>
                changeContentLines("thisWeekTasks", id, l)
              }
              onRemove={(id) => removeTask("thisWeekTasks", id)}
            />
          ))}
        </div>

        {/* 차주 계획 */}
        <div className="bg-emerald-50/50 rounded-lg p-4 border border-emerald-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-emerald-600">
              차주 계획
            </span>
            <button
              onClick={() => addTask("nextWeekTasks")}
              className="bg-emerald-600 text-white text-[10px] px-2 py-1 rounded hover:bg-emerald-700 transition-colors cursor-pointer"
            >
              + 업무
            </button>
          </div>
          {member.nextWeekTasks.map((task, tIdx) => (
            <TaskMini
              key={task.id}
              task={task}
              index={tIdx}
              total={member.nextWeekTasks.length}
              accent="emerald"
              onChangeField={(id, f, v) =>
                changeField("nextWeekTasks", id, f, v)
              }
              onChangeContentLines={(id, l) =>
                changeContentLines("nextWeekTasks", id, l)
              }
              onRemove={(id) => removeTask("nextWeekTasks", id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ===== 팀장 모드용 간소화된 업무 카드 =====
interface TaskMiniProps {
  task: TaskItem;
  index: number;
  total: number;
  accent: "blue" | "emerald";
  onChangeField: (id: number, field: string, value: string) => void;
  onChangeContentLines: (id: number, lines: ContentLine[]) => void;
  onRemove: (id: number) => void;
}

function TaskMini({
  task,
  index,
  total,
  accent,
  onChangeField,
  onChangeContentLines,
  onRemove,
}: TaskMiniProps) {
  const borderColor =
    accent === "blue" ? "border-blue-200" : "border-emerald-200";
  const numBg = accent === "blue" ? "bg-blue-500" : "bg-emerald-500";

  const updateLine = (lineId: number, field: "text" | "dateFrom" | "dateTo", value: string) =>
    onChangeContentLines(
      task.id,
      task.contentLines.map((l) =>
        l.id === lineId ? { ...l, [field]: value } : l
      )
    );

  const addLine = () =>
    onChangeContentLines(task.id, [
      ...task.contentLines,
      createEmptyContentLine(),
    ]);

  const removeLine = (lineId: number) => {
    if (task.contentLines.length <= 1) return;
    onChangeContentLines(
      task.id,
      task.contentLines.filter((l) => l.id !== lineId)
    );
  };

  // ---- SubDetail helpers ----
  const updateSubDetail = (lineId: number, subId: number, field: "text" | "dateFrom" | "dateTo", value: string) =>
    onChangeContentLines(
      task.id,
      task.contentLines.map((l) => {
        if (l.id !== lineId) return l;
        return {
          ...l,
          subDetails: l.subDetails.map((s) =>
            s.id === subId ? { ...s, [field]: value } : s
          ),
        };
      })
    );

  const addSubDetail = (lineId: number) =>
    onChangeContentLines(
      task.id,
      task.contentLines.map((l) => {
        if (l.id !== lineId) return l;
        return { ...l, subDetails: [...l.subDetails, createEmptySubDetail()] };
      })
    );

  const removeSubDetail = (lineId: number, subId: number) =>
    onChangeContentLines(
      task.id,
      task.contentLines.map((l) => {
        if (l.id !== lineId) return l;
        return { ...l, subDetails: l.subDetails.filter((s) => s.id !== subId) };
      })
    );

  return (
    <div className={`border ${borderColor} rounded-lg p-3 mb-2 bg-white`}>
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`${numBg} text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shrink-0`}
        >
          {index + 1}
        </span>
        <input
          type="text"
          placeholder="업무명"
          value={task.title}
          onChange={(e) => onChangeField(task.id, "title", e.target.value)}
          className="flex-1 text-sm font-semibold bg-transparent border-b border-gray-200 focus:border-blue-500 outline-none pb-0.5 transition-colors"
        />
        {total > 1 && (
          <button
            onClick={() => onRemove(task.id)}
            className="text-red-300 hover:text-red-500 text-xs cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      <div className="space-y-1.5">
        {task.contentLines.map((line, lIdx) => (
          <div key={line.id}>
            {/* 메인 내용 줄 */}
            <div className="flex items-start gap-1.5">
              <span className="text-[10px] text-gray-400 w-4 text-right shrink-0 mt-2">
                {lIdx + 1})
              </span>
              <textarea
                rows={1}
                placeholder="업무 내용"
                value={line.text}
                onChange={(e) => {
                  updateLine(line.id, "text", e.target.value);
                  autoResize(e.target);
                }}
                onInput={(e) => autoResize(e.target as HTMLTextAreaElement)}
                ref={(el) => { if (el) autoResize(el); }}
                className="flex-1 p-1.5 border border-gray-200 rounded text-xs focus:border-blue-500 outline-none transition-colors min-w-0 resize-none overflow-hidden"
              />
              <div className="flex items-center gap-0.5 shrink-0 mt-0.5">
                <input
                  type="date"
                  value={line.dateFrom}
                  onChange={(e) => updateLine(line.id, "dateFrom", e.target.value)}
                  className="w-[105px] p-1.5 border border-gray-200 rounded text-[10px] focus:border-blue-500 outline-none transition-colors"
                />
                <span className="text-gray-400 text-[10px]">~</span>
                <input
                  type="date"
                  value={line.dateTo}
                  onChange={(e) => updateLine(line.id, "dateTo", e.target.value)}
                  className="w-[105px] p-1.5 border border-gray-200 rounded text-[10px] focus:border-blue-500 outline-none transition-colors"
                />
              </div>
              <div className="flex items-center gap-1 shrink-0 mt-0.5">
                <button
                  onClick={() => addSubDetail(line.id)}
                  className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 text-[11px] font-medium transition-colors cursor-pointer px-1.5 py-0.5 border border-blue-300 rounded"
                  title="세부내용 추가"
                >
                  +세부
                </button>
                {task.contentLines.length > 1 ? (
                  <button
                    onClick={() => removeLine(line.id)}
                    className="text-red-400 hover:text-red-600 hover:bg-red-50 text-[11px] font-medium transition-colors cursor-pointer px-1.5 py-0.5 border border-red-300 rounded"
                  >
                    삭제
                  </button>
                ) : (
                  <div className="w-[38px] shrink-0" />
                )}
              </div>
            </div>

            {/* 세부내용 */}
            {line.subDetails.length > 0 && (
              <div className="ml-6 mt-1 space-y-1">
                {line.subDetails.map((sub) => (
                  <div key={sub.id} className="flex items-start gap-1.5">
                    <span className="text-[10px] text-gray-400 shrink-0 mt-1.5">-</span>
                    <textarea
                      rows={1}
                      placeholder="세부 내용"
                      value={sub.text}
                      onChange={(e) => {
                        updateSubDetail(line.id, sub.id, "text", e.target.value);
                        autoResize(e.target);
                      }}
                      onInput={(e) => autoResize(e.target as HTMLTextAreaElement)}
                      ref={(el) => { if (el) autoResize(el); }}
                      className="flex-1 p-1 border border-gray-200 rounded text-xs focus:border-blue-500 outline-none transition-colors min-w-0 resize-none overflow-hidden bg-gray-50"
                    />
                    <div className="flex items-center gap-0.5 shrink-0">
                      <input
                        type="date"
                        value={sub.dateFrom}
                        onChange={(e) => updateSubDetail(line.id, sub.id, "dateFrom", e.target.value)}
                        className="w-[105px] p-1 border border-gray-200 rounded text-[10px] focus:border-blue-500 outline-none transition-colors"
                      />
                      <span className="text-gray-400 text-[10px]">~</span>
                      <input
                        type="date"
                        value={sub.dateTo}
                        onChange={(e) => updateSubDetail(line.id, sub.id, "dateTo", e.target.value)}
                        className="w-[105px] p-1 border border-gray-200 rounded text-[10px] focus:border-blue-500 outline-none transition-colors"
                      />
                    </div>
                    <button
                      onClick={() => removeSubDetail(line.id, sub.id)}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 text-[10px] font-medium transition-colors cursor-pointer shrink-0 px-1 py-0.5 border border-red-300 rounded"
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
      <button
        onClick={addLine}
        className="mt-1.5 w-full py-1 border border-dashed border-gray-300 rounded text-[10px] text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors cursor-pointer"
      >
        + 행 추가
      </button>
    </div>
  );
}
