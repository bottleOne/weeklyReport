import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PlanScheduleEntryCard from "./PlanScheduleEntryCard";
import { createScheduleEntryFromRange } from "@/lib/plan-types";

function makeEntry(title: string) {
  const e = createScheduleEntryFromRange("2026-05-04", "2026-05-04");
  e.title = title;
  return e;
}

describe("PlanScheduleEntryCard — empty-title auto cleanup", () => {
  it("auto-focuses the title input on mount when title is empty", () => {
    render(
      <PlanScheduleEntryCard
        entry={makeEntry("")}
        index={0}
        onChange={() => {}}
        onRemove={() => {}}
        onHover={() => {}}
      />
    );
    const input = screen.getByPlaceholderText(/일정 제목/);
    expect(input).toHaveFocus();
  });

  it("does NOT auto-focus when title is non-empty", () => {
    render(
      <PlanScheduleEntryCard
        entry={makeEntry("기존 일정")}
        index={0}
        onChange={() => {}}
        onRemove={() => {}}
        onHover={() => {}}
      />
    );
    const input = screen.getByPlaceholderText(/일정 제목/);
    expect(input).not.toHaveFocus();
  });

  it("calls onRemove when blurring with an empty (whitespace-only) title", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    const entry = makeEntry("");
    render(
      <PlanScheduleEntryCard
        entry={entry}
        index={0}
        onChange={() => {}}
        onRemove={onRemove}
        onHover={() => {}}
      />
    );
    const input = screen.getByPlaceholderText(/일정 제목/);
    // 자동 focus 됐는지 확인 후 blur 트리거 (Tab으로 다음 element로 이동)
    expect(input).toHaveFocus();
    await user.tab();
    expect(onRemove).toHaveBeenCalledWith(entry.id);
  });

  it("does NOT call onRemove when blurring with a non-empty title", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    const entry = makeEntry("작성된 제목");
    render(
      <PlanScheduleEntryCard
        entry={entry}
        index={0}
        onChange={() => {}}
        onRemove={onRemove}
        onHover={() => {}}
      />
    );
    const input = screen.getByPlaceholderText(/일정 제목/);
    await user.click(input);
    expect(input).toHaveFocus();
    await user.tab();
    expect(onRemove).not.toHaveBeenCalled();
  });

  it("calls onRemove on unmount when title is empty (any action removing the card)", () => {
    const onRemove = vi.fn();
    const entry = makeEntry("");
    const { unmount } = render(
      <PlanScheduleEntryCard
        entry={entry}
        index={0}
        onChange={() => {}}
        onRemove={onRemove}
        onHover={() => {}}
      />
    );
    unmount();
    expect(onRemove).toHaveBeenCalledWith(entry.id);
  });

  it("does NOT call onRemove on unmount when title is non-empty", () => {
    const onRemove = vi.fn();
    const entry = makeEntry("작성된 제목");
    const { unmount } = render(
      <PlanScheduleEntryCard
        entry={entry}
        index={0}
        onChange={() => {}}
        onRemove={onRemove}
        onHover={() => {}}
      />
    );
    unmount();
    expect(onRemove).not.toHaveBeenCalled();
  });

  it("calls onRemove when sidebar close button is clicked while title is empty", async () => {
    // 사이드바 ✕ 클릭 시뮬레이션 — 외부 button 클릭으로 input blur 발생 → onRemove 호출 검증
    const user = userEvent.setup();
    const onRemove = vi.fn();
    const onClose = vi.fn();
    const entry = makeEntry("");
    render(
      <div>
        <PlanScheduleEntryCard
          entry={entry}
          index={0}
          onChange={() => {}}
          onRemove={onRemove}
          onHover={() => {}}
        />
        <button onClick={onClose}>✕ 닫기</button>
      </div>
    );
    const input = screen.getByPlaceholderText(/일정 제목/);
    expect(input).toHaveFocus(); // 마운트 시 자동 focus
    await user.click(screen.getByRole("button", { name: /닫기/ }));
    expect(onRemove).toHaveBeenCalledWith(entry.id);
    expect(onClose).toHaveBeenCalled();
  });
});
