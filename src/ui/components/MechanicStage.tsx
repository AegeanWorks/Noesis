import type { MechanicView } from "../../engine/types";
import { Button } from "./Button";

interface MechanicStageProps {
  view: MechanicView;
  onRespond: () => void;
  onAnswer: (option: number) => void;
}

function Feedback({ view }: { view: MechanicView }) {
  return (
    <p
      className={`feedback ${view.feedbackTone ? `feedback-${view.feedbackTone}` : ""}`}
      aria-live="assertive"
      data-testid="feedback"
      data-tone={view.feedbackTone ?? "neutral"}
    >
      {view.feedback ?? "\u00a0"}
    </p>
  );
}

function NBackStage({ view, onRespond }: Omit<MechanicStageProps, "onAnswer">) {
  return (
    <div className="stage stage-nback" data-mechanic="nback" data-phase={view.phase}>
      <div className="stimulus-letter" aria-live="polite" data-testid="stimulus">
        {view.stimulus ?? "\u00a0"}
      </div>
      <p className="stage-prompt">{view.prompt}</p>
      <Feedback view={view} />
      <Button
        onClick={onRespond}
        disabled={!view.canRespond}
        className="wide"
        data-testid="respond"
      >
        Match
      </Button>
    </div>
  );
}

function GoNoGoStage({ view, onRespond }: Omit<MechanicStageProps, "onAnswer">) {
  const shape = view.stimulus;
  return (
    <div className="stage stage-gonogo" data-mechanic="gonogo" data-phase={view.phase}>
      <div
        className={`shape ${shape ?? "shape-blank"}`}
        role="img"
        aria-label={shape === "circle" ? "Circle: respond" : shape === "square" ? "Square: do not respond" : "Waiting"}
        data-testid="stimulus"
        data-shape={shape ?? "blank"}
      />
      <p className="stage-prompt">{view.prompt}</p>
      <Feedback view={view} />
      <Button
        onClick={onRespond}
        disabled={!view.canRespond}
        className="wide"
        data-testid="respond"
      >
        Respond
      </Button>
    </div>
  );
}

function ReasoningStage({ view, onAnswer }: Omit<MechanicStageProps, "onRespond">) {
  return (
    <div className="stage stage-reasoning" data-mechanic="reasoning" data-phase={view.phase}>
      <h2 className="reasoning-prompt" data-testid="stimulus">
        {view.prompt}
      </h2>
      <div className="options" role="group" aria-label="Answer options">
        {(view.options ?? []).map((option, index) => (
          <Button
            key={`${option}-${index}`}
            variant="ghost"
            className="option"
            disabled={!view.canRespond}
            onClick={() => onAnswer(index)}
            data-testid={`option-${index}`}
          >
            <span className="option-key">{index + 1}</span>
            {option}
          </Button>
        ))}
      </div>
      <Feedback view={view} />
      {view.explanation ? (
        <p className="explanation" data-testid="explanation">
          {view.explanation}
        </p>
      ) : null}
    </div>
  );
}

export function MechanicStage(props: MechanicStageProps) {
  const { view } = props;
  if (view.mechanic === "nback") {
    return <NBackStage view={view} onRespond={props.onRespond} />;
  }
  if (view.mechanic === "gonogo") {
    return <GoNoGoStage view={view} onRespond={props.onRespond} />;
  }
  return <ReasoningStage view={view} onAnswer={props.onAnswer} />;
}
