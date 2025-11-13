'use client';

import { MindMapCanvas } from "@/components/mind-map/mind-map-canvas";
import { mindMapData } from "@/lib/mindmap-data";
import type { MindMapNode } from '@/types/mindmap';
import { useEffect, useState } from "react";
import { NodeDetailDialog } from "@/components/mind-map/node-detail-dialog";
import { MINDMAP_STORAGE_KEY, loadStoredMindmapInsights, mergeMindmapWithInsights } from '@/lib/mindmap-storage';

export default function MindMapPage() {
  const [mindmapTree, setMindmapTree] = useState<MindMapNode>(() => mergeMindmapWithInsights(mindMapData, loadStoredMindmapInsights()));
  const [selectedNode, setSelectedNode] = useState<MindMapNode | null>(null);

  useEffect(() => {
    const refreshTree = () => {
      setMindmapTree(mergeMindmapWithInsights(mindMapData, loadStoredMindmapInsights()));
    };

    refreshTree();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === MINDMAP_STORAGE_KEY) {
        refreshTree();
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleNodeClick = (node: MindMapNode) => {
    setSelectedNode(node);
  };

  const handleCloseDialog = () => {
    setSelectedNode(null);
  };

  return (
    <main className="flex flex-col items-center justify-center h-full w-full p-0 m-0">
      <div className="relative w-full h-full">
         <MindMapCanvas data={mindmapTree} onNodeClick={handleNodeClick} />
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
