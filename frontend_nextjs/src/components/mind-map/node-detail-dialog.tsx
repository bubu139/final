// frontend_nextjs/src/components/mind-map/node-detail-dialog.tsx
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
import { useNodeProgress } from "@/hooks/useNodeProgress";
import { useRouter } from "next/navigation";

type NodeDetailDialogProps = {
  node: MindMapNode;
  isOpen: boolean;
  onClose: () => void;
};

export function NodeDetailDialog({ node, isOpen, onClose }: NodeDetailDialogProps) {
  const router = useRouter();
  const userId = "test-user";

  // progress data
const { progress } = useNodeProgress(userId);

const nodeProgress = progress?.[node.id] ?? null;



  const [summary, setSummary] = useState('');
  const [exercises, setExercises] = useState('');
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [isExercisesLoading, setIsExercisesLoading] = useState(false);

  // ------------------------------
  // Lấy màu trạng thái theo điểm %
  // ------------------------------
const getScoreColor = (score: number | null | undefined) => {
  if (score === null || score === undefined) return "text-gray-500";
  return score >= 80 ? "text-green-600" : "text-amber-600";
};


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
        } catch (error) {
          console.error('Error fetching summary:', error);
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
    setExercises('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/generate-exercises`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: node.label }),
      });

      if (!response.ok) throw new Error('Failed to fetch exercises');
      const data = await response.json();
      setExercises(data.exercises);
    } catch (error) {
      console.error('Error fetching exercises:', error);
      setExercises('Không thể tạo bài tập. Vui lòng thử lại.');
    } finally {
      setIsExercisesLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0">
        
        {/* HEADER */}
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center gap-3 text-lg font-bold">
            <BrainCircuit className="w-6 h-6 text-primary" />
            {node.label}
          </DialogTitle>

{/* MỨC ĐỘ THÀNH THẠO — BẢN ĐÃ NÂNG CẤP */}
<div className="mt-2 text-sm">
  <span className="font-semibold">Mức độ thành thạo: </span>

  {(() => {
const rawScore = nodeProgress?.score ?? null;

if (rawScore === null) {
  return (
    <span className="font-bold px-2 py-1 rounded-lg border text-gray-600 bg-gray-100 border-gray-300">
      Chưa kiểm tra
    </span>
  );
}

const percent = Math.round(rawScore);

const color =
  percent >= 80
    ? "text-green-700 bg-green-100 border-green-300"
    : "text-amber-700 bg-amber-100 border-amber-300";

return (
  <span className={`font-bold px-2 py-1 rounded-lg border ${color}`}>
    {percent}%
  </span>
);

  })()}
</div>


        </DialogHeader>

        {/* CONTENT */}
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

        {/* FOOTER */}
<DialogFooter className="p-6 pt-4 border-t bg-background flex gap-3">

  <Button onClick={handleGenerateExercises} disabled={isExercisesLoading}>
    {isExercisesLoading ? <Loader className="animate-spin mr-2" /> : <Sparkles className="mr-2" />}
    {isExercisesLoading ? "Đang tạo..." : "Tạo bài tập mới"}
  </Button>

  {/* NÚT LÀM BÀI KIỂM TRA – BẢN SỬA CHUẨN */}
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


