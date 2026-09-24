import assert from "node:assert/strict";
import test from "node:test";
import { availablePlotWidth, ResponsiveChart, resizeSpec, type Scheduler } from "../src/responsive-chart.ts";

class FakeScheduler implements Scheduler {
	callback?: () => void;
	delay?: number;
	clears = 0;

	set(callback: () => void, delayMs: number): ReturnType<typeof setTimeout> {
		this.callback = callback;
		this.delay = delayMs;
		return 1 as unknown as ReturnType<typeof setTimeout>;
	}

	clear(): void {
		this.clears++;
	}

	fire(): void {
		this.callback?.();
	}
}

const spec = { type: "line" as const, series: [{ values: [0, 10, 0] }], height: 4 };

test("uses available component width without a maximum cap", () => {
	assert.equal(availablePlotWidth(10_000), 9_987);
});

test("interpolates when the pane is wider", () => {
	const resized = resizeSpec(spec, 18);
	assert.deepEqual(resized.series[0].values, [0, 5, 10, 5, 0]);
});

test("preserves a peak when the pane is narrower", () => {
	const resized = resizeSpec(
		{ type: "line", series: [{ values: [0, 1, 20, 2, 3, 0] }] },
		16,
	);
	assert.deepEqual(resized.series[0].values, [0, 20, 0]);
});

test("renders immediately and debounces resize by the configured delay", () => {
	const scheduler = new FakeScheduler();
	let renders = 0;
	const component = new ResponsiveChart(spec, 1_000, () => renders++, scheduler);
	const initial = component.render(40);
	const stale = component.render(60);

	assert.deepEqual(stale, initial);
	assert.equal(scheduler.delay, 1_000);
	scheduler.fire();
	assert.equal(renders, 1);
	assert.notDeepEqual(component.render(60), initial);
});

test("repeated resize resets the debounce timer", () => {
	const scheduler = new FakeScheduler();
	const component = new ResponsiveChart(spec, 1_000, () => {}, scheduler);
	component.render(40);
	component.render(50);
	component.render(60);

	assert.equal(scheduler.clears, 1);
});
