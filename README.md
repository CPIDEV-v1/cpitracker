# CPITracker

> CPI call tree debugger and visualizer for Solana transactions.

## What is this?

Paste a Solana transaction hash. Get a full CPI (Cross-Program Invocation) tree with account diffs, instruction data decoding, and compute unit breakdown.

## Usage

```
https://cpitracker.dev/tx/<TRANSACTION_HASH>
```

### API

```bash
# Get CPI tree for a transaction
curl https://api.cpitracker.dev/v1/tx/5wH...3kF

# Response
{
  "signature": "5wH...3kF",
  "tree": {
    "program": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    "instruction": "Transfer",
    "children": [...]
  },
  "computeUnits": 42389,
  "accountDiffs": [...]
}
```

## Stack

- **Backend**: Express.js + Solana Web3.js
- **Frontend**: Vite + React + D3.js (tree visualization)
- **Font**: JetBrains Mono
- **Theme**: Terminal aesthetic (green-on-black)

## Development

```bash
# API server
cd api && npm install && npm run dev

# Frontend
cd web && npm install && npm run dev
```

## Supported Transaction Versions

- [x] Legacy transactions
- [ ] v0 transactions (address lookup tables)
- [ ] Transaction batches

## License

MIT
