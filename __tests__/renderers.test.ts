import assert from "node:assert/strict";
import test from "node:test";
import { renderChart } from "../src/renderers.ts";

const stripAnsi = (text: string): string => text.replace(/\x1b\[[0-9;]*m/g, "");

test("renders a labeled line chart", () => {
	const chart = renderChart({
		type: "line",
		caption: "Requests",
		series: [{ name: "success", values: [1, 3, 2] }],
		height: 2,
		precision: 0,
	});
	const stripped = stripAnsi(chart);

	assert.equal(
		stripped,
		[
			"Requests",
			"● success",
			"          3 ┤╭╮ ",
			"          2 ┤│╰ ",
			"          1 ┼╯  ",
		].join("\n"),
	);
});

test("renders multiple series with distinct legend symbols", () => {
	const chart = renderChart({
		type: "line",
		series: [
			{ name: "first", values: [0, 2] },
			{ name: "second", values: [2, 0] },
		],
		height: 2,
		precision: 0,
	});
	const stripped = stripAnsi(chart);

	assert.match(stripped, /● first.*○ second/);
	assert.match(stripped, /┼/);
});

test("keeps large magnitudes truthful and aligned", () => {
	const chart = renderChart({
		type: "line",
		series: [{ values: [1, 123456789012, 5] }],
		height: 3,
		precision: 0,
	});
	const stripped = stripAnsi(chart);
	const axisColumns = stripped.split("\n").map((line) => line.search(/[┤┼]/u));

	assert.equal(new Set(axisColumns).size, 1);
	assert.match(stripped, /1\.2346e\+11/);
	assert.doesNotMatch(stripped, /23456789012/);
});

test("uses fixed notation when it fits the label width", () => {
	const chart = renderChart({ type: "line", series: [{ values: [1, 1000] }], height: 2, precision: 0 });
	const stripped = stripAnsi(chart);

	assert.match(stripped, / {7}1000 [┤┼]/);
});

test("rejects invalid series values", () => {
	assert.throws(
		() => renderChart({ type: "line", series: [{ values: [1, Number.NaN] }] }),
		/contains a non-finite value/,
	);
});

test("rejects invalid bounds", () => {
	assert.throws(
		() => renderChart({ type: "line", series: [{ values: [1, 2] }], min: 2, max: 2 }),
		/Minimum must be less than maximum/,
	);
});

test("rejects more than 12 series", () => {
	assert.throws(
		() => renderChart({ type: "line", series: Array.from({ length: 13 }, () => ({ values: [1] })) }),
		/At most 12 series/,
	);
});
