// frontend_nextjs/src/components/mind-map/mind-map-node.tsx
"use client";

import type { MindMapNode, MindMapNodeWithState, NodePosition } from '@/types/mindmap';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Minus, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

export type MindMapNodeProps = {
  node: MindMapNodeWithState;
  position?: NodePosition;
  onToggle: (nodeId: string) => void;
  onDragStart: (nodeId: string) => void;
  onClick: (node: MindMapNode) => void;

  color?: string;
  isSelected?: boolean;
  score?: number | null; // Add score prop
};

export function MindMapNode({
  node,
  position,
  onToggle,
  onDragStart,
  onClick,
  isSelected = false,
  color = "#2196F3",
  score,
}: MindMapNodeProps) {

  if (!position) return null;

  const nodeColor = color;
  const accentColor = isSelected ? "#ff9800" : nodeColor;

  const hasChildren = node.children.length > 0;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest("button")) return;
    e.preventDefault();
    e.stopPropagation();
    onDragStart(node.id);
  };

  const handleNodeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick(node);
  };

  return (
    <div
      className={cn(
        "absolute transition-all duration-700 ease-in-out cursor-grab active:cursor-grabbing",
        isSelected ? "ring-4 ring-yellow-400 rounded-xl" : ""
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: "translate(-50%, -50%)",
        zIndex: node.level + 1,
      }}
      onMouseDown={handleMouseDown}
      onClick={handleNodeClick}
    >
      <Card
        className="group min-w-64 text-center shadow-lg hover:shadow-xl transition-all duration-300 border-2 rounded-xl"
        style={{
          borderColor: accentColor,
          backgroundColor: "white",
        }}
      >
        <CardContent className="p-3 flex items-center gap-3">
          <div
            className="p-2 rounded-lg relative"
            style={{ backgroundColor: nodeColor + "22" }}
          >
            <Share2 className="w-5 h-5" style={{ color: nodeColor }} />
            {score !== undefined && score !== null && (
              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                {score.toFixed(0)}
              </div>
            )}
          </div>

          <div className="font-semibold text-base text-left" style={{ color: nodeColor }}>
            <ReactMarkdown
              className="prose dark:prose-invert max-w-none text-sm leading-relaxed prose-p:my-0"
              components={{
                p: ({ node, ...props }) => <p style={{ margin: 0 }} {...props} />,
              }}
            >
              {node.label}
            </ReactMarkdown>
          </div>

          {hasChildren && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onToggle(node.id);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className="ml-auto rounded-full w-7 h-7 flex-shrink-0"
            >
              {node.isExpanded ? (
                <Minus className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}