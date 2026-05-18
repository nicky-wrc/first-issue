export function buildIssueSearchQuery(options: {
  label: string;
  lang?: string;
  minStars?: number;
  ageDays?: number;
}): string {
  const labelText = options.label.replace(/-/g, " ");
  const parts = [
    "is:issue",
    "is:open",
    "no:assignee",
    `label:"${labelText}"`,
  ];

  if (options.lang) parts.push(`language:${options.lang}`);
  if (options.minStars && options.minStars > 0) {
    parts.push(`stars:>=${options.minStars}`);
  }
  if (options.ageDays && options.ageDays > 0) {
    const since = new Date();
    since.setDate(since.getDate() - options.ageDays);
    parts.push(`created:>=${since.toISOString().slice(0, 10)}`);
  }

  return parts.join(" ");
}
