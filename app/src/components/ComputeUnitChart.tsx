/**
 * ComputeUnitChart — Horizontal bar chart showing compute unit
 * consumption per instruction in the CPI tree.
 */

import type { CPINode } from '../types/analysis';
import styles from './ComputeUnitChart.module.css';

interface ComputeUnitChartProps {
  rootNodes: CPINode[];
  totalComputeUnits: number;
}

interface ComputeBarEntry {
  programName: string;
  instructionName: string;
  computeUnits: number;
  depth: number;
}

function flattenComputeEntries(cpiNode: CPINode, accumulator: ComputeBarEntry[]): void {
  if (cpiNode.computeUnits > 0) {
    accumulator.push({
      programName: cpiNode.programName,
      instructionName: cpiNode.instructionName,
      computeUnits: cpiNode.computeUnits,
      depth: cpiNode.depth,
    });
  }
  for (const childNode of cpiNode.children) {
    flattenComputeEntries(childNode, accumulator);
  }
}

export function ComputeUnitChart({
  rootNodes,
  totalComputeUnits,
}: ComputeUnitChartProps) {
  const computeEntries: ComputeBarEntry[] = [];
  for (const rootNode of rootNodes) {
    flattenComputeEntries(rootNode, computeEntries);
  }
  computeEntries.sort(
    (entryA, entryB) => entryB.computeUnits - entryA.computeUnits
  );

  const maxComputeValue = computeEntries[0]?.computeUnits ?? 1;

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartHeader}>
        <h4 className={styles.chartTitle}>// compute units</h4>
        <span className={styles.totalBadge}>
          {totalComputeUnits.toLocaleString()} CU total
        </span>
      </div>

      <div className={styles.barList}>
        {computeEntries.map((computeEntry, entryIndex) => {
          const barWidthPercent =
            (computeEntry.computeUnits / maxComputeValue) * 100;
          return (
            <div key={entryIndex} className={styles.barRow}>
              <div className={styles.barLabel}>
                <span className={styles.barProgramName}>
                  {computeEntry.programName}
                </span>
                <span className={styles.barInstructionName}>
                  {computeEntry.instructionName}
                </span>
              </div>
              <div className={styles.barTrack}>
                <div
                  className={styles.barFill}
                  style={{ width: `${barWidthPercent}%` }}
                />
              </div>
              <span className={styles.barValue}>
                {computeEntry.computeUnits.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
