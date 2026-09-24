import type { Component } from "@earendil-works/pi-tui";
import { renderChart, type ChartSeries, type ChartSpec } from "./renderers.ts";

export interface Scheduler {
	set(callback: () => void, delayMs: number): ReturnType<typeof setTimeout>;
	clear(timer: ReturnType<typeof setTimeout>): void;
}

const defaultScheduler: Scheduler = {
	set(callback, delayMs) {
		const timer = setTimeout(callback, delayMs);
		timer.unref?.();
		return timer;
	},
	clear: clearTimeout,
};

export class ResponsiveChart implements Component {
	private cachedLines: string[] = [];
	private renderedWidth = 0;
	private requestedWidth = 0;
	private timer?: ReturnType<typeof setTimeout>;
	private readonly spec: ChartSpec;
	private readonly debounceMs: number;
	private readonly requestRender: () => void;
	private readonly scheduler: Scheduler;

	constructor(spec: ChartSpec, debounceMs: number, requestRender: () => void, scheduler: Scheduler = defaultScheduler) {
		this.spec = spec;
		this.debounceMs = debounceMs;
		this.requestRender = requestRender;
		this.scheduler = scheduler;
	}

	render(width: number): string[] {
		const normalizedWidth = Math.max(1, width);
		if (this.renderedWidth === 0) this.renderNow(normalizedWidth);
		else if (normalizedWidth !== this.requestedWidth) this.scheduleRender(normalizedWidth);
		return this.cachedLines;
	}

	invalidate(): void {
		this.renderedWidth = 0;
		this.cancelTimer();
	}

	private scheduleRender(width: number): void {
		this.requestedWidth = width;
		this.cancelTimer();
		this.timer = this.scheduler.set(() => {
			this.timer = undefined;
			this.renderNow(this.requestedWidth);
			this.requestRender();
		}, this.debounceMs);
	}

	private renderNow(width: number): void {
		this.requestedWidth = width;
		this.renderedWidth = width;
		try {
			this.cachedLines = renderChart(resizeSpec(this.spec, width)).split("\n");
		} catch {
			this.cachedLines = ["[chart render error]"];
		}
	}

	private cancelTimer(): void {
		if (this.timer === undefined) return;
		this.scheduler.clear(this.timer);
		this.timer = undefined;
	}
}

export function resizeSpec(spec: ChartSpec, componentWidth: number): ChartSpec {
	if (!spec?.series) return spec;
	const plotWidth = availablePlotWidth(componentWidth);
	return { ...spec, series: spec.series.map((series) => resizeSeries(series, plotWidth)) };
}

export function availablePlotWidth(componentWidth: number): number {
	return Math.max(2, componentWidth - 13);
}

function resizeSeries(series: ChartSeries, width: number): ChartSeries {
	if (series.values.length === width) return series;
	return {
		...series,
		values: width > series.values.length ? interpolate(series.values, width) : downsample(series.values, width),
	};
}

function interpolate(values: number[], width: number): number[] {
	if (values.length === 1) return Array(width).fill(values[0]);
	return Array.from({ length: width }, (_unused, index) => {
		const position = (index * (values.length - 1)) / (width - 1);
		const left = Math.floor(position);
		const right = Math.min(values.length - 1, left + 1);
		const fraction = position - left;
		return values[left] + (values[right] - values[left]) * fraction;
	});
}

function downsample(values: number[], width: number): number[] {
	if (width === 2) return [values[0], values.at(-1)!];
	const result = [values[0]];
	const bucketCount = width - 2;
	for (let bucket = 0; bucket < bucketCount; bucket++) {
		const start = 1 + Math.floor((bucket * (values.length - 2)) / bucketCount);
		const end = 1 + Math.floor(((bucket + 1) * (values.length - 2)) / bucketCount);
		result.push(selectExtreme(values.slice(start, Math.max(start + 1, end)), result.at(-1)!));
	}
	result.push(values.at(-1)!);
	return result;
}

function selectExtreme(values: number[], previous: number): number {
	return values.reduce((selected, value) =>
		Math.abs(value - previous) > Math.abs(selected - previous) ? value : selected,
	);
}
