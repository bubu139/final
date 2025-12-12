// frontend_nextjs/src/components/QuickStatsWidget.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useUser } from '@/supabase/auth/use-user';
import { useSupabase } from '@/supabase';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Award,
  TrendingUp,
  Clock,
  ArrowRight,
  History,
  Calendar
} from 'lucide-react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';

type Trend = 'up' | 'down' | 'neutral';

type Attempt = {
  id: string;
  test_title: string | null;
  score: number | null;
  time_spent: number | null;       // giây
  completed_at: string | null;     // ISO string
  correct_answers: number | null;
  total_questions: number | null;
};

export function QuickStatsWidget() {
  const { user } = useUser();
  const { client: supabase } = useSupabase();

  const [stats, setStats] = useState<{
    recentScore: number | null;
    totalTests: number;
    totalTime: number;
    trend: Trend;
  }>({
    recentScore: null,
    totalTests: 0,
    totalTime: 0,
    trend: 'neutral'
  });

  const [isLoading, setIsLoading] = useState(true);

  // dữ liệu cho popup lịch sử
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user || !supabase) {
      setIsLoading(false);
      return;
    }

    const loadQuickStats = async () => {
      try {
        setIsLoading(true);

        // Lấy cả thống kê + lịch sử (chỉ 1 lần)
        const { data, error } = await supabase
          .from('test_attempts')
          .select(
            'id, test_title, score, time_spent, completed_at, correct_answers, total_questions'
          )
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false })
          .limit(20);

        if (error) {
          throw error;
        }

        const rows = data ?? [];

        if (rows.length === 0) {
          setAttempts([]);
          setStats({
            recentScore: null,
            totalTests: 0,
            totalTime: 0,
            trend: 'neutral'
          });
          setIsLoading(false);
          return;
        }

        const mapped: Attempt[] = rows.map((row: any) => ({
          id: row.id,
          test_title: row.test_title ?? null,
          score: row.score ?? null,
          time_spent: row.time_spent ?? null,
          completed_at: row.completed_at ?? null,
          correct_answers: row.correct_answers ?? null,
          total_questions: row.total_questions ?? null
        }));

        setAttempts(mapped);

        const recentScore = Number(mapped[0].score ?? 0);
        const totalTests = mapped.length;
        const totalTime = mapped.reduce(
          (sum, attempt) => sum + Number(attempt.time_spent ?? 0),
          0
        );

        let trend: Trend = 'neutral';
        if (mapped.length >= 2) {
          const recent = Number(mapped[0].score ?? 0);
          const previous = Number(mapped[1].score ?? 0);
          if (recent > previous + 5) trend = 'up';
          else if (recent < previous - 5) trend = 'down';
        }

        setStats({ recentScore, totalTests, totalTime, trend });
      } catch (error) {
        console.error('Error loading quick stats:', error);
        setAttempts([]);
        setStats({
          recentScore: null,
          totalTests: 0,
          totalTime: 0,
          trend: 'neutral'
        });
      } finally {
        setIsLoading(false);
      }
    };

    void loadQuickStats();
  }, [user, supabase]);

  const formatTime = (seconds: number | null) => {
    const total = Number(seconds ?? 0);
    const hours = Math.floor(total / 3600);
    const mins = Math.floor((total % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const formatDateTime = (value: string | null) => {
    if (!value) return 'Chưa xác định';
    const date = new Date(value);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const filteredAttempts = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return attempts;

    return attempts.filter((a) => {
      const title = (a.test_title ?? '').toLowerCase();
      const dateText = a.completed_at
        ? formatDateTime(a.completed_at).toLowerCase()
        : '';
      return title.includes(keyword) || dateText.includes(keyword);
    });
  }, [attempts, searchTerm]);

  // =================== CÁC TRẠNG THÁI GỐC ===================

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Theo dõi tiến độ</CardTitle>
          <CardDescription>Đăng nhập để lưu lại kết quả học tập</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/login">Đăng nhập ngay</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (stats.recentScore === null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bắt đầu học tập</CardTitle>
          <CardDescription>Chưa có bài kiểm tra nào được hoàn thành</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/tests">Làm bài kiểm tra đầu tiên</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // =================== UI CHÍNH + NÚT XEM TẤT CẢ (MỞ POPUP) ===================

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Tiến độ gần đây</CardTitle>
          <CardDescription>Thống kê học tập của bạn</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <Award className="w-6 h-6 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold">
                {stats.recentScore.toFixed(0)}
              </p>
              <p className="text-xs text-muted-foreground">Điểm gần nhất</p>
            </div>

            <div className="text-center">
              <TrendingUp className="w-6 h-6 mx-auto mb-1 text-blue-600" />
              <p className="text-2xl font-bold">{stats.totalTests}</p>
              <p className="text-xs text-muted-foreground">Bài đã làm</p>
            </div>

            <div className="text-center">
              <Clock className="w-6 h-6 mx-auto mb-1 text-orange-600" />
              <p className="text-2xl font-bold">
                {formatTime(stats.totalTime)}
              </p>
              <p className="text-xs text-muted-foreground">Thời gian</p>
            </div>
          </div>

          {stats.trend !== 'neutral' && (
            <div
              className={`p-3 rounded-lg text-center ${
                stats.trend === 'up'
                  ? 'bg-green-50 text-green-700'
                  : 'bg-orange-50 text-orange-700'
              }`}
            >
              <p className="text-sm font-medium">
                {stats.trend === 'up'
                  ? '🎉 Điểm số đang cải thiện!'
                  : '💪 Hãy cố gắng hơn nữa!'}
              </p>
            </div>
          )}

          {/* CHỈ CÒN 1 NÚT: XEM TẤT CẢ LỊCH SỬ (MỞ POPUP) */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => setIsHistoryOpen(true)}
            disabled={attempts.length === 0}
          >
            <History className="w-4 h-4 mr-2" />
            Xem tất cả lịch sử
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>

      {/* =================== POPUP LỊCH SỬ =================== */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Lịch sử làm bài</DialogTitle>
            <DialogDescription>
              Danh sách các bài kiểm tra bạn đã thực hiện gần đây.
            </DialogDescription>
          </DialogHeader>

          {/* Tìm kiếm */}
          <div className="mb-3 flex items-center gap-2">
            <Input
              placeholder="Tìm theo tên đề hoặc ngày làm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9"
            />
          </div>

          {/* Danh sách + thanh cuộn */}
          <ScrollArea className="h-[420px] pr-4">
            {filteredAttempts.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Không tìm thấy bài làm nào phù hợp.
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                {filteredAttempts.map((a) => {
                  const totalQ = Number(a.total_questions ?? 0);
                  const correct = Number(a.correct_answers ?? 0);
                  const accuracy =
                    totalQ > 0 ? Math.round((correct / totalQ) * 100) : 0;
                  const score = Number(a.score ?? 0);

                  // Đường dẫn chi tiết – KHỚP VỚI TestHistoryPage:
                  // /test-result/[attemptId]
                  const detailHref = `/test-result/${a.id}`;

                  return (
                    <div
                      key={a.id}
                      className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 transition hover:bg-accent/40"
                    >
                      {/* Bấm khối bên trái để vào trang chi tiết */}
                      <Link href={detailHref} className="flex-1 space-y-1">
                        <div className="font-medium">
                          {a.test_title || 'Đề kiểm tra'}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDateTime(a.completed_at)}
                          </span>
                          <span>Thời gian: {formatTime(a.time_spent)}</span>
                          {totalQ > 0 && (
                            <span>
                              {correct}/{totalQ} câu đúng · {accuracy}%
                            </span>
                          )}
                        </div>
                      </Link>

                      {/* Bên phải: điểm + nút Xem chi tiết */}
                      <div className="flex flex-col items-end gap-2 pl-4">
                        <div className="rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-red-600">
                          {score.toFixed(1)}
                        </div>
                        <Button asChild size="sm" variant="outline">
                          <Link href={detailHref} className="inline-flex items-center gap-1">
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
    </>
  );
}
