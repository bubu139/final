"use client";

import { useEffect, useState } from "react";
import { getNodeProgress, openNode, updateNodeScore } from "@/lib/nodeProgressApi";

// Status học của node
export type NodeStatus = "not_started" | "learning" | "mastered";

// Kiểu dữ liệu đầy đủ của một node progress
export type NodeProgress = {
  status: NodeStatus;
  score: number | null;      // điểm %
  passed: boolean;           // score >= 80%
};

export function useNodeProgress(userId: string) {
  const [progress, setProgress] = useState<Record<string, NodeProgress>>({});
  const [loading, setLoading] = useState(true);

  // Load dữ liệu khi đăng nhập
  useEffect(() => {
    if (!userId) return;
    loadProgress();
  }, [userId]);

  // LOAD trạng thái học từ API
  async function loadProgress() {
    setLoading(true);
    const data = await getNodeProgress(userId);

    // data trả về dạng:
    // { nodeId: { status, score, passed } }
    setProgress(data || {});
    setLoading(false);
  }

  // Khi mở node (user click xem lý thuyết)
  async function markNodeOpened(nodeId: string) {
    const res = await openNode(userId, nodeId);

    setProgress((prev) => ({
      ...prev,
      [nodeId]: {
        status: res.status,
        score: prev[nodeId]?.score ?? null,
        passed: prev[nodeId]?.passed ?? false
      }
    }));
  }

  // Cập nhật điểm bài kiểm tra
  async function updateScore(nodeId: string, score: number) {
    const passed = score >= 80;
    const res = await updateNodeScore(userId, nodeId, score);

    setProgress((prev) => ({
      ...prev,
      [nodeId]: {
        status: res.status, 
        score,
        passed
      }
    }));
  }

  // ⭐⭐ NEW: Cập nhật local state mà không gọi API
  function updateNodeProgress(nodeId: string, updates: Partial<NodeProgress>) {
    setProgress(prev => ({
      ...prev,
      [nodeId]: {
        ...prev[nodeId],
        ...updates
      }
    }));
  }

  return {
    progress,
    loading,
    markNodeOpened,
    updateScore,
    updateNodeProgress,   // ⭐ thêm vào return
  };
}
