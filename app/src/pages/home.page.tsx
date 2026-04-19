/**
 * Home Page — Transaction Search
 *
 * Landing page with a search bar for pasting Solana
 * transaction signatures. Shows recent analyses and
 * example transactions for quick testing.
 */

// --- deps ---
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// --- local ---
import { RecentAnalyses, loadRecentEntries } from '../components/RecentAnalyses';
import styles from './home.page.module.css';

/** Example transactions for quick testing. */
const EXAMPLE_TRANSACTIONS = [
  {
    label: 'Simple SOL Transfer',
    signature: '5UfDuX...',
    description: 'System Program → Transfer',
  },
  {
    label: 'Jupiter Swap',
    signature: '3kFxYz...',
    description: 'Jupiter → Raydium → Token Program (3 CPI levels)',
  },
  {
    label: 'Failed Transaction',
    signature: '7mPqRs...',
    description: 'Anchor program — InsufficientFunds error',
  },
];

export function HomePage() {
  const [signatureInput, setSignatureInput] = useState('');
  const [validationHint, setValidationHint] = useState('');
  const [network, setNetwork] = useState<'mainnet-beta' | 'devnet'>('devnet');
  const navigate = useNavigate();

  const handleAnalyze = useCallback(() => {
    const trimmedSignature = signatureInput.trim();
    if (trimmedSignature.length === 0) {
      setValidationHint('paste a transaction signature to analyze');
      return;
    }
    if (trimmedSignature.length < 80) {
      setValidationHint(`signature too short (${trimmedSignature.length} chars, need 80+)`);
      return;
    }
    if (!/^[1-9A-HJ-NP-Za-km-z]+$/.test(trimmedSignature)) {
      setValidationHint('invalid characters — must be Base58 encoded');
      return;
    }
    setValidationHint('');
    const query = network !== 'mainnet-beta' ? `?network=${network}` : '';
    navigate(`/tx/${trimmedSignature}${query}`);
  }, [signatureInput, network, navigate]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter') {
        handleAnalyze();
      }
    },
    [handleAnalyze]
  );

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h2 className={styles.title}>
          <span className={styles.caret}>&gt;</span> paste a transaction signature
        </h2>
        <p className={styles.subtitle}>
          Visualize the full CPI call tree, inspect account diffs,
          and decode instruction data.
        </p>
      </div>

      <div className={styles.searchBlock}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Enter Solana transaction signature..."
          value={signatureInput}
          onChange={(e) => setSignatureInput(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          autoComplete="off"
        />
        <button
          className={styles.searchButton}
          onClick={handleAnalyze}
          disabled={signatureInput.trim().length < 80}
        >
          analyze
        </button>
      </div>

      {validationHint && (
        <p className={styles.validationHint}>{validationHint}</p>
      )}

      <RecentAnalyses recentEntries={loadRecentEntries()} />

      <div className={styles.examplesSection}>
        <h3 className={styles.examplesTitle}>// example transactions</h3>
        <div className={styles.examplesList}>
          {EXAMPLE_TRANSACTIONS.map((exampleTransaction) => (
            <div key={exampleTransaction.label} className={styles.exampleCard}>
              <span className={styles.exampleLabel}>
                {exampleTransaction.label}
              </span>
              <span className={styles.exampleDescription}>
                {exampleTransaction.description}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.networkFloat}>
        <span className={network === 'devnet' ? styles.networkLabelActive : styles.networkLabel}>devnet</span>
        <button
          className={`${styles.toggle} ${network === 'mainnet-beta' ? styles.toggleOn : ''}`}
          onClick={() => setNetwork(n => n === 'mainnet-beta' ? 'devnet' : 'mainnet-beta')}
          title="Toggle network"
        >
          <span className={styles.toggleKnob} />
        </button>
        <span className={network === 'mainnet-beta' ? styles.networkLabelActive : styles.networkLabel}>mainnet</span>
      </div>
    </div>
  );
}
