interface SparklineProps {
  values: readonly number[];
  label: string;
}

const WIDTH = 120;
const HEIGHT = 30;
const PAD = 3;

export function Sparkline({ values, label }: SparklineProps) {
  if (values.length < 2) return null;

  const usableWidth = WIDTH - PAD * 2;
  const usableHeight = HEIGHT - PAD * 2;
  const step = values.length === 1 ? 0 : usableWidth / (values.length - 1);
  const points = values.map((value, index) => {
    const x = values.length === 1 ? WIDTH / 2 : PAD + index * step;
    const y = HEIGHT - PAD - Math.min(1, Math.max(0, value)) * usableHeight;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return (
    <svg
      className="sparkline"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={label}
    >
      <line
        x1={PAD}
        y1={HEIGHT - PAD}
        x2={WIDTH - PAD}
        y2={HEIGHT - PAD}
        className="sparkline-baseline"
      />
      {values.length === 1 ? (
        <>
          <line
            x1={WIDTH / 2}
            y1={PAD}
            x2={WIDTH / 2}
            y2={HEIGHT - PAD}
            className="sparkline-guide"
          />
          <circle
            cx={WIDTH / 2}
            cy={HEIGHT - PAD - Math.min(1, Math.max(0, values[0] ?? 0)) * usableHeight}
            r="3"
            className="sparkline-dot"
          />
        </>
      ) : (
        <polyline points={points.join(" ")} className="sparkline-line" />
      )}
    </svg>
  );
}
