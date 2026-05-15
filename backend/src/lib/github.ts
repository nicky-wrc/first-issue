const GITHUB_GRAPHQL_URL = "https://api.github.com/graphql";

export function getGitHubToken(accessToken?: string | null) {
  return accessToken ?? process.env.GITHUB_TOKEN ?? null;
}

export async function githubGraphql<T>(
  query: string,
  variables: Record<string, unknown>,
  accessToken?: string | null,
): Promise<T> {
  const token = getGitHubToken(accessToken);
  if (!token) {
    throw new Error("GitHub token is not configured");
  }

  const response = await fetch(GITHUB_GRAPHQL_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = (await response.json()) as {
    data?: T;
    errors?: { message: string }[];
  };

  if (!response.ok || json.errors?.length) {
    const message =
      json.errors?.map((e) => e.message).join(", ") ??
      `GitHub API error (${response.status})`;
    throw new Error(message);
  }

  if (!json.data) {
    throw new Error("GitHub API returned no data");
  }

  return json.data;
}
