"use client";

import { useState, useCallback, useRef } from "react";
import type {
  TaskItem,
  ContentLine,
  MemberData,
  ReportData,
  ReportMode,
} from "@/lib/types";
import {
  createEmptyTask,
  createEmptyMember,
  generateFileName,
} from "@/lib/types";
import TaskCard from "@/components/TaskCard";
import MemberCard from "@/components/MemberCard";
import PreviewTable from "@/components/PreviewTable";

type DownloadType = "docx" | "pdf" | null;

export default function Home() {
  const [mode, setMode] = useState<ReportMode>("employee");
  const [meetingDate, setMeetingDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [teamName, setTeamName] = useState("");
  const [authorName, setAuthorName] = useState("");

  // 사원 모드
  const [thisWeekTasks, setThisWeekTasks] = useState<TaskItem[]>([
    createEmptyTask(),
  ]);
  const [nextWeekTasks, setNextWeekTasks] = useState<TaskItem[]>([
    createEmptyTask(),
  ]);

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
  // 공통
  const [issues, setIssues] = useState("");
  const [etc, setEtc] = useState("");

  const [showPreview, setShowPreview] = useState(false);
  const [downloading, setDownloading] = useState<DownloadType>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  };

  // ==================== 사원 모드 핸들러 ====================
  const updateThisWeekField = useCallback(
    (id: number, field: string, value: string) => {
      setThisWeekTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
      );
    },
    []
  );
  const updateThisWeekContentLines = useCallback(
    (id: number, lines: ContentLine[]) => {
      setThisWeekTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, contentLines: lines } : t))
      );
    },
    []
  );
  const addThisWeekTask = useCallback(() => {
    setThisWeekTasks((prev) => [...prev, createEmptyTask()]);
  }, []);
  const removeThisWeekTask = useCallback((id: number) => {
    setThisWeekTasks((prev) =>
      prev.length <= 1 ? prev : prev.filter((t) => t.id !== id)
    );
  }, []);

  const updateNextWeekField = useCallback(
    (id: number, field: string, value: string) => {
      setNextWeekTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
      );
    },
    []
  );
  const updateNextWeekContentLines = useCallback(
    (id: number, lines: ContentLine[]) => {
      setNextWeekTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, contentLines: lines } : t))
      );
    },
    []
  );
  const addNextWeekTask = useCallback(() => {
    setNextWeekTasks((prev) => [...prev, createEmptyTask()]);
  }, []);
  const removeNextWeekTask = useCallback((id: number) => {
    setNextWeekTasks((prev) =>
      prev.length <= 1 ? prev : prev.filter((t) => t.id !== id)
    );
  }, []);

  // ==================== 팀장 모드 핸들러 ====================
  const addMember = useCallback(() => {
    setMembers((prev) => [...prev, createEmptyMember()]);
  }, []);
  const removeMember = useCallback((id: number) => {
    setMembers((prev) =>
      prev.length <= 1 ? prev : prev.filter((m) => m.id !== id)
    );
  }, []);
  const updateMember = useCallback(
    (id: number, updated: Partial<MemberData>) => {
      setMembers((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...updated } : m))
      );
    },
    []
  );

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

      setMeetingDate(
        data.meetingDate || new Date().toISOString().split("T")[0]
      );
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

      alert("이전 보고서를 불러왔습니다. 내용을 확인하고 수정해주세요.");
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

  const resetForm = () => {
    if (confirm("모든 입력 내용을 초기화하시겠습니까?")) {
      setMeetingDate(new Date().toISOString().split("T")[0]);
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
      setShowPreview(false);
    }
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
      alert("DOCX 파일 생성 중 오류가 발생했습니다.");
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
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(generateFileName(reportData, "pdf"));
    } catch (error) {
      console.error(error);
      alert("PDF 파일 생성 중 오류가 발생했습니다.");
    } finally {
      setDownloading(null);
    }
  };

  // ==================== PREVIEW MODE ====================
  if (showPreview) {
    return (
      <div className="max-w-[1100px] mx-auto p-6">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3 no-print">
          <button
            onClick={() => setShowPreview(false)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm cursor-pointer"
          >
            ← 편집으로 돌아가기
          </button>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handleDownloadDocx}
              disabled={downloading === "docx"}
              className="px-4 py-2 bg-[#2b579a] text-white rounded-lg hover:bg-[#1e3f6f] transition-colors text-sm disabled:opacity-60 cursor-pointer"
            >
              {downloading === "docx" ? "⏳ 생성 중..." : "📄 .docx 다운로드"}
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={downloading === "pdf"}
              className="px-4 py-2 bg-[#d32f2f] text-white rounded-lg hover:bg-[#b71c1c] transition-colors text-sm disabled:opacity-60 cursor-pointer"
            >
              {downloading === "pdf" ? "⏳ 생성 중..." : "📕 .pdf 다운로드"}
            </button>
          </div>
        </div>
        <PreviewTable data={reportData} />
        <p className="text-center text-gray-400 text-xs mt-4 no-print">
          미리보기 화면입니다. 다운로드 버튼을 클릭하면 원본 양식과 동일한 파일이
          생성됩니다.
        </p>
      </div>
    );
  }

  // ==================== EDIT MODE ====================
  return (
    <div className="max-w-[1800px] mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-7 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-1">
            주간업무 보고서
          </h1>
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
            className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors text-sm cursor-pointer disabled:opacity-60"
          >
            {uploading ? "⏳ 불러오는 중..." : "📂 이전 보고서 불러오기"}
          </button>
          <button
            onClick={resetForm}
            className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors text-sm cursor-pointer"
          >
            ↻ 초기화
          </button>
          <button
            onClick={() => setShowPreview(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium cursor-pointer"
          >
            미리보기 →
          </button>
        </div>
      </div>

      {/* 양식 전환 토글 */}
      <div className="flex justify-center mb-5">
        <div className="inline-flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setMode("employee")}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
              mode === "employee"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            사원 양식
          </button>
          <button
            onClick={() => setMode("leader")}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
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
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
        <div className="text-sm font-bold text-blue-600 bg-blue-50 rounded-lg px-4 py-2.5 mb-4 flex items-center gap-2">
          📋 기본 정보
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block">
              회의기준일
            </label>
            <input
              type="date"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              className="w-full p-2.5 border border-gray-200 rounded-md text-sm focus:border-blue-500 outline-none transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block">
              팀명
            </label>
            <input
              type="text"
              placeholder="예: 개발2팀"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full p-2.5 border border-gray-200 rounded-md text-sm focus:border-blue-500 outline-none transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block">
              {mode === "employee" ? "이름" : "팀장 이름"}
            </label>
            <input
              type="text"
              placeholder={
                mode === "employee" ? "예: 전병일" : "예: 홍길동"
              }
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-full p-2.5 border border-gray-200 rounded-md text-sm focus:border-blue-500 outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* ====== 사원 모드 ====== */}
      {mode === "employee" && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            {/* 금주 실적 */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-sm font-bold text-blue-600 bg-blue-50 rounded-lg px-4 py-2.5 mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2">📝 금주 실적</span>
                <button
                  onClick={addThisWeekTask}
                  className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors font-medium cursor-pointer"
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

              {/* 대상업무 / 의뢰팀 / 개발기간 */}
              <div className="border-t border-gray-200 pt-4 mt-2">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 mb-1 block">
                      대상업무
                    </label>
                    <input
                      type="text"
                      placeholder="예: kt비즈메카"
                      value={targetBusiness}
                      onChange={(e) => setTargetBusiness(e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded-md text-sm focus:border-blue-500 outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 mb-1 block">
                      의뢰팀
                    </label>
                    <input
                      type="text"
                      placeholder="예: 기획팀"
                      value={requestTeam}
                      onChange={(e) => setRequestTeam(e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded-md text-sm focus:border-blue-500 outline-none transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">
                    개발기간
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="date"
                      value={devPeriodFrom}
                      onChange={(e) => setDevPeriodFrom(e.target.value)}
                      className="flex-1 p-2 border border-gray-200 rounded-md text-sm focus:border-blue-500 outline-none transition-colors min-w-0"
                    />
                    <span className="text-gray-400 text-xs">~</span>
                    <input
                      type="date"
                      value={devPeriodTo}
                      onChange={(e) => setDevPeriodTo(e.target.value)}
                      className="flex-1 p-2 border border-gray-200 rounded-md text-sm focus:border-blue-500 outline-none transition-colors min-w-0"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 차주 계획 */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-sm font-bold text-emerald-600 bg-emerald-50 rounded-lg px-4 py-2.5 mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2">📅 차주 계획</span>
                <button
                  onClick={addNextWeekTask}
                  className="bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-md hover:bg-emerald-700 transition-colors font-medium cursor-pointer"
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

              {/* 차주 대상업무 / 의뢰팀 / 개발기간 */}
              <div className="border-t border-gray-200 pt-4 mt-2">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 mb-1 block">
                      대상업무
                    </label>
                    <input
                      type="text"
                      placeholder="예: kt비즈메카"
                      value={nextTargetBusiness}
                      onChange={(e) => setNextTargetBusiness(e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded-md text-sm focus:border-emerald-500 outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 mb-1 block">
                      의뢰팀
                    </label>
                    <input
                      type="text"
                      placeholder="예: 기획팀"
                      value={nextRequestTeam}
                      onChange={(e) => setNextRequestTeam(e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded-md text-sm focus:border-emerald-500 outline-none transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">
                    개발기간
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="date"
                      value={nextDevPeriodFrom}
                      onChange={(e) => setNextDevPeriodFrom(e.target.value)}
                      className="flex-1 p-2 border border-gray-200 rounded-md text-sm focus:border-emerald-500 outline-none transition-colors min-w-0"
                    />
                    <span className="text-gray-400 text-xs">~</span>
                    <input
                      type="date"
                      value={nextDevPeriodTo}
                      onChange={(e) => setNextDevPeriodTo(e.target.value)}
                      className="flex-1 p-2 border border-gray-200 rounded-md text-sm focus:border-emerald-500 outline-none transition-colors min-w-0"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ====== 팀장 모드 ====== */}
      {mode === "leader" && (
        <div className="mb-5">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-sm font-bold text-indigo-600 bg-indigo-50 rounded-lg px-4 py-2.5 mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">👥 팀원별 업무</span>
              <button
                onClick={addMember}
                className="bg-indigo-600 text-white text-xs px-3 py-1.5 rounded-md hover:bg-indigo-700 transition-colors font-medium cursor-pointer"
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

            {/* 금주/차주 대상업무/의뢰팀/개발기간 */}
            <div className="border-t border-gray-200 pt-4 mt-2 grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* 금주 메타 */}
              <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-100">
                <span className="text-xs font-bold text-blue-600 mb-3 block">금주 실적</span>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 mb-1 block">대상업무</label>
                    <input type="text" placeholder="예: kt비즈메카" value={targetBusiness} onChange={(e) => setTargetBusiness(e.target.value)} className="w-full p-2 border border-gray-200 rounded-md text-sm focus:border-blue-500 outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 mb-1 block">의뢰팀</label>
                    <input type="text" placeholder="예: 기획팀" value={requestTeam} onChange={(e) => setRequestTeam(e.target.value)} className="w-full p-2 border border-gray-200 rounded-md text-sm focus:border-blue-500 outline-none transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">개발기간</label>
                  <div className="flex items-center gap-1">
                    <input type="date" value={devPeriodFrom} onChange={(e) => setDevPeriodFrom(e.target.value)} className="flex-1 p-2 border border-gray-200 rounded-md text-sm focus:border-blue-500 outline-none transition-colors min-w-0" />
                    <span className="text-gray-400 text-xs">~</span>
                    <input type="date" value={devPeriodTo} onChange={(e) => setDevPeriodTo(e.target.value)} className="flex-1 p-2 border border-gray-200 rounded-md text-sm focus:border-blue-500 outline-none transition-colors min-w-0" />
                  </div>
                </div>
              </div>
              {/* 차주 메타 */}
              <div className="bg-emerald-50/50 rounded-lg p-4 border border-emerald-100">
                <span className="text-xs font-bold text-emerald-600 mb-3 block">차주 계획</span>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 mb-1 block">대상업무</label>
                    <input type="text" placeholder="예: kt비즈메카" value={nextTargetBusiness} onChange={(e) => setNextTargetBusiness(e.target.value)} className="w-full p-2 border border-gray-200 rounded-md text-sm focus:border-emerald-500 outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 mb-1 block">의뢰팀</label>
                    <input type="text" placeholder="예: 기획팀" value={nextRequestTeam} onChange={(e) => setNextRequestTeam(e.target.value)} className="w-full p-2 border border-gray-200 rounded-md text-sm focus:border-emerald-500 outline-none transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">개발기간</label>
                  <div className="flex items-center gap-1">
                    <input type="date" value={nextDevPeriodFrom} onChange={(e) => setNextDevPeriodFrom(e.target.value)} className="flex-1 p-2 border border-gray-200 rounded-md text-sm focus:border-emerald-500 outline-none transition-colors min-w-0" />
                    <span className="text-gray-400 text-xs">~</span>
                    <input type="date" value={nextDevPeriodTo} onChange={(e) => setNextDevPeriodTo(e.target.value)} className="flex-1 p-2 border border-gray-200 rounded-md text-sm focus:border-emerald-500 outline-none transition-colors min-w-0" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 주요이슈 & 기타 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="text-sm font-bold text-blue-600 bg-blue-50 rounded-lg px-4 py-2.5 mb-4 flex items-center gap-2">
          💡 주요이슈 & 기타
        </div>
        <div className="mb-4">
          <label className="text-xs font-semibold text-gray-700 mb-1 block">
            주요이슈
          </label>
          <textarea
            placeholder="이번 주 주요 이슈 사항을 입력하세요"
            value={issues}
            onChange={(e) => setIssues(e.target.value)}
            className="w-full min-h-[80px] p-2.5 border border-gray-200 rounded-md text-sm resize-y focus:border-blue-500 outline-none transition-colors"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-700 mb-1 block">
            기타
          </label>
          <textarea
            placeholder="기타 사항을 입력하세요"
            value={etc}
            onChange={(e) => setEtc(e.target.value)}
            className="w-full min-h-[80px] p-2.5 border border-gray-200 rounded-md text-sm resize-y focus:border-blue-500 outline-none transition-colors"
          />
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="flex justify-center py-4">
        <button
          onClick={() => setShowPreview(true)}
          className="px-7 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-base font-semibold cursor-pointer"
        >
          미리보기 & 다운로드 →
        </button>
      </div>
      <p className="text-center text-gray-400 text-xs mt-2 mb-8">
        작성 후 &apos;미리보기&apos;에서 원본 양식과 동일한 .docx 또는 .pdf로
        다운로드할 수 있습니다.
      </p>
    </div>
  );
}
