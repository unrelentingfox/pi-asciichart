import type { ChartSeries } from "./renderers.ts";

export function parseCsv(csv: string): ChartSeries[] {
	const lines = csv.trim().split(/\r?\n/).filter((line) => line.trim() !== "");
	if (lines.length === 0) throw new Error("CSV is empty");

	const delimiter = detectDelimiter(lines[0]);
	const rows = lines.map((line) => splitRow(line, delimiter));
	const { headers, dataRows } = extractHeaders(rows);
	if (dataRows.length === 0) throw new Error("CSV has no data rows");

	const columnCount = dataRows[0].length;
	const firstNumericColumn = dataRows.every((row) => Number.isFinite(Number(row[0]))) ? 0 : 1;
	const series: ChartSeries[] = [];
	for (let col = firstNumericColumn; col < columnCount; col++) {
		const values = dataRows.map((row) => parseCell(row[col], col, dataRows.indexOf(row)));
		series.push({ name: headers?.[col], values });
	}
	return series;
}

function detectDelimiter(line: string): string {
	if (line.includes("\t")) return "\t";
	if (line.includes(",")) return ",";
	if (line.includes(";")) return ";";
	return /\s+/.test(line) ? "whitespace" : ",";
}

function splitRow(line: string, delimiter: string): string[] {
	if (delimiter === "whitespace") return line.trim().split(/\s+/);
	return line.split(delimiter).map((cell) => cell.trim());
}

function extractHeaders(rows: string[][]): { headers: string[] | undefined; dataRows: string[][] } {
	const first = rows[0];
	const isHeader = first.length > 0 && first.every((cell) => cell !== "" && Number.isNaN(Number(cell)));
	if (isHeader) return { headers: first, dataRows: rows.slice(1) };
	return { headers: undefined, dataRows: rows };
}

function parseCell(cell: string | undefined, column: number, row: number): number {
	if (cell === undefined || cell === "") throw new Error(`Missing value at row ${row + 1}, column ${column + 1}`);
	const value = Number(cell);
	if (!Number.isFinite(value)) throw new Error(`Non-numeric value "${cell}" at row ${row + 1}, column ${column + 1}`);
	return value;
}
