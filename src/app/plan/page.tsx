"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import type {
  ProjectPlanData,
  PlanScheduleEntry,
  OpenQuestionItem,
  SuccessMetric,
  RiskItem,
  Stakeholder,
  PlanStatus,
} from "@/lib/plan-types";
import {
  createEmptyPlan,
  createEmptyOpenQuestion,
  createEmptySuccessMetric,
  createEmptyRisk,
  createEmptyStakeholder,
  createChangeLogEntry,
  createScheduleEntryFromRange,
  generatePlanFileName,
  PLAN_STATUS_LABEL,
} from "@/lib/plan-types";
import { ProjectPlanDataSchema } from "@/lib/plan-schemas";
import { loadPersisted, clearPersisted, usePersistedState } from "@/hooks/usePersistedState";
import { generatePlanMarkdown } from "@/lib/generate-plan-markdown";
import PlanInfoSection from "@/components/plan/PlanInfoSection";
import PlanTextSection from "@/components/plan/PlanTextSection";
import PlanNonGoalsSection from "@/components/plan/PlanNonGoalsSection";
import PlanOpenQuestionsSection from "@/components/plan/PlanOpenQuestionsSection";
import PlanNorthStarCard from "@/components/plan/PlanNorthStarCard";
import PlanMetricsSection from "@/components/plan/PlanMetricsSection";
import PlanRisksSection from "@/components/plan/PlanRisksSection";
import PlanStakeholdersSection from "@/components/plan/PlanStakeholdersSection";
import PlanStatusBar from "@/components/plan/PlanStatusBar";
import PlanChangeLogSection from "@/components/plan/PlanChangeLogSection";
import PlanToc, { type PlanTocItem } from "@/components/plan/PlanToc";
import PlanScheduleCalendar from "@/components/plan/PlanScheduleCalendar";
import PlanScheduleEntryCard from "@/components/plan/PlanScheduleEntryCard";
import PlanPreview from "@/components/plan/PlanPreview";

const STORAGE_KEY = "weeklyReport:planFormState:v2";
type DownloadType = "docx" | "pdf" | "md" | null;
type PlanTab = "plan" | "schedule";

// Phase 4 이후: 이해관계자는 헤더 영역(별도 카드)으로 빠짐. 본문은 4섹션.
// placeholder는 빈 폼 진입 시 작성 마찰을 줄이기 위해 구체 예시로 — Phase 6.
const TEXT_FIELDS: { key: keyof ProjectPlanData; label: string; placeholder: string }[] = [
  {
    key: "background",
    label: "1. 배경 / 필요성",
    placeholder:
      "예: 매주 보고서 작성에 평균 2시간 소요. 양식이 부서마다 달라 일관성 부족, 데이터 재가공도 반복됨.",
  },
  {
    key: "objective",
    label: "2. 목표",
    placeholder:
      "예: 보고서 작성 시간 평균 30분 이하로 단축\n- 표준 양식 1종 적용\n- 자동저장 + 다양한 포맷 다운로드",
  },
  {
    key: "scope",
    label: "3. 범위",
    placeholder:
      "포함: 주간보고서 작성/출력, 기획서 작성/출력, 일정 관리\n제외: 외부 인사 시스템 연동, 모바일 전용 화면",
  },
  {
    key: "deliverables",
    label: "4. 산출물",
    placeholder: "예: 설계서, REST API 명세서, 관리자/사용자 UI, 사용자 가이드 문서",
  },
];

const NAV_ITEMS: { key: PlanTab; label: string; icon: string; desc: string }[] = [
  { key: "plan", label: "기획서", icon: "📋", desc: "전체 기획 본문" },
  { key: "schedule", label: "일정 관리", icon: "📅", desc: "달력 + 세부 일정" },
];

// Phase 6 — 우측 sticky ToC 항목. 각 id는 page.tsx 안의 <section id="..."> 와 일치.
const TOC_ITEMS: PlanTocItem[] = [
  { id: "toc-info", label: "정보" },
  { id: "toc-stakeholders", label: "이해관계자" },
  { id: "toc-northstar", label: "🌟 North Star" },
  { id: "toc-metrics", label: "성공 지표" },
  { id: "toc-body", label: "본문 (1~4)" },
  { id: "toc-nongoals", label: "범위 외" },
  { id: "toc-openquestions", label: "미결사항" },
  { id: "toc-risks", label: "리스크" },
  { id: "toc-etc", label: "기타" },
  { id: "toc-changelog", label: "변경 이력" },
];

/** Date → YYYY-MM-DD (로컬 자정 기준). */
function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** YYYY-MM-DD → "2026년 4월 26일 (일)" 같은 한국어 헤더 표기. */
function formatDateForHeader(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return ymd;
  const date = new Date(y, m - 1, d);
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];
  return `${y}년 ${m}월 ${d}일 (${weekday})`;
}

/** target(YYYY-MM-DD)이 [from, to] 범위(YYYY-MM-DD 문자열) 안에 있는지. */
function isDateInRange(target: string, from: string, to: string): boolean {
  if (!from) return false;
  const end = to || from;
  const lo = from <= end ? from : end;
  const hi = from <= end ? end : from;
  return target >= lo && target <= hi;
}

export default function PlanPage() {
  const [plan, setPlan] = useState<ProjectPlanData>(() => createEmptyPlan());
  const [activeTab, setActiveTab] = useState<PlanTab>("plan");
  const [highlightedEntryId, setHighlightedEntryId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null); // YYYY-MM-DD
  // 사이드바 모드 결정: selectedEntryId 있으면 단일 일정 모드, 없고 selectedDate 있으면 그 날짜 전체 모드
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  // 새로 추가된 미결사항 id — 마운트 시 question input 자동 focus용. focused 후 null로 풀림.
  const [focusOpenQuestionId, setFocusOpenQuestionId] = useState<string | null>(null);
  // 새로 추가된 성공 지표 id — 마운트 시 name input 자동 focus.
  const [focusMetricId, setFocusMetricId] = useState<string | null>(null);
  // 새로 추가된 risk id — 마운트 시 description textarea 자동 focus.
  const [focusRiskId, setFocusRiskId] = useState<string | null>(null);
  // 새로 추가된 stakeholder id — 마운트 시 name input 자동 focus.
  const [focusStakeholderId, setFocusStakeholderId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [downloading, setDownloading] = useState<DownloadType>(null);

  // 마운트 시 localStorage 복원.
  // SSR 안전: 서버는 localStorage 없음 → 빈 폼 → 클라 마운트 후 복원.
  useEffect(() => {
    const persisted = loadPersisted(STORAGE_KEY, ProjectPlanDataSchema);
    if (!persisted) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 마운트 시 클라 전용 외부 상태(localStorage) 1회 복원
    setPlan(persisted);
    toast.info("이전 작성 내용을 불러왔습니다.");
  }, []);

  usePersistedState(STORAGE_KEY, plan);

  const updateField = useCallback(
    <K extends keyof ProjectPlanData>(key: K, value: ProjectPlanData[K]) => {
      setPlan((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleRangeCommit = useCallback((range: { from: Date; to: Date }) => {
    const dateFrom = formatLocalDate(range.from);
    const dateTo = formatLocalDate(range.to);
    const entry = createScheduleEntryFromRange(dateFrom, dateTo);
    setPlan((prev) => ({ ...prev, scheduleEntries: [...prev.scheduleEntries, entry] }));
    setSelectedDate(dateFrom);
    setSelectedEntryId(null); // 새 일정 추가는 그 날 전체 모드로
    toast.success(`기간 추가: ${dateFrom}${dateFrom !== dateTo ? ` ~ ${dateTo}` : ""}`);
  }, []);

  // 일정 띠 / 더보기 드롭다운 항목 클릭 시
  // - 제목이 비어있는 일정 → 그 자리에서 삭제 (사이드바 변화 없음)
  // - 제목이 있는 일정 → 단일 일정 모드 사이드바 열기
  const handleEntryClick = useCallback((entry: PlanScheduleEntry, cellDate: string) => {
    if (entry.title.trim() === "") {
      setPlan((prev) => ({
        ...prev,
        scheduleEntries: prev.scheduleEntries.filter((e) => e.id !== entry.id),
      }));
      setSelectedEntryId((cur) => (cur === entry.id ? null : cur));
      return;
    }
    setSelectedDate(cellDate);
    setSelectedEntryId(entry.id);
    setHighlightedEntryId(entry.id);
  }, []);

  // 일정 있는 셀의 빈 영역 클릭 시 — 그 날 전체 일정 모드
  const handleDayClick = useCallback((cellDate: string) => {
    setSelectedDate(cellDate);
    setSelectedEntryId(null);
  }, []);

  const updateEntry = useCallback((id: string, field: keyof PlanScheduleEntry, value: string) => {
    setPlan((prev) => ({
      ...prev,
      scheduleEntries: prev.scheduleEntries.map((e) =>
        e.id === id ? { ...e, [field]: value } : e
      ),
    }));
  }, []);

  const removeEntry = useCallback((id: string) => {
    setPlan((prev) => ({
      ...prev,
      scheduleEntries: prev.scheduleEntries.filter((e) => e.id !== id),
    }));
    // 단일 일정 모드에서 그 일정을 삭제하면 사이드바를 일자 전체 모드로 강등
    setSelectedEntryId((cur) => (cur === id ? null : cur));
  }, []);

  // ===== 미결사항 (Open Questions) =====
  const addOpenQuestion = useCallback(() => {
    const item = createEmptyOpenQuestion();
    setPlan((prev) => ({ ...prev, openQuestions: [...prev.openQuestions, item] }));
    setFocusOpenQuestionId(item.id);
  }, []);

  const updateOpenQuestion = useCallback((id: string, patch: Partial<OpenQuestionItem>) => {
    setPlan((prev) => ({
      ...prev,
      openQuestions: prev.openQuestions.map((q) => (q.id === id ? { ...q, ...patch } : q)),
    }));
  }, []);

  const removeOpenQuestion = useCallback((id: string) => {
    setPlan((prev) => ({
      ...prev,
      openQuestions: prev.openQuestions.filter((q) => q.id !== id),
    }));
  }, []);

  // ===== 성공 지표 (Success Metrics) =====
  const addMetric = useCallback(() => {
    const item = createEmptySuccessMetric();
    setPlan((prev) => ({ ...prev, successMetrics: [...prev.successMetrics, item] }));
    setFocusMetricId(item.id);
  }, []);

  const updateMetric = useCallback((id: string, patch: Partial<SuccessMetric>) => {
    setPlan((prev) => ({
      ...prev,
      successMetrics: prev.successMetrics.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    }));
  }, []);

  const removeMetric = useCallback((id: string) => {
    setPlan((prev) => ({
      ...prev,
      successMetrics: prev.successMetrics.filter((m) => m.id !== id),
    }));
  }, []);

  // ===== 리스크 (Risks) =====
  const addRisk = useCallback(() => {
    const item = createEmptyRisk();
    setPlan((prev) => ({ ...prev, risks: [...prev.risks, item] }));
    setFocusRiskId(item.id);
  }, []);

  const updateRisk = useCallback((id: string, patch: Partial<RiskItem>) => {
    setPlan((prev) => ({
      ...prev,
      risks: prev.risks.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));
  }, []);

  const removeRisk = useCallback((id: string) => {
    setPlan((prev) => ({
      ...prev,
      risks: prev.risks.filter((r) => r.id !== id),
    }));
  }, []);

  // ===== 이해관계자 (Stakeholders) =====
  const addStakeholder = useCallback(() => {
    const item = createEmptyStakeholder();
    setPlan((prev) => ({ ...prev, stakeholders: [...prev.stakeholders, item] }));
    setFocusStakeholderId(item.id);
  }, []);

  const updateStakeholder = useCallback((id: string, patch: Partial<Stakeholder>) => {
    setPlan((prev) => ({
      ...prev,
      stakeholders: prev.stakeholders.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  }, []);

  const removeStakeholder = useCallback((id: string) => {
    setPlan((prev) => ({
      ...prev,
      stakeholders: prev.stakeholders.filter((s) => s.id !== id),
    }));
  }, []);

  // 일정 entry assignee input의 datalist 옵션 — stakeholder 이름 중 비지 않은 것만
  const assigneeOptions = plan.stakeholders
    .map((s) => s.name.trim())
    .filter((name) => name.length > 0);

  // ===== 문서 상태 + 변경 이력 (Phase 5) =====
  // 상태 전환 시 changeLog에 자동 항목 추가. 이전 → 다음을 한 번에 setPlan으로 처리.
  const handleStatusChange = useCallback((next: PlanStatus) => {
    setPlan((prev) => {
      if (prev.status === next) return prev;
      const auto = createChangeLogEntry(
        prev.authorName || "-",
        `상태 변경: ${PLAN_STATUS_LABEL[prev.status]} → ${PLAN_STATUS_LABEL[next]}`
      );
      return {
        ...prev,
        status: next,
        changeLog: [...prev.changeLog, auto],
      };
    });
  }, []);

  const addChangeLog = useCallback((author: string, summary: string) => {
    const item = createChangeLogEntry(author, summary);
    setPlan((prev) => ({ ...prev, changeLog: [...prev.changeLog, item] }));
  }, []);

  const removeChangeLog = useCallback((id: string) => {
    setPlan((prev) => ({ ...prev, changeLog: prev.changeLog.filter((e) => e.id !== id) }));
  }, []);

  const resetForm = () => {
    toast("모든 입력 내용을 초기화하시겠습니까?", {
      action: {
        label: "초기화",
        onClick: () => {
          clearPersisted(STORAGE_KEY);
          setPlan(createEmptyPlan());
          setShowPreview(false);
        },
      },
    });
  };

  // ===== 다운로드 =====
  const handleDownloadDocx = async () => {
    setDownloading("docx");
    try {
      const res = await fetch("/api/generate-plan-docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(plan),
      });
      if (!res.ok) throw new Error("Failed to generate DOCX");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = generatePlanFileName(plan, "docx");
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      toast.error("DOCX 파일 생성 중 오류가 발생했습니다.");
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadPdf = async () => {
    setDownloading("pdf");
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");
      const element = document.getElementById("plan-preview-content");
      if (!element) throw new Error("Preview element not found");
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidthMm = pageWidth;
      const imgHeightMm = (canvas.height * imgWidthMm) / canvas.width;

      let heightLeft = imgHeightMm;
      let position = 0;
      pdf.addImage(imgData, "PNG", 0, position, imgWidthMm, imgHeightMm);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidthMm, imgHeightMm);
        heightLeft -= pageHeight;
      }
      pdf.save(generatePlanFileName(plan, "pdf"));
    } catch (error) {
      console.error(error);
      toast.error("PDF 파일 생성 중 오류가 발생했습니다.");
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadMarkdown = () => {
    setDownloading("md");
    try {
      const md = generatePlanMarkdown(plan);
      const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = generatePlanFileName(plan, "md");
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      toast.error("Markdown 파일 생성 중 오류가 발생했습니다.");
    } finally {
      setDownloading(null);
    }
  };

  // ============== PREVIEW MODE ==============
  if (showPreview) {
    return (
      <div className="mx-auto max-w-[1100px] p-6">
        <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => setShowPreview(false)}
            className="cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
          >
            ← 편집으로 돌아가기
          </button>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleDownloadDocx}
              disabled={downloading === "docx"}
              className="cursor-pointer rounded-lg bg-[#2b579a] px-4 py-2 text-sm text-white transition-colors hover:bg-[#1e3f6f] disabled:opacity-60"
            >
              {downloading === "docx" ? "⏳ 생성 중..." : "📄 .docx"}
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={downloading === "pdf"}
              className="cursor-pointer rounded-lg bg-[#d32f2f] px-4 py-2 text-sm text-white transition-colors hover:bg-[#b71c1c] disabled:opacity-60"
            >
              {downloading === "pdf" ? "⏳ 생성 중..." : "📕 .pdf"}
            </button>
            <button
              onClick={handleDownloadMarkdown}
              disabled={downloading === "md"}
              className="cursor-pointer rounded-lg bg-gray-700 px-4 py-2 text-sm text-white transition-colors hover:bg-gray-800 disabled:opacity-60"
            >
              {downloading === "md" ? "⏳ 생성 중..." : "📝 .md"}
            </button>
          </div>
        </div>
        <PlanPreview data={plan} />
      </div>
    );
  }

  // ============== EDIT MODE ==============
  return (
    <div className="mx-auto max-w-[1920px] p-6">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1
              className={`text-2xl font-extrabold text-gray-900 ${plan.status === "archived" ? "text-gray-400 line-through" : ""}`}
            >
              프로젝트 기획서
            </h1>
            <PlanStatusBar status={plan.status} onChange={handleStatusChange} />
          </div>
          <p className="text-sm text-gray-500">
            왼쪽에서 기획서/일정을 전환하며 작성, .docx / .pdf / .md로 다운로드
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={resetForm}
            className="cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-gray-50"
          >
            ↻ 초기화
          </button>
          <button
            onClick={() => setShowPreview(true)}
            className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            미리보기 →
          </button>
        </div>
      </div>

      {/* 좌측 nav + 메인 */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row">
        {/* 좌측 사이드바: 모드 전환 nav */}
        <aside className="w-full shrink-0 lg:w-[220px]">
          <nav
            aria-label="기획서 섹션"
            className="flex gap-2 rounded-xl border border-gray-200 bg-white p-2 lg:flex-col lg:gap-1"
          >
            {NAV_ITEMS.map((item) => {
              const active = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  aria-current={active ? "page" : undefined}
                  className={`flex-1 cursor-pointer rounded-lg px-3 py-2.5 text-left transition-colors lg:flex-none ${
                    active ? "bg-indigo-600 text-white shadow-sm" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  <div
                    className={`mt-0.5 hidden text-xs lg:block ${
                      active ? "text-indigo-100" : "text-gray-400"
                    }`}
                  >
                    {item.desc}
                  </div>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* 메인: 모드별 콘텐츠 */}
        <section className="min-w-0 flex-1">
          {activeTab === "plan" && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_220px]">
              <div className="min-w-0 space-y-4">
                <section id="toc-info" className="scroll-mt-4">
                  <PlanInfoSection
                    title={plan.title}
                    teamName={plan.teamName}
                    authorName={plan.authorName}
                    createdDate={plan.createdDate}
                    startDate={plan.startDate}
                    endDate={plan.endDate}
                    onChange={(field, value) =>
                      updateField(
                        field as keyof ProjectPlanData,
                        value as ProjectPlanData[keyof ProjectPlanData]
                      )
                    }
                  />
                </section>
                <section id="toc-stakeholders" className="scroll-mt-4">
                  <PlanStakeholdersSection
                    items={plan.stakeholders}
                    onAdd={addStakeholder}
                    onChange={updateStakeholder}
                    onRemove={removeStakeholder}
                    focusId={focusStakeholderId}
                    onFocused={() => setFocusStakeholderId(null)}
                  />
                </section>
                <section id="toc-northstar" className="scroll-mt-4">
                  <PlanNorthStarCard
                    value={plan.northStar}
                    onChange={(value) => updateField("northStar", value)}
                  />
                </section>
                <section id="toc-metrics" className="scroll-mt-4">
                  <PlanMetricsSection
                    items={plan.successMetrics}
                    onAdd={addMetric}
                    onChange={updateMetric}
                    onRemove={removeMetric}
                    focusId={focusMetricId}
                    onFocused={() => setFocusMetricId(null)}
                  />
                </section>
                <section id="toc-body" className="scroll-mt-4">
                  <PlanTextSection
                    fields={TEXT_FIELDS.map((f) => ({
                      key: f.key,
                      label: f.label,
                      placeholder: f.placeholder,
                      value: plan[f.key] as string,
                    }))}
                    onChange={(key, value) =>
                      updateField(
                        key as keyof ProjectPlanData,
                        value as ProjectPlanData[keyof ProjectPlanData]
                      )
                    }
                  />
                </section>
                <section id="toc-nongoals" className="scroll-mt-4">
                  <PlanNonGoalsSection
                    value={plan.nonGoals}
                    onChange={(value) => updateField("nonGoals", value)}
                  />
                </section>
                <section id="toc-openquestions" className="scroll-mt-4">
                  <PlanOpenQuestionsSection
                    items={plan.openQuestions}
                    onAdd={addOpenQuestion}
                    onChange={updateOpenQuestion}
                    onRemove={removeOpenQuestion}
                    focusId={focusOpenQuestionId}
                    onFocused={() => setFocusOpenQuestionId(null)}
                  />
                </section>
                <section id="toc-risks" className="scroll-mt-4">
                  <PlanRisksSection
                    items={plan.risks}
                    onAdd={addRisk}
                    onChange={updateRisk}
                    onRemove={removeRisk}
                    focusId={focusRiskId}
                    onFocused={() => setFocusRiskId(null)}
                  />
                </section>
                <section id="toc-etc" className="scroll-mt-4">
                  <div className="rounded-xl border border-gray-200 bg-white p-5">
                    <div className="mb-3 flex items-center gap-2 rounded-lg bg-indigo-50 px-4 py-2.5 text-sm font-bold text-indigo-600">
                      📝 기타
                    </div>
                    <textarea
                      placeholder="예: 후속 phase 아이디어, 의존 프로젝트, 참고 문서 링크 등"
                      value={plan.etc}
                      onChange={(e) => updateField("etc", e.target.value)}
                      className="min-h-[80px] w-full resize-y rounded-md border border-gray-200 p-2.5 text-sm outline-none focus:border-indigo-500"
                    />
                  </div>
                </section>
                <section id="toc-changelog" className="scroll-mt-4">
                  <PlanChangeLogSection
                    items={plan.changeLog}
                    defaultAuthor={plan.authorName || ""}
                    onAdd={addChangeLog}
                    onRemove={removeChangeLog}
                  />
                </section>
              </div>
              <PlanToc items={TOC_ITEMS} />
            </div>
          )}

          {activeTab === "schedule" && (
            <div className="flex flex-col gap-4 lg:flex-row">
              {/* 큰 달력 */}
              <div className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white p-4">
                <div className="mb-3 flex items-center gap-2 rounded-lg bg-indigo-50 px-4 py-2.5 text-sm font-bold text-indigo-600">
                  📅 달력
                  <span className="ml-auto text-xs font-normal text-indigo-500">
                    드래그로 추가, 일정 위 클릭으로 카드 이동
                  </span>
                </div>
                <div className="min-h-[600px] overflow-y-auto pr-2 lg:max-h-[calc(100vh-200px)]">
                  <PlanScheduleCalendar
                    entries={plan.scheduleEntries}
                    onRangeCommit={handleRangeCommit}
                    onEntryClick={handleEntryClick}
                    onDayClick={handleDayClick}
                    onEntryHover={setHighlightedEntryId}
                    highlightedEntryId={highlightedEntryId}
                  />
                </div>
              </div>

              {/* 오른쪽 사이드바: 단일 일정 모드(selectedEntryId) 또는 그날 전체(selectedDate) */}
              <aside className="w-full shrink-0 rounded-xl border border-gray-200 bg-white p-5 lg:w-[420px]">
                {(() => {
                  // 단일 일정 모드 — 선택된 entry 1개만 표시
                  if (selectedEntryId) {
                    const idx = plan.scheduleEntries.findIndex((e) => e.id === selectedEntryId);
                    const entry = idx >= 0 ? plan.scheduleEntries[idx] : null;
                    return (
                      <>
                        <div className="mb-3 flex items-center justify-between gap-2 rounded-lg bg-indigo-50 px-4 py-2.5 text-sm font-bold text-indigo-600">
                          <span className="flex items-center gap-2 truncate">
                            📌 {entry?.title || "일정 상세"}
                          </span>
                          <div className="flex items-center gap-1">
                            {selectedDate && (
                              <button
                                onClick={() => setSelectedEntryId(null)}
                                className="cursor-pointer rounded-md px-2 py-0.5 text-xs text-indigo-700 transition-colors hover:bg-white"
                                title="이 날짜의 모든 일정 보기"
                              >
                                ← 전체
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setSelectedEntryId(null);
                                setSelectedDate(null);
                              }}
                              className="cursor-pointer rounded-md px-2 py-0.5 text-xs text-indigo-700 transition-colors hover:bg-white"
                            >
                              ✕ 닫기
                            </button>
                          </div>
                        </div>
                        <div className="overflow-y-auto pr-1 lg:max-h-[calc(100vh-200px)]">
                          {entry ? (
                            <PlanScheduleEntryCard
                              entry={entry}
                              index={idx}
                              onChange={updateEntry}
                              onRemove={removeEntry}
                              onHover={setHighlightedEntryId}
                              assigneeOptions={assigneeOptions}
                            />
                          ) : (
                            <p className="py-16 text-center text-sm text-gray-400">
                              선택한 일정을 찾을 수 없습니다.
                            </p>
                          )}
                        </div>
                      </>
                    );
                  }

                  // 일자 전체 모드 — 그 날의 모든 일정 표시
                  return (
                    <>
                      <div className="mb-3 flex items-center justify-between gap-2 rounded-lg bg-indigo-50 px-4 py-2.5 text-sm font-bold text-indigo-600">
                        <span className="flex items-center gap-2">
                          📝 {selectedDate ? formatDateForHeader(selectedDate) : "세부 일정"}
                        </span>
                        {selectedDate && (
                          <button
                            onClick={() => setSelectedDate(null)}
                            className="cursor-pointer rounded-md px-2 py-0.5 text-xs text-indigo-700 transition-colors hover:bg-white"
                          >
                            ✕ 닫기
                          </button>
                        )}
                      </div>
                      <div className="overflow-y-auto pr-1 lg:max-h-[calc(100vh-200px)]">
                        {(() => {
                          if (!selectedDate) {
                            return (
                              <p className="py-16 text-center text-sm text-gray-400">
                                왼쪽 달력에서 일정 또는 날짜를 클릭하면
                                <br />
                                그날의 전체 일정이 나타납니다.
                              </p>
                            );
                          }
                          const entriesForDay = plan.scheduleEntries
                            .map((entry, originalIdx) => ({ entry, originalIdx }))
                            .filter(({ entry }) =>
                              isDateInRange(selectedDate, entry.dateFrom, entry.dateTo)
                            );
                          if (entriesForDay.length === 0) {
                            return (
                              <p className="py-16 text-center text-sm text-gray-400">
                                이 날짜에 등록된 일정이 없습니다.
                              </p>
                            );
                          }
                          return (
                            <div className="space-y-3">
                              <p className="px-1 text-xs text-gray-500">
                                총 {entriesForDay.length}개의 일정
                              </p>
                              {entriesForDay.map(({ entry, originalIdx }) => (
                                <PlanScheduleEntryCard
                                  key={entry.id}
                                  entry={entry}
                                  index={originalIdx}
                                  onChange={updateEntry}
                                  onRemove={removeEntry}
                                  onHover={setHighlightedEntryId}
                                  assigneeOptions={assigneeOptions}
                                />
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    </>
                  );
                })()}
              </aside>
            </div>
          )}
        </section>
      </div>

      <div className="flex justify-center py-4">
        <button
          onClick={() => setShowPreview(true)}
          className="cursor-pointer rounded-lg bg-indigo-600 px-7 py-3 text-base font-semibold text-white transition-colors hover:bg-indigo-700"
        >
          미리보기 & 다운로드 →
        </button>
      </div>
    </div>
  );
}
