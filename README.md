# artifacts

FiveM Artifacts Public API on Cloudflare Workers. Returns artifact options in JSON format with aggressive caching. Official artifacts are merged with manual entries from `data/artifacts.json` and sorted by version (descending).

## Setup

```bash
bun install
```

## Development

```bash
npx wrangler dev
```

## Manual Artifacts

Add custom entries to `data/artifacts.json`. Each entry must have:

- `type`: `"custom"`
- `tags`: array of strings (e.g. `["stable"]`)
- `url`: download URL
- `version`: version string (used for sorting, numeric preferred)

## Deployment

```bash
npx wrangler deploy
```

This project was created using `bun init` in bun v1.3.0. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
