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
    <div
      className="stage stage-nback"
      data-mechanic="nback"
      data-phase={view.phase}
      data-feedback={view.feedbackTone ?? "neutral"}
    >
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
    <div
      className="stage stage-gonogo"
      data-mechanic="gonogo"
      data-phase={view.phase}
      data-feedback={view.feedbackTone ?? "neutral"}
    >
      <div
        className={`shape shape-${shape ?? "blank"}`}
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

function SpeedStage({ view, onRespond }: Omit<MechanicStageProps, "onAnswer">) {
  return (
    <div
      className="stage stage-speed"
      data-mechanic="speed"
      data-phase={view.phase}
      data-feedback={view.feedbackTone ?? "neutral"}
    >
      <div
        className={`speed-ring ${view.stimulus ? "speed-ring-active" : "speed-ring-idle"}`}
        role="img"
        aria-label={view.stimulus ? "Circle: tap now" : "Wait for the circle"}
        data-testid="stimulus"
        data-shape={view.stimulus ?? "blank"}
      />
      <p className="stage-prompt">{view.prompt}</p>
      <Feedback view={view} />
      <Button
        onClick={onRespond}
        disabled={!view.canRespond}
        className="wide"
        data-testid="respond"
      >
        Tap
      </Button>
    </div>
  );
}

function SwitchingStage({ view, onAnswer }: Omit<MechanicStageProps, "onRespond">) {
  const [colour = "blank", shape = "blank"] = (view.stimulus ?? "").split("-");
  return (
    <div
      className="stage stage-switching"
      data-mechanic="switching"
      data-phase={view.phase}
      data-feedback={view.feedbackTone ?? "neutral"}
    >
      <p className="switch-cue">{view.prompt}</p>
      <div
        className={`switch-stimulus switch-colour-${colour} switch-shape-${shape}`}
        role="img"
        aria-label={`${colour} ${shape}`}
        data-testid="stimulus"
        data-shape={view.stimulus ?? "blank"}
      />
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

function FlankerStage({ view, onAnswer }: Omit<MechanicStageProps, "onRespond">) {
  return (
    <div
      className="stage stage-flanker"
      data-mechanic="flanker"
      data-phase={view.phase}
      data-feedback={view.feedbackTone ?? "neutral"}
    >
      <p className="stage-prompt">{view.prompt}</p>
      <div
        className="flanker-arrows"
        role="img"
        aria-label={`Flanker arrows: ${view.stimulus ?? "blank"}`}
        data-testid="stimulus"
      >
        {view.stimulus ?? "\u00a0"}
      </div>
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

function SpatialStage({ view, onAnswer }: Omit<MechanicStageProps, "onRespond">) {
  return (
    <div
      className="stage stage-spatial"
      data-mechanic="spatial"
      data-phase={view.phase}
      data-feedback={view.feedbackTone ?? "neutral"}
    >
      <p className="stage-prompt">{view.prompt}</p>
      <div className="spatial-grid" role="group" aria-label="Spatial span grid">
        {(view.options ?? []).map((cellState, index) => (
          <button
            key={index}
            type="button"
            className={`spatial-cell spatial-cell-${cellState || "idle"}`}
            data-testid={`spatial-cell-${index}`}
            data-state={cellState || "idle"}
            aria-label={`Block ${index + 1}${cellState === "active" ? " highlighted" : ""}`}
            disabled={!view.canRespond}
            onClick={() => onAnswer(index)}
          />
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

const ROTATION_SHAPES: readonly (readonly (readonly [number, number])[])[] = [
  [
    [0, 0],
    [1, 0],
    [2, 0],
    [0, 1],
  ],
  [
    [0, 0],
    [1, 0],
    [1, 1],
    [2, 1],
  ],
];

function RotationFigure({
  shape,
  rotation,
  mirrored,
  label,
  testId,
}: {
  shape: number;
  rotation: number;
  mirrored: boolean;
  label: string;
  testId: string;
}) {
  const cells = ROTATION_SHAPES[shape] ?? ROTATION_SHAPES[0] ?? [];
  const cols = Math.max(...cells.map(([col]) => col)) + 1;
  const rows = Math.max(...cells.map(([, row]) => row)) + 1;
  const size = 18;
  return (
    <svg
      className="rotation-figure"
      viewBox="0 0 120 100"
      role="img"
      aria-label={label}
      data-testid={testId}
    >
      <g transform={`translate(60 50) rotate(${rotation}) scale(${mirrored ? -1 : 1} 1)`}>
        {cells.map(([col, row], index) => (
          <rect
            key={index}
            x={(col - (cols - 1) / 2) * size - size / 2}
            y={(row - (rows - 1) / 2) * size - size / 2}
            width={size}
            height={size}
            rx={3}
          />
        ))}
      </g>
    </svg>
  );
}

function ProspectiveStage({ view, onAnswer }: Omit<MechanicStageProps, "onRespond">) {
  return (
    <div
      className="stage stage-prospective"
      data-mechanic="prospective"
      data-phase={view.phase}
      data-feedback={view.feedbackTone ?? "neutral"}
    >
      <p className="stage-prompt">{view.prompt}</p>
      <div className="prospective-letter" role="img" aria-label={`Letter ${view.stimulus ?? "blank"}`} data-testid="stimulus">
        {view.stimulus ?? "\u00a0"}
      </div>
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

function RotationStage({ view, onAnswer }: Omit<MechanicStageProps, "onRespond">) {
  const [shape = 0, rotation = 0, mirrorFlag = 0] = (view.stimulus ?? "0-0-0")
    .split("-")
    .map(Number);
  return (
    <div
      className="stage stage-rotation"
      data-mechanic="rotation"
      data-phase={view.phase}
      data-feedback={view.feedbackTone ?? "neutral"}
    >
      <p className="stage-prompt">{view.prompt}</p>
      <div className="rotation-figures">
        <div className="rotation-panel">
          <RotationFigure
            shape={shape}
            rotation={0}
            mirrored={false}
            label="Original block figure"
            testId="rotation-left"
          />
          <span className="fine">Original</span>
        </div>
        <div className="rotation-panel">
          <RotationFigure
            shape={shape}
            rotation={rotation}
            mirrored={mirrorFlag === 1}
            label="Right block figure"
            testId="rotation-right"
          />
          <span className="fine">Right</span>
        </div>
      </div>
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

function ReasoningStage({ view, onAnswer }: Omit<MechanicStageProps, "onRespond">) {
  return (
    <div
      className="stage stage-reasoning"
      data-mechanic="reasoning"
      data-phase={view.phase}
      data-feedback={view.feedbackTone ?? "neutral"}
    >
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
  if (view.mechanic === "speed") {
    return <SpeedStage view={view} onRespond={props.onRespond} />;
  }
  if (view.mechanic === "switching") {
    return <SwitchingStage view={view} onAnswer={props.onAnswer} />;
  }
  if (view.mechanic === "flanker") {
    return <FlankerStage view={view} onAnswer={props.onAnswer} />;
  }
  if (view.mechanic === "spatial") {
    return <SpatialStage view={view} onAnswer={props.onAnswer} />;
  }
  if (view.mechanic === "rotation") {
    return <RotationStage view={view} onAnswer={props.onAnswer} />;
  }
  if (view.mechanic === "prospective") {
    return <ProspectiveStage view={view} onAnswer={props.onAnswer} />;
  }
  return <ReasoningStage view={view} onAnswer={props.onAnswer} />;
}
