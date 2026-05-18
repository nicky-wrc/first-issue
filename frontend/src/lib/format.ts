export function formatIssueAge(isoDate: string): string {
  const created = new Date(isoDate).getTime();
  const days = Math.floor((Date.now() - created) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} mo ago`;
  return `${Math.floor(months / 12)} yr ago`;
}

export function formatRelativeDate(isoDate: string): string {
  const then = new Date(isoDate).getTime();
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(isoDate).toLocaleDateString();
}

export function formatStars(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return String(count);
}
