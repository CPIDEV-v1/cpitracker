/**
 * /api/analyze routes
 *
 * Handles transaction analysis requests. Accepts a Solana
 * transaction signature, fetches the transaction from RPC,
 * builds the CPI tree, computes account diffs, and returns
 * a full TransactionAnalysis.
 *
 * @module routes/analyze
 */

// --- deps ---
import { Router } from 'express';

// --- local ---
import { fetchTransaction, NetworkType } from '../core/tx.fetcher';
import { buildCpiTrees } from '../core/cpi.parser';
import { computeAccountDiffs } from '../core/account.differ';
import type { TransactionAnalysis } from '../types/analysis';
import { ErrorCode, ServerError } from '../types/errors';

const analyzeRouter = Router();

// ---------------------------------------------------------------------------
// Signature validation
// ---------------------------------------------------------------------------

/**
 * Solana transaction signatures are 88 base58 characters.
 * We allow 80-90 to be lenient with edge cases.
 */
const SIGNATURE_MIN_LENGTH = 80;
const SIGNATURE_MAX_LENGTH = 90;
const BASE58_REGEX = /^[1-9A-HJ-NP-Za-km-z]+$/;

function validateSignature(signature: string): void {
  if (
    !signature ||
    signature.length < SIGNATURE_MIN_LENGTH ||
    signature.length > SIGNATURE_MAX_LENGTH
  ) {
    throw new ServerError(
      ErrorCode.INVALID_SIGNATURE,
      `Invalid signature length: expected ${SIGNATURE_MIN_LENGTH}-${SIGNATURE_MAX_LENGTH} chars, got ${signature?.length ?? 0}`,
      400
    );
  }

  if (!BASE58_REGEX.test(signature)) {
    throw new ServerError(
      ErrorCode.INVALID_SIGNATURE,
      'Signature contains invalid characters (expected base58)',
      400
    );
  }
}

/**
 * Validates and normalizes the network query parameter.
 */
function parseNetwork(networkParam: unknown): NetworkType {
  const validNetworks: NetworkType[] = ['mainnet-beta', 'devnet', 'testnet'];
  const network = (typeof networkParam === 'string' ? networkParam : 'mainnet-beta') as NetworkType;
  return validNetworks.includes(network) ? network : 'mainnet-beta';
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/**
 * GET /api/analyze/:signature
 *
 * Fetches a Solana transaction by signature, parses inner
 * instructions, builds the CPI call tree, computes account
 * diffs, and returns the full analysis.
 *
 * @param signature — base58-encoded transaction signature
 * @query network — "mainnet-beta" | "devnet" | "testnet" (default: "mainnet-beta")
 */
analyzeRouter.get('/:signature', async (req, res, next) => {
  try {
    const { signature } = req.params;
    const network = parseNetwork(req.query.network);

    // --- validate ---
    validateSignature(signature);

    // --- fetch transaction ---
    const txResponse = await fetchTransaction(signature, network);

    // --- build CPI trees ---
    const cpiTrees = buildCpiTrees(txResponse);

    // --- extract account keys for differ ---
    const staticKeys = txResponse.transaction.message.staticAccountKeys.map(
      (k) => k.toBase58()
    );
    const loadedWritable = txResponse.meta?.loadedAddresses?.writable?.map(
      (k) => k.toBase58()
    ) || [];
    const loadedReadonly = txResponse.meta?.loadedAddresses?.readonly?.map(
      (k) => k.toBase58()
    ) || [];
    const allAccountKeys = [...staticKeys, ...loadedWritable, ...loadedReadonly];

    // --- compute account diffs ---
    const accountDiffs = computeAccountDiffs(txResponse, allAccountKeys);

    // --- count inner instructions ---
    const innerInstructionsCount = txResponse.meta?.innerInstructions?.reduce(
      (sum, group) => sum + group.instructions.length,
      0
    ) ?? 0;

    // --- build response ---
    const analysis: TransactionAnalysis = {
      signature,
      slot: txResponse.slot,
      blockTime: txResponse.blockTime ?? null,
      fee: txResponse.meta?.fee ?? 0,
      cpiTree: cpiTrees[0] || {
        programId: '',
        programName: 'Empty',
        instructionName: 'none',
        instructionData: {},
        accounts: [],
        depth: 0,
        children: [],
        success: true,
        logMessages: [],
        computeUnits: 0,
      },
      accountDiffs,
      totalComputeUnits: txResponse.meta?.computeUnitsConsumed ?? 0,
      innerInstructionsCount,
      errorExplanation: txResponse.meta?.err
        ? formatTransactionError(txResponse.meta.err)
        : undefined,
      network,
    };

    // include all top-level instruction trees in a separate field
    // so clients can iterate over multi-instruction transactions
    res.json({
      ...analysis,
      allTrees: cpiTrees,
      instructionCount: cpiTrees.length,
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// Error formatting
// ---------------------------------------------------------------------------

/**
 * Formats a Solana TransactionError into a human-readable string.
 */
function formatTransactionError(err: unknown): string {
  if (typeof err === 'string') return err;

  if (typeof err === 'object' && err !== null) {
    // common pattern: { InstructionError: [index, { Custom: code }] }
    const errObj = err as Record<string, unknown>;

    if ('InstructionError' in errObj) {
      const [instructionIndex, errorDetail] = errObj.InstructionError as [number, unknown];

      if (typeof errorDetail === 'string') {
        return `Instruction ${instructionIndex} failed: ${errorDetail}`;
      }

      if (typeof errorDetail === 'object' && errorDetail !== null) {
        const detail = errorDetail as Record<string, unknown>;
        if ('Custom' in detail) {
          return `Instruction ${instructionIndex} failed with custom error code: ${detail.Custom}`;
        }
        return `Instruction ${instructionIndex} failed: ${JSON.stringify(detail)}`;
      }
    }

    return JSON.stringify(err);
  }

  return String(err);
}

export { analyzeRouter };
