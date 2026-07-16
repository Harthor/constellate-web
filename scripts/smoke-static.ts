export {};

const baseUrl = (process.argv[2] ?? "http://127.0.0.1:4173").replace(/\/$/, "");

const pageRoutes = [
  "/",
  "/constellation-map/",
  "/constellation-map/?type=absence&view=cards",
  "/constellation-map/?type=chain&view=cards",
  "/constellation-map/?type=triangulation&view=cards",
  "/constellation-map/?type=convergence&view=cards",
  "/constellation-map/?type=spectrum&view=cards",
];

const dataRoutes = [
  "/data/summary.json",
  "/data/top-gaps.json",
  "/data/constellations.json",
];

async function fetchOk(path: string): Promise<Response> {
  const response = await fetch(`${baseUrl}${path}`);
  if (!response.ok) throw new Error(`${path} returned HTTP ${response.status}`);
  return response;
}

async function main(): Promise<void> {
try {
  const pages = await Promise.all(pageRoutes.map((route) => fetchOk(route)));
  const html = await Promise.all(pages.map((response) => response.text()));
  html.forEach((body, index) => {
    if (body.trim().length < 100) throw new Error(`${pageRoutes[index]} returned empty HTML`);
  });

  const homepage = html[0];
  for (const staleValue of ["Apr 21, 2026", "2,013 ideas", "63 gaps"]) {
    if (homepage.includes(staleValue)) {
      throw new Error(`Homepage still contains stale value: ${staleValue}`);
    }
  }
  if (!homepage.includes("Latest analysis")) {
    throw new Error("Homepage does not contain the latest-analysis label");
  }

  await Promise.all(
    dataRoutes.map(async (route) => {
      const response = await fetchOk(route);
      const value: unknown = await response.json();
      if (typeof value !== "object" || value === null) {
        throw new Error(`${route} did not return a JSON object`);
      }
    }),
  );

  const assetPaths = Array.from(
    homepage.matchAll(/(?:src|href)="([^"?]+\.(?:js|css))[^\"]*"/g),
    (match) => match[1],
  ).filter((path) => path.startsWith("/"));
  if (assetPaths.length === 0) throw new Error("No JavaScript or CSS assets found");
  await Promise.all([...new Set(assetPaths)].map((path) => fetchOk(path)));

  console.log(
    `Smoke test passed: ${pageRoutes.length} pages, ${dataRoutes.length} data files, ` +
      `${new Set(assetPaths).size} JS/CSS assets.`,
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
}

void main();
