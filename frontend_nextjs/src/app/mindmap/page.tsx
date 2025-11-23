"use client";

import { useEffect, useState } from "react";
import { MindMapCanvas } from "@/components/mind-map/mind-map-canvas";
import { NodeDetailDialog } from "@/components/mind-map/node-detail-dialog";
import { mindMapData } from "@/lib/mindmap-data";
import type { MindMapNode } from "@/types/mindmap";

import {
  getNodeProgress,
  openNode,
  updateNodeScore,
  NodeProgress,
} from "@/lib/nodeProgressApi";

import { useUser } from "@/supabase/auth/use-user";

export default function MindmapPage() {
  const { user } = useUser();
  const userId = user?.id || "";

  const [selectedNode, setSelectedNode] = useState<MindMapNode | null>(null);

  // progress dưới dạng Record<nodeId, NodeProgress>
  const [progress, setProgress] = useState<Record<string, NodeProgress>>({});
  const [loading, setLoading] = useState(true);

  // =================================================
  // LOAD PROGRESS TỪ SUPABASE
  // =================================================
  useEffect(() => {
    if (!userId) return;

    const load = async () => {
      try {
        const data = await getNodeProgress(userId);
        setProgress(data || {});
      } catch (error) {
        console.error("Failed to load node progress:", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  if (loading) return <p>Đang tải...</p>;

  // =================================================
  // HANDLE CLICK NODE
  // =================================================
  async function handleNodeClick(node: MindMapNode) {
    setSelectedNode(node);

    // Gọi API mở node
    const updated = await openNode(userId, node.id);

    // Update lại local progress để đổi màu node ngay
    setProgress((prev) => ({
      ...prev,
      [node.id]: updated,
    }));
  }

  return (
    <div className="w-full h-full relative">
      {/* MINDMAP CANVAS */}
      <MindMapCanvas
        data={mindMapData}
        progress={progress}
        selectedNodeId={selectedNode?.id ?? null}
        onNodeClick={handleNodeClick}
      />

      {/* POPUP NODE DETAILS */}
      {selectedNode && (
        <NodeDetailDialog
          isOpen
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
}
