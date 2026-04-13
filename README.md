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

### API

```bash
# analyze a transaction
curl http://localhost:3001/api/analyze/5wH...3kF

# get known programs
curl http://localhost:3001/api/known-programs

# decode a program's IDL
curl http://localhost:3001/api/decode/TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA
```

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

## Stack

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

MIT
