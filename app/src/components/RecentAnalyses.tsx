/**
 * RecentAnalyses — Shows recently analyzed transactions
 * stored in localStorage. Clicking navigates to the analysis page.
 */

import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './RecentAnalyses.module.css';

const STORAGE_KEY = 'cpitracker:recent';
const MAX_ENTRIES = 10;

export interface RecentEntry {
  signature: string;
  timestamp: number;
  instructionCount: number;
  totalComputeUnits: number;
  network: string;
}

export function saveRecentAnalysis(entry: RecentEntry): void {
  const stored = loadRecentEntries();
  const filtered = stored.filter(
    (existingEntry) => existingEntry.signature !== entry.signature
  );
  filtered.unshift(entry);
  if (filtered.length > MAX_ENTRIES) {
    filtered.length = MAX_ENTRIES;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function loadRecentEntries(): RecentEntry[] {
  const rawData = localStorage.getItem(STORAGE_KEY);
  if (!rawData) return [];
  try {
    const parsed = JSON.parse(rawData);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry: unknown): entry is RecentEntry =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof (entry as RecentEntry).signature === 'string' &&
        typeof (entry as RecentEntry).timestamp === 'number' &&
        typeof (entry as RecentEntry).instructionCount === 'number' &&
        typeof (entry as RecentEntry).totalComputeUnits === 'number'
    );
  } catch {
    return [];
  }
}

interface RecentAnalysesProps {
  recentEntries: RecentEntry[];
}

export function RecentAnalyses({ recentEntries }: RecentAnalysesProps) {
  const navigate = useNavigate();

  const handleEntryClick = useCallback(
    (entry: RecentEntry) => {
      const query = entry.network && entry.network !== 'mainnet-beta' ? `?network=${entry.network}` : '';
      navigate(`/tx/${entry.signature}${query}`);
    },
    [navigate]
  );

  if (recentEntries.length === 0) return null;

  return (
    <div className={styles.recentContainer}>
      <h3 className={styles.recentTitle}>// recent analyses</h3>
      <div className={styles.entryList}>
        {recentEntries.map((recentEntry) => (
          <button
            key={recentEntry.signature}
            className={styles.entryRow}
            onClick={() => handleEntryClick(recentEntry)}
          >
            <code className={styles.entrySignature}>
              {recentEntry.signature.slice(0, 16)}...{recentEntry.signature.slice(-8)}
            </code>
            <span className={styles.entryMeta}>
              {recentEntry.instructionCount} ix &middot;{' '}
              {recentEntry.totalComputeUnits.toLocaleString()} CU
            </span>
            <span className={styles.entryTime}>
              {formatTimestamp(recentEntry.timestamp)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function formatTimestamp(unixMs: number): string {
  const deltaSeconds = Math.floor((Date.now() - unixMs) / 1000);
  if (deltaSeconds < 60) return `${deltaSeconds}s ago`;
  if (deltaSeconds < 3600) return `${Math.floor(deltaSeconds / 60)}m ago`;
  if (deltaSeconds < 86400) return `${Math.floor(deltaSeconds / 3600)}h ago`;
  return `${Math.floor(deltaSeconds / 86400)}d ago`;
}
