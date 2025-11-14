'use client';

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { BrainCircuit, FileText, LineChart, Sparkles, Target, TrendingUp, UserRound } from "lucide-react";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, PolarAngleAxis, PolarGrid, Radar, RadarChart, Tooltip, XAxis, YAxis, ResponsiveContainer } from "recharts";

const radarData = [
  { skill: "Đại số", score: 82 },
  { skill: "Hàm số", score: 76 },
  { skill: "Hình học", score: 64 },
  { skill: "Xác suất", score: 71 },
  { skill: "Giải tích", score: 58 },
];

const masteryData = [
  { name: "Nắm vững", value: 45 },
  { name: "Đang luyện", value: 35 },
  { name: "Cần ôn", value: 20 },
];

const masteryConfig: ChartConfig = {
  advanced: { label: "Nắm vững", color: "hsl(var(--primary))" },
  practicing: { label: "Đang luyện", color: "#f97316" },
  weak: { label: "Cần ôn", color: "#ef4444" },
};

const testHistory = [
  { id: "TX-09", type: "Thường xuyên", topic: "Hàm bậc ba", score: 7.8, date: "12/10" },
  { id: "GK-01", type: "Giữa kì", topic: "Giải tích 12", score: 7.3, date: "05/10" },
  { id: "TX-08", type: "Thường xuyên", topic: "Vector hình Oxyz", score: 8.5, date: "28/09" },
  { id: "THPT-Prep", type: "THPTQG", topic: "Đề minh họa", score: 6.9, date: "15/09" },
];

const trendData = [
  { name: "Thg 6", score: 6.1 },
  { name: "Thg 7", score: 6.8 },
  { name: "Thg 8", score: 7.2 },
  { name: "Thg 9", score: 7.5 },
  { name: "Thg 10", score: 7.9 },
];

export default function UserPage() {
  return (
    <main className="flex flex-col h-full w-full p-4 md:p-8">
      <div className="max-w-6xl mx-auto w-full space-y-8">
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-primary">Trang cá nhân</p>
            <h1 className="text-3xl md:text-4xl font-headline font-bold">Hồ sơ học tập MathMentor</h1>
          </div>
          <p className="text-muted-foreground max-w-3xl">
            Tất cả dữ liệu được thu thập trong quá trình trò chuyện AI, mindmap và các bài kiểm tra sẽ hiển thị tại đây để học sinh
            dễ dàng theo dõi tiến độ, lên lịch ôn luyện và chia sẻ với giáo viên.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <UserRound className="text-primary" /> Nguyễn Minh Anh
                </CardTitle>
                <CardDescription>Học sinh lớp 12 | Mục tiêu: 9+ THPTQG Toán</CardDescription>
              </div>
              <Badge variant="secondary">Cấp độ: Proactive</Badge>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-2xl font-semibold">NM</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm text-muted-foreground">Hành trình học tập</p>
                  <p className="text-2xl font-bold">78% hoàn thành</p>
                  <Progress value={78} className="mt-2" />
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Điểm mạnh nổi bật</span>
                  <Badge variant="outline" className="gap-1"><BrainCircuit className="h-3.5 w-3.5" /> Hàm số</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Kỹ năng cần bồi dưỡng</span>
                  <Badge variant="destructive">Hình Oxyz</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Bài kiểm tra tiếp theo</span>
                  <Badge variant="secondary">Giữa kì - 25/10</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sparkles className="text-primary" /> Gợi ý tiếp theo</CardTitle>
              <CardDescription>Dựa trên lịch sử chat và kết quả gần nhất</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-sm font-semibold">Tập trung</p>
                <p className="text-muted-foreground">Ôn luyện đạo hàm bậc cao và bài toán tiếp tuyến trước khi vào đề giữa kì.</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold">Mindmap cần mở</p>
                <p className="text-muted-foreground">Node "Ứng dụng đạo hàm" được đánh dấu vàng. Nhấn để xem tài liệu, tạo bài tập và cập nhật trạng thái.</p>
              </div>
              <Button asChild>
                <Link href="/mindmap">Mở mindmap</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><TrendingUp className="text-primary" /> Xu hướng điểm số</CardTitle>
              <CardDescription>Điểm trung bình các bài kiểm tra gần đây</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{ score: { label: "Điểm", color: "hsl(var(--primary))" } }}
                className="h-[260px]"
              >
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis domain={[5, 10]} tickLine={false} axisLine={false} />
                  <ChartTooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent />} />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><LineChart className="text-primary" /> Bản đồ kỹ năng</CardTitle>
              <CardDescription>Dữ liệu tổng hợp từ chat và mindmap</CardDescription>
            </CardHeader>
            <CardContent className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius="80%">
                  <PolarGrid strokeOpacity={0.2} />
                  <PolarAngleAxis dataKey="skill" tick={{ fill: "currentColor", fontSize: 12 }} />
                  <Radar dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Target className="text-primary" /> Tình trạng kiến thức</CardTitle>
              <CardDescription>Các node mindmap và chủ đề luyện tập</CardDescription>
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
                <p>45% kiến thức đã được đánh dấu xanh lá.</p>
                <p>Mindmap đề xuất tập trung 3 node đỏ: Hình không gian, Số phức, Xác suất.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText className="text-primary" /> Lịch sử bài kiểm tra</CardTitle>
              <CardDescription>Kết quả gần nhất để AI tinh chỉnh bộ đề</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[260px] pr-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã đề</TableHead>
                      <TableHead>Loại</TableHead>
                      <TableHead>Chủ đề</TableHead>
                      <TableHead className="text-right">Điểm</TableHead>
                      <TableHead className="text-right">Ngày</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {testHistory.map((test) => (
                      <TableRow key={test.id}>
                        <TableCell className="font-medium">{test.id}</TableCell>
                        <TableCell>{test.type}</TableCell>
                        <TableCell>{test.topic}</TableCell>
                        <TableCell className="text-right font-semibold">{test.score}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{test.date}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="gap-2">
                <Link href="/tests/adaptive">
                  <Sparkles className="h-4 w-4" /> Tạo đề phù hợp năng lực
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </main>
  );
}
