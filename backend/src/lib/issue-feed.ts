import { buildIssueSearchQuery } from "./issue-search.js";
import { githubGraphql } from "./github.js";

export type FeedIssue = {
  id: string;
  title: string;
  url: string;
  repoName: string;
  language: string | null;
  stars: number;
  labels: string[];
  createdAt: string;
  commentCount: number;
};

type SearchIssuesResponse = {
  search: {
    nodes: {
      id: string;
      title: string;
      url: string;
      createdAt: string;
      comments: { totalCount: number };
      repository: {
        nameWithOwner: string;
        stargazerCount: number;
        primaryLanguage: { name: string } | null;
      };
      labels: { nodes: { name: string }[] };
    }[];
  };
};

const SEARCH_ISSUES_QUERY = `
  query SearchIssues($query: String!, $first: Int!) {
    search(type: ISSUE, query: $query, first: $first) {
      nodes {
        ... on Issue {
          id
          title
          url
          createdAt
          comments { totalCount }
          repository {
            nameWithOwner
            stargazerCount
            primaryLanguage { name }
          }
          labels(first: 10) { nodes { name } }
        }
      }
    }
  }
`;

function mapIssue(node: SearchIssuesResponse["search"]["nodes"][0]): FeedIssue {
  return {
    id: node.id,
    title: node.title,
    url: node.url,
    repoName: node.repository.nameWithOwner,
    language: node.repository.primaryLanguage?.name ?? null,
    stars: node.repository.stargazerCount,
    labels: node.labels.nodes.map((l) => l.name),
    createdAt: node.createdAt,
    commentCount: node.comments.totalCount,
  };
}

export async function searchFeedIssues(
  options: {
    label?: string;
    languages?: string[];
    limit?: number;
  },
  accessToken?: string | null,
): Promise<FeedIssue[]> {
  const limit = options.limit ?? 5;
  const label = options.label ?? "good-first-issue";
  const langs =
    options.languages && options.languages.length > 0
      ? options.languages.slice(0, 3)
      : [undefined];

  const seen = new Set<string>();
  const results: FeedIssue[] = [];

  for (const lang of langs) {
    const query = buildIssueSearchQuery({ label, lang });
    const data = await githubGraphql<SearchIssuesResponse>(
      SEARCH_ISSUES_QUERY,
      { query, first: Math.min(limit, 10) },
      accessToken,
    );

    for (const node of data.search.nodes) {
      const issue = mapIssue(node);
      if (seen.has(issue.url)) continue;
      seen.add(issue.url);
      results.push(issue);
      if (results.length >= limit) return results;
    }
  }

  return results;
}
