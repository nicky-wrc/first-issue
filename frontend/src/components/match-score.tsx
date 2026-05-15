import { cn } from "@/lib/utils";

export function MatchScore({
  score,
  className,
}: {
  score: number;
  className?: string;
}) {
  const tone =
    score >= 75 ? "text-green-700 bg-green-50" : score >= 50 ? "text-amber-800 bg-amber-50" : "text-muted-foreground bg-muted";

  return (
    <span
      className={cn(
        "inline-flex min-w-12 items-center justify-center rounded-md px-2 py-1 text-xs font-semibold tabular-nums",
        tone,
        className,
      )}
    >
      {score}%
    </span>
  );
}
