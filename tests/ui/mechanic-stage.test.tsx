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
    expect(screen.getByTestId("stimulus").textContent).toBe("A");
    expect(document.querySelector(".stage")?.getAttribute("data-feedback")).toBe("correct");
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

  it("renders a speed circle and sends a tap", () => {
    const onRespond = vi.fn();
    render(
      <MechanicStage
        view={view({ mechanic: "speed", name: "Speed Tap", stimulus: "circle" })}
        onRespond={onRespond}
        onAnswer={vi.fn()}
      />,
    );
    expect(screen.getByTestId("stimulus").getAttribute("data-shape")).toBe("circle");
    fireEvent.click(screen.getByTestId("respond"));
    expect(onRespond).toHaveBeenCalledTimes(1);
  });

  it("renders a task-switch stimulus and sends the chosen option", () => {
    const onAnswer = vi.fn();
    render(
      <MechanicStage
        view={view({
          mechanic: "switching",
          name: "Task Switch",
          phase: "question",
          prompt: "Colour rule: choose the colour",
          stimulus: "red-circle",
          options: ["Red", "Blue"],
        })}
        onRespond={vi.fn()}
        onAnswer={onAnswer}
      />,
    );
    expect(screen.getByTestId("stimulus").getAttribute("data-shape")).toBe("red-circle");
    expect(screen.getByText("Colour rule: choose the colour")).toBeTruthy();
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

  it("uses hyphenated shape classes matching styles.css", () => {
    const { unmount } = render(
      <MechanicStage
        view={view({ mechanic: "gonogo", name: "Go / No-Go", stimulus: "circle" })}
        onRespond={vi.fn()}
        onAnswer={vi.fn()}
      />,
    );
    expect(screen.getByTestId("stimulus").className).toMatch(/shape-circle/);
    unmount();
    render(
      <MechanicStage
        view={view({ mechanic: "gonogo", name: "Go / No-Go", stimulus: "square" })}
        onRespond={vi.fn()}
        onAnswer={vi.fn()}
      />,
    );
    expect(screen.getByTestId("stimulus").className).toMatch(/shape-square/);
  });

  it("renders flanker arrows and sends the chosen direction", () => {
    const onAnswer = vi.fn();
    render(
      <MechanicStage
        view={view({
          mechanic: "flanker",
          name: "Flanker",
          stimulus: "<<><<",
          options: ["Left", "Right"],
        })}
        onRespond={vi.fn()}
        onAnswer={onAnswer}
      />,
    );
    expect(screen.getByTestId("stimulus").textContent).toBe("<<><<");
    fireEvent.click(screen.getByTestId("option-1"));
    expect(onAnswer).toHaveBeenCalledWith(1);
  });

  it("renders the spatial grid and sends the tapped cell", () => {
    const onAnswer = vi.fn();
    const options = Array.from({ length: 9 }, () => "");
    options[2] = "active";
    options[4] = "selected";
    render(
      <MechanicStage
        view={view({
          mechanic: "spatial",
          name: "Spatial Span",
          phase: "recall",
          prompt: "Tap the blocks in the same order (1/3)",
          stimulus: null,
          options,
        })}
        onRespond={vi.fn()}
        onAnswer={onAnswer}
      />,
    );
    expect(screen.getByTestId("spatial-cell-2").getAttribute("data-state")).toBe("active");
    expect(screen.getByTestId("spatial-cell-4").getAttribute("data-state")).toBe("selected");
    fireEvent.click(screen.getByTestId("spatial-cell-4"));
    expect(onAnswer).toHaveBeenCalledWith(4);
  });

  it("renders both mental-rotation figures and sends the chosen parity", () => {
    const onAnswer = vi.fn();
    render(
      <MechanicStage
        view={view({
          mechanic: "rotation",
          name: "Mental Rotation",
          phase: "question",
          prompt: "Is the right figure a rotation of the left, or a mirror image?",
          stimulus: "0-90-1",
          options: ["Same", "Mirrored"],
        })}
        onRespond={vi.fn()}
        onAnswer={onAnswer}
      />,
    );
    expect(screen.getByTestId("rotation-left")).toBeTruthy();
    expect(screen.getByTestId("rotation-right")).toBeTruthy();
    fireEvent.click(screen.getByTestId("option-1"));
    expect(onAnswer).toHaveBeenCalledWith(1);
  });

  it("renders the prospective-memory cue and sends Remember", () => {
    const onAnswer = vi.fn();
    render(
      <MechanicStage
        view={view({
          mechanic: "prospective",
          name: "Prospective Memory",
          phase: "question",
          prompt: "Sort the letter. If it is Q, choose Remember.",
          stimulus: "Q",
          options: ["Vowel", "Consonant", "Remember"],
        })}
        onRespond={vi.fn()}
        onAnswer={onAnswer}
      />,
    );
    expect(screen.getByTestId("stimulus").textContent).toBe("Q");
    fireEvent.click(screen.getByTestId("option-2"));
    expect(onAnswer).toHaveBeenCalledWith(2);
  });

  it("renders a paired-associates study pair and test options", () => {
    const { unmount } = render(
      <MechanicStage
        view={view({
          mechanic: "paired",
          name: "Paired Associates",
          phase: "study",
          prompt: "Remember this word pair",
          stimulus: "apple|bridge",
          options: null,
        })}
        onRespond={vi.fn()}
        onAnswer={vi.fn()}
      />,
    );
    expect(screen.getByTestId("stimulus").textContent).toMatch(/apple/);
    expect(screen.getByTestId("stimulus").textContent).toMatch(/bridge/);
    unmount();
    const onAnswer = vi.fn();
    render(
      <MechanicStage
        view={view({
          mechanic: "paired",
          name: "Paired Associates",
          phase: "test",
          prompt: 'Which word was paired with "apple"?',
          stimulus: "apple",
          options: ["bridge", "candle", "desert", "engine"],
        })}
        onRespond={vi.fn()}
        onAnswer={onAnswer}
      />,
    );
    fireEvent.click(screen.getByTestId("option-0"));
    expect(onAnswer).toHaveBeenCalledWith(0);
  });

  it("offers a mnemonic strategy hint during paired study", () => {
    render(
      <MechanicStage
        view={view({
          mechanic: "paired",
          name: "Paired Associates",
          phase: "study",
          prompt: "Remember this word pair",
          stimulus: "apple|bridge",
          options: null,
        })}
        onRespond={vi.fn()}
        onAnswer={vi.fn()}
      />,
    );
    const hint = screen.getByTestId("paired-strategy-hint");
    expect(hint.textContent).toMatch(/vivid image|short sentence/i);
    expect(hint.textContent).toMatch(/link/i);
  });
});
