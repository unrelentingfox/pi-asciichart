import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { loadConfig } from "../src/config.ts";

test("loads a configured resize debounce", () => {
	const path = configFile({ resizeDebounceMs: 250 });
	assert.equal(loadConfig(path).resizeDebounceMs, 250);
});

test("uses one second for invalid configuration", () => {
	const path = configFile({ resizeDebounceMs: -1 });
	assert.equal(loadConfig(path).resizeDebounceMs, 1_000);
});

test("uses one second for missing configuration", () => {
	assert.equal(loadConfig(join(tmpdir(), "missing-chart-config.json")).resizeDebounceMs, 1_000);
});

function configFile(value: unknown): string {
	const path = join(mkdtempSync(join(tmpdir(), "ascii-chart-")), "config.json");
	writeFileSync(path, JSON.stringify(value));
	return path;
}
