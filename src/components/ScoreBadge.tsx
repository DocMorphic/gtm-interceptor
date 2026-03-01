"use client";

export function ScoreBadge({ score, label, size = "md" }: { score: number; label?: string; size?: "sm" | "md" }) {
  const radius = size === "sm" ? 16 : 20;
  const stroke = size === "sm" ? 3 : 3.5;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const svgSize = (radius + stroke) * 2;

  let ringColor = "";
  let textColor = "";

  if (score >= 80) {
    ringColor = "stroke-emerald-500";
    textColor = "text-emerald-600";
  } else if (score >= 60) {
    ringColor = "stroke-amber-400";
    textColor = "text-amber-600";
  } else if (score >= 40) {
    ringColor = "stroke-orange-400";
    textColor = "text-orange-600";
  } else {
    ringColor = "stroke-rose-500";
    textColor = "text-rose-600";
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative" style={{ width: svgSize, height: svgSize }}>
        <svg width={svgSize} height={svgSize} className="-rotate-90">
          <circle
            cx={radius + stroke}
            cy={radius + stroke}
            r={radius}
            fill="none"
            stroke="#f3f4f6"
            strokeWidth={stroke}
          />
          <circle
            cx={radius + stroke}
            cy={radius + stroke}
            r={radius}
            fill="none"
            className={`${ringColor} score-ring`}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center font-semibold ${textColor} ${size === "sm" ? "text-[10px]" : "text-xs"}`}>
          {score}
        </span>
      </div>
      {label && (
        <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">{label}</span>
      )}
    </div>
  );
}
