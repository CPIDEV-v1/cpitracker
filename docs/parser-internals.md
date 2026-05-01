# Parser internals

A peek under the hood. The parser sits in `server/src/core/cpi.parser.ts`
and turns raw Solana transactions into the tree the frontend renders.

## Pipeline

```
fetchTransaction(sig)
  └─ getTransaction(sig, { maxSupportedTransactionVersion: 0 })
      └─ buildAccountTable(rawTx)         — pubkey → role + signer flags
          └─ walkInstructions(rawTx)      — outer ix walk
              └─ walkInner(innerIx)       — depth-first CPI traversal
                  └─ diffAccounts(pre, post)  — per-call account state diff
                      └─ classifyEncoding(data) — base58 / hex / utf8 hint
                          └─ buildNode(...)
```

Output: `CpiTreeNode[]` rooted at outer instructions, with collapsible
children describing each inner CPI.

## CpiTreeNode shape

```ts
type CpiTreeNode = {
  programId: string
  programName: string | null    // resolved via known-program registry
  ixIndex: number
  innerIndex: number | null     // null for outer
  data: { encoded: string; decoded?: string; encoding: 'base58' | 'hex' | 'utf8' }
  accounts: AccountRow[]        // role + writable + signer + diff
  computeUnits: number | null
  logs: string[]
  children: CpiTreeNode[]
}
```

## Edge cases handled

- **Versioned transactions (v0)** — address-table lookups resolved before walk.
- **Loaded addresses** — table-loaded keys flagged separately so the diff knows to label them.
- **Self-recursion** — a program that CPIs into itself (e.g. SPL Token wrap) is
  rendered as a normal child, not collapsed.
- **Failed transactions** — partial walk; failed-instruction node is highlighted
  red and ancestor compute counts are still summed where available.
- **Compute-unit overruns** — when `requestedUnits` < `consumedUnits` we surface
  a banner with the gap.
- **Stack overflow guard** — depth capped at 8 (Solana's max CPI depth) plus
  a 50-call width safety to prevent runaway parses.

## Known-program registry

Lives in `server/src/core/programs.json`. Add entries to label common
programs in the UI:

```json
{
  "11111111111111111111111111111111": "System",
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA": "SPL Token"
}
```

The frontend falls back to the truncated pubkey when no label is found.

## Performance

Typical parse time for a 12-CPI Jupiter swap: 8-14ms server-side. The
bottleneck is the RPC roundtrip, not parsing. We cache by signature for
24h via an in-memory LRU (1000 entries, ~3 MiB).
