// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MechanicStage } from "../../src/ui/components/MechanicStage";
import type { MechanicView } from "../../src/engine/types";

afterEach(cleanup);

function view(overrides: Partial<MechanicView> = {}): MechanicView {
  return {
    mechanic: "nback",
    name: "N-back",
    phase: "trial",
    prompt: "Match when the letter is the same as 2 back.",
    stimulus: "A",
    options: null,
    explanation: null,
    progressCurrent: 1,
    progressTotal: 10,
    feedback: null,
    feedbackTone: null,
    canRespond: true,
    controls: [],
    metrics: {},
    complete: false,
    ...overrides,
  };
}

describe("MechanicStage", () => {
  it("renders an n-back letter and sends a response", () => {
    const onRespond = vi.fn();
    render(<MechanicStage view={view()} onRespond={onRespond} onAnswer={vi.fn()} />);
    expect(screen.getByTestId("stimulus").textContent).toBe("A");
    fireEvent.click(screen.getByTestId("respond"));
    expect(onRespond).toHaveBeenCalledTimes(1);
  });

  it("disables the response button when the mechanic cannot respond", () => {
    render(
      <MechanicStage
        view={view({ canRespond: false, phase: "feedback", feedback: "Hit", feedbackTone: "correct" })}
        onRespond={vi.fn()}
        onAnswer={vi.fn()}
      />,
    );
    expect((screen.getByTestId("respond") as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByTestId("feedback").textContent).toBe("Hit");
  });

  it("renders reasoning options and sends the chosen index", () => {
    const onAnswer = vi.fn();
    render(
      <MechanicStage
        view={view({
          mechanic: "reasoning",
          name: "Reasoning",
          prompt: "2, 4, 6, 8, ?",
          stimulus: null,
          options: ["9", "10", "11", "12"],
        })}
        onRespond={vi.fn()}
        onAnswer={onAnswer}
      />,
    );
    fireEvent.click(screen.getByTestId("option-1"));
    expect(onAnswer).toHaveBeenCalledWith(1);
  });

  it("renders a go/no-go shape", () => {
    render(
      <MechanicStage
        view={view({ mechanic: "gonogo", name: "Go / No-Go", stimulus: "circle" })}
        onRespond={vi.fn()}
        onAnswer={vi.fn()}
      />,
    );
    expect(screen.getByTestId("stimulus").getAttribute("data-shape")).toBe("circle");
  });
});
