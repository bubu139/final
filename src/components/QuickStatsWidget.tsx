// frontend_nextjs/src/components/QuickStatsWidget.tsx
'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/supabase/auth/use-user';
import { useSupabase } from '@/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function QuickStatsWidget() {
  const { user } = useUser();
  const { client: supabase } = useSupabase();

  const [stats, setStats] = useState<{
    recentScore: number | null;
    totalTests: number;
    totalTime: number;
    trend: 'up' | 'down' | 'neutral';
  }>({
    recentScore: null,
    totalTests: 0,
    totalTime: 0,
    trend: 'neutral'
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !supabase) {
      setIsLoading(false);
      return;
    }

    const loadQuickStats = async () => {
      try {
        setIsLoading(true);

        const { data, error } = await supabase
          .from('test_attempts')
          .select('score, time_spent, completed_at')
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false })
          .limit(5);

        if (error) {
          throw error;
        }

        const attempts = data ?? [];

        if (attempts.length === 0) {
          setIsLoading(false);
          setStats({ recentScore: null, totalTests: 0, totalTime: 0, trend: 'neutral' });
          return;
        }

        const recentScore = Number(attempts[0].score ?? 0);
        const totalTests = attempts.length;
        const totalTime = attempts.reduce((sum, attempt) => sum + Number(attempt.time_spent ?? 0), 0);

        // Tính xu hướng
        let trend: 'up' | 'down' | 'neutral' = 'neutral';
        if (attempts.length >= 2) {
          const recent = Number(attempts[0].score ?? 0);
          const previous = Number(attempts[1].score ?? 0);
          if (recent > previous + 5) trend = 'up';
          else if (recent < previous - 5) trend = 'down';
        }

        setStats({ recentScore, totalTests, totalTime, trend });
      } catch (error) {
        console.error("Error loading quick stats:", error);
        setStats({ recentScore: null, totalTests: 0, totalTime: 0, trend: 'neutral' });
      } finally {
        setIsLoading(false);
      }
    };

    loadQuickStats();
  }, [user, supabase]);

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

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tiến độ gần đây</CardTitle>
        <CardDescription>Thống kê học tập của bạn</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <Award className="w-6 h-6 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{stats.recentScore.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">Điểm gần nhất</p>
          </div>
          
          <div className="text-center">
            <TrendingUp className="w-6 h-6 mx-auto mb-1 text-blue-600" />
            <p className="text-2xl font-bold">{stats.totalTests}</p>
            <p className="text-xs text-muted-foreground">Bài đã làm</p>
          </div>
          
          <div className="text-center">
            <Clock className="w-6 h-6 mx-auto mb-1 text-orange-600" />
            <p className="text-2xl font-bold">{formatTime(stats.totalTime)}</p>
            <p className="text-xs text-muted-foreground">Thời gian</p>
          </div>
        </div>

        {stats.trend !== 'neutral' && (
          <div className={`p-3 rounded-lg text-center ${
            stats.trend === 'up' 
              ? 'bg-green-50 text-green-700' 
              : 'bg-orange-50 text-orange-700'
          }`}>
            <p className="text-sm font-medium">
              {stats.trend === 'up' 
                ? '🎉 Điểm số đang cải thiện!' 
                : '💪 Hãy cố gắng hơn nữa!'}
            </p>
          </div>
        )}

        <Button asChild variant="outline" className="w-full">
          <Link href="/history">
            Xem chi tiết
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}