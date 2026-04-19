/**
 * CpiTree — D3.js collapsible tree visualization of a CPI call tree.
 *
 * Renders each program invocation as a node with:
 *   - Color-coded rectangle per program
 *   - Program name + instruction name label
 *   - Click to select (fires onNodeSelect)
 *   - Click toggle button to collapse/expand subtrees
 *   - Failed nodes shown with error border
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import type { CPINode } from '../types/analysis';
import styles from './CpiTree.module.css';

/* ── program color lookup ── */

const PROGRAM_COLORS: Record<string, string> = {
  '11111111111111111111111111111111': '#6b7280',
  TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA: '#2dd4bf',
  TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb: '#22d3ee',
  ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL: '#34d399',
  ComputeBudget111111111111111111111111111111: '#a78bfa',
  JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4: '#6ee7b7',
  MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD: '#38bdf8',
  dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH: '#c084fc',
  '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8': '#60a5fa',
  whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc: '#fbbf24',
};

function nodeColor(programId: string): string {
  return PROGRAM_COLORS[programId] ?? '#555e6e';
}

/* ── constants ── */

const NODE_WIDTH = 180;
const NODE_HEIGHT = 42;
const HORIZONTAL_GAP = 60;
const VERTICAL_GAP = 16;

/* ── D3-compatible node type ── */

interface TreeDatum {
  nodeId: string;
  programId: string;
  programName: string;
  instructionName: string;
  computeUnits: number;
  success: boolean;
  error?: string;
  originalNode: CPINode;
  children?: TreeDatum[];
  _collapsed?: boolean;
  _children?: TreeDatum[];
}

function cpiNodeToTreeDatum(cpiNode: CPINode, parentPath: string = '', selfIndex: number = 0): TreeDatum {
  const nodeId = `${parentPath}/${cpiNode.programId}-${cpiNode.depth}-${selfIndex}`;
  return {
    nodeId,
    programId: cpiNode.programId,
    programName: cpiNode.programName,
    instructionName: cpiNode.instructionName,
    computeUnits: cpiNode.computeUnits,
    success: cpiNode.success,
    error: cpiNode.error,
    originalNode: cpiNode,
    children: cpiNode.children.map((childNode, childIndex) =>
      cpiNodeToTreeDatum(childNode, `${nodeId}:${childIndex}`, childIndex)
    ),
  };
}

/* ── props ── */

interface CpiTreeProps {
  rootNodes: CPINode[];
  selectedNodeId: string | null;
  onNodeSelect: (cpiNode: CPINode, nodeId: string) => void;
}

export function CpiTree({ rootNodes, selectedNodeId, onNodeSelect }: CpiTreeProps) {
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const treeDatumRef = useRef<TreeDatum | null>(null);
  const prevRootNodesRef = useRef<CPINode[] | null>(null);
  const [treeVersion, setTreeVersion] = useState(0);

  // Rebuild tree datum when rootNodes identity changes (not just count)
  if (!treeDatumRef.current || prevRootNodesRef.current !== rootNodes) {
    prevRootNodesRef.current = rootNodes;
    treeDatumRef.current = {
      nodeId: '__root__',
      programId: '',
      programName: 'Transaction',
      instructionName: '',
      computeUnits: 0,
      success: true,
      originalNode: rootNodes[0],
      children: rootNodes.map((rootNode, rootIndex) =>
        cpiNodeToTreeDatum(rootNode, String(rootIndex))
      ),
    };
  }

  const virtualRoot = treeDatumRef.current;

  const toggleCollapse = useCallback(
    (datum: TreeDatum) => {
      if (datum._collapsed) {
        datum.children = datum._children;
        datum._children = undefined;
        datum._collapsed = false;
      } else if (datum.children && datum.children.length > 0) {
        datum._children = datum.children;
        datum.children = undefined;
        datum._collapsed = true;
      }
      setTreeVersion((previousVersion) => previousVersion + 1);
    },
    []
  );

  const onNodeSelectRef = useRef(onNodeSelect);
  onNodeSelectRef.current = onNodeSelect;

  useEffect(() => {
    const containerElement = svgContainerRef.current;
    if (!containerElement) return;

    const containerWidth = containerElement.clientWidth;
    const containerHeight = containerElement.clientHeight;

    const hierarchyRoot = d3.hierarchy(virtualRoot);
    const treeLayout = d3.tree<TreeDatum>().nodeSize([
      NODE_HEIGHT + VERTICAL_GAP,
      NODE_WIDTH + HORIZONTAL_GAP,
    ]);
    treeLayout(hierarchyRoot);

    const allNodes = hierarchyRoot.descendants() as d3.HierarchyPointNode<TreeDatum>[];
    const allLinks = hierarchyRoot.links() as d3.HierarchyPointLink<TreeDatum>[];

    let minY = Infinity;
    let maxY = -Infinity;
    let minX = Infinity;
    let maxX = -Infinity;
    for (const nodeDescendant of allNodes) {
      if (nodeDescendant.x < minX) minX = nodeDescendant.x;
      if (nodeDescendant.x > maxX) maxX = nodeDescendant.x;
      if (nodeDescendant.y < minY) minY = nodeDescendant.y;
      if (nodeDescendant.y > maxY) maxY = nodeDescendant.y;
    }

    const paddingSize = 40;
    const viewBoxWidth = maxY - minY + NODE_WIDTH + paddingSize * 2;
    const viewBoxHeight = maxX - minX + NODE_HEIGHT + paddingSize * 2;

    // Clear previous SVG content
    d3.select(containerElement).selectAll('svg').remove();

    const svgSelection = d3
      .select(containerElement)
      .append('svg')
      .attr('class', styles.treeSvg)
      .attr('width', Math.max(viewBoxWidth, containerWidth))
      .attr('height', Math.max(viewBoxHeight, containerHeight))
      .attr(
        'viewBox',
        `${minY - paddingSize} ${minX - paddingSize} ${viewBoxWidth} ${viewBoxHeight}`
      );

    const graphGroup = svgSelection.append('g').attr('class', 'treeGroup');

    /* ── links ── */
    graphGroup
      .selectAll<SVGPathElement, d3.HierarchyPointLink<TreeDatum>>('path.cpiLink')
      .data(allLinks)
      .enter()
      .append('path')
      .attr('class', 'cpiLink')
      .attr('d', (linkDatum) => {
        const sourceX = linkDatum.source.y + NODE_WIDTH;
        const sourceY = linkDatum.source.x + NODE_HEIGHT / 2;
        const targetX = linkDatum.target.y;
        const targetY = linkDatum.target.x + NODE_HEIGHT / 2;
        const midpointX = (sourceX + targetX) / 2;
        return `M${sourceX},${sourceY} C${midpointX},${sourceY} ${midpointX},${targetY} ${targetX},${targetY}`;
      })
      .attr('fill', 'none')
      .attr('stroke', (linkDatum) =>
        linkDatum.source.data.nodeId === '__root__'
          ? 'var(--color-border)'
          : 'var(--color-border)'
      )
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', (linkDatum) =>
        linkDatum.source.data.nodeId === '__root__' ? '4 2' : 'none'
      );

    /* ── node groups (skip virtual root) ── */
    const visibleNodes = allNodes.filter(
      (nodeItem) => nodeItem.data.nodeId !== '__root__'
    );

    const nodeGroups = graphGroup
      .selectAll<SVGGElement, d3.HierarchyPointNode<TreeDatum>>('g.cpiNode')
      .data(visibleNodes)
      .enter()
      .append('g')
      .attr('class', 'cpiNode')
      .attr(
        'transform',
        (nodeDatum) => `translate(${nodeDatum.y}, ${nodeDatum.x})`
      );

    /* ── rect ── */
    nodeGroups
      .append('rect')
      .attr('width', NODE_WIDTH)
      .attr('height', NODE_HEIGHT)
      .attr('rx', 4)
      .attr('fill', (nodeDatum) =>
        nodeDatum.data.nodeId === selectedNodeId
          ? 'var(--color-bg-elevated)'
          : 'var(--color-bg-surface)'
      )
      .attr('stroke', (nodeDatum) => {
        if (!nodeDatum.data.success) return 'var(--color-error)';
        if (nodeDatum.data.nodeId === selectedNodeId) return 'var(--color-accent)';
        return nodeColor(nodeDatum.data.programId);
      })
      .attr('stroke-width', (nodeDatum) =>
        nodeDatum.data.nodeId === selectedNodeId ? 2 : 1.5
      )
      .attr('cursor', 'pointer')
      .on('click', (_clickEvent, nodeDatum) => {
        onNodeSelectRef.current(nodeDatum.data.originalNode, nodeDatum.data.nodeId);
      });

    /* ── program name ── */
    nodeGroups
      .append('text')
      .attr('x', 10)
      .attr('y', 16)
      .attr('font-size', '11px')
      .attr('font-family', 'var(--font-mono)')
      .attr('fill', (nodeDatum) => nodeColor(nodeDatum.data.programId))
      .text((nodeDatum) => truncateLabel(nodeDatum.data.programName, 22));

    /* ── instruction name ── */
    nodeGroups
      .append('text')
      .attr('x', 10)
      .attr('y', 32)
      .attr('font-size', '10px')
      .attr('font-family', 'var(--font-mono)')
      .attr('fill', 'var(--color-text-secondary)')
      .text((nodeDatum) => truncateLabel(nodeDatum.data.instructionName, 24));

    /* ── collapse toggle ── */
    nodeGroups
      .append('circle')
      .attr('cx', NODE_WIDTH + 12)
      .attr('cy', NODE_HEIGHT / 2)
      .attr('r', (nodeDatum) => {
        const childCount =
          (nodeDatum.data.children?.length ?? 0) +
          (nodeDatum.data._children?.length ?? 0);
        return childCount > 0 ? 6 : 0;
      })
      .attr('fill', (nodeDatum) =>
        nodeDatum.data._collapsed ? 'var(--color-accent-dim)' : 'var(--color-bg-elevated)'
      )
      .attr('stroke', 'var(--color-text-muted)')
      .attr('stroke-width', 1)
      .attr('cursor', 'pointer')
      .on('click', (_clickEvent, nodeDatum) => {
        _clickEvent.stopPropagation();
        toggleCollapse(nodeDatum.data);
      });

    return () => {
      d3.select(containerElement).selectAll('svg').remove();
    };
  }, [virtualRoot, selectedNodeId, treeVersion, toggleCollapse]);

  return (
    <div className={styles.treeContainer} ref={svgContainerRef} />
  );
}

function truncateLabel(labelText: string, maxLength: number): string {
  if (labelText.length <= maxLength) return labelText;
  return labelText.slice(0, maxLength - 1) + '\u2026';
}
