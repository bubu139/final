// frontend_nextjs/src/components/mind-map/mind-map-node.tsx
"use client";

import type { MindMapNode, MindMapNodeWithState, NodePosition } from '@/types/mindmap';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Minus, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

type MindMapNodeProps = {
  node: MindMapNodeWithState;
  position?: NodePosition;
  onToggle: (nodeId: string) => void;
  onDragStart: (nodeId: string) => void;
  onClick: (node: MindMapNode) => void;
};

export function MindMapNode({ node, position, onToggle, onDragStart, onClick }: MindMapNodeProps) {
  if (!position) {
    return null;
  }
  
  const isRoot = node.level === 0;
  const hasChildren = node.children.length > 0;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest('button')) return;
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
      className="absolute transition-all duration-700 ease-in-out cursor-grab active:cursor-grabbing"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -50%)',
        zIndex: node.level + 1,
      }}
      aria-label={`Node: ${node.label}`}
      onMouseDown={handleMouseDown}
      onClick={handleNodeClick}
    >
      <Card
        className={cn(
          'group min-w-64 text-center shadow-lg hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/80',
          isRoot ? 'border-primary' : 'border-transparent',
          node.isExpanded ? 'border-primary/50' : ''
        )}
      >
        <CardContent className="p-3 flex items-center gap-3">
          <div className={cn(
              "p-2 rounded-lg bg-primary/10",
              isRoot ? "bg-primary/20" : ""
            )}>
            <Share2 className={cn(
                "w-5 h-5",
                isRoot ? "text-primary" : "text-primary/80"
              )} />
          </div>
          <div className={cn(
            "font-semibold text-base font-headline text-card-foreground text-left",
            isRoot ? "text-lg" : ""
            )}>
            <ReactMarkdown
              className="prose dark:prose-invert max-w-none text-sm leading-relaxed prose-p:my-0"
              components={{ p: ({node, ...props}) => <p style={{margin: 0}} {...props} /> }}
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
              aria-label={node.isExpanded ? `Collapse ${node.label}` : `Expand ${node.label}`}
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