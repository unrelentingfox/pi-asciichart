# pi-asciichart

[![npm version](https://img.shields.io/npm/v/pi-asciichart)](https://www.npmjs.com/package/pi-asciichart)
[![npm downloads](https://img.shields.io/npm/dm/pi-asciichart)](https://www.npmjs.com/package/pi-asciichart)
[![CI](https://img.shields.io/github/actions/workflow/status/unrelentingfox/pi-asciichart/ci.yml?branch=mainline&label=CI)](https://github.com/unrelentingfox/pi-asciichart/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/unrelentingfox/pi-asciichart/graph/badge.svg)](https://app.codecov.io/gh/unrelentingfox/pi-asciichart)
[![Node.js](https://img.shields.io/node/v/pi-asciichart)](https://www.npmjs.com/package/pi-asciichart)
[![License](https://img.shields.io/github/license/unrelentingfox/pi-asciichart)](https://github.com/unrelentingfox/pi-asciichart/blob/mainline/LICENSE)

Pi extension that registers `render_chart`, a tool that displays plain-text line
charts in the tool-result UI using
[asciichart](https://github.com/kroitor/asciichart).

Charts render in the tool-result interface only and do not enter model context.
The agent receives a short status line instead of the chart text.

## Install

Add the package to your Pi settings:

```json
{
  "packages": [
    "git:github.com/unrelentingfox/pi-asciichart"
  ]
}
```

For local development, use the path directly:

```json
{
  "packages": [
    "~/workplace/pi/pi-asciichart"
  ]
}
```

## Features

- Up to 12 series with distinct ANSI colors and legend symbols
- Responsive width: charts use the full pane width and redraw after resize
- Configurable trailing resize debounce (default 1000 ms)
- Linear interpolation when the pane is wider than the data
- Peak-preserving downsampling when narrower
- Scientific notation for overflow y-axis labels
- Renderer registry designed for future chart types

## Configuration

Place `config.json` next to the extension entry point:

```json
{
  "resizeDebounceMs": 1000
}
```

Non-negative integer values are accepted. Missing or invalid values use 1000 ms.

## Limits

- 12 series maximum (one distinct color/symbol pair each)
- 11-character y-axis label field (overflows switch to scientific notation)

Values per series and chart height are unconstrained.

## Examples

Single series:

```text
      18.00 ┤        ╭
      15.33 ┤      ╭╮│
      12.67 ┤    ╭╮│││
      10.00 ┤    │││╰╯
       7.33 ┤╭╮╭╮│╰╯
       4.67 ┤│││╰╯
       2.00 ┼╯╰╯
```

Multi-series with legend:

```text
Weekly signups
● organic  ○ paid
        110 ┤          ╭
        100 ┤        ╭╮│
         90 ┤        │╰╯
         80 ┤      ╭─╯
         70 ┤    ╭─╯
         60 ┤  ╭─╯
         50 ┼──╯
         40 ┤         ╭╮
         30 ┤     ╭─╮╭╯╰
         20 ┤╭╮╭──╯ ╰╯
         10 ┼╯╰╯
```

Tool input:

```json
{
  "type": "line",
  "caption": "Weekly signups",
  "series": [
    { "name": "organic", "values": [45, 52, 48, 61, 58, 73, 69, 82, 77, 95, 88, 110] },
    { "name": "paid", "values": [12, 15, 10, 18, 22, 19, 25, 28, 20, 32, 35, 30] }
  ],
  "height": 10,
  "precision": 0
}
```

## Development

```bash
npm install
npm test
npm run typecheck
```

## License

MIT
