'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  AvatarFallback,
} from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  AlertCircle,
  BrainCircuit,
  FileText,
  LineChart,
  Loader,
  Sparkles,
  Target,
  TrendingUp,
  UserRound,
} from 'lucide-react';
import Link from 'next/link';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from 'recharts';
import { useUser } from '@/supabase/auth/use-user';
import { useSupabase } from '@/supabase';
import { TestHistoryService } from '@/services/test-history.service';
import type { TestAnalysis, TestAttempt } from '@/types/test-history';

const masteryConfig: ChartConfig = {
  advanced: { label: 'Nắm vững', color: 'hsl(var(--primary))' },
  practicing: { label: 'Đang luyện', color: '#f97316' },
  weak: { label: 'Cần ôn', color: '#ef4444' },
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat('vi-VN', {
    month: 'short',
    day: '2-digit',
  }).format(date);
}

type TopicStat = {
  correct: number;
  total: number;
  accuracy: number;
};

export default function UserPage() {
  const { user, isUserLoading } = useUser();
  const { client: supabase, isInitialized, error: supabaseError } = useSupabase();

  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [analysis, setAnalysis] = useState<TestAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (isUserLoading || !isInitialized) return;

    if (!user) {
      setIsLoading(false);
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
        const userAttempts = await historyService.getUserAttempts(user.id, 30);
        const userAnalysis = await historyService.analyzeWeakTopics(user.id);
        setAttempts(userAttempts);
        setAnalysis(userAnalysis);
        setLoadError(null);
      } catch (error) {
        console.error('Error loading profile data:', error);
        setLoadError('Không thể tải dữ liệu hồ sơ. Vui lòng thử lại sau.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isUserLoading, isInitialized, supabase, supabaseError, user]);

  const topicStats = useMemo<Record<string, TopicStat>>(() => {
    const stats: Record<string, TopicStat> = {};
    attempts.forEach((attempt) => {
      attempt.answers.forEach((answer) => {
        const topic = answer.topic || attempt.topic || 'Khác';
        if (!stats[topic]) {
          stats[topic] = { correct: 0, total: 0, accuracy: 0 };
        }
        stats[topic].total += 1;
        if (answer.isCorrect) {
          stats[topic].correct += 1;
        }
      });
    });

    Object.keys(stats).forEach((topic) => {
      const value = stats[topic];
      value.accuracy = value.total === 0 ? 0 : (value.correct / value.total) * 100;
    });

    return stats;
  }, [attempts]);

  const topicEntries = useMemo(
    () =>
      Object.entries(topicStats).map(([topic, stat]) => ({
        topic,
        correct: stat.correct,
        total: stat.total,
        accuracy: stat.accuracy,
      })),
    [topicStats],
  );

  const strengthTopics = useMemo(
    () => {
      const strong = topicEntries
        .filter((entry) => entry.accuracy >= 80)
        .sort((a, b) => b.accuracy - a.accuracy)
        .slice(0, 4);

      if (strong.length > 0) return strong;

      // Fallback: Top 3 topics with accuracy >= 50
      return topicEntries
        .filter((entry) => entry.accuracy >= 50)
        .sort((a, b) => b.accuracy - a.accuracy)
        .slice(0, 3);
    },
    [topicEntries],
  );

  const practicingTopics = useMemo(
    () =>
      topicEntries
        .filter((entry) => entry.accuracy >= 50 && entry.accuracy < 80)
        .sort((a, b) => a.accuracy - b.accuracy),
    [topicEntries],
  );

  const fallbackWeakTopics = useMemo(
    () =>
      topicEntries
        .filter((entry) => entry.accuracy < 50)
        .map((entry) => ({
          topic: entry.topic,
          accuracy: entry.accuracy,
          correctAnswers: entry.correct,
          totalQuestions: entry.total,
        })),
    [topicEntries],
  );

  const knowledgeFocus = useMemo(
    () => (analysis?.weakTopics?.length ? analysis.weakTopics : fallbackWeakTopics),
    [analysis, fallbackWeakTopics],
  );

  const scoreTrendData = useMemo(
    () =>
      attempts.length === 0
        ? []
        : [...attempts]
          .reverse()
          .slice(0, 6)
          .map((attempt) => ({
            name: formatShortDate(attempt.completedAt),
            score: Number(attempt.score.toFixed(1)),
          })),
    [attempts],
  );

  const radarData = useMemo(
    () =>
      (topicEntries.length ? topicEntries : [{ topic: 'Chưa có dữ liệu', accuracy: 0 }])
        .sort((a, b) => b.accuracy - a.accuracy)
        .slice(0, 5)
        .map((entry) => ({
          skill: entry.topic,
          score: Number(entry.accuracy.toFixed(1)),
        })),
    [topicEntries],
  );

  const masteryData = useMemo(() => {
    const strong = strengthTopics.length;
    const practicing = practicingTopics.length;
    const weak = knowledgeFocus.length;
    return [
      { name: 'Nắm vững', value: strong },
      { name: 'Đang luyện', value: practicing },
      { name: 'Cần ôn', value: weak },
    ];
  }, [strengthTopics.length, practicingTopics.length, knowledgeFocus.length]);

  const totalTests = attempts.length;
  const averageScore = totalTests
    ? attempts.reduce((sum, attempt) => sum + attempt.score, 0) / totalTests
    : 0;
  const latestScore = attempts[0]?.score ?? 0;
  const totalTimeSpent = attempts.reduce((sum, attempt) => sum + attempt.timeSpent, 0);

  const displayName = user?.user_metadata?.full_name || user?.email || 'Học sinh MathMentor';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (isUserLoading || !isInitialized || isLoading) {
    return (
      <main className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Đang tải dữ liệu hồ sơ...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex items-center justify-center h-full">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center space-y-4">
            <p className="text-lg font-semibold">Bạn cần đăng nhập để xem hồ sơ học tập.</p>
            <Button asChild>
              <Link href="/login">Đăng nhập ngay</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex flex-col h-full w-full p-4 md:p-8">
      <div className="max-w-6xl mx-auto w-full space-y-8">
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-primary">Trang cá nhân</p>
            <h1 className="text-3xl md:text-4xl font-headline font-bold">Hồ sơ học tập MathMentor</h1>
          </div>
          <p className="text-muted-foreground max-w-3xl">
            Tất cả dữ liệu từ bài kiểm tra và phân tích AI được tổng hợp tại đây để bạn dễ dàng theo dõi tiến độ,
            nhận diện điểm mạnh - điểm yếu và lên kế hoạch ôn luyện.
          </p>
        </div>

        {loadError && (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardContent className="p-4 flex items-center gap-3 text-destructive">
              <AlertCircle className="w-5 h-5" />
              {loadError}
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <UserRound className="text-primary" /> {displayName}
                </CardTitle>
                <CardDescription>
                  {analysis?.totalAttempts ? `Đã hoàn thành ${analysis.totalAttempts} bài kiểm tra` : 'Hãy bắt đầu với một bài kiểm tra để AI hiểu rõ bạn hơn'}
                </CardDescription>
              </div>
              <Badge variant="secondary">
                Điểm gần nhất: {latestScore ? latestScore.toFixed(1) : '--'}
              </Badge>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-2xl font-semibold">{initials || 'HV'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm text-muted-foreground">Điểm trung bình</p>
                  <p className="text-2xl font-bold">{averageScore.toFixed(1)} / 100</p>
                  <Progress value={Math.min(averageScore, 100)} className="mt-2" />
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Điểm mạnh nổi bật</span>
                  <Badge variant="outline" className="gap-1">
                    <BrainCircuit className="h-3.5 w-3.5" /> {strengthTopics[0]?.topic ?? 'Đang cập nhật'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Kỹ năng cần bồi dưỡng</span>
                  <Badge variant="destructive">{knowledgeFocus[0]?.topic ?? 'Chưa xác định'}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Thời gian ôn luyện</span>
                  <Badge variant="secondary">{Math.round(totalTimeSpent / 60)} phút</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="text-primary" /> Gợi ý tiếp theo
              </CardTitle>
              <CardDescription>Dựa trên lịch sử bài kiểm tra gần nhất</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {knowledgeFocus.length === 0 ? (
                <p className="text-muted-foreground">Hãy hoàn thành ít nhất một bài kiểm tra để nhận gợi ý học tập cá nhân hoá.</p>
              ) : (
                <div className="space-y-2">
                  {knowledgeFocus.slice(0, 3).map((topic) => (
                    <div key={topic.topic} className="p-3 rounded-lg border bg-muted/30">
                      <p className="font-semibold">{topic.topic}</p>
                      <p className="text-sm text-muted-foreground">
                        Độ chính xác {topic.accuracy.toFixed(1)}% - Hãy xem lại lý thuyết và luyện thêm 2-3 bài tự luyện.
                      </p>
                    </div>
                  ))}
                </div>
              )}
              <Button asChild>
                <Link href="/tests/adaptive">Tạo đề phù hợp năng lực</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="text-primary" /> Xu hướng điểm số
              </CardTitle>
              <CardDescription>Điểm trung bình các bài kiểm tra gần đây</CardDescription>
            </CardHeader>
            <CardContent>
              {scoreTrendData.length === 0 ? (
                <p className="text-muted-foreground text-center py-12">Chưa có dữ liệu điểm số. Hãy hoàn thành bài test đầu tiên nhé!</p>
              ) : (
                <ChartContainer
                  config={{ score: { label: 'Điểm', color: 'hsl(var(--primary))' } }}
                  className="h-[260px]"
                >
                  <BarChart data={scoreTrendData}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 100]} tickLine={false} axisLine={false} />
                    <ChartTooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent />} />
                    <Bar dataKey="score" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="text-primary" /> Bản đồ kỹ năng
              </CardTitle>
              <CardDescription>Dữ liệu tổng hợp từ kết quả bài test</CardDescription>
            </CardHeader>
            <CardContent className="h-[260px]">
              {radarData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  Chưa có dữ liệu để vẽ biểu đồ.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} outerRadius="80%">
                    <PolarGrid strokeOpacity={0.2} />
                    <PolarAngleAxis dataKey="skill" tick={{ fill: 'currentColor', fontSize: 12 }} />
                    <Radar dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="text-primary" /> Tình trạng kiến thức
              </CardTitle>
              <CardDescription>Nhóm chủ đề theo mức độ nắm vững</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={masteryConfig} className="h-[240px]">
                <PieChart>
                  <Tooltip contentStyle={{ borderRadius: 8 }} />
                  <Pie data={masteryData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} label>
                    <Cell fill="var(--color-advanced)" />
                    <Cell fill="var(--color-practicing)" />
                    <Cell fill="var(--color-weak)" />
                  </Pie>
                </PieChart>
              </ChartContainer>
              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                <p>{strengthTopics.length} chủ đề đang ở trạng thái xanh lá.</p>
                <p>{knowledgeFocus.length} chủ đề cần được ưu tiên luyện tập trong tuần này.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="text-primary" /> Lịch sử bài kiểm tra
              </CardTitle>
              <CardDescription>Dữ liệu thực tế dùng để AI tinh chỉnh đề</CardDescription>
            </CardHeader>
            <CardContent>
              {attempts.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-12 text-muted-foreground">
                  <p>Chưa có bài kiểm tra nào trong lịch sử.</p>
                  <Button asChild className="mt-4">
                    <Link href="/tests">Làm bài test đầu tiên</Link>
                  </Button>
                </div>
              ) : (
                <ScrollArea className="h-[260px] pr-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tiêu đề</TableHead>
                        <TableHead>Chủ đề</TableHead>
                        <TableHead>Loại</TableHead>
                        <TableHead className="text-right">Điểm</TableHead>
                        <TableHead className="text-right">Ngày</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attempts.slice(0, 8).map((attempt) => (
                        <TableRow key={attempt.id}>
                          <TableCell className="font-medium">{attempt.testTitle}</TableCell>
                          <TableCell>{attempt.topic}</TableCell>
                          <TableCell className="text-muted-foreground">{attempt.difficulty}</TableCell>
                          <TableCell className="text-right font-semibold">{attempt.score.toFixed(1)}</TableCell>
                          <TableCell className="text-right text-muted-foreground">{formatDate(attempt.completedAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button asChild variant="outline" className="gap-2">
                <Link href="/test-history">
                  <Sparkles className="h-4 w-4" /> Xem toàn bộ lịch sử
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </main>
  );
}
