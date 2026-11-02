// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { FarCheckScreen } from "../../src/ui/screens/FarCheckScreen";

afterEach(cleanup);

function advanceStudy(times: number) {
  for (let i = 0; i < times; i += 1) {
    fireEvent.click(screen.getByRole("button", { name: /next word|start test/i }));
  }
}

describe("FarCheckScreen", () => {
  it("walks study then test and reports the outcome", () => {
    const onComplete = vi.fn();
    render(<FarCheckScreen seed={42} onComplete={onComplete} onCancel={() => {}} />);
    expect(screen.getByTestId("far-check-study")).toBeTruthy();
    advanceStudy(8);
    expect(screen.getByTestId("far-check-test")).toBeTruthy();
    for (let i = 0; i < 16; i += 1) {
      fireEvent.click(screen.getByRole("button", { name: "Seen before" }));
    }
    expect(screen.getByTestId("far-check-done")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Save result" }));
    expect(onComplete).toHaveBeenCalledTimes(1);
    const outcome = onComplete.mock.calls[0]?.[0] as {
      studied: number;
      tested: number;
      hits: number;
      falseAlarms: number;
      accuracy: number;
    };
    expect(outcome.studied).toBe(8);
    expect(outcome.tested).toBe(16);
    expect(outcome.hits + outcome.falseAlarms).toBeLessThanOrEqual(16);
    expect(outcome.accuracy).toBeGreaterThanOrEqual(0);
    expect(outcome.accuracy).toBeLessThanOrEqual(1);
  });

  it("is deterministic for a fixed seed", () => {
    const first = vi.fn();
    const { unmount } = render(<FarCheckScreen seed={7} onComplete={first} onCancel={() => {}} />);
    const firstWord = screen.getByRole("heading").textContent;
    unmount();
    cleanup();
    render(<FarCheckScreen seed={7} onComplete={vi.fn()} onCancel={() => {}} />);
    expect(screen.getByRole("heading").textContent).toBe(firstWord);
  });
});
