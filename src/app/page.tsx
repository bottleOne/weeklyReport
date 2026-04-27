"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import type { TaskItem, ContentLine, MemberData, ReportData, ReportMode } from "@/lib/types";
import { createEmptyTask, createEmptyMember, generateFileName, getTodayLocal } from "@/lib/types";
import {
  loadPersistedReport,
  clearPersistedReport,
  usePersistReport,
} from "@/hooks/useFormPersistence";
import TaskCard from "@/components/TaskCard";
import MemberCard from "@/components/MemberCard";
import PreviewTable from "@/components/PreviewTable";
import MetaSection from "@/components/MetaSection";

type DownloadType = "docx" | "pdf" | null;

export default function Home() {
  const [mode, setMode] = useState<ReportMode>("employee");
  const [meetingDate, setMeetingDate] = useState(getTodayLocal());
  const [teamName, setTeamName] = useState("");
  const [authorName, setAuthorName] = useState("");

  // 사원 모드
  const [thisWeekTasks, setThisWeekTasks] = useState<TaskItem[]>([createEmptyTask()]);
  const [nextWeekTasks, setNextWeekTasks] = useState<TaskItem[]>([createEmptyTask()]);

  // 팀장 모드
  const [members, setMembers] = useState<MemberData[]>([createEmptyMember()]);

  // 금주 메타
  const [targetBusiness, setTargetBusiness] = useState("");
  const [requestTeam, setRequestTeam] = useState("");
  const [devPeriodFrom, setDevPeriodFrom] = useState("");
  const [devPeriodTo, setDevPeriodTo] = useState("");
  // 차주 메타
  const [nextTargetBusiness, setNextTargetBusiness] = useState("");
  const [nextRequestTeam, setNextRequestTeam] = useState("");
  const [nextDevPeriodFrom, setNextDevPeriodFrom] = useState("");
  const [nextDevPeriodTo, setNextDevPeriodTo] = useState("");
  // 금주 주요이슈/기타
  const [issues, setIssues] = useState("");
  const [etc, setEtc] = useState("");
  // 차주 주요이슈/기타
  const [nextIssues, setNextIssues] = useState("");
  const [nextEtc, setNextEtc] = useState("");

  const [showPreview, setShowPreview] = useState(false);
  const [downloading, setDownloading] = useState<DownloadType>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 마운트 시 localStorage에서 폼 상태 복원.
  // SSR 안전: 서버는 localStorage 없음 → 빈 폼 → 클라 마운트 후 복원.
  // 17개 setState 호출은 page.tsx 분해 시 단일 state 객체로 통합 예정.
  useEffect(() => {
    const persisted = loadPersistedReport();
    if (!persisted) return;
    /* eslint-disable react-hooks/set-state-in-effect -- 마운트 시 클라 전용 외부 상태(localStorage) 1회 복원 */
    setMode(persisted.mode);
    setMeetingDate(persisted.meetingDate || getTodayLocal());
    setTeamName(persisted.teamName);
    setAuthorName(persisted.authorName);
    setThisWeekTasks(
      persisted.thisWeekTasks.length > 0 ? persisted.thisWeekTasks : [createEmptyTask()]
    );
    setNextWeekTasks(
      persisted.nextWeekTasks.length > 0 ? persisted.nextWeekTasks : [createEmptyTask()]
    );
    setMembers(persisted.members.length > 0 ? persisted.members : [createEmptyMember()]);
    setTargetBusiness(persisted.targetBusiness);
    setRequestTeam(persisted.requestTeam);
    setDevPeriodFrom(persisted.devPeriodFrom);
    setDevPeriodTo(persisted.devPeriodTo);
    setNextTargetBusiness(persisted.nextTargetBusiness);
    setNextRequestTeam(persisted.nextRequestTeam);
    setNextDevPeriodFrom(persisted.nextDevPeriodFrom);
    setNextDevPeriodTo(persisted.nextDevPeriodTo);
    setIssues(persisted.issues);
    setEtc(persisted.etc);
    setNextIssues(persisted.nextIssues);
    setNextEtc(persisted.nextEtc);
    /* eslint-enable react-hooks/set-state-in-effect */
    toast.info("이전 작성 내용을 불러왔습니다.");
  }, []);

  const reportData: ReportData = {
    mode,
    meetingDate,
    teamName,
    authorName,
    thisWeekTasks,
    nextWeekTasks,
    members,
    targetBusiness,
    requestTeam,
    devPeriodFrom,
    devPeriodTo,
    nextTargetBusiness,
    nextRequestTeam,
    nextDevPeriodFrom,
    nextDevPeriodTo,
    issues,
    etc,
    nextIssues,
    nextEtc,
  };

  // 폼 변경 시 디바운스(500ms) 자동 저장
  usePersistReport(reportData);

  // ==================== 사원 모드 핸들러 ====================
  const updateThisWeekField = useCallback((id: string, field: string, value: string) => {
    setThisWeekTasks((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  }, []);
  const updateThisWeekContentLines = useCallback((id: string, lines: ContentLine[]) => {
    setThisWeekTasks((prev) => prev.map((t) => (t.id === id ? { ...t, contentLines: lines } : t)));
  }, []);
  const addThisWeekTask = useCallback(() => {
    setThisWeekTasks((prev) => [...prev, createEmptyTask()]);
  }, []);
  const removeThisWeekTask = useCallback((id: string) => {
    setThisWeekTasks((prev) => (prev.length <= 1 ? prev : prev.filter((t) => t.id !== id)));
  }, []);

  const updateNextWeekField = useCallback((id: string, field: string, value: string) => {
    setNextWeekTasks((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  }, []);
  const updateNextWeekContentLines = useCallback((id: string, lines: ContentLine[]) => {
    setNextWeekTasks((prev) => prev.map((t) => (t.id === id ? { ...t, contentLines: lines } : t)));
  }, []);
  const addNextWeekTask = useCallback(() => {
    setNextWeekTasks((prev) => [...prev, createEmptyTask()]);
  }, []);
  const removeNextWeekTask = useCallback((id: string) => {
    setNextWeekTasks((prev) => (prev.length <= 1 ? prev : prev.filter((t) => t.id !== id)));
  }, []);

  // ==================== 메타 핸들러 ====================
  const handleThisMetaChange = useCallback((field: string, value: string) => {
    switch (field) {
      case "targetBusiness":
        setTargetBusiness(value);
        break;
      case "requestTeam":
        setRequestTeam(value);
        break;
      case "devPeriodFrom":
        setDevPeriodFrom(value);
        break;
      case "devPeriodTo":
        setDevPeriodTo(value);
        break;
    }
  }, []);
  const handleNextMetaChange = useCallback((field: string, value: string) => {
    switch (field) {
      case "targetBusiness":
        setNextTargetBusiness(value);
        break;
      case "requestTeam":
        setNextRequestTeam(value);
        break;
      case "devPeriodFrom":
        setNextDevPeriodFrom(value);
        break;
      case "devPeriodTo":
        setNextDevPeriodTo(value);
        break;
    }
  }, []);

  // ==================== 팀장 모드 핸들러 ====================
  const addMember = useCallback(() => {
    setMembers((prev) => [...prev, createEmptyMember()]);
  }, []);
  const removeMember = useCallback((id: string) => {
    setMembers((prev) => (prev.length <= 1 ? prev : prev.filter((m) => m.id !== id)));
  }, []);
  const updateMember = useCallback((id: string, updated: Partial<MemberData>) => {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...updated } : m)));
  }, []);

  // ==================== 공통 핸들러 ====================
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

      setMeetingDate(data.meetingDate || getTodayLocal());
      setTeamName(data.teamName || "");
      setAuthorName(data.authorName || "");
      setMode(data.mode || "employee");

      if (data.mode === "leader" && data.members?.length > 0) {
        setMembers(data.members);
      } else {
        setThisWeekTasks(data.thisWeekTasks);
        setNextWeekTasks(data.nextWeekTasks);
      }

      setTargetBusiness(data.targetBusiness || "");
      setRequestTeam(data.requestTeam || "");
      setDevPeriodFrom(data.devPeriodFrom || "");
      setDevPeriodTo(data.devPeriodTo || "");
      setNextTargetBusiness(data.nextTargetBusiness || "");
      setNextRequestTeam(data.nextRequestTeam || "");
      setNextDevPeriodFrom(data.nextDevPeriodFrom || "");
      setNextDevPeriodTo(data.nextDevPeriodTo || "");
      setIssues(data.issues || "");
      setEtc(data.etc || "");
      setNextIssues(data.nextIssues || "");
      setNextEtc(data.nextEtc || "");

      toast.success("이전 보고서를 불러왔습니다. 내용을 확인하고 수정해주세요.");
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

  const resetForm = () => {
    toast("모든 입력 내용을 초기화하시겠습니까?", {
      action: {
        label: "초기화",
        onClick: () => {
          clearPersistedReport();
          setMeetingDate(getTodayLocal());
          setTeamName("");
          setAuthorName("");
          setThisWeekTasks([createEmptyTask()]);
          setNextWeekTasks([createEmptyTask()]);
          setMembers([createEmptyMember()]);
          setTargetBusiness("");
          setRequestTeam("");
          setDevPeriodFrom("");
          setDevPeriodTo("");
          setNextTargetBusiness("");
          setNextRequestTeam("");
          setNextDevPeriodFrom("");
          setNextDevPeriodTo("");
          setIssues("");
          setEtc("");
          setNextIssues("");
          setNextEtc("");
          setShowPreview(false);
        },
      },
    });
  };

  const handleDownloadDocx = async () => {
    setDownloading("docx");
    try {
      const res = await fetch("/api/generate-docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportData),
      });
      if (!res.ok) throw new Error("Failed to generate DOCX");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = generateFileName(reportData, "docx");
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
      const element = document.getElementById("preview-content");
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

      // 다중 페이지: 같은 이미지를 음수 y-offset으로 반복 배치하면
      // PDF가 페이지 경계 밖을 자동 클립해서 페이지 분할 효과.
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

      pdf.save(generateFileName(reportData, "pdf"));
    } catch (error) {
      console.error(error);
      toast.error("PDF 파일 생성 중 오류가 발생했습니다.");
    } finally {
      setDownloading(null);
    }
  };

  // ==================== PREVIEW MODE ====================
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
              {downloading === "docx" ? "⏳ 생성 중..." : "📄 .docx 다운로드"}
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={downloading === "pdf"}
              className="cursor-pointer rounded-lg bg-[#d32f2f] px-4 py-2 text-sm text-white transition-colors hover:bg-[#b71c1c] disabled:opacity-60"
            >
              {downloading === "pdf" ? "⏳ 생성 중..." : "📕 .pdf 다운로드"}
            </button>
          </div>
        </div>
        <PreviewTable data={reportData} />
        <p className="no-print mt-4 text-center text-xs text-gray-400">
          미리보기 화면입니다. 다운로드 버튼을 클릭하면 원본 양식과 동일한 파일이 생성됩니다.
        </p>
      </div>
    );
  }

  // ==================== EDIT MODE ====================
  return (
    <div className="mx-auto max-w-[1800px] p-6">
      {/* Header */}
      <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="mb-1 text-2xl font-extrabold text-gray-900">주간업무 보고서</h1>
          <p className="text-sm text-gray-500">
            웹에서 간편하게 작성하고, .docx / .pdf 파일로 다운로드하세요
          </p>
        </div>
        <div className="flex gap-2">
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
            className="cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-60"
          >
            {uploading ? "⏳ 불러오는 중..." : "📂 이전 보고서 불러오기"}
          </button>
          <button
            onClick={resetForm}
            className="cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-gray-50"
          >
            ↻ 초기화
          </button>
          <button
            onClick={() => setShowPreview(true)}
            className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            미리보기 →
          </button>
        </div>
      </div>

      {/* 양식 전환 토글 */}
      <div className="mb-5 flex justify-center">
        <div className="inline-flex rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => setMode("employee")}
            className={`cursor-pointer rounded-md px-5 py-2 text-sm font-medium transition-colors ${
              mode === "employee"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            사원 양식
          </button>
          <button
            onClick={() => setMode("leader")}
            className={`cursor-pointer rounded-md px-5 py-2 text-sm font-medium transition-colors ${
              mode === "leader"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            팀장 양식
          </button>
        </div>
      </div>

      {/* 기본 정보 */}
      <div className="mb-5 rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-600">
          📋 기본 정보
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700">회의기준일</label>
            <input
              type="date"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              className="w-full rounded-md border border-gray-200 p-2.5 text-sm transition-colors outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700">팀명</label>
            <input
              type="text"
              placeholder="예: 개발2팀"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full rounded-md border border-gray-200 p-2.5 text-sm transition-colors outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700">
              {mode === "employee" ? "이름" : "팀장 이름"}
            </label>
            <input
              type="text"
              placeholder={mode === "employee" ? "예: 전병일" : "예: 홍길동"}
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-full rounded-md border border-gray-200 p-2.5 text-sm transition-colors outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* ====== 사원 모드 ====== */}
      {mode === "employee" && (
        <>
          <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* 금주 실적 */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="mb-4 flex items-center justify-between rounded-lg bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-600">
                <span className="flex items-center gap-2">📝 금주 실적</span>
                <button
                  onClick={addThisWeekTask}
                  className="cursor-pointer rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
                >
                  + 업무 추가
                </button>
              </div>
              {thisWeekTasks.map((task, idx) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={idx}
                  total={thisWeekTasks.length}
                  accentColor="blue"
                  placeholderContent="수행한 업무 내용 입력"
                  onChangeField={updateThisWeekField}
                  onChangeContentLines={updateThisWeekContentLines}
                  onRemove={removeThisWeekTask}
                />
              ))}

              <div className="mt-2 border-t border-gray-200 pt-4">
                <MetaSection
                  values={{ targetBusiness, requestTeam, devPeriodFrom, devPeriodTo }}
                  accent="blue"
                  onChange={handleThisMetaChange}
                />
              </div>
            </div>

            {/* 차주 계획 */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="mb-4 flex items-center justify-between rounded-lg bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-600">
                <span className="flex items-center gap-2">📅 차주 계획</span>
                <button
                  onClick={addNextWeekTask}
                  className="cursor-pointer rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
                >
                  + 업무 추가
                </button>
              </div>
              {nextWeekTasks.map((task, idx) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={idx}
                  total={nextWeekTasks.length}
                  accentColor="emerald"
                  placeholderContent="다음 주 예정 업무 입력"
                  onChangeField={updateNextWeekField}
                  onChangeContentLines={updateNextWeekContentLines}
                  onRemove={removeNextWeekTask}
                />
              ))}

              <div className="mt-2 border-t border-gray-200 pt-4">
                <MetaSection
                  values={{
                    targetBusiness: nextTargetBusiness,
                    requestTeam: nextRequestTeam,
                    devPeriodFrom: nextDevPeriodFrom,
                    devPeriodTo: nextDevPeriodTo,
                  }}
                  accent="emerald"
                  onChange={handleNextMetaChange}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* ====== 팀장 모드 ====== */}
      {mode === "leader" && (
        <div className="mb-5">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between rounded-lg bg-indigo-50 px-4 py-2.5 text-sm font-bold text-indigo-600">
              <span className="flex items-center gap-2">👥 팀원별 업무</span>
              <button
                onClick={addMember}
                className="cursor-pointer rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700"
              >
                + 팀원 추가
              </button>
            </div>
            {members.map((member, idx) => (
              <MemberCard
                key={member.id}
                member={member}
                index={idx}
                total={members.length}
                onUpdate={updateMember}
                onRemove={removeMember}
              />
            ))}

            <div className="mt-2 grid grid-cols-1 gap-4 border-t border-gray-200 pt-4 lg:grid-cols-2">
              <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4">
                <span className="mb-3 block text-xs font-bold text-blue-600">금주 실적</span>
                <MetaSection
                  values={{ targetBusiness, requestTeam, devPeriodFrom, devPeriodTo }}
                  accent="blue"
                  onChange={handleThisMetaChange}
                />
              </div>
              <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-4">
                <span className="mb-3 block text-xs font-bold text-emerald-600">차주 계획</span>
                <MetaSection
                  values={{
                    targetBusiness: nextTargetBusiness,
                    requestTeam: nextRequestTeam,
                    devPeriodFrom: nextDevPeriodFrom,
                    devPeriodTo: nextDevPeriodTo,
                  }}
                  accent="emerald"
                  onChange={handleNextMetaChange}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 주요이슈 & 기타 */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-600">
          💡 주요이슈 & 기타
        </div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* 좌: 금주 실적 */}
          <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4">
            <span className="mb-3 block text-xs font-bold text-blue-600">금주 실적</span>
            <div className="mb-3">
              <label className="mb-1 block text-xs font-semibold text-gray-700">주요이슈</label>
              <textarea
                placeholder="이번 주 주요 이슈 사항을 입력하세요"
                value={issues}
                onChange={(e) => setIssues(e.target.value)}
                className="min-h-[80px] w-full resize-y rounded-md border border-gray-200 bg-white p-2.5 text-sm transition-colors outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">기타</label>
              <textarea
                placeholder="기타 사항을 입력하세요"
                value={etc}
                onChange={(e) => setEtc(e.target.value)}
                className="min-h-[80px] w-full resize-y rounded-md border border-gray-200 bg-white p-2.5 text-sm transition-colors outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* 우: 차주 계획 */}
          <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-4">
            <span className="mb-3 block text-xs font-bold text-emerald-600">차주 계획</span>
            <div className="mb-3">
              <label className="mb-1 block text-xs font-semibold text-gray-700">주요이슈</label>
              <textarea
                placeholder="다음 주 예상 이슈 사항을 입력하세요"
                value={nextIssues}
                onChange={(e) => setNextIssues(e.target.value)}
                className="min-h-[80px] w-full resize-y rounded-md border border-gray-200 bg-white p-2.5 text-sm transition-colors outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">기타</label>
              <textarea
                placeholder="다음 주 기타 계획을 입력하세요"
                value={nextEtc}
                onChange={(e) => setNextEtc(e.target.value)}
                className="min-h-[80px] w-full resize-y rounded-md border border-gray-200 bg-white p-2.5 text-sm transition-colors outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="flex justify-center py-4">
        <button
          onClick={() => setShowPreview(true)}
          className="cursor-pointer rounded-lg bg-blue-600 px-7 py-3 text-base font-semibold text-white transition-colors hover:bg-blue-700"
        >
          미리보기 & 다운로드 →
        </button>
      </div>
      <p className="mt-2 mb-8 text-center text-xs text-gray-400">
        작성 후 &apos;미리보기&apos;에서 원본 양식과 동일한 .docx 또는 .pdf로 다운로드할 수
        있습니다.
      </p>
    </div>
  );
}
