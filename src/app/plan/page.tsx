"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import type { ProjectPlanData, Milestone } from "@/lib/plan-types";
import { createEmptyPlan, createEmptyMilestone, generatePlanFileName } from "@/lib/plan-types";
import { ProjectPlanDataSchema } from "@/lib/plan-schemas";
import { loadPersisted, clearPersisted, usePersistedState } from "@/hooks/usePersistedState";
import { generatePlanMarkdown } from "@/lib/generate-plan-markdown";
import PlanInfoSection from "@/components/plan/PlanInfoSection";
import PlanTextSection from "@/components/plan/PlanTextSection";
import MilestoneCard from "@/components/plan/MilestoneCard";
import PlanPreview from "@/components/plan/PlanPreview";

const STORAGE_KEY = "weeklyReport:planFormState:v1";
type DownloadType = "docx" | "pdf" | "md" | null;

const TEXT_FIELDS: { key: keyof ProjectPlanData; label: string; placeholder: string }[] = [
  { key: "background", label: "1. 배경 / 필요성", placeholder: "왜 이 프로젝트가 필요한가" },
  { key: "objective", label: "2. 목표", placeholder: "정량/정성 목표" },
  { key: "scope", label: "3. 범위", placeholder: "포함 / 제외 범위" },
  { key: "stakeholders", label: "4. 이해관계자", placeholder: "사용자, 결정권자, 협업팀" },
  { key: "deliverables", label: "5. 산출물", placeholder: "최종 결과물 목록" },
];

export default function PlanPage() {
  const [plan, setPlan] = useState<ProjectPlanData>(() => createEmptyPlan());
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

  // 디바운스 자동저장
  usePersistedState(STORAGE_KEY, plan);

  // 단일 update 헬퍼들
  const updateField = useCallback(
    <K extends keyof ProjectPlanData>(key: K, value: ProjectPlanData[K]) => {
      setPlan((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const updateMilestone = useCallback((id: string, updated: Partial<Milestone>) => {
    setPlan((prev) => ({
      ...prev,
      milestones: prev.milestones.map((m) => (m.id === id ? { ...m, ...updated } : m)),
    }));
  }, []);

  const addMilestone = useCallback(() => {
    setPlan((prev) => ({ ...prev, milestones: [...prev.milestones, createEmptyMilestone()] }));
  }, []);

  const removeMilestone = useCallback((id: string) => {
    setPlan((prev) =>
      prev.milestones.length <= 1
        ? prev
        : { ...prev, milestones: prev.milestones.filter((m) => m.id !== id) }
    );
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

  // ===== 다운로드 핸들러 =====
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
    <div className="mx-auto max-w-[1200px] p-6">
      {/* Header */}
      <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Link
              href="/"
              className="text-xs text-gray-500 transition-colors hover:text-indigo-600"
            >
              ← 주간보고서
            </Link>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">프로젝트 기획서</h1>
          <p className="text-sm text-gray-500">
            기초 기획서와 마일스톤+작업 일정을 작성하고 .docx / .pdf / .md로 다운로드하세요
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

      <PlanTextSection
        fields={TEXT_FIELDS.map((f) => ({
          key: f.key,
          label: f.label,
          placeholder: f.placeholder,
          value: plan[f.key] as string,
        }))}
        onChange={(key, value) =>
          updateField(key as keyof ProjectPlanData, value as ProjectPlanData[keyof ProjectPlanData])
        }
      />

      {/* Milestones */}
      <div className="mb-5 rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between rounded-lg bg-indigo-50 px-4 py-2.5 text-sm font-bold text-indigo-600">
          <span className="flex items-center gap-2">📅 6. 일정 (마일스톤 + 작업)</span>
          <button
            onClick={addMilestone}
            className="cursor-pointer rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700"
          >
            + 마일스톤 추가
          </button>
        </div>
        {plan.milestones.map((m, idx) => (
          <MilestoneCard
            key={m.id}
            milestone={m}
            index={idx}
            total={plan.milestones.length}
            onUpdate={updateMilestone}
            onRemove={removeMilestone}
          />
        ))}
      </div>

      {/* 리스크 / 기타 */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-indigo-50 px-4 py-2.5 text-sm font-bold text-indigo-600">
          ⚠️ 리스크 & 기타
        </div>
        <div className="mb-4">
          <label className="mb-1 block text-xs font-semibold text-gray-700">리스크</label>
          <textarea
            placeholder="예측 가능한 리스크와 대응 방안"
            value={plan.risks}
            onChange={(e) => updateField("risks", e.target.value)}
            className="min-h-[80px] w-full resize-y rounded-md border border-gray-200 p-2.5 text-sm outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-700">기타</label>
          <textarea
            placeholder="기타 사항"
            value={plan.etc}
            onChange={(e) => updateField("etc", e.target.value)}
            className="min-h-[80px] w-full resize-y rounded-md border border-gray-200 p-2.5 text-sm outline-none focus:border-indigo-500"
          />
        </div>
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
