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
    manual: ArtifactOption[],
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
    const cacheKey = new Request(BASE_URL);
    const cache = caches.default;

    let res = await cache.match(cacheKey);

    if (!res) {
        const fetchRes = await fetchFn(BASE_URL, {
            cf: { cacheTtl: 3600, cacheEverything: true },
        } as RequestInit);

        if (!fetchRes.ok) {
            throw new Error(
                `Failed to fetch artifacts: ${fetchRes.status} ${fetchRes.statusText}`,
            );
        }

        const forCache = fetchRes.clone();
        const resToCache = new Response(forCache.body, {
            status: fetchRes.status,
            statusText: fetchRes.statusText,
            headers: new Headers(fetchRes.headers),
        });
        resToCache.headers.set(
            "Cache-Control",
            "public, max-age=3600, s-maxage=3600",
        );
        await cache.put(cacheKey, resToCache);

        res = fetchRes;
    }

    const html = await res.text();
    const linkRegex = /<a\s+class="[^"]*panel-block[^"]*"\s+href="([^"]+)"/g;

    const artifacts: ArtifactOption[] = [];
    let match: RegExpExecArray | null;

    while ((match = linkRegex.exec(html)) !== null) {
        const rawHref = match[1];
        if (!rawHref) continue;
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
