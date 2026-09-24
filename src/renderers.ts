import asciichart from "asciichart";

export type ChartType = "line";

const SERIES_COLORS = [
	asciichart.blue,
	asciichart.green,
	asciichart.red,
	asciichart.yellow,
	asciichart.magenta,
	asciichart.cyan,
	asciichart.lightblue,
	asciichart.lightgreen,
	asciichart.lightred,
	asciichart.lightyellow,
	asciichart.lightmagenta,
	asciichart.lightcyan,
];

const LEGEND_SYMBOLS = ["●", "○", "◆", "◇", "■", "□", "▲", "△", "★", "☆", "◎", "◉"];

export interface ChartSeries {
	name?: string;
	values: number[];
}

export interface ChartSpec {
	type: ChartType;
	series: ChartSeries[];
	height?: number;
	min?: number;
	max?: number;
	precision?: number;
	caption?: string;
}

type Renderer = (spec: ChartSpec) => string;

const LABEL_WIDTH = 11;

const renderers: Record<ChartType, Renderer> = {
	line: renderLineChart,
};

export function renderChart(spec: ChartSpec): string {
	validateSpec(spec);
	return renderers[spec.type](spec);
}

function renderLineChart(spec: ChartSpec): string {
	const values = spec.series.map((series) => series.values);
	const colors = SERIES_COLORS.slice(0, spec.series.length);
	const chart = asciichart.plot(values.length === 1 ? values[0] : values, {
		height: spec.height,
		min: spec.min,
		max: spec.max,
		colors,
		format: formatLabel(spec.precision ?? 2),
	});
	return [spec.caption, renderLegend(spec.series), chart].filter(Boolean).join("\n");
}

function formatLabel(precision: number): (value: number) => string {
	return (value) => fitLabel(value, precision).padStart(LABEL_WIDTH);
}

function fitLabel(value: number, precision: number): string {
	const fixed = value.toFixed(precision);
	if (fixed.length <= LABEL_WIDTH) return fixed;
	for (let digits = LABEL_WIDTH - 7; digits >= 0; digits--) {
		const scientific = value.toExponential(digits);
		if (scientific.length <= LABEL_WIDTH) return scientific;
	}
	return value.toExponential(0);
}

function renderLegend(series: ChartSeries[]): string {
	if (!series.some(({ name }) => name)) return "";
	return series
		.map(({ name }, index) => {
			const color = SERIES_COLORS[index % SERIES_COLORS.length];
			const symbol = LEGEND_SYMBOLS[index % LEGEND_SYMBOLS.length];
			return `${color}${symbol}${asciichart.reset} ${name ?? `series ${index + 1}`}`;
		})
		.join("  ");
}

function validateSpec(spec: ChartSpec): void {
	if (spec.series.length === 0) throw new Error("At least one series is required");
	for (const [index, series] of spec.series.entries()) validateSeries(series, index);
	if (spec.height !== undefined && (!Number.isInteger(spec.height) || spec.height < 1)) {
		throw new Error("Height must be a positive integer");
	}
	if (spec.precision !== undefined && (!Number.isInteger(spec.precision) || spec.precision < 0 || spec.precision > 10)) {
		throw new Error("Precision must be an integer from 0 to 10");
	}
	if (spec.min !== undefined && spec.max !== undefined && spec.min >= spec.max) {
		throw new Error("Minimum must be less than maximum");
	}
}

function validateSeries(series: ChartSeries, index: number): void {
	if (series.values.length === 0) throw new Error(`Series ${index + 1} is empty`);
	if (series.values.some((value) => !Number.isFinite(value))) {
		throw new Error(`Series ${index + 1} contains a non-finite value`);
	}
}
