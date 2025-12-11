"use client";

import type { NodeProgress } from "@/lib/nodeProgressApi";

import type { MindMapNode, MindMapNodeWithState, NodePosition, Edge } from '@/types/mindmap';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MindMapNode as MindMapNodeComponent } from './mind-map-node';

// ---- FIX: Định nghĩa type mở rộng để TypeScript không báo lỗi max_score ----
type NodeProgressWithMaxScore = NodeProgress & {
  max_score?: number;
};
// ---- END FIX ----

type MindMapCanvasProps = {
  data: MindMapNode;
  progress: Record<string, NodeProgressWithMaxScore>; // Sử dụng type mở rộng ở đây
  selectedNodeId: string | null;
  onNodeClick: (node: MindMapNode) => void;
};

// ---- FIX: Cập nhật logic màu sắc chuẩn theo thang điểm 100 ----
const getStatusColor = (p?: NodeProgressWithMaxScore) => {
  if (!p) return "#2196F3"; // Mặc định: Xanh dương (Chưa học)

  // Ưu tiên lấy max_score (điểm cao nhất), nếu không có thì lấy score
  const currentScore = p.max_score ?? p.score ?? 0;

  // Logic màu dựa trên thang điểm 100
  if (currentScore >= 80) return "#4CAF50"; // Xanh lá (Thành thạo)
  if (currentScore >= 50) return "#FFC107"; // Vàng (Đang học/Khá)
  if (currentScore > 0) return "#FF9800";   // Cam (Mới bắt đầu/Điểm thấp)

  return "#2196F3"; // Xanh dương (Chưa có điểm)
};
// ---- END FIX ----

// Helper to initialize nodes with state from the raw data
const initializeNodes = (node: MindMapNode): Map<string, MindMapNodeWithState> => {
  const map = new Map<string, MindMapNodeWithState>();
  function recurse(n: MindMapNode, parentId: string | null, level: number) {
    const isRoot = parentId === null;
    map.set(n.id, { ...n, isExpanded: isRoot, parentId, level });
    n.children.forEach(child => recurse(child, n.id, level + 1));
  }
  recurse(node, null, 0);
  return map;
};

export function MindMapCanvas({
  data,
  progress,
  selectedNodeId,
  onNodeClick
}: MindMapCanvasProps) {
  const [nodes, setNodes] = useState<Map<string, MindMapNodeWithState>>(() => initializeNodes(data));
  const [positions, setPositions] = useState<Map<string, NodePosition>>(new Map());
  const [edges, setEdges] = useState<Edge[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [viewTransform, setViewTransform] = useState({ scale: 1, x: 0, y: 0 });

  useEffect(() => {
    setNodes(initializeNodes(data));
  }, [data]);

  useEffect(() => {
    if (canvasRef.current) {
      const resizeObserver = new ResizeObserver(entries => {
        if (entries[0]) {
          const { width, height } = entries[0].contentRect;
          setDimensions({ width, height });
        }
      });
      resizeObserver.observe(canvasRef.current);
      return () => resizeObserver.disconnect();
    }
  }, []);

  const calculateLayout = useCallback(() => {
    if (draggingNode) return;
    const newPositions = new Map<string, NodePosition>();
    if (dimensions.width === 0 || dimensions.height === 0) return;

    const root = Array.from(nodes.values()).find(n => n.level === 0);
    if (!root) return;

    const xSpacing = 350;
    const ySpacing = 130;

    const getVisibleChildren = (nodeId: string): MindMapNodeWithState[] => {
      const node = nodes.get(nodeId);
      if (!node || !node.isExpanded) return [];
      return node.children.map(child => nodes.get(child.id)!);
    };

    const calculateBranchSize = (nodeId: string): number => {
      const children = getVisibleChildren(nodeId);
      if (children.length === 0) {
        return 1;
      }
      return children.reduce((sum, child) => sum + calculateBranchSize(child.id), 0);
    };

    const positionNodesRecursively = (
      nodeId: string,
      x: number,
      y: number,
      side: 'left' | 'right'
    ) => {
      newPositions.set(nodeId, { x, y });

      const children = getVisibleChildren(nodeId);
      if (children.length === 0) return;

      const totalBranchSize = children.reduce((sum, child) => sum + calculateBranchSize(child.id), 0);
      let startY = y - ((totalBranchSize - children.length) * ySpacing) / 2 - (ySpacing * (children.length - 1)) / 2;

      let currentY = startY;
      children.forEach((child, index) => {
        const childBranchSize = calculateBranchSize(child.id);
        const yOffset = (childBranchSize - 1) * ySpacing / 2;

        positionNodesRecursively(
          child.id,
          x + (side === 'right' ? xSpacing : -xSpacing),
          currentY + yOffset,
          side
        );

        if (index < children.length - 1) {
          const nextChildBranchSize = calculateBranchSize(children[index + 1].id);
          currentY += (childBranchSize + nextChildBranchSize) / 2 * ySpacing;
        }
      });
    };

    newPositions.set(root.id, { x: dimensions.width / 2, y: dimensions.height / 2 });

    if (root.isExpanded) {
      const children = root.children;
      const leftChildren = children.slice(0, Math.ceil(children.length / 2));
      const rightChildren = children.slice(Math.ceil(children.length / 2));

      const positionSide = (childrenToPosition: MindMapNode[], side: 'left' | 'right') => {
        const totalSize = childrenToPosition.reduce((sum, child) => sum + calculateBranchSize(child.id), 0);
        let currentY = (dimensions.height / 2) - (ySpacing * (totalSize - childrenToPosition.length)) / 2 - (ySpacing * (childrenToPosition.length - 1) / 2);

        childrenToPosition.forEach((child, index) => {
          const childId = child.id;
          const childSize = calculateBranchSize(childId);
          const yOffset = (ySpacing * (childSize - 1)) / 2;
          const startX = newPositions.get(root.id)!.x;
          positionNodesRecursively(childId, startX + (side === 'right' ? xSpacing : -xSpacing), currentY + yOffset, side);

          if (index < childrenToPosition.length - 1) {
            const nextChild = childrenToPosition[index + 1];
            const nextChildSize = calculateBranchSize(nextChild.id);
            currentY += (childSize + nextChildSize) / 2 * ySpacing;
          }
        });
      };

      positionSide(leftChildren, 'left');
      positionSide(rightChildren, 'right');
    }

    const newEdges: Edge[] = [];
    nodes.forEach(node => {
      if (node.parentId) {
        const parent = nodes.get(node.parentId);
        if (parent?.isExpanded) {
          const fromPos = newPositions.get(node.parentId);
          const toPos = newPositions.get(node.id);
          if (fromPos && toPos) {
            newEdges.push({ id: `${node.parentId}-${node.id}`, from: fromPos, to: toPos });
          }
        }
      }
    });
    setPositions(newPositions);
    setEdges(newEdges);
  }, [nodes, dimensions, draggingNode]);


  useEffect(() => {
    calculateLayout();
  }, [calculateLayout]);

  const updateEdges = useCallback((currentPositions: Map<string, NodePosition>) => {
    const newEdges: Edge[] = [];
    nodes.forEach(node => {
      if (node.parentId) {
        const parent = nodes.get(node.parentId);
        if (parent && parent.isExpanded) {
          const fromPos = currentPositions.get(node.parentId);
          const toPos = currentPositions.get(node.id);
          if (fromPos && toPos) {
            newEdges.push({ id: `${node.parentId}-${node.id}`, from: fromPos, to: toPos });
          }
        }
      }
    });
    setEdges(newEdges);
  }, [nodes]);


  const handleToggleNode = (nodeId: string) => {
    setDraggingNode(null); // Stop dragging when toggling
    setNodes(prevNodes => {
      const newNodes = new Map(prevNodes);
      const node = newNodes.get(nodeId);
      if (node) {
        newNodes.set(nodeId, { ...node, isExpanded: !node.isExpanded });
      }
      return newNodes;
    });
  };

  const handleNodeDragStart = (nodeId: string) => {
    setDraggingNode(nodeId);
  };

  const handleDrag = useCallback((e: React.MouseEvent) => {
    if (!draggingNode || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - viewTransform.x) / viewTransform.scale;
    const y = (e.clientY - rect.top - viewTransform.y) / viewTransform.scale;

    setPositions(prev => {
      const newPos = new Map(prev);
      newPos.set(draggingNode, { x, y });
      updateEdges(newPos);
      return newPos;
    });
  }, [draggingNode, viewTransform, updateEdges]);

  const handleDragEnd = useCallback(() => {
    if (draggingNode) {
      setDraggingNode(null);
    }
    if (isPanning) {
      setIsPanning(false);
    }
  }, [draggingNode, isPanning]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const zoomFactor = 1.1;
    const newScale = e.deltaY < 0 ? viewTransform.scale * zoomFactor : viewTransform.scale / zoomFactor;
    const scale = Math.max(0.1, Math.min(newScale, 5));

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const contentMouseX = (mouseX - viewTransform.x) / viewTransform.scale;
    const contentMouseY = (mouseY - viewTransform.y) / viewTransform.scale;

    const newX = mouseX - contentMouseX * scale;
    const newY = mouseY - contentMouseY * scale;

    setViewTransform({ scale, x: newX, y: newY });
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).parentElement === canvasRef.current?.firstChild) {
      setIsPanning(true);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setViewTransform(prev => ({
        ...prev,
        x: prev.x + e.movementX,
        y: prev.y + e.movementY,
      }));
    } else if (draggingNode) {
      handleDrag(e);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseUp = () => handleDragEnd();
    const handleMouseMove = (e: MouseEvent) => handleCanvasMouseMove(e as unknown as React.MouseEvent);

    canvas.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPanning, draggingNode, handleDrag, handleDragEnd, handleCanvasMouseMove]);


  const visibleNodes = Array.from(nodes.values()).filter(node => {
    if (node.level === 0) return true;
    const parent = nodes.get(node.parentId!);
    return parent && parent.isExpanded && positions.has(node.id);
  });

  const visibleEdges = edges.filter(edge => {
    const toNode = Array.from(nodes.values()).find(n => positions.get(n.id) === edge.to);
    if (!toNode) return false;
    const parent = nodes.get(toNode.parentId!);
    return parent && parent.isExpanded;
  });

  return (
    <div
      ref={canvasRef}
      className="w-full h-full relative overflow-hidden cursor-grab active:cursor-grabbing"
      onWheel={handleWheel}
      onMouseDown={handleCanvasMouseDown}
    >
      <div
        className="absolute top-0 left-0 w-full h-full"
        style={{
          transform: `translate(${viewTransform.x}px, ${viewTransform.y}px) scale(${viewTransform.scale})`,
          transformOrigin: '0 0',
        }}
      >
        <svg className="absolute top-0 left-0" style={{ zIndex: 0, width: '100vw', height: '100vh', overflow: 'visible' }}>
          <g>
            {visibleEdges.map((edge) => {
              if (!edge.from || !edge.to) return null;
              const pathData = `M ${edge.from.x} ${edge.from.y} C ${(edge.from.x + edge.to.x) / 2} ${edge.from.y}, ${(edge.from.x + edge.to.x) / 2} ${edge.to.y}, ${edge.to.x} ${edge.to.y}`;
              return (
                <path
                  key={edge.id}
                  d={pathData}
                  stroke="hsl(var(--border))"
                  strokeWidth="2"
                  fill="none"
                  className="transition-all duration-700 ease-in-out"
                />
              );
            })}
          </g>
        </svg>
        {visibleNodes.map(node => {
          // ---- FIX: Lấy dữ liệu điểm số chính xác ----
          const nodeProgress = progress[node.id];
          const displayScore = nodeProgress?.max_score ?? nodeProgress?.score;
          // ---- END FIX ----

          return (
            <MindMapNodeComponent
              key={node.id}
              node={node}
              position={positions.get(node.id)}
              onToggle={handleToggleNode}
              onDragStart={handleNodeDragStart}
              onClick={() => onNodeClick(node)}
              color={getStatusColor(nodeProgress)} 
              score={displayScore} 
              isSelected={selectedNodeId === node.id}
            />
          );
        })}
      </div>
    </div>
  );
}