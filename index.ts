import { Hono } from "hono";
import { cache } from "hono/cache";
import { cors } from "hono/cors";
import {
    type ArtifactOption,
    fetchArtifacts,
    mergeAndSortArtifacts,
} from "./lib/artifacts";
import manualArtifacts from "./data/artifacts.json";

type Env = Record<string, never>;

const CACHE_CONTROL =
    "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400";

const app = new Hono<{ Bindings: Env }>();

app.use("/*", cors({ origin: "*" }));

app.get(
    "/",
    cache({
        cacheName: "artifacts-api",
        cacheControl: CACHE_CONTROL,
        keyGenerator: (c) => new URL(c.req.url).pathname,
    }),
    async (c) => {
        try {
            const official = await fetchArtifacts(fetch);
            const artifacts = mergeAndSortArtifacts(
                official,
                manualArtifacts as ArtifactOption[],
            );
            const response = c.json(artifacts);
            response.headers.set("Cache-Control", CACHE_CONTROL);
            return response;
        } catch (err) {
            return c.json(
                {
                    error:
                        err instanceof Error
                            ? err.message
                            : "Failed to fetch artifacts",
                },
                502,
            );
        }
    },
);

export default app;
