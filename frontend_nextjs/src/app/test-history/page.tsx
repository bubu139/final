// frontend_nextjs/src/app/test-history/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/supabase/auth/use-user';
import { useSupabase } from '@/supabase';
import { TestHistoryService } from '@/services/test-history.service';
import type { TestAttempt, TestAnalysis } from '@/types/test-history';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Clock,
  TrendingUp,
  Award,
  Target,
  BarChart3,
  ArrowRight,
  Loader
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TestHistoryPage() {
  const { user, isUserLoading } = useUser();
  const { client: supabase, isInitialized, error: supabaseError } = useSupabase();
  const router = useRouter();

  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [analysis, setAnalysis] = useState<TestAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

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

    const loadData = async () => {
      setIsLoading(true);
      try {
        const historyService = new TestHistoryService(supabase);

        // Load attempts
        const userAttempts = await historyService.getUserAttempts(user.id, 20);
        setAttempts(userAttempts);

        // Load analysis
        const userAnalysis = await historyService.analyzeWeakTopics(user.id);
        setAnalysis(userAnalysis);
        setLoadError(null);
      } catch (error) {
        console.error('Error loading test history:', error);
        setLoadError('Không thể tải lịch sử làm bài. Vui lòng thử lại sau.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
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

  if (!user) {
    return null; // Will redirect
  }

  return (
    <main className="flex-1 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Lịch sử làm bài</h1>
          <p className="text-muted-foreground">
            Xem lại kết quả các bài kiểm tra và theo dõi tiến độ học tập của bạn
          </p>
        </div>

        {loadError && (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardContent className="p-4 text-destructive">
              {loadError}
            </CardContent>
          </Card>
        )}

        {/* Statistics Overview */}
        {analysis && (
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Tổng số bài
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{analysis.totalAttempts}</span>
                  <BarChart3 className="w-5 h-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Điểm trung bình
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{analysis.averageScore.toFixed(1)}</span>
                  <Award className="w-5 h-5 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Tiến bộ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-bold ${analysis.improvementRate >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                    {analysis.improvementRate >= 0 ? '+' : ''}{analysis.improvementRate.toFixed(1)}%
                  </span>
                  <TrendingUp className={`w-5 h-5 ${analysis.improvementRate >= 0 ? 'text-green-500' : 'text-red-500'
                    }`} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Điểm yếu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{analysis.weakTopics.length}</span>
                  <Target className="w-5 h-5 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Weak Topics Card */}
        {analysis && analysis.weakTopics.length > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="text-orange-500" />
                Chủ đề cần cải thiện
              </CardTitle>
              <CardDescription>
                Những chủ đề bạn nên tập trung ôn tập
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {analysis.weakTopics.map((topic, idx) => (
                  <div key={idx} className="p-4 bg-white rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{topic.topic}</span>
                      <Badge className={`${topic.accuracy >= 80 ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                          topic.accuracy >= 50 ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' :
                            'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}>
                        {topic.accuracy.toFixed(0)}%
                      </Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${topic.accuracy >= 80 ? 'bg-green-500' :
                            topic.accuracy >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                        style={{ width: `${topic.accuracy}%` }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {topic.correctAnswers}/{topic.totalQuestions} câu đúng
                    </p>
                  </div>
                ))}
              </div>

              <Button
                className="w-full mt-4"
                onClick={() => router.push('/tests/adaptive')}
              >
                Làm đề thích ứng để cải thiện
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Test History List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Lịch sử các bài làm</h2>

          {attempts.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">Chưa có lịch sử</h3>
                <p className="text-muted-foreground mb-6">
                  Bạn chưa hoàn thành bài kiểm tra nào. Hãy bắt đầu ngay!
                </p>
                <Button asChild>
                  <Link href="/tests">
                    Làm bài kiểm tra
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {attempts.map((attempt) => (
                <Card key={attempt.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      {/* Left: Test Info */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{attempt.testTitle}</h3>
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
                          <Badge className={`text-lg px-4 py-2 ${getScoreColor(attempt.score)}`}>
                            {attempt.score.toFixed(1)}
                          </Badge>
                        </div>

                        {/* Mini Stats */}
                        <div className="flex gap-6 text-sm">
                          <span className="text-muted-foreground">
                            <strong>{attempt.correctAnswers}/{attempt.totalQuestions}</strong> câu đúng
                          </span>
                          <span className="text-muted-foreground">
                            Độ chính xác: <strong>{((attempt.correctAnswers / attempt.totalQuestions) * 100).toFixed(0)}%</strong>
                          </span>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <Button
                        variant="outline"
                        onClick={() => router.push(`/test-result/${attempt.id}`)}
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
      </div>
    </main>
  );
}