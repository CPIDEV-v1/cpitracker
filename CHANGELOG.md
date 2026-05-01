# changelog

## phase 6 — landing page + dashboard polish

- viz: animated circuit-grid background with mouse-tracking radial glow
- viz: glitch title effect, animated CPI tree with data-flow particles
- viz: bento features section, terminal demo block, hero CTA
- routing: `/` landing page, `/app` dashboard
- ui: collapsible tree nodes with smooth height transitions
- ui: account diff panel with before/after byte-level deltas
- parser: depth tracking on inner instructions
- parser: program-name resolution via on-chain account label registry

## phase 5 — D3 frontend + parser core

- parser: extracts CPI tree from getTransaction response, including v0 ALT lookups
- parser: handles failed-tx case with log-only fallback tree
- viz: D3 force-directed tree with parent-child collapse
- viz: account diff side panel
- api: `/analyze` endpoint, hand-rolled OpenAPI shape

## phase 4 — Express + RPC client

- api: rate-limit handling on RPC client
- core: shared analysis types between server + client
- ui: terminal-style empty state and error boundary

## license

MIT
