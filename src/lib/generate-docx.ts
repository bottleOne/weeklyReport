import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  BorderStyle,
  WidthType,
  VerticalAlign,
} from "docx";
import type { ReportData, TaskItem } from "./types";
import { formatDateRange } from "./types";

// ===== 원본 문서 정확 사양 =====
const COL1 = 1244;
const COL2 = 4994;
const COL3 = 900;
const COL4 = 3644;
const COL34 = COL3 + COL4; // 4544

const FONT_SIZE = 16; // 8pt
const TITLE_SIZE = 44; // 22pt

const border = {
  style: BorderStyle.SINGLE,
  size: 4,
  space: 0,
  color: "auto",
};
const borders = {
  top: border,
  bottom: border,
  left: border,
  right: border,
};

function getDayOfWeek(dateStr: string): string {
  if (!dateStr) return "";
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return days[new Date(dateStr).getDay()];
}

function headerCell(
  text: string,
  width: number,
  fontSize?: number,
  opts?: { columnSpan?: number }
): TableCell {
  return new TableCell({
    borders,
    margins: CELL_MARGINS,
    width: { size: width, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    ...(opts?.columnSpan ? { columnSpan: opts.columnSpan } : {}),
    children: [
      new Paragraph({
        spacing: CELL_SPACING,
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text,
            bold: true,
            size: fontSize ?? undefined,
          }),
        ],
      }),
    ],
  });
}

function valueCell(text: string, width: number): TableCell {
  return new TableCell({
    borders,
    margins: CELL_MARGINS,
    width: { size: width, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        spacing: CELL_SPACING,
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text })],
      }),
    ],
  });
}

/** 원본 테이블 셀 내 paragraph 간격: after=0, line=240 (단일 간격) */
const CELL_SPACING = { after: 0, line: 240 };

/** 원본 문서 기본 셀 마진: left=108, right=108 DXA */
const CELL_MARGINS = {
  top: 0,
  bottom: 0,
  left: 108,
  right: 108,
};

function emptyLine(): Paragraph {
  return new Paragraph({
    spacing: CELL_SPACING,
    children: [new TextRun({ text: "", size: FONT_SIZE })],
  });
}

/** 업무 목록 → Paragraph 배열로 변환 (원본 형식) */
function buildTaskParagraphs(tasks: TaskItem[]): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  paragraphs.push(emptyLine());

  tasks.forEach((task, idx) => {
    // 업무 번호 + 제목
    paragraphs.push(
      new Paragraph({
        spacing: CELL_SPACING,
        children: [new TextRun({ text: `${idx + 1}. ${task.title || ""}`, size: FONT_SIZE })],
      })
    );

    // 내용이 있는지 체크
    const hasContent = (task.contentLines || []).some(
      (l) => l.text.trim() || (l.subDetails || []).some((s) => s.text.trim())
    );

    if (hasContent) {
      paragraphs.push(
        new Paragraph({
          spacing: CELL_SPACING,
          children: [new TextRun({ text: "내용 : ", size: FONT_SIZE })],
        })
      );

      let contentNum = 0;
      (task.contentLines || []).forEach((line) => {
        if (line.text.trim()) {
          contentNum++;
          const dateStr = formatDateRange(line);
          const mainText = dateStr ? `${line.text} (${dateStr})` : line.text;
          // 원본: numbering abstractNum left=760 hanging=360
          // → 번호 위치 400(760-360), 텍스트 위치 760
          paragraphs.push(
            new Paragraph({
              spacing: CELL_SPACING,
              indent: { left: 760, hanging: 360 },
              children: [new TextRun({ text: `${contentNum}) ${mainText}`, size: FONT_SIZE })],
            })
          );
        }

        (line.subDetails || []).forEach((sub) => {
          if (sub.text.trim()) {
            const sDate = formatDateRange(sub);
            const subText = sDate ? `- ${sub.text} (${sDate})` : `- ${sub.text}`;
            // 원본: left=400, firstLineChars=200, firstLine=320
            paragraphs.push(
              new Paragraph({
                spacing: CELL_SPACING,
                indent: { left: 400, firstLine: 320 },
                children: [new TextRun({ text: subText, size: FONT_SIZE })],
              })
            );
          }
        });
      });
    }

    if (idx < tasks.length - 1) {
      paragraphs.push(emptyLine());
    }
  });

  return paragraphs;
}

/** 대상업무/의뢰팀/개발기간 → Paragraph 배열 */
function buildMetaParagraphsFrom(
  targetBusiness: string,
  requestTeam: string,
  devPeriodFrom: string,
  devPeriodTo: string
): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  if (targetBusiness) {
    paragraphs.push(emptyLine());
    paragraphs.push(
      new Paragraph({
        spacing: CELL_SPACING,
        children: [
          new TextRun({
            text: `대상업무 : ${targetBusiness}`,
            size: FONT_SIZE,
          }),
        ],
      })
    );
  }

  if (requestTeam) {
    paragraphs.push(
      new Paragraph({
        spacing: CELL_SPACING,
        children: [
          new TextRun({
            text: ` 의뢰팀 : ${requestTeam}`,
            size: FONT_SIZE,
          }),
        ],
      })
    );
  }

  if (devPeriodFrom || devPeriodTo) {
    paragraphs.push(
      new Paragraph({
        spacing: CELL_SPACING,
        children: [
          new TextRun({
            text: ` 개발기간 : ${devPeriodFrom || ""}~ ${devPeriodTo || ""}`,
            size: FONT_SIZE,
          }),
        ],
      })
    );
  }

  return paragraphs;
}

/** 금주 메타 */
function buildMetaParagraphs(data: ReportData): Paragraph[] {
  return buildMetaParagraphsFrom(
    data.targetBusiness,
    data.requestTeam,
    data.devPeriodFrom,
    data.devPeriodTo
  );
}

/** 차주 메타 */
function buildNextMetaParagraphs(data: ReportData): Paragraph[] {
  return buildMetaParagraphsFrom(
    data.nextTargetBusiness,
    data.nextRequestTeam,
    data.nextDevPeriodFrom,
    data.nextDevPeriodTo
  );
}

/** 공통 행: 회의기준일, 구분, 주요이슈, 기타 */
function buildCommonRows(data: ReportData) {
  return {
    headerRow: new TableRow({
      height: { value: 137, rule: "atLeast" as const },
      children: [
        headerCell("회의기준일", COL1),
        valueCell(
          data.meetingDate ? `${data.meetingDate} (${getDayOfWeek(data.meetingDate)})` : "",
          COL2
        ),
        headerCell("팀명/이름", COL3),
        valueCell(`${data.teamName} / ${data.authorName}`, COL4),
      ],
    }),
    dividerRow: new TableRow({
      height: { value: 137, rule: "atLeast" as const },
      children: [
        headerCell("구분", COL1),
        headerCell("금주", COL2),
        headerCell("차주", COL34, undefined, { columnSpan: 2 }),
      ],
    }),
    issueRow: new TableRow({
      height: { value: 999, rule: "atLeast" as const },
      children: [
        headerCell("주요이슈", COL1, FONT_SIZE),
        new TableCell({
          borders,
          margins: CELL_MARGINS,
          width: { size: COL2, type: WidthType.DXA },
          children: [
            new Paragraph({
              spacing: CELL_SPACING,
              children: [new TextRun({ text: data.issues || "", size: FONT_SIZE })],
            }),
          ],
        }),
        new TableCell({
          borders,
          margins: CELL_MARGINS,
          width: { size: COL34, type: WidthType.DXA },
          columnSpan: 2,
          children: [
            new Paragraph({
              spacing: CELL_SPACING,
              children: [new TextRun({ text: "", size: FONT_SIZE })],
            }),
          ],
        }),
      ],
    }),
    etcRow: new TableRow({
      height: { value: 1106, rule: "atLeast" as const },
      children: [
        headerCell("기타", COL1, FONT_SIZE),
        new TableCell({
          borders,
          margins: CELL_MARGINS,
          width: { size: COL2, type: WidthType.DXA },
          children: [
            new Paragraph({
              spacing: CELL_SPACING,
              children: [new TextRun({ text: data.etc || "", size: FONT_SIZE })],
            }),
          ],
        }),
        new TableCell({
          borders,
          margins: CELL_MARGINS,
          width: { size: COL34, type: WidthType.DXA },
          columnSpan: 2,
          children: [
            new Paragraph({
              spacing: CELL_SPACING,
              children: [new TextRun({ text: "", size: FONT_SIZE })],
            }),
          ],
        }),
      ],
    }),
  };
}

/** 사원 모드: 업무 행 1개 */
function buildEmployeeTaskRow(data: ReportData): TableRow {
  const thisWeekParagraphs = [
    ...buildTaskParagraphs(data.thisWeekTasks),
    ...buildMetaParagraphs(data),
  ];
  const nextWeekParagraphs = [
    ...buildTaskParagraphs(data.nextWeekTasks),
    ...buildNextMetaParagraphs(data),
  ];

  return new TableRow({
    height: { value: 10888, rule: "atLeast" as const },
    children: [
      new TableCell({
        borders,
        margins: CELL_MARGINS,
        width: { size: COL1, type: WidthType.DXA },
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            spacing: CELL_SPACING,
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "업무", bold: true, size: FONT_SIZE })],
          }),
        ],
      }),
      new TableCell({
        borders,
        margins: CELL_MARGINS,
        width: { size: COL2, type: WidthType.DXA },
        children: thisWeekParagraphs,
      }),
      new TableCell({
        borders,
        margins: CELL_MARGINS,
        width: { size: COL34, type: WidthType.DXA },
        columnSpan: 2,
        children: nextWeekParagraphs,
      }),
    ],
  });
}

/** 팀장 모드: 팀원별 업무 행 배열 */
function buildLeaderTaskRows(data: ReportData): TableRow[] {
  const memberRows = data.members.map((member) => {
    const thisWeekParas = buildTaskParagraphs(member.thisWeekTasks);
    const nextWeekParas = buildTaskParagraphs(member.nextWeekTasks);

    return new TableRow({
      children: [
        new TableCell({
          borders,
          margins: CELL_MARGINS,
          width: { size: COL1, type: WidthType.DXA },
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              spacing: CELL_SPACING,
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: member.name || "(이름)",
                  bold: true,
                  size: FONT_SIZE,
                }),
              ],
            }),
          ],
        }),
        new TableCell({
          borders,
          margins: CELL_MARGINS,
          width: { size: COL2, type: WidthType.DXA },
          children: thisWeekParas,
        }),
        new TableCell({
          borders,
          margins: CELL_MARGINS,
          width: { size: COL34, type: WidthType.DXA },
          columnSpan: 2,
          children: nextWeekParas,
        }),
      ],
    });
  });

  // 마지막 팀원 행 아래 메타 정보 별도 행 추가
  if (data.targetBusiness || data.requestTeam || data.devPeriodFrom || data.devPeriodTo) {
    const metaParas = buildMetaParagraphs(data);
    if (metaParas.length > 0) {
      memberRows.push(
        new TableRow({
          children: [
            new TableCell({
              borders,
              margins: CELL_MARGINS,
              width: { size: COL1, type: WidthType.DXA },
              verticalAlign: VerticalAlign.CENTER,
              children: [
                new Paragraph({
                  spacing: CELL_SPACING,
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: "", size: FONT_SIZE })],
                }),
              ],
            }),
            new TableCell({
              borders,
              margins: CELL_MARGINS,
              width: { size: COL2, type: WidthType.DXA },
              columnSpan: 3,
              children: metaParas,
            }),
          ],
        })
      );
    }
  }

  return memberRows;
}

export async function generateDocxBuffer(data: ReportData): Promise<Buffer> {
  const { headerRow, dividerRow, issueRow, etcRow } = buildCommonRows(data);

  const taskRows =
    data.mode === "leader" ? buildLeaderTaskRows(data) : [buildEmployeeTaskRow(data)];

  const doc = new Document({
    styles: {
      default: {
        document: {
          paragraph: {
            spacing: { after: 0, line: 240 },
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 851, right: 851, bottom: 851, left: 851 },
          },
        },
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: "주간업무",
                bold: true,
                size: TITLE_SIZE,
                underline: { type: "single" },
              }),
            ],
          }),
          new Table({
            width: { size: 10782, type: WidthType.DXA },
            columnWidths: [COL1, COL2, COL3, COL4],
            indent: { size: -176, type: WidthType.DXA },
            rows: [headerRow, dividerRow, ...taskRows, issueRow, etcRow],
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer as Buffer;
}
