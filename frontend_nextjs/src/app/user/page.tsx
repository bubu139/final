'use client';

import { useEffect, useMemo, useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  MessageSquare,
} from 'lucide-react';
import Link from 'next/link';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PolarGrid,
  PolarAngleAxis,
} from 'recharts';
import { useUser } from '@/supabase/auth/use-user';
import { useSupabase } from '@/supabase';
import { TestHistoryService } from '@/services/test-history.service';
import type { TestAnalysis, TestAttempt } from '@/types/test-history';
import { Textarea } from '@/components/ui/textarea';

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

type AiAssessment = {
  label: string;
  tone: 'positive' | 'neutral' | 'warning';
  summary: string;
  bulletPoints: string[];
};

export default function UserPage() {
  const { user, isUserLoading } = useUser();
  const { client: supabase, isInitialized, error: supabaseError } = useSupabase();

  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [analysis, setAnalysis] = useState<TestAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Mục tiêu học tập (FE-only)
  const [goalInput, setGoalInput] = useState('');
  const [confirmedGoal, setConfirmedGoal] = useState<string | null>(null);

  const handleSaveGoal = () => {
    const trimmed = goalInput.trim();
    if (!trimmed) return;
    setConfirmedGoal(trimmed);
  };

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

  // Đánh giá điểm mạnh – yếu, khả năng cần cải thiện / phát huy
  const aiAssessment: AiAssessment = useMemo(() => {
    const strongCount = strengthTopics.length;
    const practicingCount = practicingTopics.length;
    const weakCount = knowledgeFocus.length;

    const strongNames = strengthTopics.slice(0, 3).map((t) => t.topic);
    const practicingNames = practicingTopics.slice(0, 3).map((t) => t.topic);
    const weakNames = knowledgeFocus.slice(0, 3).map((t) => t.topic);

    if (!totalTests) {
      return {
        label: 'Chưa đủ dữ liệu',
        tone: 'neutral',
        summary:
          'Bạn chưa có bài kiểm tra nào trong hệ thống, nên AI chưa thể đánh giá rõ điểm mạnh – điểm yếu.',
        bulletPoints: [
          'Hãy làm ít nhất 1–2 bài kiểm tra để AI xây dựng bản đồ kỹ năng ban đầu.',
          'Sau mỗi bài, mục “Đánh giá của AI” sẽ cập nhật tự động theo kết quả mới.',
        ],
      };
    }

    const avg = Number(averageScore.toFixed(1));
    let label: AiAssessment['label'];
    let tone: AiAssessment['tone'];
    let summary: string;

    if (strongCount > 0 && weakCount === 0) {
      label = 'Điểm mạnh rõ ràng';
      tone = 'positive';
      summary = `Bạn đang có nền tảng khá vững, đặc biệt ở các chủ đề ${strongNames.join(
        ', ',
      ) || 'mạnh hiện tại'}. Hãy tiếp tục phát huy và tăng dần độ khó của bài luyện tập.`;
    } else if (strongCount > 0 && weakCount > 0) {
      label = 'Cân bằng nhưng cần cải thiện';
      tone = avg >= 60 ? 'neutral' : 'warning';
      summary = `Bạn đã có một số điểm mạnh như ${strongNames.join(
        ', ',
      ) || 'một vài chủ đề nắm vững'}, nhưng vẫn còn ${
        weakCount
      } nhóm kỹ năng cần ưu tiên cải thiện, điển hình là ${weakNames.join(
        ', ',
      ) || 'một số chủ đề màu đỏ trên bản đồ kỹ năng'}.`;
    } else if (weakCount > 0) {
      label = 'Cần tập trung xây nền';
      tone = 'warning';
      summary = `AI nhận thấy phần lớn kỹ năng đang ở mức cần ôn, đặc biệt là ${weakNames.join(
        ', ',
      ) || 'các chủ đề màu đỏ trên bản đồ kỹ năng'}. Bạn nên củng cố lại kiến thức nền trước khi luyện đề khó.`;
    } else {
      label = 'Đang hình thành bản đồ kỹ năng';
      tone = 'neutral';
      summary =
        'Dữ liệu hiện tại chưa đủ rõ để phân loại điểm mạnh – yếu. Bạn cứ tiếp tục làm thêm đề, AI sẽ dần tinh chỉnh bản đồ kỹ năng cho bạn.';
    }

    const bulletPoints: string[] = [];

    if (strongNames.length) {
      bulletPoints.push(
        `Khả năng nên phát huy: ${strongNames.join(
          ', ',
        )} – hãy duy trì luyện các dạng vận dụng và vận dụng cao ở những chủ đề này.`,
      );
    }

    if (practicingNames.length) {
      bulletPoints.push(
        `Kỹ năng đang ở mức trung bình: ${practicingNames.join(
          ', ',
        )} – nên luyện thêm bài từ dễ đến trung bình khá để kéo độ chính xác lên ≥ 80%.`,
      );
    }

    if (weakNames.length) {
      bulletPoints.push(
        `Kỹ năng cần cải thiện sớm: ${weakNames.join(
          ', ',
        )} – xem lại lý thuyết, chữa kỹ các câu sai và ưu tiên luyện lại những dạng bài hay nhầm.`,
      );
    }

    if (!bulletPoints.length) {
      bulletPoints.push(
        'Tiếp tục duy trì nhịp độ làm bài đều đặn (mỗi ngày 30–45 phút). Khi dữ liệu đủ lớn, AI sẽ gợi ý chi tiết hơn từng kỹ năng.',
      );
    }

    return { label, tone, summary, bulletPoints };
  }, [strengthTopics, practicingTopics, knowledgeFocus, totalTests, averageScore]);

  const latestScore = attempts[0]?.score ?? 0;
  const totalTimeSpent = attempts.reduce((sum, attempt) => sum + attempt.timeSpent, 0);

  const displayName = user?.user_metadata?.full_name || user?.email || 'Học sinh MathMentor';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((part: string) => part[0])
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
                  {analysis?.totalAttempts
                    ? `Đã hoàn thành ${analysis.totalAttempts} bài kiểm tra`
                    : 'Hãy bắt đầu với một bài kiểm tra để AI hiểu rõ bạn hơn'}
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
            </CardHeader>
            <CardContent className="space-y-4">
              {knowledgeFocus.length === 0 ? (
                <p className="text-muted-foreground">
                  Hãy hoàn thành ít nhất một bài kiểm tra để nhận gợi ý học tập cá nhân hoá.
                </p>
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
                <p className="text-muted-foreground text-center py-12">
                  Chưa có dữ liệu điểm số. Hãy hoàn thành bài test đầu tiên nhé!
                </p>
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
                    <Radar
                      dataKey="score"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.3}
                    />
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
                  <Pie
                    data={masteryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    label
                  >
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
                          <TableCell className="text-right font-semibold">
                            {attempt.score.toFixed(1)}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {formatDate(attempt.completedAt)}
                          </TableCell>
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

        {/* Mục tiêu học tập & Đánh giá của AI */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Khung 1: Mục tiêu học tập */}
          <Card>
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  <span>Mục tiêu học tập</span>
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  FE-only • sẽ lưu backend sau
                </Badge>
              </div>
              <CardDescription>
                Viết ngắn gọn mục tiêu ôn luyện (điểm mong muốn, khối thi, chủ đề muốn tập trung...).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                placeholder="Ví dụ: Đạt 8.0+ Toán THPTQG, làm chắc hàm số và tích phân trong 2 tháng tới..."
                className="min-h-[110px] resize-none"
              />

              <div className="flex items-center justify-between gap-3">
                <Button size="sm" onClick={handleSaveGoal}>
                  Lưu mục tiêu
                </Button>

                {confirmedGoal && (
                  <p className="flex items-center gap-1 text-xs text-emerald-600">
                    <Sparkles className="w-4 h-4" />
                    AI đã cập nhật mục tiêu của bạn.
                  </p>
                )}
              </div>

              {confirmedGoal && (
                <div className="mt-1 rounded-lg border border-emerald-100 bg-emerald-50/70 p-3">
                  <p className="text-[11px] font-semibold text-emerald-800 mb-1">Mục tiêu hiện tại</p>
                  <p className="text-sm text-emerald-900 whitespace-pre-wrap">{confirmedGoal}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Khung 2: Đánh giá của AI */}
          <Card>
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  <span>Đánh giá của AI</span>
                </CardTitle>
                <Badge
                  variant={
                    aiAssessment.tone === 'positive'
                      ? 'default'
                      : aiAssessment.tone === 'warning'
                      ? 'destructive'
                      : 'outline'
                  }
                  className="text-xs"
                >
                  {aiAssessment.label}
                </Badge>
              </div>
              <CardDescription>
                Đánh giá tổng quan điểm mạnh – điểm yếu từ bản đồ kỹ năng và lịch sử điểm số. Khi bạn làm bài mới, phần
                này sẽ tự động cập nhật.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-800">{aiAssessment.summary}</p>

              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="rounded-lg bg-slate-50 border border-slate-100 p-2">
                  <p className="text-[11px] text-muted-foreground mb-1">Điểm trung bình</p>
                  <p className="text-base font-semibold">
                    {averageScore.toFixed(1)}
                    <span className="text-[11px] text-muted-foreground"> / 100</span>
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 border border-slate-100 p-2">
                  <p className="text-[11px] text-muted-foreground mb-1">Số bài kiểm tra</p>
                  <p className="text-base font-semibold">{totalTests}</p>
                </div>
                <div className="rounded-lg bg-slate-50 border border-slate-100 p-2">
                  <p className="text-[11px] text-muted-foreground mb-1">Kỹ năng cần ôn</p>
                  <p className="text-base font-semibold">
                    {masteryData.find((m) => m.name === 'Cần ôn')?.value ?? 0}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  Điểm mạnh & cần cải thiện
                </p>
                <ul className="space-y-1.5 text-sm text-slate-700 list-disc list-inside">
                  {aiAssessment.bulletPoints.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
