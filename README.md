# CPITracker

> CPI call tree debugger and visualizer for Solana transactions.

## What is this?

Paste a Solana transaction hash. Get a full CPI (Cross-Program Invocation) tree with account diffs, instruction data decoding, and compute unit breakdown.

## Installation

```bash
# clone
git clone https://github.com/your-username/cpitracker.git
cd cpitracker

# server
cd server && npm install

# app (separate terminal)
cd app && npm install
```

## Usage

```bash
# start the API server (port 3001)
cd server && npm run dev

# start the frontend (port 5173)
cd app && npm run dev
```

Open `http://localhost:5173` and paste a transaction signature.

A hosted instance with the same API surface is up at `cpitracker.vercel.app` — useful for one-off lookups or sharing a tx hash without spinning up a local server.

### API reference

| method | path | what |
|---|---|---|
| `GET` | `/api/analyze/:sig` | parse a tx signature → cpi tree + account diffs + cu summary |
| `GET` | `/api/known-programs` | list every program-id label the resolver knows |
| `GET` | `/api/decode/:programId` | fetch + decode an Anchor IDL for the given program |
| `GET` | `/api/health` | uptime + version probe (used by docker liveness) |

```bash
# analyze a transaction
curl http://localhost:3001/api/analyze/5wH...3kF

# list known programs (Jupiter, Raydium, Orca, SPL Token, etc.)
curl http://localhost:3001/api/known-programs

# decode a program's IDL by id
curl http://localhost:3001/api/decode/TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA

# liveness check
curl http://localhost:3001/api/health
```

#### error codes

| status | code | when |
|---|---|---|
| `400` | `INVALID_SIGNATURE` | base58 decode failed or tx not found |
| `429` | `RPC_THROTTLED` | upstream RPC returned 429; retry with backoff |
| `502` | `IDL_FETCH_FAILED` | program account exists but IDL is missing or corrupt |

### Response

```json
{
  "signature": "5wH...3kF",
  "cpiTree": {
    "programId": "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",
    "programName": "Jupiter v6",
    "instructionName": "Route",
    "children": [
      {
        "programId": "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8",
        "programName": "Raydium",
        "instructionName": "SwapBaseIn",
        "children": [...]
      }
    ]
  },
  "accountDiffs": [...],
  "totalComputeUnits": 142389
}
```

## Internals

- **Backend**: Express.js + TypeScript + Solana Web3.js
- **Frontend**: Vite + React + D3.js (tree visualization)
- **IDL Decoding**: @coral-xyz/anchor
- **Font**: JetBrains Mono
- **Theme**: Terminal aesthetic (green-on-black)

## Supported Transaction Versions

- [x] Legacy transactions
- [ ] v0 transactions (address lookup tables)
- [ ] Transaction simulation

## Environment Variables

Copy `.env.example` to `.env`:

```
HELIUS_API_KEY=your-key
RPC_URL=https://mainnet.helius-rpc.com/?api-key=your-key
PORT=3001
```

## License

MIT — see [LICENSE](LICENSE). Unaudited tx parser, no warranty on decoded output. Verify against your own RPC before trusting any account diff or CU number for prod work.
