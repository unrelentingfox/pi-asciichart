import { readFileSync } from "node:fs";

export interface ChartConfig {
	resizeDebounceMs: number;
}

const DEFAULT_RESIZE_DEBOUNCE_MS = 1_000;

export function loadConfig(path = new URL("./config.json", import.meta.url)): ChartConfig {
	try {
		const value = JSON.parse(readFileSync(path, "utf8")) as { resizeDebounceMs?: unknown };
		return { resizeDebounceMs: validDebounce(value.resizeDebounceMs) };
	} catch {
		return { resizeDebounceMs: DEFAULT_RESIZE_DEBOUNCE_MS };
	}
}

function validDebounce(value: unknown): number {
	return Number.isInteger(value) && Number(value) >= 0 ? Number(value) : DEFAULT_RESIZE_DEBOUNCE_MS;
}
