# Constellate Web

Static frontend for [Constellate](https://constellate.fyi) — the hidden patterns in what you are already reading.

## Architecture

Constellate Web is a Next.js 16 App Router project exported as static HTML, CSS, JavaScript, JSON, and social-card images. It has no API routes, database connection, permanent backend, or paid hosting requirement. The UI reads the generated pipeline result from `public/data.json`.

Static delivery does not mean frozen data: the engine regenerates a validated snapshot every 1–2 weeks, and each deployment exposes the analysis timestamp embedded in `metadata.generated_at`.

Routes:

- `/` — featured absences and project explanation
- `/constellation-map/` — filterable cards and interactive force-directed graph

## Local development

```bash
npm ci
npm run validate:data
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

`npm run build` always runs `npm run validate:data` first. Invalid JSON, missing required fields, unknown constellation types, or references to missing ideas stop the build before anything can be deployed. A successful build is written to `out/` and contains no server route.

## Data

`public/data.json` must use the output schema shared with [constellate-engine](https://github.com/Harthor/constellate-engine):

- `constellations`: detected chains, triangulations, convergences, absences, and spectra
- `patterns`: cluster-level emergent patterns
- `ideas`: idea records keyed by numeric ID
- `metadata`: counts, cache/API call totals, estimated cost, and elapsed time

Do not copy files manually in production. Use the engine repository's guarded publication command:

```bash
cd ../constellate-engine
npm run publish-data -- --web-dir ../constellate-web
```

That command validates the candidate output, backs up the current dataset, copies it, builds this frontend, and rolls the copy back if the build fails. It does not commit or push.

## Free deployment on Vercel

Vercel Hobby can serve this project as a static Next.js export for USD 0 under normal Hobby limits.

Dashboard setup:

1. In Vercel, choose **Add New → Project** and import `Harthor/constellate-web`.
2. Leave **Framework Preset** as **Next.js** and **Root Directory** as `./`.
3. Leave **Build Command** and **Output Directory** on their detected defaults. The repository's `npm run build` produces `out/` through `output: "export"`.
4. Do not add Supabase or Anthropic environment variables. `NEXT_PUBLIC_SITE_URL` is optional and defaults to `https://constellate.fyi`.
5. Deploy the generated Vercel URL and verify `/`, `/constellation-map/`, `/data.json`, `/icon.svg`, and the JavaScript/CSS assets before attaching the custom domain.

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
