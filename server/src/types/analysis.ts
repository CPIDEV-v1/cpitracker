/**
 * Top-level transaction analysis result.
 *
 * This is the primary data structure returned by the /api/analyze
 * endpoint. Contains the full CPI tree, account diffs, compute
 * budget breakdown, and optional error explanation.
 *
 * @module types/analysis
 */

import type { CPINode } from './cpi.node';
import type { AccountDiffEntry } from './account.diff';

/**
 * Complete analysis result for a single Solana transaction.
 */
export interface TransactionAnalysis {
  /** Transaction signature (base58) */
  signature: string;

  /** Slot in which the transaction was confirmed */
  slot: number;

  /** Block timestamp (unix seconds) */
  blockTime: number | null;

  /** Transaction fee in lamports */
  fee: number;

  /** Root of the CPI call tree */
  cpiTree: CPINode;

  /** Account state diffs */
  accountDiffs: AccountDiffEntry[];

  /** Total compute units consumed */
  totalComputeUnits: number;

  /** Number of inner (CPI) instructions */
  innerInstructionsCount: number;

  /** Human-readable error explanation if the transaction failed */
  errorExplanation?: string;

  /** Network the transaction was fetched from */
  network: 'mainnet-beta' | 'devnet' | 'testnet';
}
