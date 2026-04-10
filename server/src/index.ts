/**
 * CPITracker Server — Entry Point
 *
 * Express server that exposes the CPI tree analysis API.
 * Parses Solana transactions, builds CPI call trees, and
 * returns structured analysis with account diffs.
 *
 * @module server
 */

// --- stdlib ---
import path from 'path';

// --- deps ---
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// --- local ---
import { analyzeRouter } from './routes/analyze';
import { decodeRouter } from './routes/decode';
import { ErrorCode, ServerError } from './types/errors';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const PORT = parseInt(process.env.PORT || '3001', 10);
const app = express();

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

app.use(cors());
app.use(express.json());

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

app.use('/api/analyze', analyzeRouter);
app.use('/api/decode', decodeRouter);

/**
 * Health check — returns server status and current RPC endpoint.
 * Useful for monitoring and quick sanity checks.
 */
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    rpcUrl: process.env.RPC_URL ? 'configured' : 'missing',
    uptime: process.uptime(),
  });
});

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    if (err instanceof ServerError) {
      console.error(`[server] ${err.code}: ${err.message}`);
      res.status(err.httpStatus).json({
        error: {
          code: err.code,
          message: err.message,
        },
      });
      return;
    }

    console.error('[server] unhandled error:', err);
    res.status(500).json({
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: 'Internal server error',
      },
    });
  }
);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

app.listen(PORT, () => {
  console.log(`[server] CPITracker API listening on port ${PORT}`);
  const rpcUrl = process.env.RPC_URL || 'not configured';
  const maskedRpc = rpcUrl.includes('?') ? rpcUrl.split('?')[0] + '?api-key=***' : rpcUrl;
  console.log(`[server] RPC: ${maskedRpc}`);
});

export { app };
