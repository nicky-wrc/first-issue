import { cn } from "@/lib/utils";

const STYLES = {
  easy: "bg-green-50 text-green-800",
  medium: "bg-amber-50 text-amber-800",
  hard: "bg-red-50 text-red-700",
} as const;

export function DifficultyBadge({
  difficulty,
  className,
}: {
  difficulty: "easy" | "medium" | "hard";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2 py-0.5 text-xs font-medium capitalize",
        STYLES[difficulty],
        className,
      )}
    >
      {difficulty}
    </span>
  );
}
