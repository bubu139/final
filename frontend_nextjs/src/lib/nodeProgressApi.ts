import { supabase } from '@/lib/supabaseClient';

export type NodeStatus = "not_started" | "learning" | "mastered";

export type NodeProgress = {
  status: NodeStatus;
  score: number;
  max_score?: number; // ⚠️ QUAN TRỌNG: Phải có dòng này
  passed: boolean;
};

// Map score sang status (Thang 100)
function mapScoreToStatus(score: number | null | undefined): NodeStatus {
  if (score === null || score === undefined || score === 0) return "not_started";
  if (score >= 80) return "mastered"; // >= 80 điểm là Master (Xanh)
  return "learning";
}

// 1. OPEN NODE
export async function openNode(userId: string, nodeId: string): Promise<NodeProgress> {
  try {
    await supabase.rpc('upsert_node_progress', {
      p_user_id: userId,
      p_node_id: nodeId,
      p_score: 0,
    });

    return {
      status: "learning",
      score: 0,
      max_score: 0,
      passed: false,
    };
  } catch (err) {
    console.error('openNode error:', err);
    throw err;
  }
}

// 2. UPDATE SCORE
export async function updateNodeScore(userId: string, nodeId: string, score: number): Promise<NodeProgress> {
  try {
    await supabase.rpc('upsert_node_progress', {
      p_user_id: userId,
      p_node_id: nodeId,
      p_score: score,
    });

    return {
      status: mapScoreToStatus(score),
      score,
      max_score: score, 
      passed: score >= 80,
    };
  } catch (err) {
    console.error('updateNodeScore error:', err);
    throw err;
  }
}

// 3. GET PROGRESS (⚠️ QUAN TRỌNG NHẤT)
export async function getNodeProgress(
  userId: string
): Promise<Record<string, NodeProgress>> {
  try {
    const { data, error } = await supabase
      .from("node_progress")
      .select("node_id, score, max_score") // nhớ bảng này phải tồn tại ở DB
      .eq("user_id", userId);

    if (error) {
      // log chi tiết nhưng không throw nữa
      console.warn("[nodeProgressApi] Supabase error khi load progress:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return {};
    }

    const result: Record<string, NodeProgress> = {};

    (data || []).forEach((row: any) => {
      const currentScore = Number(row.score) || 0;
      const maxScore = row.max_score != null ? Number(row.max_score) : 0;

      // Điểm tốt nhất từng đạt được
      const bestScore = Math.max(currentScore, maxScore);

      result[row.node_id] = {
        status: mapScoreToStatus(bestScore),
        score: bestScore,
        max_score: maxScore,
        passed: bestScore >= 80,
      };
    });

    return result;
  } catch (err: any) {
    // Không throw nữa để Mindmap không bị lỗi
    console.warn(
      "[nodeProgressApi] getNodeProgress unexpected error:",
      err?.message ?? err
    );
    return {};
  }
}