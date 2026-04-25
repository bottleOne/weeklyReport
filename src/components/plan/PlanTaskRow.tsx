"use client";

import type { PlanTask, TaskStatus } from "@/lib/plan-types";
import { TASK_STATUS_LABEL } from "@/lib/plan-types";

interface PlanTaskRowProps {
  task: PlanTask;
  index: number;
  total: number;
  onChange: (id: string, field: keyof PlanTask, value: string) => void;
  onRemove: (id: string) => void;
}

const STATUS_COLOR: Record<TaskStatus, string> = {
  todo: "bg-gray-100 text-gray-700 border-gray-300",
  in_progress: "bg-blue-50 text-blue-700 border-blue-300",
  done: "bg-emerald-50 text-emerald-700 border-emerald-300",
  blocked: "bg-red-50 text-red-700 border-red-300",
};

export default function PlanTaskRow({ task, index, total, onChange, onRemove }: PlanTaskRowProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <div className="flex items-start gap-2">
        <span className="mt-2 w-5 shrink-0 text-right text-xs text-gray-400">{index + 1}.</span>
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="작업 제목"
              value={task.title}
              onChange={(e) => onChange(task.id, "title", e.target.value)}
              className="min-w-[140px] flex-1 rounded-md border border-gray-200 p-1.5 text-sm outline-none focus:border-indigo-500"
            />
            <input
              type="text"
              placeholder="담당자"
              value={task.assignee}
              onChange={(e) => onChange(task.id, "assignee", e.target.value)}
              className="w-24 rounded-md border border-gray-200 p-1.5 text-sm outline-none focus:border-indigo-500"
            />
            <input
              type="date"
              value={task.dateFrom}
              onChange={(e) => onChange(task.id, "dateFrom", e.target.value)}
              className="w-[125px] rounded-md border border-gray-200 p-1.5 text-xs outline-none focus:border-indigo-500"
            />
            <span className="text-xs text-gray-400">~</span>
            <input
              type="date"
              value={task.dateTo}
              onChange={(e) => onChange(task.id, "dateTo", e.target.value)}
              className="w-[125px] rounded-md border border-gray-200 p-1.5 text-xs outline-none focus:border-indigo-500"
            />
            <select
              value={task.status}
              onChange={(e) => onChange(task.id, "status", e.target.value)}
              className={`rounded-md border p-1.5 text-xs font-medium outline-none ${STATUS_COLOR[task.status]}`}
            >
              {(Object.keys(TASK_STATUS_LABEL) as TaskStatus[]).map((s) => (
                <option key={s} value={s}>
                  {TASK_STATUS_LABEL[s]}
                </option>
              ))}
            </select>
            {total > 1 && (
              <button
                onClick={() => onRemove(task.id)}
                className="cursor-pointer rounded-md border border-red-300 px-2 py-1 text-xs text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
                title="작업 삭제"
              >
                삭제
              </button>
            )}
          </div>
          {task.notes !== undefined && (
            <textarea
              rows={1}
              placeholder="메모 (선택)"
              value={task.notes}
              onChange={(e) => onChange(task.id, "notes", e.target.value)}
              className="w-full resize-y rounded-md border border-gray-100 bg-gray-50 p-1.5 text-xs outline-none focus:border-indigo-500"
            />
          )}
        </div>
      </div>
    </div>
  );
}
