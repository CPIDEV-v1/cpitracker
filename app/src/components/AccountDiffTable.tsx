/**
 * AccountDiffTable — Before/after state comparison table
 * with change highlights for each account touched by the transaction.
 */

import type { AccountDiffEntry } from '../types/analysis';
import styles from './AccountDiffTable.module.css';

interface AccountDiffTableProps {
  accountDiffs: AccountDiffEntry[];
}

export function AccountDiffTable({ accountDiffs }: AccountDiffTableProps) {
  if (accountDiffs.length === 0) {
    return (
      <div className={styles.emptyState}>
        <span className={styles.emptyText}>no account changes detected</span>
      </div>
    );
  }

  return (
    <div className={styles.tableContainer}>
      <h4 className={styles.tableTitle}>// account diffs ({accountDiffs.length})</h4>
      <div className={styles.diffList}>
        {accountDiffs.map((diffEntry) => (
          <AccountDiffRow key={diffEntry.address} diffEntry={diffEntry} />
        ))}
      </div>
    </div>
  );
}

function AccountDiffRow({ diffEntry }: { diffEntry: AccountDiffEntry }) {
  const lamportsDelta =
    diffEntry.after.lamports - diffEntry.before.lamports;
  const dataSizeDelta =
    diffEntry.after.dataSize - diffEntry.before.dataSize;

  return (
    <div className={styles.diffRow}>
      <div className={styles.diffHeader}>
        <code className={styles.diffAddress}>{diffEntry.address}</code>
        {diffEntry.label && (
          <span className={styles.diffLabel}>{diffEntry.label}</span>
        )}
      </div>

      <div className={styles.diffColumns}>
        <div className={styles.diffColumn}>
          <span className={styles.columnHeader}>before</span>
          <div className={styles.snapshotValues}>
            <span className={styles.snapshotRow}>
              {formatLamports(diffEntry.before.lamports)} SOL
            </span>
            <span className={styles.snapshotRow}>
              {diffEntry.before.dataSize.toLocaleString()} bytes
            </span>
          </div>
        </div>

        <div className={styles.diffArrow}>&rarr;</div>

        <div className={styles.diffColumn}>
          <span className={styles.columnHeader}>after</span>
          <div className={styles.snapshotValues}>
            <span
              className={`${styles.snapshotRow} ${
                lamportsDelta > 0
                  ? styles.valueIncrease
                  : lamportsDelta < 0
                  ? styles.valueDecrease
                  : ''
              }`}
            >
              {formatLamports(diffEntry.after.lamports)} SOL
            </span>
            <span
              className={`${styles.snapshotRow} ${
                dataSizeDelta !== 0 ? styles.valueChanged : ''
              }`}
            >
              {diffEntry.after.dataSize.toLocaleString()} bytes
            </span>
          </div>
        </div>

        {lamportsDelta !== 0 && (
          <div className={styles.deltaColumn}>
            <span
              className={
                lamportsDelta > 0 ? styles.deltaPositive : styles.deltaNegative
              }
            >
              {lamportsDelta > 0 ? '+' : ''}
              {formatLamports(lamportsDelta)} SOL
            </span>
          </div>
        )}
      </div>

      {diffEntry.changes.length > 0 && (
        <div className={styles.changesList}>
          {diffEntry.changes.map((changeDescription, changeIndex) => (
            <span key={changeIndex} className={styles.changeItem}>
              {changeDescription}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function formatLamports(lamportAmount: number): string {
  return (lamportAmount / 1_000_000_000).toFixed(4);
}
