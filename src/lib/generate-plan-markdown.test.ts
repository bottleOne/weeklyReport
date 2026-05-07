import { describe, it, expect } from "vitest";
import { generatePlanMarkdown } from "./generate-plan-markdown";
import type { ProjectPlanData } from "./plan-types";

const sample: ProjectPlanData = {
  title: "비즈메카 인사 모듈 개편",
  authorName: "전병일",
  teamName: "개발2팀",
  createdDate: "2026-04-25",
  background: "현행 권한 체계의 한계.\nRBAC 도입 필요.",
  objective: "권한 관리 표준화",
  scope: "포함: 권한 모델 / 제외: 외부 SSO",
  stakeholders: "기획팀, 보안팀",
  deliverables: "설계서, API, UI",
  nonGoals: "외부 SSO 통합\n모바일 전용 화면",
  openQuestions: [
    { id: "q1", question: "외부 SSO 적용 시기는?", resolved: false, resolution: "" },
    { id: "q2", question: "권한 모델 명칭 표준?", resolved: true, resolution: "RBAC v2 채택" },
  ],
  northStar: "권한 변경 평균 처리 시간 1일 → 1시간",
  successMetrics: [
    {
      id: "m1",
      name: "권한 변경 처리 시간",
      target: "1시간 이내",
      method: "감사로그 집계",
      timeline: "출시 후 4주",
    },
  ],
  startDate: "2026-05-01",
  endDate: "2026-07-31",
  scheduleEntries: [
    {
      id: "e2",
      title: "사용자 인터뷰",
      dateFrom: "2026-05-08",
      dateTo: "2026-05-12",
      details: "",
      assignee: "김기획",
      status: "todo",
    },
    {
      id: "e1",
      title: "현행 권한 분석",
      dateFrom: "2026-05-01",
      dateTo: "2026-05-07",
      details: "DB 스키마 포함",
      assignee: "전병일",
      status: "in_progress",
    },
  ],
  risks: [
    {
      id: "r1",
      description: "데이터 마이그레이션 복잡도",
      impact: "high",
      likelihood: "medium",
      mitigation: "사전 정제 스크립트",
    },
    {
      id: "r2",
      description: "외부 API 응답 지연",
      impact: "medium",
      likelihood: "low",
      mitigation: "캐시 fallback",
    },
  ],
  etc: "",
};

describe("generatePlanMarkdown", () => {
  it("includes title and metadata", () => {
    const md = generatePlanMarkdown(sample);
    expect(md).toContain("# 비즈메카 인사 모듈 개편");
    expect(md).toContain("개발2팀");
    expect(md).toContain("전병일");
    expect(md).toContain("2026-04-25");
  });

  it("renders Phase 2 header sections (North Star + 성공 지표)", () => {
    const md = generatePlanMarkdown(sample);
    expect(md).toContain("## 🌟 North Star");
    expect(md).toContain("권한 변경 평균 처리 시간 1일 → 1시간");
    expect(md).toContain("## 성공 지표");
    expect(md).toContain("| 지표 | 목표값 | 측정방법 | 시점 |");
    expect(md).toContain("권한 변경 처리 시간");
    expect(md).toContain("출시 후 4주");
  });

  it("renders all 10 sections in renumbered order", () => {
    const md = generatePlanMarkdown(sample);
    expect(md).toContain("## 1. 배경");
    expect(md).toContain("## 2. 목표");
    expect(md).toContain("## 3. 범위");
    expect(md).toContain("## 4. 이해관계자");
    expect(md).toContain("## 5. 산출물");
    expect(md).toContain("## 6. 범위 외 (Non-goals)");
    expect(md).toContain("## 7. 미결사항");
    expect(md).toContain("## 8. 일정");
    expect(md).toContain("## 9. 리스크");
    expect(md).toContain("## 10. 기타");
  });

  it("renders risks table sorted by score descending with Korean labels", () => {
    const md = generatePlanMarkdown(sample);
    expect(md).toContain("| # | 리스크 | 영향도 | 확률 | 점수 | 대응 방안 |");
    // r1: high(3) × medium(2) = 6 > r2: medium(2) × low(1) = 2
    const idxR1 = md.indexOf("데이터 마이그레이션");
    const idxR2 = md.indexOf("외부 API");
    expect(idxR1).toBeLessThan(idxR2);
    expect(md).toContain("높음");
    expect(md).toContain("중간");
    expect(md).toContain("낮음");
  });

  it("renders open questions with checkbox + indented resolution", () => {
    const md = generatePlanMarkdown(sample);
    // unresolved 먼저
    const idxQ1 = md.indexOf("외부 SSO 적용 시기는?");
    const idxQ2 = md.indexOf("권한 모델 명칭 표준?");
    expect(idxQ1).toBeGreaterThan(-1);
    expect(idxQ2).toBeGreaterThan(idxQ1);
    expect(md).toContain("- [ ] 외부 SSO 적용 시기는?");
    expect(md).toContain("- [x] 권한 모델 명칭 표준?");
    expect(md).toContain("**답변**: RBAC v2 채택");
  });

  it("renders schedule table with sorted entries and status labels", () => {
    const md = generatePlanMarkdown(sample);
    expect(md).toContain("| # | 기간 | 제목 | 담당 | 상태 | 상세 |");
    // 정렬 검증: 5월 1일 entry가 5월 8일 entry보다 먼저 나와야 함
    const idxFirst = md.indexOf("현행 권한 분석");
    const idxSecond = md.indexOf("사용자 인터뷰");
    expect(idxFirst).toBeLessThan(idxSecond);
    expect(md).toContain("진행중");
    expect(md).toContain("예정");
  });

  it("escapes pipes and converts newlines in details", () => {
    const data: ProjectPlanData = {
      ...sample,
      scheduleEntries: [
        {
          id: "x",
          title: "test",
          dateFrom: "2026-05-01",
          dateTo: "2026-05-01",
          details: "before|after\nline2",
          assignee: "",
          status: "todo",
        },
      ],
    };
    const md = generatePlanMarkdown(data);
    expect(md).toContain("before\\|after<br/>line2");
  });

  it("shows empty state when no entries", () => {
    const md = generatePlanMarkdown({ ...sample, scheduleEntries: [] });
    expect(md).toContain("(등록된 일정이 없습니다)");
  });

  it("matches structural snapshot", () => {
    expect(generatePlanMarkdown(sample)).toMatchSnapshot();
  });
});
