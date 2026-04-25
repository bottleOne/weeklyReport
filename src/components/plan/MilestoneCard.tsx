"use client";

import type { Milestone, PlanTask } from "@/lib/plan-types";
import { createEmptyPlanTask } from "@/lib/plan-types";
import PlanTaskRow from "./PlanTaskRow";

interface MilestoneCardProps {
  milestone: Milestone;
  index: number;
  total: number;
  onUpdate: (id: string, updated: Partial<Milestone>) => void;
  onRemove: (id: string) => void;
}

export default function MilestoneCard({
  milestone,
  index,
  total,
  onUpdate,
  onRemove,
}: MilestoneCardProps) {
  const updateTaskField = (taskId: string, field: keyof PlanTask, value: string) => {
    onUpdate(milestone.id, {
      tasks: milestone.tasks.map((t) => (t.id === taskId ? { ...t, [field]: value } : t)),
    });
  };

  const addTask = () => {
    onUpdate(milestone.id, { tasks: [...milestone.tasks, createEmptyPlanTask()] });
  };

  const removeTask = (taskId: string) => {
    if (milestone.tasks.length <= 1) return;
    onUpdate(milestone.id, { tasks: milestone.tasks.filter((t) => t.id !== taskId) });
  };

  const inputClass =
    "w-full rounded-md border border-gray-200 p-2 text-sm outline-none focus:border-indigo-500";

  return (
    <div className="mb-4 rounded-xl border border-indigo-200 bg-indigo-50/30 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex flex-1 items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
            {index + 1}
          </span>
          <input
            type="text"
            placeholder="마일스톤 제목 (예: 요구사항 정의 완료)"
            value={milestone.title}
            onChange={(e) => onUpdate(milestone.id, { title: e.target.value })}
            className="flex-1 border-b-2 border-gray-300 bg-transparent pb-1 text-base font-semibold outline-none focus:border-indigo-500"
          />
        </div>
        {total > 1 && (
          <button
            onClick={() => onRemove(milestone.id)}
            className="cursor-pointer text-sm text-red-400 transition-colors hover:text-red-600"
          >
            ✕ 삭제
          </button>
        )}
      </div>

      <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-700">기간</label>
          <div className="flex items-center gap-1">
            <input
              type="date"
              value={milestone.dateFrom}
              onChange={(e) => onUpdate(milestone.id, { dateFrom: e.target.value })}
              className="min-w-0 flex-1 rounded-md border border-gray-200 p-2 text-sm outline-none focus:border-indigo-500"
            />
            <span className="text-xs text-gray-400">~</span>
            <input
              type="date"
              value={milestone.dateTo}
              onChange={(e) => onUpdate(milestone.id, { dateTo: e.target.value })}
              className="min-w-0 flex-1 rounded-md border border-gray-200 p-2 text-sm outline-none focus:border-indigo-500"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-700">설명 (선택)</label>
          <input
            type="text"
            placeholder="마일스톤의 목적/맥락"
            value={milestone.description}
            onChange={(e) => onUpdate(milestone.id, { description: e.target.value })}
            className={inputClass}
          />
        </div>
      </div>

      <div className="rounded-lg bg-white p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-700">하위 작업</span>
          <button
            onClick={addTask}
            className="cursor-pointer rounded bg-indigo-600 px-2 py-1 text-[10px] text-white transition-colors hover:bg-indigo-700"
          >
            + 작업
          </button>
        </div>
        <div className="space-y-2">
          {milestone.tasks.map((task, idx) => (
            <PlanTaskRow
              key={task.id}
              task={task}
              index={idx}
              total={milestone.tasks.length}
              onChange={updateTaskField}
              onRemove={removeTask}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
