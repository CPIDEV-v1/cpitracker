/**
 * CPI Tree Parser
 *
 * Core parsing logic: takes raw Solana transaction data from RPC
 * and builds a recursive CPINode tree. Handles both legacy and
 * v0 (address lookup table) transaction formats.
 *
 * This is the heart of CPITracker — every other module depends
 * on the tree structure this parser produces.
 *
 * @module core/cpi.parser
 */

import type { CPINode } from '../types/cpi.node';

/**
 * Builds a CPI call tree from a raw Solana transaction response.
 *
 * The parser works in three phases:
 *   1. Extract top-level instructions from the message
 *   2. Match innerInstructions to their parent by index
 *   3. Recursively nest children using invoke depth from logs
 *
 * @param transactionResponse — raw getTransaction result from RPC
 * @returns root CPINode representing the full call tree
 */
export function buildCpiTree(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _transactionResponse: any
): CPINode {
  // placeholder — will be implemented in Phase 2
  return {
    programId: '',
    programName: 'Unknown',
    instructionName: 'unknown',
    instructionData: {},
    accounts: [],
    depth: 0,
    children: [],
    success: true,
    logMessages: [],
    computeUnits: 0,
  };
}
