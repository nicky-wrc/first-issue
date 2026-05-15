"use client";

import { Button } from "@/components/ui/button";

type FilterPanelProps = {
  language: string;
  label: string;
  onLanguageChange: (value: string) => void;
  onLabelChange: (value: string) => void;
  onSearch: () => void;
  loading?: boolean;
};

const LANGUAGES = ["", "TypeScript", "JavaScript", "Python", "Go", "Rust", "Java"];
const LABELS = [
  { value: "good-first-issue", label: "Good first issue" },
  { value: "help-wanted", label: "Help wanted" },
];

export function FilterPanel({
  language,
  label,
  onLanguageChange,
  onLabelChange,
  onSearch,
  loading,
}: FilterPanelProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-end">
      <label className="flex flex-1 flex-col gap-1 text-sm">
        <span className="text-muted-foreground">Language</span>
        <select
          className="h-9 rounded-lg border bg-background px-3 text-sm"
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
        >
          <option value="">Any</option>
          {LANGUAGES.filter(Boolean).map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-1 flex-col gap-1 text-sm">
        <span className="text-muted-foreground">Label</span>
        <select
          className="h-9 rounded-lg border bg-background px-3 text-sm"
          value={label}
          onChange={(e) => onLabelChange(e.target.value)}
        >
          {LABELS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <Button onClick={onSearch} disabled={loading}>
        {loading ? "Searching..." : "Search issues"}
      </Button>
    </div>
  );
}
