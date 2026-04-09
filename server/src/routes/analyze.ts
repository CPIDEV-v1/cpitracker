/**
 * /api/analyze routes
 *
 * Handles transaction analysis requests. Accepts a Solana
 * transaction signature, fetches the transaction from RPC,
 * builds the CPI tree, and returns a full TransactionAnalysis.
 *
 * @module routes/analyze
 */

// --- deps ---
import { Router } from 'express';

// --- local ---
import { ErrorCode, ServerError } from '../types/errors';

const analyzeRouter = Router();

/**
 * GET /api/analyze/:signature
 *
 * Fetches a Solana transaction by signature, parses inner
 * instructions, builds the CPI call tree, computes account
 * diffs, and returns the full analysis.
 *
 * @param signature — base58-encoded transaction signature
 * @query network — "mainnet-beta" | "devnet" (default: "mainnet-beta")
 */
analyzeRouter.get('/:signature', async (req, res, next) => {
  try {
    const { signature } = req.params;

    // basic signature validation — 87-88 base58 chars
    if (!signature || signature.length < 80 || signature.length > 90) {
      throw new ServerError(
        ErrorCode.INVALID_SIGNATURE,
        `Invalid transaction signature: ${signature}`,
        400
      );
    }

    // TODO: wire up parser.buildCpiTree(signature, network)
    res.json({
      status: 'stub',
      signature,
      message: 'analysis endpoint — parser not yet wired',
    });
  } catch (err) {
    next(err);
  }
});

export { analyzeRouter };
