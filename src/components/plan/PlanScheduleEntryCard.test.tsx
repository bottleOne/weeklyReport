import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import PlanScheduleEntryCard from "./PlanScheduleEntryCard";
import { createScheduleEntryFromRange } from "@/lib/plan-types";

function makeEntry(title: string) {
  const e = createScheduleEntryFromRange("2026-05-04", "2026-05-04");
  e.title = title;
  return e;
}

describe("PlanScheduleEntryCard — auto focus on empty title", () => {
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
});
