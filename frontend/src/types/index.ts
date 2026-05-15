export type IssueSummary = {
  id: string;
  title: string;
  url: string;
  repoName: string;
  language: string | null;
  labels: string[];
  createdAt: string;
  commentCount: number;
};
