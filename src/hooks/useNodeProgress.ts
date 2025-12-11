import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export type NodeStatus = 'not_started' | 'learning' | 'mastered';

export function useNodeProgress(userId: string | null) {
  const [progress, setProgress] = useState<Record<string, number>>({});

  const getStatus = (score: number | null | undefined): NodeStatus => {
    if (score === null || score === undefined) return 'not_started';
    if (score >= 80) return 'mastered';
    if (score > 0) return 'learning';
    return 'not_started';
  };

  const openNode = useCallback(async (nodeId: string) => {
    if (!userId) return;
    try {
      await supabase.rpc('upsert_node_progress', {
        p_user_id: userId,
        p_node_id: nodeId,
        p_score: 0
      });

      setProgress(prev => ({
        ...prev,
        [nodeId]: prev[nodeId] ?? 0
      }));
    } catch (err) {
      console.error('Failed to open node:', err);
    }
  }, [userId]);

  const updateNodeScore = useCallback(async (nodeId: string, score: number) => {
    if (!userId) return;
    try {
      const { error } = await supabase.rpc('upsert_node_progress', {
        p_user_id: userId,
        p_node_id: nodeId,
        p_score: score
      });

      if (error) throw error;

      setProgress(prev => ({
        ...prev,
        [nodeId]: Math.max(score, prev[nodeId] ?? 0) // 🔥 giữ max score
      }));
    } catch (err) {
      console.error('Failed to update node score:', err);
    }
  }, [userId]);

  const fetchProgress = useCallback(async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('node_progress')
        .select('node_id, score')
        .eq('user_id', userId);

      if (error) throw error;

      const newProgress: Record<string, number> = {};
      data?.forEach((row: any) => {
        newProgress[row.node_id] = row.score ?? 0;
      });

      setProgress(newProgress);
    } catch (err) {
      console.error('Failed to fetch node progress:', err);
    }
  }, [userId]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  return {
    progress,
    openNode,
    updateNodeScore,
    getStatus,
    refreshProgress: fetchProgress
  };
}
