const BASE_URL =
    "https://runtime.fivem.net/artifacts/fivem/build_server_windows/master/";

export interface ArtifactOption {
  type: "official" | "custom";
  tags: string[];
  url: string;
  version: string;
}

export function mergeAndSortArtifacts(
  official: ArtifactOption[],
  manual: ArtifactOption[]
): ArtifactOption[] {
  const merged = [...official, ...manual];
  return merged.sort((a, b) => {
    const va = parseInt(a.version, 10);
    const vb = parseInt(b.version, 10);
    if (!Number.isNaN(va) && !Number.isNaN(vb)) {
      return vb - va;
    }
    return String(b.version).localeCompare(String(a.version));
  });
}

export async function fetchArtifacts(
    fetchFn: typeof fetch,
): Promise<ArtifactOption[]> {
    console.log("Fetching Artifacts");
    const res = await fetchFn(BASE_URL, {
        cf: { cacheTtl: 3600, cacheEverything: true },
    } as RequestInit);

    if (!res.ok) {
        throw new Error(
            `Failed to fetch artifacts: ${res.status} ${res.statusText}`,
        );
    }

    const html = await res.text();
    const linkRegex = /<a\s+class="[^"]*panel-block[^"]*"\s+href="([^"]+)"/g;

    const artifacts: ArtifactOption[] = [];
    let match: RegExpExecArray | null;

    while ((match = linkRegex.exec(html)) !== null) {
        const rawHref = match[1];
        const href = rawHref.replace("./", "");

        if (href === ".." || !href.includes("/")) continue;

        const url = BASE_URL + href;
        const version = href.split(/[/.-]/)[0] || "unknown";
        const isActive = match[0].includes("is-active");

        artifacts.push({
            type: "official",
            tags: isActive ? ["latest"] : [],
            url,
            version,
        });
    }

    if (artifacts.length === 0) {
        throw new Error("No artifacts found");
    }

    return artifacts;
}
