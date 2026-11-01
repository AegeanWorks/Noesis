interface ProgressBarProps {
  current: number;
  total: number;
  label: string;
}

export function ProgressBar({ current, total, label }: ProgressBarProps) {
  const safeTotal = Math.max(1, total);
  const percent = Math.min(100, Math.max(0, (current / safeTotal) * 100));
  return (
    <div className="progress-block">
      <div className="progress-label">
        <span>{label}</span>
        <span>
          {current} / {total}
        </span>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={current}
        aria-label={label}
      >
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
