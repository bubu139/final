'use client';

import Link from "next/link";
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MindMapNode } from '@/types/mindmap';
import ReactMarkdown from 'react-markdown';
import { Loader, Sparkles, PencilRuler, BrainCircuit } from 'lucide-react';
import { Separator } from '../ui/separator';
import { API_BASE_URL } from '@/lib/utils';
// 🔥 FIX 1: Import API trực tiếp thay vì hook cũ
import { openNode, type NodeProgress } from "@/lib/nodeProgressApi";
import { useUser } from "@/supabase/auth/use-user"; // Import hook user nếu có, hoặc dùng context

type NodeDetailDialogProps = {
  node: MindMapNode;
  isOpen: boolean;
  onClose: () => void;
  // 🔥 FIX 2: Nhận progress từ cha để đảm bảo đồng bộ dữ liệu
  currentProgress?: NodeProgress; 
};

export function NodeDetailDialog({ node, isOpen, onClose, currentProgress }: NodeDetailDialogProps) {
  // Lấy user thật thay vì hardcode "test-user"
  const { user } = useUser(); 
  const userId = user?.id;

  // Khi mở dialog -> Gọi API mở node (đánh dấu là đang học)
  useEffect(() => {
    if (isOpen && node && userId) {
      // Gọi API ngầm, không cần chờ kết quả để chặn UI
      openNode(userId, node.id).catch(console.error);
    }
  }, [isOpen, node, userId]);

  // 🔥 FIX 3: Ưu tiên hiển thị Max Score
  // Nếu không có max_score thì mới lấy score, fallback về 0
  const rawScore = Math.round(currentProgress?.max_score ?? currentProgress?.score ?? 0);

  // 🔥 FIX 4: Cập nhật thang màu giống MindMapCanvas (>=80, >=50)
  let colorClass = "text-gray-400 bg-gray-100 border-gray-200"; // Default
  if (rawScore >= 80) {
    colorClass = "text-green-700 bg-green-100 border-green-300"; // Mastered
  } else if (rawScore >= 50) {
    colorClass = "text-yellow-700 bg-yellow-100 border-yellow-300"; // Learning (Good)
  } else if (rawScore > 0) {
    colorClass = "text-orange-700 bg-orange-100 border-orange-300"; // Started (Low)
  }

  const [summary, setSummary] = useState('');
  const [exercises, setExercises] = useState('');
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [isExercisesLoading, setIsExercisesLoading] = useState(false);

  useEffect(() => {
    if (isOpen && node) {
      setSummary('');
      setExercises('');

      const fetchSummary = async () => {
        setIsSummaryLoading(true);
        try {
          const response = await fetch(`${API_BASE_URL}/api/summarize-topic`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic: node.label }),
          });

          if (!response.ok) throw new Error('Failed to fetch summary');
          const data = await response.json();
          setSummary(data.summary);
        } catch {
          setSummary('Không thể tải tóm tắt kiến thức. Vui lòng thử lại.');
        } finally {
          setIsSummaryLoading(false);
        }
      };

      fetchSummary();
    }
  }, [isOpen, node]);

  const handleGenerateExercises = async () => {
    setIsExercisesLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/generate-exercises`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: node.label }),
      });

      if (!response.ok) throw new Error('Failed to fetch exercises');
      const data = await response.json();
      setExercises(data.exercises);
    } catch {
      setExercises('Không thể tạo bài tập. Vui lòng thử lại.');
    } finally {
      setIsExercisesLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center gap-3 text-lg font-bold">
            <BrainCircuit className="w-6 h-6 text-primary" />
            {node.label}
          </DialogTitle>

          <div className="mt-2 text-sm">
            <span className="font-semibold">Mức độ thành thạo: </span>
            <span className={`font-bold px-2 py-1 rounded-lg border ${colorClass}`}>
              {rawScore > 0 ? `${rawScore}%` : "Chưa kiểm tra"}
            </span>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed">
            {node.description && (
              <div className="mb-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                {node.description}
              </div>
            )}

            <h3 className="flex items-center gap-2 font-semibold text-md mb-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              Kiến thức liên quan
            </h3>

            {isSummaryLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader className="animate-spin" />
              </div>
            ) : (
              <ReactMarkdown>{summary}</ReactMarkdown>
            )}

            <Separator className="my-6" />

            <h3 className="flex items-center gap-2 font-semibold text-md mb-4">
              <PencilRuler className="w-5 h-5 text-green-500" />
              Bài tập vận dụng
            </h3>

            {isExercisesLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader className="animate-spin" />
              </div>
            ) : exercises ? (
              <div className="p-4 bg-muted/50 rounded-lg border">
                <ReactMarkdown>{exercises}</ReactMarkdown>
              </div>
            ) : (
              <div className="text-center text-gray-500 italic p-4">
                Nhấn nút bên dưới để tạo bài tập.
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 pt-4 border-t bg-background flex gap-3">
          <Button onClick={handleGenerateExercises} disabled={isExercisesLoading}>
            {isExercisesLoading ? <Loader className="animate-spin mr-2" /> : <Sparkles className="mr-2" />}
            {isExercisesLoading ? "Đang tạo..." : "Tạo bài tập mới"}
          </Button>

          <Link href={`/tests/custom-node-test?nodeId=${node.id}&title=${encodeURIComponent(node.label)}`}>
            <Button variant="secondary" className="w-full">
              🎯 Làm bài kiểm tra
            </Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}