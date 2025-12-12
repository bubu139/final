// frontend_nextjs/src/app/test-history/all/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useUser } from '@/supabase/auth/use-user';
import { useSupabase } from '@/supabase';
import { TestHistoryService } from '@/services/test-history.service';
import type { TestAttempt } from '@/types/test-history';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Clock,
  ArrowLeft,
  ArrowRight,
  Loader,
  BarChart3,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';

export default function AllTestHistoryPage() {
  const { user, isUserLoading } = useUser();
  const { client: supabase, isInitialized, error: supabaseError } = useSupabase();
  const router = useRouter();

  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isUserLoading || !isInitialized) return;

    if (!user) {
      router.push('/login');
      return;
    }

    if (supabaseError) {
      setLoadError(supabaseError);
      setIsLoading(false);
      return;
    }

    if (!supabase) {
      setLoadError('Không thể kết nối tới Supabase.');
      setIsLoading(false);
      return;
    }

    const loadAllAttempts = async () => {
      setIsLoading(true);
      try {
        const historyService = new TestHistoryService(supabase);
        // Lấy gần như toàn bộ lịch sử (ví dụ 1000 bài)
        const allAttempts = await historyService.getUserAttempts(user.id, 1000);
        setAttempts(allAttempts);
        setLoadError(null);
      } catch (error) {
        console.error('Error loading full test history:', error);
        setLoadError('Không thể tải đầy đủ lịch sử làm bài. Vui lòng thử lại sau.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadAllAttempts();
  }, [user, isUserLoading, isInitialized, supabase, supabaseError, router]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50';
    if (score >= 70) return 'text-blue-600 bg-blue-50';
    if (score >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredAttempts = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return attempts;
    return attempts.filter((a) =>
      (a.testTitle ?? '').toLowerCase().includes(keyword),
    );
  }, [attempts, searchTerm]);

  if (isUserLoading || !isInitialized || isLoading) {
    return (
      <main className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Đang tải lịch sử...</p>
        </div>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="flex-1 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Tất cả lịch sử các bài làm</h1>
            <p className="text-muted-foreground">
              Xem toàn bộ các bài kiểm tra bạn đã thực hiện và tìm kiếm theo tên đề.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Tổng số bài: <strong>{attempts.length}</strong>
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/test-history')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
        </div>

        {loadError && (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardContent className="p-4 text-destructive">
              {loadError}
            </CardContent>
          </Card>
        )}

        {/* Search bar */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Tìm kiếm bài đã làm
            </CardTitle>
            <CardDescription>
              Nhập tên đề / dạng bài để lọc lịch sử.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Ví dụ: Đề minh họa THPT QG, Ôn tập hàm số..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </CardContent>
        </Card>

        {/* List all attempts */}
        {filteredAttempts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">
                Không tìm thấy bài phù hợp
              </h3>
              <p className="text-muted-foreground mb-2">
                Thử đổi từ khóa tìm kiếm hoặc xoá ô tìm kiếm để xem toàn bộ.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredAttempts.map((attempt) => (
              <Card
                key={attempt.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Test Info */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {attempt.testTitle}
                          </h3>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(attempt.completedAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formatTime(attempt.timeSpent)}
                            </span>
                          </div>
                        </div>

                        {/* Score Badge */}
                        <Badge
                          className={`text-lg px-4 py-2 ${getScoreColor(
                            attempt.score,
                          )}`}
                        >
                          {attempt.score.toFixed(1)}
                        </Badge>
                      </div>

                      {/* Mini Stats */}
                      <div className="flex gap-6 text-sm">
                        <span className="text-muted-foreground">
                          <strong>
                            {attempt.correctAnswers}/{attempt.totalQuestions}
                          </strong>{' '}
                          câu đúng
                        </span>
                        <span className="text-muted-foreground">
                          Độ chính xác:{' '}
                          <strong>
                            {(
                              (attempt.correctAnswers / attempt.totalQuestions) *
                              100
                            ).toFixed(0)}
                            %
                          </strong>
                        </span>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <Button
                      variant="outline"
                      onClick={() =>
                        router.push(`/test-result/${attempt.id}`)
                      }
                    >
                      Xem chi tiết
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
