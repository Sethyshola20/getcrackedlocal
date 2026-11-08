import type { LucideIcon } from "lucide-react";

export function Stat({
  label,
  value,
  icon: Icon,
  sub,
  suffix,
  progress,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  sub: string;
  suffix?: string;
  progress?: number;
}) {
  return (
    <div className="stat">
      <div className="stat-label">
        {label}
        <Icon size={16} />
      </div>
      <div className="stat-value">
        {value}
        {suffix && <span>{suffix}</span>}
      </div>
      <div className="stat-sub">
        {progress !== undefined && (
          <span className="mini-progress">
            <i style={{ width: `${progress * 100}%` }} />
          </span>
        )}
        {sub}
      </div>
    </div>
  );
}
