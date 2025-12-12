import { supabase } from '@/lib/supabaseClient';

export type NodeStatus = "not_started" | "learning" | "mastered";

export type NodeProgress = {
  status: NodeStatus;
  score: number;
  max_score?: number;
  passed: boolean;
  node_color: number; // 0: Blue, 1: Yellow, 2: Green
};

// Map score sang status (chỉ dùng tham khảo)
function mapScoreToStatus(score: number | null | undefined): NodeStatus {
  if (score === null || score === undefined || score === 0) return "not_started";
  if (score >= 80) return "mastered"; 
  return "learning";
}

// 1. OPEN NODE: Gửi node_color = 1 (Vàng) lên Server
export async function openNode(userId: string, nodeId: string): Promise<NodeProgress> {
  try {
    // Gọi RPC với p_node_color = 1
    await supabase.rpc('upsert_node_progress', {
      p_user_id: userId,
      p_node_id: nodeId,
      p_score: 0,
      p_node_color: 1 // <--- QUAN TRỌNG: Đánh dấu là đã học
    });

    return {
      status: "learning",
      score: 0,
      max_score: 0,
      passed: false,
      node_color: 1 // Trả về 1 để UI hiển thị Vàng ngay
    };
  } catch (err) {
    console.error('openNode error:', err);
    throw err;
  }
}

// 2. UPDATE SCORE: Gửi node_color = 2 (Xanh lá) nếu điểm cao
export async function updateNodeScore(userId: string, nodeId: string, score: number): Promise<NodeProgress> {
  try {
    const isMastered = score >= 80;
    const color = isMastered ? 2 : 1; // 2: Green, 1: Yellow

    await supabase.rpc('upsert_node_progress', {
      p_user_id: userId,
      p_node_id: nodeId,
      p_score: score,
      p_node_color: color
    });

    return {
      status: isMastered ? "mastered" : "learning",
      score,
      max_score: score, 
      passed: isMastered,
      node_color: color
    };
  } catch (err) {
    console.error('updateNodeScore error:', err);
    throw err;
  }
}

// 3. GET PROGRESS: Lấy node_color từ DB để giữ trạng thái sau khi reload
export async function getNodeProgress(userId: string): Promise<Record<string, NodeProgress>> {
  try {
    const { data, error } = await supabase
      .from('node_progress')
      // 👇 QUAN TRỌNG: Phải select thêm cột 'node_color'
      .select('node_id, score, max_score, node_color') 
      .eq('user_id', userId);

    if (error) throw error;

    const result: Record<string, NodeProgress> = {};
    (data || []).forEach((row: any) => {
      const bestScore = row.max_score ?? row.score ?? 0;
      
      // 👇 QUAN TRỌNG: Ưu tiên lấy màu từ DB. Nếu null thì mặc định 0.
      let color = row.node_color ?? 0; 
      
      // Logic fallback: Nếu DB cũ chưa có màu nhưng điểm >= 80 thì cho xanh lá
      if (bestScore >= 80) color = 2;

      result[row.node_id] = {
        status: bestScore >= 80 ? "mastered" : (color > 0 ? "learning" : "not_started"),
        score: row.score,
        max_score: row.max_score,
        passed: bestScore >= 80,
        node_color: color
      };
    });

    return result;
  } catch (err) {
    console.error('getNodeProgress error:', err);
    throw err;
  }
}