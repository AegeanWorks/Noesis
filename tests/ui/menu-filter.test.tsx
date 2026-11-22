// @vitest-environment jsdom
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { PracticeMenuScreen } from "../../src/ui/screens/PracticeMenuScreen";

afterEach(cleanup);

function renderMenu(overrides: Partial<ComponentProps<typeof PracticeMenuScreen>> = {}) {
  const props: ComponentProps<typeof PracticeMenuScreen> = {
    history: [],
    adherenceCounts: { started: 0, completed: 0, aborted: 0 },
    hasSession: false,
    sessionLength: "standard",
    initialTab: "tests",
    onStartTest: vi.fn(),
    onStartSession: vi.fn(),
    onResume: vi.fn(),
    onExportHistory: vi.fn(),
    onHome: vi.fn(),
    ...overrides,
  };
  render(<PracticeMenuScreen {...props} />);
  return props;
}

describe("Practice menu domain filter", () => {
  it("filters the test list by domain and keeps starting tests working", () => {
    const props = renderMenu();
    expect(screen.getByTestId("menu-filter-count").textContent).toBe("12 of 12 tests");

    fireEvent.change(screen.getByTestId("domain-filter"), {
      target: { value: "working_memory" },
    });

    expect(screen.getByTestId("menu-filter-count").textContent).toBe("3 of 12 tests");
    for (const name of ["N-back", "Spatial Span", "Change Detection"]) {
      expect(screen.getByRole("heading", { name })).toBeTruthy();
    }
    for (const name of [
      "Go / No-Go",
      "Reasoning",
      "Speed Tap",
      "Task Switch",
      "Flanker",
      "Mental Rotation",
      "Prospective Memory",
      "Paired Associates",
      "Visual Search",
    ]) {
      expect(screen.queryByRole("heading", { name })).toBeNull();
    }

    fireEvent.click(screen.getByRole("button", { name: "Start Change Detection test" }));
    expect(props.onStartTest).toHaveBeenCalledWith("change");
  });

  it("restores the full list with the All tests option", () => {
    renderMenu();
    const select = screen.getByTestId("domain-filter");
    fireEvent.change(select, { target: { value: "episodic_memory" } });
    expect(screen.getByTestId("menu-filter-count").textContent).toBe("2 of 12 tests");
    expect(screen.getByRole("heading", { name: "Prospective Memory" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Paired Associates" })).toBeTruthy();

    fireEvent.change(select, { target: { value: "all" } });
    expect(screen.getByTestId("menu-filter-count").textContent).toBe("12 of 12 tests");
    expect(screen.getByRole("heading", { name: "N-back" })).toBeTruthy();
  });
});
