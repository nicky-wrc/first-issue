"use client";

import { Button } from "@/components/ui/button";

export type IssueFilters = {
  language: string;
  label: string;
  minStars: string;
  ageDays: string;
};

type FilterPanelProps = {
  filters: IssueFilters;
  onChange: (patch: Partial<IssueFilters>) => void;
  onSearch: () => void;
  loading?: boolean;
  total?: number | null;
};

const LANGUAGES = ["", "TypeScript", "JavaScript", "Python", "Go", "Rust", "Java"];
const LABELS = [
  { value: "good-first-issue", label: "Good first issue" },
  { value: "help-wanted", label: "Help wanted" },
];
const MIN_STARS = [
  { value: "", label: "Any stars" },
  { value: "50", label: "50+" },
  { value: "100", label: "100+" },
  { value: "500", label: "500+" },
  { value: "1000", label: "1k+" },
];
const AGE = [
  { value: "", label: "Any age" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
];

export function FilterPanel({
  filters,
  onChange,
  onSearch,
  loading,
  total,
}: FilterPanelProps) {
  return (
    <div className="space-y-3 rounded-xl border bg-card p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Language</span>
          <select
            className="h-9 rounded-lg border bg-background px-3 text-sm"
            value={filters.language}
            onChange={(e) => onChange({ language: e.target.value })}
          >
            <option value="">Any</option>
            {LANGUAGES.filter(Boolean).map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Label</span>
          <select
            className="h-9 rounded-lg border bg-background px-3 text-sm"
            value={filters.label}
            onChange={(e) => onChange({ label: e.target.value })}
          >
            {LABELS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Min repo stars</span>
          <select
            className="h-9 rounded-lg border bg-background px-3 text-sm"
            value={filters.minStars}
            onChange={(e) => onChange({ minStars: e.target.value })}
          >
            {MIN_STARS.map((item) => (
              <option key={item.value || "any"} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Issue age</span>
          <select
            className="h-9 rounded-lg border bg-background px-3 text-sm"
            value={filters.ageDays}
            onChange={(e) => onChange({ ageDays: e.target.value })}
          >
            {AGE.map((item) => (
              <option key={item.value || "any"} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button onClick={onSearch} disabled={loading}>
          {loading ? "Loading..." : "Search issues"}
        </Button>
        {total != null && (
          <p className="text-sm text-muted-foreground">
            {total.toLocaleString()} issues found
          </p>
        )}
      </div>
    </div>
  );
}
