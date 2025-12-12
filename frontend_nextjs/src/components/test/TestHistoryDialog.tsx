// frontend_nextjs/src/components/test/TestHistoryDialog.tsx
'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, ArrowRight } from 'lucide-react';

export type QuickAttempt = {
  id: string;
  test_title: string | null;
  score: number | null;
  correct_answers: number | null;
  total_questions: number | null;
  time_spent: number | null;     // tính bằng giây
  completed_at: string | null;   // ISO string
};

interface TestHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attempts: QuickAttempt[];
}

function formatDateTime(value: string | null) {
  if (!value) return 'Chưa xác định';
  const date = new Date(value);
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function formatTime(seconds: number | null) {
  const total = Number(seconds ?? 0);
  if (total <= 0) return '0 phút';

  const minutes = Math.round(total / 60);
  if (minutes < 60) return `${minutes} phút`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (rest === 0) return `${hours} giờ`;
  return `${hours} giờ ${rest} phút`;
}

export function TestHistoryDialog({ open, onOpenChange, attempts }: TestHistoryDialogProps) {
  const [search, setSearch] = useState('');

  const filteredAttempts = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return attempts;

    return attempts.filter((a) => {
      const title = (a.test_title ?? '').toLowerCase();
      const dateText = a.completed_at ? formatDateTime(a.completed_at).toLowerCase() : '';
      return title.includes(keyword) || dateText.includes(keyword);
    });
  }, [attempts, search]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Lịch sử làm bài</DialogTitle>
          <DialogDescription>
            Danh sách các bài kiểm tra bạn đã làm gần đây.
          </DialogDescription>
        </DialogHeader>

        {/* Thanh tìm kiếm */}
        <div className="mb-3 flex items-center gap-2">
          <Input
            placeholder="Tìm theo tên đề hoặc ngày làm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9"
          />
        </div>

        {/* Khu vực scroll */}
        <ScrollArea className="h-[460px] pr-4">
          {filteredAttempts.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Không tìm thấy bài làm nào phù hợp.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAttempts.map((attempt) => {
                const totalQuestions = Number(attempt.total_questions ?? 0);
                const correct = Number(attempt.correct_answers ?? 0);
                const score = Number(attempt.score ?? 0);
                const accuracy =
                  totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;

                let scoreColor = 'bg-red-50 text-red-600';
                if (score >= 90) scoreColor = 'bg-green-50 text-green-600';
                else if (score >= 70) scoreColor = 'bg-blue-50 text-blue-600';
                else if (score >= 50) scoreColor = 'bg-yellow-50 text-yellow-600';

                return (
                  <div
                    key={attempt.id}
                    className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 text-sm transition hover:bg-accent/40"
                  >
                    <div className="space-y-1">
                      <div className="font-medium">
                        {attempt.test_title || 'Đề kiểm tra'}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDateTime(attempt.completed_at)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(attempt.time_spent)}
                        </span>
                        {totalQuestions > 0 && (
                          <span>
                            {correct}/{totalQuestions} câu đúng · {accuracy}%
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge className={scoreColor}>{score.toFixed(1)}</Badge>
                      <Button asChild variant="ghost" size="sm">
                        <Link
                          href={`/test/result/${attempt.id}`}
                          className="inline-flex items-center gap-1"
                        >
                          Xem chi tiết
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
