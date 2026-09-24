# pi-asciichart

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

- 12 series maximum
- 1000 values per series
- 40 rows maximum height
- 11-character y-axis label field

## Example

```json
{
  "type": "line",
  "caption": "Weekly requests",
  "series": [
    { "name": "success", "values": [12, 18, 15, 24] },
    { "name": "failure", "values": [3, 2, 5, 1] }
  ],
  "height": 8,
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
