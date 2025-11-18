// Import API_URL từ file config
import { API_URL } from '../config'; // Hoặc đường dẫn đúng tới file config.js của bạn

export type NodeStatus = "not_started" | "learning" | "mastered";

export type NodeProgress = {
  status: NodeStatus;
  score: number | null;
  passed: boolean;
};

function mapScoreToStatus(score: number | null): NodeStatus {
  if (score === null) return "learning";
  if (score >= 80) return "mastered";
  return "learning";
}

// ===============================
// 1) OPEN NODE
// ===============================
export async function openNode(
  userId: string,
  nodeId: string
): Promise<NodeProgress> {
  // SỬA: Dùng API_URL thay vì localhost
  await fetch(`${API_URL}/node-progress/update`, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_id: userId,
      node_id: nodeId,
      opened: true,
      score: null,
    }),
  });

  return {
    status: "learning",
    score: null,
    passed: false,
  };
}

// ===============================
// 2) UPDATE SCORE
// ===============================
export async function updateNodeScore(
  userId: string,
  nodeId: string,
  score: number
): Promise<NodeProgress> {
  // SỬA: Dùng API_URL thay vì localhost
  await fetch(`${API_URL}/node-progress/update`, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_id: userId,
      node_id: nodeId,
      opened: true,
      score: score,
    }),
  });

  return {
    status: mapScoreToStatus(score),
    score,
    passed: score >= 80,
  };
}

// ===============================
// 3) GET PROGRESS
// ===============================
export async function getNodeProgress(
  userId: string
): Promise<Record<string, NodeProgress>> {
  // SỬA: Dùng API_URL thay vì localhost
  const res = await fetch(`${API_URL}/node-progress/${userId}`, {
    method: "GET",
    headers: {
      "Accept": "application/json",
    },
  });

  const json = await res.json();
  const list = Array.isArray(json) ? json : json.data ?? [];
  const result: Record<string, NodeProgress> = {};

  for (const item of list) {
    result[item.node_id] = {
      status: mapScoreToStatus(item.score),
      score: item.score,
      passed: item.score >= 80,
    };
  }

  return result;
}
