/**
 * NodeDetailPanel — Displays instruction data and accounts
 * for the currently selected CPI tree node.
 */

import type { CPINode } from '../types/analysis';
import styles from './NodeDetailPanel.module.css';

interface NodeDetailPanelProps {
  selectedNode: CPINode | null;
}

export function NodeDetailPanel({ selectedNode }: NodeDetailPanelProps) {
  if (!selectedNode) {
    return (
      <div className={styles.emptyPanel}>
        <span className={styles.emptyHint}>&gt; select a node to inspect</span>
      </div>
    );
  }

  const instructionEntries = Object.entries(selectedNode.instructionData);

  return (
    <div className={styles.panelContainer}>
      {/* ── header ── */}
      <div className={styles.panelHeader}>
        <span className={styles.programName}>{selectedNode.programName}</span>
        <span className={styles.instructionBadge}>
          {selectedNode.instructionName}
        </span>
        {!selectedNode.success && (
          <span className={styles.errorBadge}>FAILED</span>
        )}
      </div>

      {/* ── metadata ── */}
      <div className={styles.metaRow}>
        <span className={styles.metaLabel}>program</span>
        <code className={styles.metaValue}>{selectedNode.programId}</code>
      </div>
      <div className={styles.metaRow}>
        <span className={styles.metaLabel}>depth</span>
        <span className={styles.metaValue}>{selectedNode.depth}</span>
      </div>
      <div className={styles.metaRow}>
        <span className={styles.metaLabel}>compute</span>
        <span className={styles.metaValue}>
          {selectedNode.computeUnits.toLocaleString()} CU
        </span>
      </div>

      {selectedNode.error && (
        <div className={styles.errorBlock}>
          <span className={styles.errorLabel}>error:</span>
          <code className={styles.errorMessage}>{selectedNode.error}</code>
        </div>
      )}

      {/* ── instruction data ── */}
      {instructionEntries.length > 0 && (
        <div className={styles.sectionBlock}>
          <h4 className={styles.sectionTitle}>// instruction data</h4>
          <div className={styles.dataGrid}>
            {instructionEntries.map(([fieldKey, fieldValue]) => (
              <div key={fieldKey} className={styles.dataRow}>
                <span className={styles.dataKey}>{fieldKey}</span>
                <code className={styles.dataValue}>
                  {formatInstructionValue(fieldValue)}
                </code>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── accounts ── */}
      {selectedNode.accounts.length > 0 && (
        <div className={styles.sectionBlock}>
          <h4 className={styles.sectionTitle}>
            // accounts ({selectedNode.accounts.length})
          </h4>
          <div className={styles.accountList}>
            {selectedNode.accounts.map((accountEntry, accountIndex) => (
              <div key={accountIndex} className={styles.accountRow}>
                <div className={styles.accountFlags}>
                  {accountEntry.isSigner && (
                    <span className={styles.signerFlag}>S</span>
                  )}
                  {accountEntry.isWritable && (
                    <span className={styles.writableFlag}>W</span>
                  )}
                </div>
                <code className={styles.accountPubkey}>
                  {accountEntry.pubkey}
                </code>
                {accountEntry.label && (
                  <span className={styles.accountLabel}>
                    {accountEntry.label}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── logs ── */}
      {selectedNode.logMessages.length > 0 && (
        <div className={styles.sectionBlock}>
          <h4 className={styles.sectionTitle}>
            // logs ({selectedNode.logMessages.length})
          </h4>
          <pre className={styles.logBlock}>
            {selectedNode.logMessages.join('\n')}
          </pre>
        </div>
      )}
    </div>
  );
}

function formatInstructionValue(rawValue: unknown): string {
  if (rawValue === null || rawValue === undefined) return 'null';
  if (typeof rawValue === 'string') return rawValue;
  if (typeof rawValue === 'number' || typeof rawValue === 'boolean') {
    return String(rawValue);
  }
  return JSON.stringify(rawValue, null, 2);
}
