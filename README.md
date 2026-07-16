# Constellate Web

Static frontend for [Constellate](https://constellate.fyi) — the hidden patterns in what you are already reading.

## Architecture

Constellate Web is a Next.js 16 App Router project exported as static HTML, CSS, JavaScript, JSON, and social-card images. It has no API routes, database connection, permanent backend, or paid hosting requirement. `public/data.json` is the canonical pipeline snapshot; the UI reads smaller files generated from it during prebuild.

Static delivery does not mean frozen data. A maintainer can publish a new validated snapshot manually and deploy it; each release exposes the analysis timestamp embedded in `metadata.generated_at`. No weekly scheduler is configured in this repository.

Routes:

- `/` — featured absences and project explanation
- `/constellation-map/` — filterable cards and interactive force-directed graph

## Local development

```bash
npm ci
npm run dev
```

Open <http://localhost:3000>.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

`npm run dev` and `npm run build` run `npm run generate:data` first. Generation validates the canonical snapshot, so invalid JSON, missing metadata, inconsistent counts, unknown constellation types, or references to missing ideas stop the command before anything can be served or deployed. A successful build is written to `out/` and contains no server route.

## Data

`public/data.json` must use the output schema shared with [constellate-engine](https://github.com/Harthor/constellate-engine):

- `constellations`: detected chains, triangulations, convergences, absences, and spectra
- `patterns`: cluster-level emergent patterns
- `ideas`: idea records keyed by numeric ID
- `metadata`: counts, cache/API call totals, estimated cost, and elapsed time

The prebuild writes these disposable, deterministic files:

- `public/data/summary.json` — snapshot metadata and source list for the landing page
- `public/data/top-gaps.json` — the 12 featured absences and only their compact idea references
- `public/data/constellations.json` — every constellation plus one compact record per referenced idea for the map

The canonical `public/data.json` remains public for compatibility, but it is not serialized into the landing-page HTML and the map does not download it.

Do not copy files manually in production. Use the engine repository's guarded publication command:

```bash
cd ../constellate-engine
npm run publish-data -- --web-dir ../constellate-web
```

That command validates the candidate output, backs up the current dataset, copies it, builds this frontend, and rolls the copy back if the build fails. It does not commit or push.

## Weekly digest status

The site does not currently collect email addresses and makes no delivery-frequency promise. To activate a digest, configure an email provider or consent-aware list store, verify the sender domain, publish privacy and unsubscribe handling, and add a monitored scheduler that sends only after a verified snapshot is deployed. Until those pieces exist, the UI links to GitHub and says **Weekly digest coming soon**.

## Free deployment on Vercel

Vercel Hobby can serve this project as a static Next.js export for USD 0 under normal Hobby limits.

Dashboard setup:

1. In Vercel, choose **Add New → Project** and import `Harthor/constellate-web`.
2. Leave **Framework Preset** as **Next.js** and **Root Directory** as `./`.
3. Leave **Build Command** and **Output Directory** on their detected defaults. The repository's `npm run build` produces `out/` through `output: "export"`.
4. Do not add Supabase or Anthropic environment variables. `NEXT_PUBLIC_SITE_URL` is optional and defaults to `https://constellate.fyi`.
5. Deploy the generated Vercel URL and verify `/`, `/constellation-map/`, `/data/summary.json`, `/data/top-gaps.json`, `/data/constellations.json`, `/icon.svg`, and the JavaScript/CSS assets before attaching the custom domain.

CLI alternative after authenticating:

```bash
npx vercel@latest login
npx vercel@latest
# Verify the preview URL first, then:
npx vercel@latest --prod
```

Do not change DNS until the Vercel production URL is returning HTTP 200 with the real dataset.

## License

See `LICENSE`.
