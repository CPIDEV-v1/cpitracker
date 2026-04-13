/**
 * Account Differ
 *
 * Computes before/after state diffs for every account
 * touched by a transaction. Uses preBalances/postBalances
 * and preTokenBalances/postTokenBalances from transaction
 * meta — no additional RPC calls needed.
 *
 * Produces human-readable change descriptions for each
 * account: lamport changes, token balance changes, owner
 * changes, etc.
 *
 * @module core/account.differ
 */

// --- deps ---
import { VersionedTransactionResponse } from '@solana/web3.js';

// --- local ---
import type { AccountDiffEntry, AccountSnapshot } from '../types/account.diff';
import { resolveProgramName } from './program.resolver';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LAMPORTS_PER_SOL = 1_000_000_000;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Computes account diffs for all accounts in a transaction.
 *
 * Uses preBalances/postBalances from meta for SOL changes and
 * preTokenBalances/postTokenBalances for SPL token changes.
 * Only returns entries where something actually changed.
 *
 * @param txResponse — full transaction response from RPC
 * @param allAccountKeys — ordered list of all account keys (static + loaded)
 * @returns array of AccountDiffEntry with before/after snapshots
 */
export function computeAccountDiffs(
  txResponse: VersionedTransactionResponse,
  allAccountKeys: string[]
): AccountDiffEntry[] {
  const { meta } = txResponse;
  if (!meta) return [];

  const { preBalances, postBalances } = meta;
  const diffs: AccountDiffEntry[] = [];

  // --- SOL balance diffs ---
  for (let i = 0; i < allAccountKeys.length; i++) {
    const preLamports = preBalances[i] ?? 0;
    const postLamports = postBalances[i] ?? 0;
    const lamportDelta = postLamports - preLamports;

    // skip accounts with no change
    if (lamportDelta === 0) continue;

    const address = allAccountKeys[i];
    const changes: string[] = [];

    const solDelta = lamportDelta / LAMPORTS_PER_SOL;
    const sign = solDelta > 0 ? '+' : '';
    changes.push(`SOL: ${sign}${solDelta.toFixed(9)} (${sign}${lamportDelta} lamports)`);

    diffs.push({
      address,
      label: labelAccount(address, i, allAccountKeys),
      before: {
        lamports: preLamports,
        dataHash: '',
        owner: '',
        dataSize: 0,
      },
      after: {
        lamports: postLamports,
        dataHash: '',
        owner: '',
        dataSize: 0,
      },
      changes,
    });
  }

  // --- SPL token balance diffs ---
  enrichWithTokenBalances(diffs, meta, allAccountKeys);

  return diffs;
}

// ---------------------------------------------------------------------------
// Token balance enrichment
// ---------------------------------------------------------------------------

/**
 * Adds SPL token balance changes to existing diffs or creates
 * new entries for token accounts that changed.
 */
function enrichWithTokenBalances(
  diffs: AccountDiffEntry[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  meta: any,
  allAccountKeys: string[]
): void {
  const preTokenBalances = meta.preTokenBalances || [];
  const postTokenBalances = meta.postTokenBalances || [];

  // index token balances by account index for fast lookup
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const preTokenMap = new Map<number, any>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const postTokenMap = new Map<number, any>();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const tb of preTokenBalances) {
    preTokenMap.set(tb.accountIndex, tb);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const tb of postTokenBalances) {
    postTokenMap.set(tb.accountIndex, tb);
  }

  // collect all account indices that have token balance info
  const tokenAccountIndices = new Set<number>([
    ...preTokenMap.keys(),
    ...postTokenMap.keys(),
  ]);

  for (const accountIndex of tokenAccountIndices) {
    const pre = preTokenMap.get(accountIndex);
    const post = postTokenMap.get(accountIndex);

    // use uiAmountString for precision (uiAmount is float, loses precision)
    const preAmount = parseFloat(pre?.uiTokenAmount?.uiAmountString ?? '0');
    const postAmount = parseFloat(post?.uiTokenAmount?.uiAmountString ?? '0');
    const delta = postAmount - preAmount;

    if (delta === 0) continue;

    const mint = pre?.mint || post?.mint || 'unknown';
    const sign = delta > 0 ? '+' : '';
    const changeDescription = `Token (${mint.slice(0, 8)}...): ${sign}${delta}`;

    // find existing diff entry or create new one
    const address = allAccountKeys[accountIndex];
    const existing = diffs.find((d) => d.address === address);

    if (existing) {
      existing.changes.push(changeDescription);
    } else {
      diffs.push({
        address,
        label: `Token Account (${mint.slice(0, 8)}...)`,
        before: {
          lamports: 0,
          dataHash: '',
          owner: '',
          dataSize: 0,
        },
        after: {
          lamports: 0,
          dataHash: '',
          owner: '',
          dataSize: 0,
        },
        changes: [changeDescription],
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Labeling
// ---------------------------------------------------------------------------

/**
 * Attempts to label an account with a human-readable name.
 *
 * Known programs get their registry name. For other accounts,
 * uses position-based heuristics (index 0 is usually the fee payer).
 */
function labelAccount(
  address: string,
  index: number,
  _allAccountKeys: string[]
): string {
  // check if it's a known program
  const programInfo = resolveProgramName(address);
  if (programInfo.name !== 'Unknown Program') {
    return programInfo.shortName;
  }

  // heuristic: first account is usually the fee payer / signer
  if (index === 0) {
    return 'Fee Payer';
  }

  // default: truncated address
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}
