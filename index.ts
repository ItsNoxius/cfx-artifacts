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

const app = new Hono<{ Bindings: Env }>();

app.use("/*", cors({ origin: "*" }));

app.get(
  "/",
  cache({
    cacheName: "artifacts-api",
    cacheControl:
      "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
  }),
  async (c) => {
    try {
      const official = await fetchArtifacts(fetch);
      const artifacts = mergeAndSortArtifacts(
        official,
        manualArtifacts as ArtifactOption[]
      );
      return c.json(artifacts);
    } catch (err) {
      return c.json(
        { error: err instanceof Error ? err.message : "Failed to fetch artifacts" },
        502
      );
    }
  }
);

export default app;
