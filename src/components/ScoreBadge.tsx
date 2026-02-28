export function ScoreBadge({ score, label }: { score: number; label?: string }) {
  let color: string;
  if (score >= 80) color = "bg-green-100 text-green-800";
  else if (score >= 60) color = "bg-yellow-100 text-yellow-800";
  else if (score >= 40) color = "bg-orange-100 text-orange-800";
  else color = "bg-red-100 text-red-800";

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}
    >
      {label ? `${label}: ` : ""}
      {score}
    </span>
  );
}
