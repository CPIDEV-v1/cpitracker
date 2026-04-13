/**
 * Account diff type definitions.
 *
 * Tracks how each account was mutated across a transaction,
 * showing before/after state for lamports, data hash, and owner.
 *
 * @module types/account.diff
 */

/**
 * Snapshot of an account's state at a single point in time.
 */
export interface AccountSnapshot {
  lamports: number;
  dataHash: string;
  owner: string;
  dataSize: number;
}

/**
 * Before/after diff for one account touched by a transaction.
 */
export interface AccountDiffEntry {
  /** Account public key */
  address: string;

  /** Human-readable label (e.g. "User Token Account", "Vault PDA") */
  label: string;

  /** Account state before the transaction executed */
  before: AccountSnapshot;

  /** Account state after the transaction executed */
  after: AccountSnapshot;

  /** Human-readable description of each change */
  changes: string[];
}
