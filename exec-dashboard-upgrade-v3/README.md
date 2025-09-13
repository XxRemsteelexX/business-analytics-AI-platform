
# Executive Dashboard Upgrade – v2

This bundle contains **drop‑in modules** and **implementation notes** to:
- Parse messy Excel sheets reliably (header detection, footer trimming, empty‑column pruning)
- Auto‑select the **best** worksheet if the user doesn’t pick one
- Infer column **roles** (date / category / metric / id) to drive better default charts
- Add a **Projections** button (Holt‑Winters) for quick trend forecasts
- Show a **Parser Decisions** chip so execs understand how the table was detected
- Provide two layers of **chart explanations**: **Executive** and **Analyst**

## Contents
```
api/
  analyze/route.ts     # robust analyze route (example)
  upload/route.ts      # safer upload route (example)
lib/
  table-inference.ts   # header/columns/footers inference
  sheet-scoring.ts     # pick best sheet by relational score
  typing-utils.ts      # column role inference
  forecast.ts          # tiny Holt‑Winters for projections
components/dashboard/
  ParserDecisionsChip.tsx
  ProjectionsButton.tsx
  ChartExplanation.tsx # executive vs analyst text block
docs/
  INTEGRATION_CHECKLIST.md
  CHANGELOG.md
```

## Quick Start (copy/paste)
1. **Install deps** (if not already present):
   ```bash
   npm i xlsx papaparse
   ```

2. **Copy files** into your Next.js app preserving folder names. If you use path aliases (`@/lib/...`), ensure `tsconfig.json` has these aliases.

3. **Wire upload** route:
   - Replace your `/api/upload/route.ts` with the provided version (or merge changes):
     - Saves file with original extension
     - Returns `sheetNames` for Excel so the dropdown is accurate

4. **Wire analyze** route:
   - Replace your `/api/analyze/route.ts` with the provided version (or merge):
     - Builds a grid, infers headers, prunes columns, trims footers
     - If no `sheetName` provided, **scores up to 8 sheets** and auto‑selects the best
     - Returns `parser` meta, `roles`, `columns`, `data`

5. **Update UI (optional but recommended):**
   - Show `<ParserDecisionsChip headerRow={parser.headerRow} trimmedFooters={parser.trimmedFooters} sheetChosen={sheetChosen} />`
   - Add `<ProjectionsButton series={...} onProjected={...} />` wherever a time‑series is visible
   - For each chart, render `<ChartExplanation mode={viewMode} summary={explainSpec} />` where `viewMode` is `'executive'` or `'analyst'`

6. **Two Explanation Styles**
   - **Executive**: plain language, no jargon; short sentence or two
   - **Analyst**: include method (aggregation, filters), key stats (%Δ, correlation), and any caveats

7. **Testing**
   - Upload a workbook with multiple tabs (some with notes/footers). Confirm the chosen sheet and parser decisions look right.
   - Toggle view mode to verify both explanation styles render.

## Notes
- The inference routines are **O(n)** on practical sizes — negligible overhead vs chart rendering.
- For extremely large sheets, consider chunked CSV conversion server‑side before inference.
