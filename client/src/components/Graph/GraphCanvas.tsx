import { useEffect, useMemo, useRef, useState } from 'react';
import type { TGraphData, TGraphNode } from '~/common/graph-types';
import { emitGraphEvent } from '~/hooks/Graph/useGraphEvents';

interface GraphCanvasProps {
  data: TGraphData;
  selectedNodeId: string | null;
  onSelectNode: (node: TGraphNode) => void;
}

interface SimNode extends TGraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const WIDTH = 640;
const HEIGHT = 480;

export default function GraphCanvas({ data, selectedNodeId, onSelectNode }: GraphCanvasProps) {
  const [nodes, setNodes] = useState<SimNode[]>([]);
  const frameRef = useRef<number>();
  const edgeList = useMemo(() => data.edges, [data.edges]);

  useEffect(() => {
    setNodes(
      data.nodes.map((n, i) => ({
        ...n,
        x: n.x ?? WIDTH / 2 + Math.cos(i) * 120,
        y: n.y ?? HEIGHT / 2 + Math.sin(i) * 120,
        vx: 0,
        vy: 0,
      })),
    );
  }, [data.nodes]);

  useEffect(() => {
    if (nodes.length === 0) return;
    let ticks = 0;
    const tick = () => {
      ticks += 1;
      setNodes((prev) => {
        const next = prev.map((n) => ({ ...n }));
        for (let i = 0; i < next.length; i++) {
          for (let j = i + 1; j < next.length; j++) {
            const a = next[i];
            const b = next[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const distSq = Math.max(dx * dx + dy * dy, 1);
            const force = 2000 / distSq;
            const fx = (dx / Math.sqrt(distSq)) * force;
            const fy = (dy / Math.sqrt(distSq)) * force;
            a.vx += fx; a.vy += fy;
            b.vx -= fx; b.vy -= fy;
          }
        }
        for (const edge of edgeList) {
          const a = next.find((n) => n.id === edge.source);
          const b = next.find((n) => n.id === edge.target);
          if (!a || !b) continue;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const spring = (dist - 140) * 0.02;
          const fx = (dx / dist) * spring;
          const fy = (dy / dist) * spring;
          a.vx += fx; a.vy += fy;
          b.vx -= fx; b.vy -= fy;
        }
        for (const n of next) {
          n.vx += (WIDTH / 2 - n.x) * 0.002;
          n.vy += (HEIGHT / 2 - n.y) * 0.002;
          n.vx *= 0.85; n.vy *= 0.85;
          n.x += n.vx; n.y += n.vy;
        }
        return next;
      });
      if (ticks < 200) frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.nodes.length, edgeList.length]);

  const nodeById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-full w-full select-none" role="img" aria-label="Graph view">
      {edgeList.map((edge) => {
        const a = nodeById.get(edge.source);
        const b = nodeById.get(edge.target);
        if (!a || !b) return null;
        return (
          <line key={edge.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="currentColor" strokeOpacity={0.25} strokeWidth={1.5} />
        );
      })}
      {nodes.map((node) => {
        const isSelected = node.id === selectedNodeId;
        return (
          <g
            key={node.id}
            transform={`translate(${node.x}, ${node.y})`}
            className="cursor-pointer"
            onClick={() => {
              onSelectNode(node);
              // The "on-click" event chat (or anything else) can listen to via useGraphEvent.
              emitGraphEvent('graph:node-click', { node });
            }}
            onMouseEnter={() => emitGraphEvent('graph:node-hover', { node })}
            onMouseLeave={() => emitGraphEvent('graph:node-hover', { node: null })}
          >
            <circle
              r={isSelected ? 12 : 9}
              className={isSelected ? 'fill-blue-500' : 'fill-slate-400 dark:fill-slate-500'}
              stroke={isSelected ? 'white' : 'none'}
              strokeWidth={2}
            />
            <text x={14} y={4} fontSize={11} className="fill-current text-text-primary">
              {node.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
