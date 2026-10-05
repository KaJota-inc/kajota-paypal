#!/usr/bin/env tsx
/**
 * Runs every failure-mode reproducer in `scripts/fail/*.ts` and prints a
 * gate table firing both ways: each row names a gate, its failing input,
 * and the stage at which the pipeline refused.
 *
 * Playbook move #6 — "make the adversarial cases runnable, not prose."
 * Mirrored by scripts/reproduce-paypal-mesh-flow.ts for the happy-path side.
 */

import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

const scripts = readdirSync(here)
  .filter((f) => f.endsWith(".ts") && !f.startsWith("_"))
  .sort();

type Row = {
  gate: string;
  outcome: "fired" | "missed";
  stage: string;
  stdout: string;
};
const rows: Row[] = [];

for (const script of scripts) {
  const path = join(here, script);
  const result = spawnSync("tsx", [path], {
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
  });
  const output = (result.stdout ?? "") + (result.stderr ?? "");
  const match = output.match(/✓ (\S+) — (gate fired at (\S+): .*|.*)/);
  rows.push({
    gate: script.replace(".ts", ""),
    outcome: result.status === 0 ? "fired" : "missed",
    stage: match?.[3] ?? "n/a",
    stdout: output.trim(),
  });
}

console.log("\n═══ Mesh × PayPal — gate table (adversarial side) ═══\n");
console.log("Gate                              │ Outcome │ Stage");
console.log("──────────────────────────────────┼─────────┼──────────────────");
for (const row of rows) {
  const gate = row.gate.padEnd(33);
  const outcome = (row.outcome === "fired" ? "✓ FIRED " : "✗ MISSED").padEnd(7);
  const stage = row.stage;
  console.log(`${gate} │ ${outcome} │ ${stage}`);
}

const missed = rows.filter((r) => r.outcome === "missed");
if (missed.length > 0) {
  console.error(`\n✗ ${missed.length}/${rows.length} gates missed:`);
  for (const row of missed) {
    console.error(`  ${row.gate}:\n${row.stdout.split("\n").map((l) => "    " + l).join("\n")}`);
  }
  process.exit(1);
}

console.log(
  `\n✓ ${rows.length}/${rows.length} gates fired. The pipeline refuses every adversarial input tested.`,
);
console.log(
  "Mirror of scripts/reproduce-paypal-mesh-flow.ts (happy path) + the on-chain",
);
console.log(
  "invariants in kajota-arbitrum-singapore/contracts/{CosellRegistryV2,CosellEscrowV2}.sol.",
);
