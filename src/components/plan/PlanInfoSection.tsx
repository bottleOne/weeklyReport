"use client";

interface PlanInfoSectionProps {
  title: string;
  teamName: string;
  authorName: string;
  createdDate: string;
  startDate: string;
  endDate: string;
  onChange: (field: string, value: string) => void;
}

export default function PlanInfoSection({
  title,
  teamName,
  authorName,
  createdDate,
  startDate,
  endDate,
  onChange,
}: PlanInfoSectionProps) {
  const inputClass =
    "w-full rounded-md border border-gray-200 p-2.5 text-sm transition-colors outline-none focus:border-indigo-500";

  return (
    <div className="mb-5 rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-center gap-2 rounded-lg bg-indigo-50 px-4 py-2.5 text-sm font-bold text-indigo-600">
        📋 기본 정보
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-gray-700">프로젝트명</label>
          <input
            type="text"
            placeholder="예: 비즈메카 인사 모듈 개편"
            value={title}
            onChange={(e) => onChange("title", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-700">팀명</label>
          <input
            type="text"
            placeholder="예: 개발2팀"
            value={teamName}
            onChange={(e) => onChange("teamName", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-700">작성자</label>
          <input
            type="text"
            placeholder="예: 전병일"
            value={authorName}
            onChange={(e) => onChange("authorName", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-700">작성일</label>
          <input
            type="date"
            value={createdDate}
            onChange={(e) => onChange("createdDate", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-700">전체 기간</label>
          <div className="flex items-center gap-1">
            <input
              type="date"
              value={startDate}
              onChange={(e) => onChange("startDate", e.target.value)}
              className="min-w-0 flex-1 rounded-md border border-gray-200 p-2 text-sm outline-none focus:border-indigo-500"
            />
            <span className="text-xs text-gray-400">~</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onChange("endDate", e.target.value)}
              className="min-w-0 flex-1 rounded-md border border-gray-200 p-2 text-sm outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
