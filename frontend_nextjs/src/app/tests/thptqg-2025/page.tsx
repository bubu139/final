'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { API_BASE_URL } from '@/lib/utils';
import { BrainCircuit, FileText, Loader, Target } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useUser } from '@/supabase/auth/use-user';

interface Question {
  id: string;
  stem: string;
  options: string[];
  answer: string;
  explanation: string;
}

interface PracticeResponse {
  meta: { durationMinutes: number; goalScore: number; focusTopics: string[] };
  questions: Question[];
  scoringGuide: { strategy: string; analysis: string };
  reviewActions: string[];
}

export default function Thptqg2025Page() {
  const { user } = useUser();
  const [goalScore, setGoalScore] = useState('8.0');
  const [focusTopics, setFocusTopics] = useState('hàm số, hình học');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<PracticeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/learning/thptqg-practice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          goalScore: parseFloat(goalScore),
          focusTopics: focusTopics.split(',').map((t) => t.trim()).filter(Boolean),
        }),
      });
      if (!res.ok) throw new Error('Không thể tạo đề luyện.');
      const data: PracticeResponse = await res.json();
      setResponse(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2"><Target className="text-primary" /> Luyện đề THPTQG 2025</h1>
        <p className="text-slate-600">Đề thi bám sát cấu trúc, sinh bằng RAG, có kèm hình ảnh và đánh giá điểm yếu sau khi làm xong.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin cá nhân hoá</CardTitle>
          <CardDescription>AI dùng mục tiêu điểm và chủ đề ưu tiên để sinh đề phù hợp, tránh trùng lặp.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mục tiêu điểm</Label>
              <Input value={goalScore} onChange={(e) => setGoalScore(e.target.value)} placeholder="8.0" />
            </div>
            <div className="space-y-2">
              <Label>Chủ đề ưu tiên</Label>
              <Input value={focusTopics} onChange={(e) => setFocusTopics(e.target.value)} placeholder="hàm số, hình học" />
            </div>
          </div>
          <Button onClick={handleGenerate} disabled={isLoading}>
            {isLoading ? <Loader className="animate-spin mr-2" /> : <BrainCircuit className="w-4 h-4 mr-2" />} 
            {isLoading ? 'Đang tạo đề...' : 'Tạo đề chuẩn THPTQG 2025'}
          </Button>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </CardContent>
      </Card>

      {response && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" /> Đề thi</CardTitle>
            <CardDescription>
              Thời gian: {response.meta.durationMinutes} phút · Mục tiêu: {response.meta.goalScore} · Chủ đề: {response.meta.focusTopics.join(', ')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {response.questions.map((q) => (
              <div key={q.id} className="p-3 rounded-lg border">
                <p className="font-semibold text-slate-800">{q.stem}</p>
                <p className="text-xs text-slate-600">Đáp án chuẩn: {q.answer}</p>
                <p className="text-xs text-slate-500">Giải thích: {q.explanation}</p>
              </div>
            ))}

            <Separator />
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-700">Đánh giá & cập nhật lộ trình</h3>
              <ReactMarkdown className="text-sm text-slate-700">{`- ${response.scoringGuide.strategy}\n- ${response.scoringGuide.analysis}`}</ReactMarkdown>
              <ul className="list-disc list-inside text-sm text-slate-600">
                {response.reviewActions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
