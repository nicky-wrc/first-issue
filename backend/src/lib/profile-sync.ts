import { cacheGet, cacheSet } from "./redis.js";
import { githubGraphql } from "./github.js";
import { inferSkillLevel } from "./skills.js";

type RepoLanguagesResponse = {
  viewer: {
    repositories: {
      nodes: {
        name: string;
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
          languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
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

  const repos = data.viewer.repositories.nodes;
  const languageTotals = new Map<string, number>();

  for (const repo of repos) {
    for (const edge of repo.languages.edges) {
      languageTotals.set(
        edge.node.name,
        (languageTotals.get(edge.node.name) ?? 0) + edge.size,
      );
    }
  }

  const languages = Array.from(languageTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name]) => name);

  const result: SyncResult = {
    languages,
    skillLevel: inferSkillLevel(languages.length, repos.length),
    repoCount: repos.length,
  };

  await cacheSet(cacheKey, result, 3600);
  return result;
}
