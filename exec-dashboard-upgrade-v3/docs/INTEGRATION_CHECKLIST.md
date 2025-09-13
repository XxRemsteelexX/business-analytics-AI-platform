
# Integration Checklist

- [ ] Install `xlsx` (and `papaparse` if you also accept CSVs).
- [ ] Copy `lib/*.ts` and ensure import paths (`@/lib/...`) resolve in your project.
- [ ] Replace/merge `/api/upload/route.ts` to preserve original filename and expose `sheetNames`.
- [ ] Replace/merge `/api/analyze/route.ts` to enable header detection + sheet scoring.
- [ ] In your analysis page, surface the parser meta via `ParserDecisionsChip`.
- [ ] Add `ChartExplanation` under each chart; drive `mode` from your view toggle (executive/analyst).
- [ ] For time series visuals, add `ProjectionsButton` and render the forecast overlay.
- [ ] Validate with several messy Excel files (notes on top, totals on bottom, merged cells, etc.).
