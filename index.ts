import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { StringEnum } from "@earendil-works/pi-ai";
import { Text } from "@earendil-works/pi-tui";
import { Type } from "typebox";
import { loadConfig } from "./src/config.ts";
import { parseCsv } from "./src/csv.ts";
import { ResponsiveChart } from "./src/responsive-chart.ts";
import { type ChartSpec, type ChartSeries, type ChartType } from "./src/renderers.ts";

interface ChartDetails {
	type: ChartType;
	spec: ChartSpec;
}

interface LegacyChartDetails {
	type: ChartType;
	chart: string;
}

const seriesSchema = Type.Array(
	Type.Object({
		name: Type.Optional(Type.String({ maxLength: 80, description: "Series name shown in the legend" })),
		values: Type.Array(Type.Number(), { minItems: 1, description: "Numeric values in display order" }),
	}),
	{ minItems: 1, maxItems: 12 },
);

export default function piAsciichartExtension(pi: ExtensionAPI): void {
	const config = loadConfig();
	pi.registerTool({
		name: "render_chart",
		label: "Render Chart",
		description:
			"Display numeric series to the user as a plain-text chart. The chart is shown in the user interface only and is not returned to you, so never restate or redraw it. Provide data as structured series OR as a csv string, not both.",
		promptSnippet: "Display numeric data to the user as a plain-text chart",
		promptGuidelines: [
			"Use render_chart when a visual trend helps the user more than a table or numeric list.",
			"render_chart output is displayed directly to the user; do not repeat the chart in your reply.",
			"render_chart accepts data as structured series or as a csv string with auto-detected delimiters (comma, tab, semicolon, whitespace). Use csv when the data is already in tabular text.",
		],
		parameters: Type.Object({
			type: Type.Optional(StringEnum(["line"] as const, { description: "Chart type (default: line)" })),
			series: Type.Optional(seriesSchema),
			csv: Type.Optional(Type.String({ description: "CSV/TSV data string. Columns become series. A non-numeric header row is used for series names. Delimiters are auto-detected (comma, tab, semicolon, whitespace)." })),
			height: Type.Optional(Type.Integer({ minimum: 1, description: "Plot height in rows" })),
			min: Type.Optional(Type.Number({ description: "Fixed lower y-axis bound" })),
			max: Type.Optional(Type.Number({ description: "Fixed upper y-axis bound" })),
			precision: Type.Optional(
				Type.Integer({ minimum: 0, maximum: 10, description: "Y-axis decimal places (default: 2)" }),
			),
			caption: Type.Optional(Type.String({ maxLength: 200, description: "Caption displayed above the chart" })),
		}),

		async execute(_toolCallId, params) {
			const series = resolveSeries(params.series, params.csv);
			const spec: ChartSpec = { ...params, type: params.type ?? "line", series };
			const details: ChartDetails = { type: spec.type, spec };
			return {
				content: [{ type: "text", text: describeChart(spec) }],
				details,
			};
		},

		renderResult(result, { isPartial }, theme, context) {
			if (isPartial) return new Text(theme.fg("warning", "Rendering chart..."), 0, 0);
			const details = result.details as ChartDetails | LegacyChartDetails | undefined;
			if (!details) return new Text(theme.fg("error", "No chart produced"), 0, 0);
			if ("chart" in details) return new Text(details.chart, 0, 0);
			return new ResponsiveChart(details.spec, config.resizeDebounceMs, context.invalidate);
		},
	});
}

function resolveSeries(series: ChartSeries[] | undefined, csv: string | undefined): ChartSeries[] {
	if (series && csv) throw new Error("Provide series or csv, not both");
	if (csv) return parseCsv(csv);
	if (series) return series;
	throw new Error("Provide series or csv");
}

function describeChart(spec: ChartSpec): string {
	const points = spec.series.reduce((total, { values }) => total + values.length, 0);
	return `Displayed ${spec.type} chart to the user (${spec.series.length} series, ${points} points). The chart is visible to the user; do not repeat it.`;
}
