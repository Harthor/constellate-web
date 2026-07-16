import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { parsePipelineData } from "../lib/data-schema";
import { buildDerivedData } from "../lib/derived-data";

const sourcePath = resolve(process.cwd(), process.argv[2] ?? "public/data.json");
const outputDirectory = resolve(process.cwd(), "public/data");

function writeJsonAtomically(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  const temporaryPath = `${path}.tmp`;
  writeFileSync(temporaryPath, `${JSON.stringify(value)}\n`, "utf8");
  renameSync(temporaryPath, path);
}

try {
  const source: unknown = JSON.parse(readFileSync(sourcePath, "utf8"));
  const derived = buildDerivedData(parsePipelineData(source));

  writeJsonAtomically(resolve(outputDirectory, "summary.json"), derived.summary);
  writeJsonAtomically(resolve(outputDirectory, "top-gaps.json"), derived.topGaps);
  writeJsonAtomically(
    resolve(outputDirectory, "constellations.json"),
    derived.constellations,
  );

  console.log(
    `Generated public data: ${derived.summary.metadata.total_ideas} ideas, ` +
      `${derived.summary.metadata.constellations_found} constellations, ` +
      `${derived.topGaps.gaps.length} featured gaps.`,
  );
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Could not generate derived public data from ${sourcePath}: ${message}`);
  process.exit(1);
}
