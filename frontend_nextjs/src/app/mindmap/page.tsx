'use client';

import { MindMapCanvas } from "@/components/mind-map/mind-map-canvas";
import { mindMapData } from "@/lib/mindmap-data";
import type { MindMapNode } from '@/types/mindmap';
import { useState } from "react";
import { NodeDetailDialog } from "@/components/mind-map/node-detail-dialog";

export default function MindMapPage() {
  const [selectedNode, setSelectedNode] = useState<MindMapNode | null>(null);

  const handleNodeClick = (node: MindMapNode) => {
    setSelectedNode(node);
  };

  const handleCloseDialog = () => {
    setSelectedNode(null);
  };

  return (
    <main className="flex flex-col items-center justify-center h-full w-full p-0 m-0">
      <div className="relative w-full h-full">
         <MindMapCanvas data={mindMapData} onNodeClick={handleNodeClick} />
      </div>
      {selectedNode && (
        <NodeDetailDialog 
          node={selectedNode}
          isOpen={!!selectedNode}
          onClose={handleCloseDialog}
        />
      )}
    </main>
  );
}
