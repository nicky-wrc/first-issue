"use client";

import { Button } from "@/components/ui/button";

type LanguageChipsProps = {
  languages: string[];
  activeLanguage: string;
  onSelect: (language: string) => void;
};

export function LanguageChips({
  languages,
  activeLanguage,
  onSelect,
}: LanguageChipsProps) {
  if (languages.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground">Your stack:</span>
      {languages.slice(0, 5).map((lang) => (
        <Button
          key={lang}
          size="sm"
          variant={activeLanguage === lang ? "default" : "outline"}
          onClick={() => onSelect(lang)}
        >
          {lang}
        </Button>
      ))}
      {activeLanguage && (
        <Button size="sm" variant="ghost" onClick={() => onSelect("")}>
          Clear
        </Button>
      )}
    </div>
  );
}
