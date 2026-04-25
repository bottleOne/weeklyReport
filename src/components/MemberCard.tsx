"use client";

import type { MemberData, TaskItem, ContentLine, ReportData } from "@/lib/types";
import { createEmptyTask, createEmptyContentLine, createEmptySubDetail } from "@/lib/types";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

/** textarea 높이를 내용에 맞게 자동 조절 */
function autoResize(el: HTMLTextAreaElement) {
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
}

interface MemberCardProps {
  member: MemberData;
  index: number;
  total: number;
  onUpdate: (id: string, updated: Partial<MemberData>) => void;
  onRemove: (id: string) => void;
}

export default function MemberCard({ member, index, total, onUpdate, onRemove }: MemberCardProps) {
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
      toast.error(
        error instanceof Error ? error.message : "파일을 불러오는 중 오류가 발생했습니다."
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const updateTasks = useCallback(
    (which: "thisWeekTasks" | "nextWeekTasks", updater: (prev: TaskItem[]) => TaskItem[]) => {
      onUpdate(member.id, { [which]: updater(member[which]) });
    },
    [member, onUpdate]
  );

  const addTask = (which: "thisWeekTasks" | "nextWeekTasks") =>
    updateTasks(which, (prev) => [...prev, createEmptyTask()]);

  const removeTask = (which: "thisWeekTasks" | "nextWeekTasks", id: string) =>
    updateTasks(which, (prev) => (prev.length <= 1 ? prev : prev.filter((t) => t.id !== id)));

  const changeField = (
    which: "thisWeekTasks" | "nextWeekTasks",
    taskId: string,
    field: string,
    value: string
  ) =>
    updateTasks(which, (prev) => prev.map((t) => (t.id === taskId ? { ...t, [field]: value } : t)));

  const changeContentLines = (
    which: "thisWeekTasks" | "nextWeekTasks",
    taskId: string,
    lines: ContentLine[]
  ) =>
    updateTasks(which, (prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, contentLines: lines } : t))
    );

  return (
    <div className="mb-4 rounded-xl border border-gray-200 bg-white p-5">
      {/* 팀원 헤더 */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex flex-1 items-center gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
            {index + 1}
          </span>
          <input
            type="text"
            placeholder="팀원 이름"
            value={member.name}
            onChange={(e) => onUpdate(member.id, { name: e.target.value })}
            className="w-40 border-b-2 border-gray-300 bg-transparent pb-1 text-base font-semibold transition-colors outline-none focus:border-indigo-500"
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
            className="cursor-pointer rounded-md border border-indigo-200 px-2.5 py-1 text-xs text-indigo-500 transition-colors hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-50"
          >
            {uploading ? "⏳ 불러오는 중..." : "📂 이전 보고서"}
          </button>
          {total > 1 && (
            <button
              onClick={() => onRemove(member.id)}
              className="cursor-pointer text-sm text-red-400 transition-colors hover:text-red-600"
            >
              ✕ 삭제
            </button>
          )}
        </div>
      </div>

      {/* 금주/차주 좌우 배치 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* 금주 실적 */}
        <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-bold text-blue-600">금주 실적</span>
            <button
              onClick={() => addTask("thisWeekTasks")}
              className="cursor-pointer rounded bg-blue-600 px-2 py-1 text-[10px] text-white transition-colors hover:bg-blue-700"
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
              onChangeContentLines={(id, l) => changeContentLines("thisWeekTasks", id, l)}
              onRemove={(id) => removeTask("thisWeekTasks", id)}
            />
          ))}
        </div>

        {/* 차주 계획 */}
        <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600">차주 계획</span>
            <button
              onClick={() => addTask("nextWeekTasks")}
              className="cursor-pointer rounded bg-emerald-600 px-2 py-1 text-[10px] text-white transition-colors hover:bg-emerald-700"
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
              onChangeField={(id, f, v) => changeField("nextWeekTasks", id, f, v)}
              onChangeContentLines={(id, l) => changeContentLines("nextWeekTasks", id, l)}
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
  onChangeField: (id: string, field: string, value: string) => void;
  onChangeContentLines: (id: string, lines: ContentLine[]) => void;
  onRemove: (id: string) => void;
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
  const borderColor = accent === "blue" ? "border-blue-200" : "border-emerald-200";
  const numBg = accent === "blue" ? "bg-blue-500" : "bg-emerald-500";

  const updateLine = (lineId: string, field: "text" | "dateFrom" | "dateTo", value: string) =>
    onChangeContentLines(
      task.id,
      task.contentLines.map((l) => (l.id === lineId ? { ...l, [field]: value } : l))
    );

  const addLine = () =>
    onChangeContentLines(task.id, [...task.contentLines, createEmptyContentLine()]);

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
  ) =>
    onChangeContentLines(
      task.id,
      task.contentLines.map((l) => {
        if (l.id !== lineId) return l;
        return {
          ...l,
          subDetails: l.subDetails.map((s) => (s.id === subId ? { ...s, [field]: value } : s)),
        };
      })
    );

  const addSubDetail = (lineId: string) =>
    onChangeContentLines(
      task.id,
      task.contentLines.map((l) => {
        if (l.id !== lineId) return l;
        return { ...l, subDetails: [...l.subDetails, createEmptySubDetail()] };
      })
    );

  const removeSubDetail = (lineId: string, subId: string) =>
    onChangeContentLines(
      task.id,
      task.contentLines.map((l) => {
        if (l.id !== lineId) return l;
        return { ...l, subDetails: l.subDetails.filter((s) => s.id !== subId) };
      })
    );

  return (
    <div className={`border ${borderColor} mb-2 rounded-lg bg-white p-3`}>
      <div className="mb-2 flex items-center gap-2">
        <span
          className={`${numBg} flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white`}
        >
          {index + 1}
        </span>
        <input
          type="text"
          placeholder="업무명"
          value={task.title}
          onChange={(e) => onChangeField(task.id, "title", e.target.value)}
          className="flex-1 border-b border-gray-200 bg-transparent pb-0.5 text-sm font-semibold transition-colors outline-none focus:border-blue-500"
        />
        {total > 1 && (
          <button
            onClick={() => onRemove(task.id)}
            className="cursor-pointer text-xs text-red-300 hover:text-red-500"
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
              <span className="mt-2 w-4 shrink-0 text-right text-[10px] text-gray-400">
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
                ref={(el) => {
                  if (el) autoResize(el);
                }}
                className="min-w-0 flex-1 resize-none overflow-hidden rounded border border-gray-200 p-1.5 text-xs transition-colors outline-none focus:border-blue-500"
              />
              <div className="mt-0.5 flex shrink-0 items-center gap-0.5">
                <input
                  type="date"
                  value={line.dateFrom}
                  onChange={(e) => updateLine(line.id, "dateFrom", e.target.value)}
                  className="w-[105px] rounded border border-gray-200 p-1.5 text-[10px] transition-colors outline-none focus:border-blue-500"
                />
                <span className="text-[10px] text-gray-400">~</span>
                <input
                  type="date"
                  value={line.dateTo}
                  onChange={(e) => updateLine(line.id, "dateTo", e.target.value)}
                  className="w-[105px] rounded border border-gray-200 p-1.5 text-[10px] transition-colors outline-none focus:border-blue-500"
                />
              </div>
              <div className="mt-0.5 flex shrink-0 items-center gap-1">
                <button
                  onClick={() => addSubDetail(line.id)}
                  className="cursor-pointer rounded border border-blue-300 px-1.5 py-0.5 text-[11px] font-medium text-blue-500 transition-colors hover:bg-blue-50 hover:text-blue-700"
                  title="세부내용 추가"
                >
                  +세부
                </button>
                {task.contentLines.length > 1 ? (
                  <button
                    onClick={() => removeLine(line.id)}
                    className="cursor-pointer rounded border border-red-300 px-1.5 py-0.5 text-[11px] font-medium text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
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
              <div className="mt-1 ml-6 space-y-1">
                {line.subDetails.map((sub) => (
                  <div key={sub.id} className="flex items-start gap-1.5">
                    <span className="mt-1.5 shrink-0 text-[10px] text-gray-400">-</span>
                    <textarea
                      rows={1}
                      placeholder="세부 내용"
                      value={sub.text}
                      onChange={(e) => {
                        updateSubDetail(line.id, sub.id, "text", e.target.value);
                        autoResize(e.target);
                      }}
                      onInput={(e) => autoResize(e.target as HTMLTextAreaElement)}
                      ref={(el) => {
                        if (el) autoResize(el);
                      }}
                      className="min-w-0 flex-1 resize-none overflow-hidden rounded border border-gray-200 bg-gray-50 p-1 text-xs transition-colors outline-none focus:border-blue-500"
                    />
                    <div className="flex shrink-0 items-center gap-0.5">
                      <input
                        type="date"
                        value={sub.dateFrom}
                        onChange={(e) =>
                          updateSubDetail(line.id, sub.id, "dateFrom", e.target.value)
                        }
                        className="w-[105px] rounded border border-gray-200 p-1 text-[10px] transition-colors outline-none focus:border-blue-500"
                      />
                      <span className="text-[10px] text-gray-400">~</span>
                      <input
                        type="date"
                        value={sub.dateTo}
                        onChange={(e) => updateSubDetail(line.id, sub.id, "dateTo", e.target.value)}
                        className="w-[105px] rounded border border-gray-200 p-1 text-[10px] transition-colors outline-none focus:border-blue-500"
                      />
                    </div>
                    <button
                      onClick={() => removeSubDetail(line.id, sub.id)}
                      className="shrink-0 cursor-pointer rounded border border-red-300 px-1 py-0.5 text-[10px] font-medium text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
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
        className="mt-1.5 w-full cursor-pointer rounded border border-dashed border-gray-300 py-1 text-[10px] text-gray-400 transition-colors hover:border-gray-400 hover:text-gray-500"
      >
        + 행 추가
      </button>
    </div>
  );
}
