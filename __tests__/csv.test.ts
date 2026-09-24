import assert from "node:assert/strict";
import test from "node:test";
import { parseCsv } from "../src/csv.ts";

test("parses comma-delimited CSV with headers", () => {
	const series = parseCsv("revenue,costs\n100,80\n120,90\n140,95");
	assert.equal(series.length, 2);
	assert.equal(series[0].name, "revenue");
	assert.deepEqual(series[0].values, [100, 120, 140]);
	assert.equal(series[1].name, "costs");
	assert.deepEqual(series[1].values, [80, 90, 95]);
});

test("skips a non-numeric first column", () => {
	const series = parseCsv("month,revenue,costs\nJan,100,80\nFeb,120,90");
	assert.equal(series.length, 2);
	assert.equal(series[0].name, "revenue");
	assert.deepEqual(series[0].values, [100, 120]);
});

test("parses tab-delimited data", () => {
	const series = parseCsv("a\tb\n1\t2\n3\t4");
	assert.equal(series.length, 2);
	assert.equal(series[0].name, "a");
	assert.deepEqual(series[0].values, [1, 3]);
});

test("parses semicolon-delimited data", () => {
	const series = parseCsv("1;2;3\n4;5;6");
	assert.equal(series.length, 3);
	assert.deepEqual(series[0].values, [1, 4]);
});

test("parses whitespace-delimited data", () => {
	const series = parseCsv("day  visits\n1  100\n2  200");
	assert.equal(series.length, 2);
	assert.equal(series[0].name, "day");
	assert.deepEqual(series[1].values, [100, 200]);
});

test("parses headerless numeric data", () => {
	const series = parseCsv("10,20\n30,40");
	assert.equal(series.length, 2);
	assert.equal(series[0].name, undefined);
	assert.deepEqual(series[0].values, [10, 30]);
});

test("handles CRLF line endings", () => {
	const series = parseCsv("a,b\r\n1,2\r\n3,4");
	assert.equal(series.length, 2);
	assert.deepEqual(series[0].values, [1, 3]);
});

test("skips blank lines", () => {
	const series = parseCsv("1,2\n\n3,4\n\n");
	assert.deepEqual(series[0].values, [1, 3]);
});

test("rejects empty CSV", () => {
	assert.throws(() => parseCsv(""), /CSV is empty/);
	assert.throws(() => parseCsv("  \n  \n"), /CSV is empty/);
});

test("rejects non-numeric values in data rows", () => {
	assert.throws(() => parseCsv("a,b\n1,foo"), /Non-numeric value "foo"/);
});

test("rejects missing cells", () => {
	assert.throws(() => parseCsv("1,2\n3,"), /Missing value/);
});
