import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { validatePipelineData } from "../lib/data-schema";

const dataPath = resolve(process.cwd(), process.argv[2] ?? "public/data.json");

try {
  const parsed: unknown = JSON.parse(readFileSync(dataPath, "utf8"));
  const result = validatePipelineData(parsed);
  if (!result.success) {
    console.error(`Invalid data file: ${dataPath}`);
    for (const error of result.errors.slice(0, 20)) console.error(`- ${error}`);
    if (result.errors.length > 20) {
      console.error(`- ...and ${result.errors.length - 20} more errors`);
    }
    process.exit(1);
  }

  console.log(
    `Validated ${dataPath}: ${result.data.metadata.total_ideas} ideas, ` +
      `${result.data.constellations.length} constellations, ${result.data.patterns.length} patterns.`,
  );
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Could not validate ${dataPath}: ${message}`);
  process.exit(1);
}
