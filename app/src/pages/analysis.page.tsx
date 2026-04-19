/**
 * Analysis Page — Transaction CPI Tree Viewer
 *
 * Fetches transaction analysis from the API, then renders:
 *  - CPI tree (D3 collapsible tree)
 *  - Node detail panel (selected instruction)
 *  - Account diff table (before/after state)
 *  - Compute unit chart (bar chart per instruction)
 */

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';

import { useTransactionAnalysis } from '../hooks/useTransactionAnalysis';
import { CpiTree } from '../components/CpiTree';
import { NodeDetailPanel } from '../components/NodeDetailPanel';
import { AccountDiffTable } from '../components/AccountDiffTable';
import { ComputeUnitChart } from '../components/ComputeUnitChart';
import { saveRecentAnalysis } from '../components/RecentAnalyses';
import type { CPINode } from '../types/analysis';
import styles from './analysis.page.module.css';

type ActiveTab = 'detail' | 'accounts' | 'compute';

export function AnalysisPage() {
  const { signature: routeSignature } = useParams<{ signature: string }>();
  const [searchParams] = useSearchParams();
  const networkParam = searchParams.get('network') ?? 'mainnet-beta';

  const {
    data: analysisResult,
    isLoading: isAnalyzing,
    error: analysisError,
    refetch,
    isFetching,
  } = useTransactionAnalysis(routeSignature, networkParam);

  const [selectedCpiNode, setSelectedCpiNode] = useState<CPINode | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('detail');

  useEffect(() => {
    if (analysisResult) {
      // Reset selection when new analysis arrives
      setSelectedCpiNode(null);
      setSelectedNodeId(null);
      saveRecentAnalysis({
        signature: analysisResult.signature,
        timestamp: Date.now(),
        instructionCount: analysisResult.instructionCount,
        totalComputeUnits: analysisResult.totalComputeUnits,
        network: analysisResult.network,
      });
    }
  }, [analysisResult]);

  /* ── loading state ── */
  if (isAnalyzing) {
    return (
      <div className={styles.statusContainer}>
        <div className={styles.loadingBlock}>
          <span className={styles.loadingCaret}>&gt;_</span>
          <span className={styles.loadingText}>analyzing transaction...</span>
        </div>
        <code className={styles.signatureDisplay}>
          {routeSignature?.slice(0, 32)}...
        </code>
        <div className={styles.loadingSteps}>
          <span className={styles.stepDone}>fetching tx data</span>
          <span className={styles.stepActive}>parsing CPI tree</span>
          <span className={styles.stepPending}>computing diffs</span>
        </div>
      </div>
    );
  }

  /* ── error state ── */
  if (analysisError) {
    return (
      <div className={styles.statusContainer}>
        <div className={styles.errorBlock}>
          <span className={styles.errorPrefix}>ERR</span>
          <span className={styles.errorText}>
            {analysisError instanceof Error
              ? analysisError.message
              : 'Analysis failed'}
          </span>
        </div>
        <div className={styles.errorActions}>
          <button
            className={styles.retryButton}
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching ? 'retrying...' : 'retry'}
          </button>
          <Link to="/" className={styles.backLink}>
            &larr; back to search
          </Link>
        </div>
      </div>
    );
  }

  if (!analysisResult) return null;

  const displayTrees =
    analysisResult.allTrees.length > 0
      ? analysisResult.allTrees
      : [analysisResult.cpiTree];

  return (
    <div className={styles.pageContainer}>
      {/* ── header bar ── */}
      <div className={styles.analysisHeader}>
        <Link to="/" className={styles.backLink}>
          &larr; search
        </Link>
        <div className={styles.txMeta}>
          <code className={styles.signatureShort}>
            {analysisResult.signature.slice(0, 12)}...
            {analysisResult.signature.slice(-8)}
          </code>
          <span className={styles.metaBadge}>
            slot {analysisResult.slot.toLocaleString()}
          </span>
          <span className={styles.metaBadge}>
            {analysisResult.instructionCount} ix
          </span>
          <span className={styles.metaBadge}>
            {analysisResult.totalComputeUnits.toLocaleString()} CU
          </span>
          <span className={styles.metaBadge}>
            fee {(analysisResult.fee / 1_000_000_000).toFixed(6)} SOL
          </span>
          {analysisResult.errorExplanation && (
            <span className={styles.failedBadge}>FAILED</span>
          )}
        </div>
      </div>

      {/* ── main split layout ── */}
      <div className={styles.splitLayout}>
        {/* ── left: CPI tree ── */}
        <div className={styles.treePanel}>
          <CpiTree
            rootNodes={displayTrees}
            selectedNodeId={selectedNodeId}
            onNodeSelect={(cpiNode, nodeId) => {
              setSelectedCpiNode(cpiNode);
              setSelectedNodeId(nodeId);
            }}
          />
        </div>

        {/* ── right: detail panels ── */}
        <div className={styles.detailPanel}>
          <div className={styles.tabBar}>
            <button
              className={`${styles.tabButton} ${
                activeTab === 'detail' ? styles.tabActive : ''
              }`}
              onClick={() => setActiveTab('detail')}
            >
              instruction
            </button>
            <button
              className={`${styles.tabButton} ${
                activeTab === 'accounts' ? styles.tabActive : ''
              }`}
              onClick={() => setActiveTab('accounts')}
            >
              accounts ({analysisResult.accountDiffs.length})
            </button>
            <button
              className={`${styles.tabButton} ${
                activeTab === 'compute' ? styles.tabActive : ''
              }`}
              onClick={() => setActiveTab('compute')}
            >
              compute
            </button>
          </div>

          <div className={styles.tabContent}>
            {activeTab === 'detail' && (
              <NodeDetailPanel selectedNode={selectedCpiNode} />
            )}
            {activeTab === 'accounts' && (
              <AccountDiffTable
                accountDiffs={analysisResult.accountDiffs}
              />
            )}
            {activeTab === 'compute' && (
              <ComputeUnitChart
                rootNodes={displayTrees}
                totalComputeUnits={analysisResult.totalComputeUnits}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
