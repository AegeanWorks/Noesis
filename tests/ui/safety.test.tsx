// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { SafetyScreen } from "../../src/ui/screens/SafetyScreen";
import { clearSafety, loadSafety } from "../../src/storage/safety";

beforeEach(() => {
  clearSafety();
});

afterEach(() => {
  cleanup();
  clearSafety();
});

describe("SafetyScreen", () => {
  it("requires answers and consent before saving", () => {
    const onComplete = vi.fn();
    render(<SafetyScreen onComplete={onComplete} />);
    const save = screen.getByRole("button", { name: "Save and start" });
    expect((save as HTMLButtonElement).disabled).toBe(true);

    const yes = screen.getAllByLabelText("Yes");
    expect(yes).toHaveLength(2);
    fireEvent.click(yes[0]!);
    fireEvent.click(yes[1]!);
    fireEvent.click(screen.getByLabelText(/I understand Noesis is not medical care/));
    fireEvent.click(screen.getByLabelText(/visual exercises may contain motion/));

    expect((save as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(save);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(loadSafety()?.acknowledged).toBe(true);
    expect(loadSafety()?.consent).toBe(true);
  });

  it("shows the photosensitivity warning when needed", () => {
    const onComplete = vi.fn();
    render(<SafetyScreen onComplete={onComplete} />);
    const yes = screen.getAllByLabelText("Yes");
    fireEvent.click(yes[0]!);
    expect(screen.getByRole("alert").textContent).toMatch(/Visual entrainment is not available/);
  });
});
