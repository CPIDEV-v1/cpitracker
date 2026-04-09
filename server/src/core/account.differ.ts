/**
 * Account Differ
 *
 * Computes before/after state diffs for every account
 * touched by a transaction. Fetches account state at
 * slot-1 (before) and slot (after), then produces
 * human-readable change descriptions.
 *
 * @module core/account.differ
 */

import type { AccountDiffEntry } from '../types/account.diff';

/**
 * Computes account diffs for all accounts in a transaction.
 *
 * @param _accountKeys — list of account public keys from the tx
 * @param _slot — slot the transaction was confirmed in
 * @returns array of AccountDiffEntry with before/after snapshots
 */
export async function computeAccountDiffs(
  _accountKeys: string[],
  _slot: number
): Promise<AccountDiffEntry[]> {
  // placeholder — will fetch account state and diff in Phase 2
  return [];
}
