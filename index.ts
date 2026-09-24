import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { StringEnum } from "@earendil-works/pi-ai";
import { Text } from "@earendil-works/pi-tui";
import { Type } from "typebox";
import { loadConfig } from "./src/config.ts";
import { ResponsiveChart } from "./src/responsive-chart.ts";
import { type ChartSpec, type ChartType } from "./src/renderers.ts";

interface ChartDetails {
	type: ChartType;
	spec: ChartSpec;
}

interface LegacyChartDetails {
	type: ChartType;
	chart: string;
}

export default function piAsciichartExtension(pi: ExtensionAPI): void {
	const config = loadConfig();
	pi.registerTool({
		name: "render_chart",
		label: "Render Chart",
		description:
			"Display numeric series to the user as a plain-text chart. The chart is shown in the user interface only and is not returned to you, so never restate or redraw it.",
		promptSnippet: "Display numeric data to the user as a plain-text chart",
		promptGuidelines: [
			"Use render_chart when a visual trend helps the user more than a table or numeric list.",
			"render_chart output is displayed directly to the user; do not repeat the chart in your reply.",
		],
		parameters: Type.Object({
			type: Type.Optional(StringEnum(["line"] as const, { description: "Chart type (default: line)" })),
			series: Type.Array(
				Type.Object({
					name: Type.Optional(Type.String({ maxLength: 80, description: "Series name shown in the legend" })),
					values: Type.Array(Type.Number(), {
						minItems: 1,
						maxItems: 1_000,
						description: "Numeric values in display order",
					}),
				}),
				{ minItems: 1, maxItems: 12 },
			),
			height: Type.Optional(Type.Integer({ minimum: 1, maximum: 40, description: "Plot height in rows" })),
			min: Type.Optional(Type.Number({ description: "Fixed lower y-axis bound" })),
			max: Type.Optional(Type.Number({ description: "Fixed upper y-axis bound" })),
			precision: Type.Optional(
				Type.Integer({ minimum: 0, maximum: 10, description: "Y-axis decimal places (default: 2)" }),
			),
			caption: Type.Optional(Type.String({ maxLength: 200, description: "Caption displayed above the chart" })),
		}),

		async execute(_toolCallId, params) {
			const spec = { ...params, type: params.type ?? "line" } as ChartSpec;
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

function describeChart(spec: ChartSpec): string {
	const points = spec.series.reduce((total, { values }) => total + values.length, 0);
	return `Displayed ${spec.type} chart to the user (${spec.series.length} series, ${points} points). The chart is visible to the user; do not repeat it.`;
}
