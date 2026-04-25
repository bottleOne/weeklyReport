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
  startDate: "2026-05-01",
  endDate: "2026-07-31",
  milestones: [
    {
      id: "m1",
      title: "요구사항 확정",
      description: "이해관계자 인터뷰",
      dateFrom: "2026-05-01",
      dateTo: "2026-05-15",
      tasks: [
        {
          id: "t1",
          title: "현행 권한 분석",
          assignee: "전병일",
          dateFrom: "2026-05-01",
          dateTo: "2026-05-07",
          status: "in_progress",
          notes: "DB 스키마 포함",
        },
        {
          id: "t2",
          title: "사용자 인터뷰",
          assignee: "김기획",
          dateFrom: "2026-05-08",
          dateTo: "2026-05-12",
          status: "todo",
          notes: "",
        },
      ],
    },
  ],
  risks: "데이터 마이그레이션 복잡도",
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

  it("renders all 8 sections", () => {
    const md = generatePlanMarkdown(sample);
    expect(md).toContain("## 1. 배경");
    expect(md).toContain("## 2. 목표");
    expect(md).toContain("## 3. 범위");
    expect(md).toContain("## 4. 이해관계자");
    expect(md).toContain("## 5. 산출물");
    expect(md).toContain("## 6. 일정");
    expect(md).toContain("## 7. 리스크");
    expect(md).toContain("## 8. 기타");
  });

  it("renders milestone table with all status labels", () => {
    const md = generatePlanMarkdown(sample);
    expect(md).toContain("### 1) 요구사항 확정");
    expect(md).toContain("| 작업 | 담당 | 기간 | 상태 | 메모 |");
    expect(md).toContain("진행중");
    expect(md).toContain("예정");
    expect(md).toContain("현행 권한 분석");
  });

  it("escapes pipe characters in notes", () => {
    const data: ProjectPlanData = {
      ...sample,
      milestones: [
        {
          ...sample.milestones[0],
          tasks: [
            {
              ...sample.milestones[0].tasks[0],
              notes: "before|after|test",
            },
          ],
        },
      ],
    };
    const md = generatePlanMarkdown(data);
    expect(md).toContain("before\\|after\\|test");
  });

  it("matches structural snapshot", () => {
    expect(generatePlanMarkdown(sample)).toMatchSnapshot();
  });
});
