import { cacheGet, cacheSet } from "./redis.js";
import { githubGraphql } from "./github.js";
import { inferSkillLevel } from "./skills.js";

export type RepoSummary = {
  name: string;
  url: string;
  stars: number;
  languages: string[];
};

type RepoLanguagesResponse = {
  viewer: {
    repositories: {
      nodes: {
        name: string;
        url: string;
        stargazerCount: number;
        languages: { edges: { size: number; node: { name: string } }[] };
      }[];
    };
  };
};

const SYNC_REPOS_QUERY = `
  query SyncRepos {
    viewer {
      repositories(first: 30, ownerAffiliations: OWNER, orderBy: { field: UPDATED_AT, direction: DESC }) {
        nodes {
          name
          url
          stargazerCount
          languages(first: 5, orderBy: { field: SIZE, direction: DESC }) {
            edges { size node { name } }
          }
        }
      }
    }
  }
`;

export type SyncResult = {
  languages: string[];
  skillLevel: "beginner" | "intermediate" | "advanced";
  repoCount: number;
  repos: RepoSummary[];
};

export async function syncLanguagesFromGitHub(
  userId: string,
  accessToken?: string,
  options?: { skipCache?: boolean },
): Promise<SyncResult> {
  const cacheKey = `profile:sync:${userId}`;

  if (!options?.skipCache) {
    const cached = await cacheGet<SyncResult>(cacheKey);
    if (cached) return cached;
  }

  const data = await githubGraphql<RepoLanguagesResponse>(
    SYNC_REPOS_QUERY,
    {},
    accessToken,
  );

  const repoNodes = data.viewer.repositories.nodes;
  const languageTotals = new Map<string, number>();

  const repos: RepoSummary[] = repoNodes.map((repo) => {
    const languages = repo.languages.edges.map((e) => e.node.name);
    for (const edge of repo.languages.edges) {
      languageTotals.set(
        edge.node.name,
        (languageTotals.get(edge.node.name) ?? 0) + edge.size,
      );
    }
    return {
      name: repo.name,
      url: repo.url,
      stars: repo.stargazerCount,
      languages,
    };
  });

  const languages = Array.from(languageTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name]) => name);

  const result: SyncResult = {
    languages,
    skillLevel: inferSkillLevel(languages.length, repos.length),
    repoCount: repos.length,
    repos: repos.slice(0, 12),
  };

  await cacheSet(cacheKey, result, 3600);
  return result;
}
