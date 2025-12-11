// frontend_nextjs/src/components/test/TestResultDetail.tsx
'use client';

import type { TestAttempt, WeakTopic } from '@/types/test-history';
import type { Test } from '@/types/test-schema';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Zap, Target, BookOpen, Brain, ArrowLeft, Home } from 'lucide-react';
import 'katex/dist/katex.min.css';

interface AiAnalysisResult {
  analysis: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  suggestedTopics: string[];
}

interface Props {
  attempt: TestAttempt;
  testData: Test;
  weakTopics: WeakTopic[];
  aiAnalysis?: AiAnalysisResult;
  onRetakeTest: () => void;
  onTakeAdaptiveTest: () => void;
}

export function TestResultDetail({ attempt, weakTopics, aiAnalysis, onRetakeTest, onTakeAdaptiveTest }: Props) {
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-green-600';
    if (score >= 50) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  const handleNavigate = (path: string) => {
    window.location.href = path;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      
      {/* 1. KẾT QUẢ TỔNG QUAN */}
      <Card className="shadow-lg border-primary/20">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Kết quả bài kiểm tra</CardTitle>
          <CardDescription className="text-lg">{attempt.testTitle}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex flex-col items-center">
            <p className="text-sm text-muted-foreground">Tổng điểm</p>
            <h2 className={`text-7xl font-extrabold ${getScoreColor(attempt.score || 0)}`}>
              {(attempt.score || 0).toFixed(1)}
            </h2>
            <p className="text-muted-foreground">
              Đúng: <strong>{attempt.correctAnswers} / {attempt.totalQuestions}</strong> câu
            </p>
          </div>
          
          {/* 3 NÚT */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button onClick={onRetakeTest} variant="outline" size="lg">
              Làm lại bài này
            </Button>

            <Button onClick={onTakeAdaptiveTest} size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
              <Zap className="w-4 h-4 mr-2" />
              Luyện tập thích ứng
            </Button>

            {/* ➕ NÚT XEM ĐÁP ÁN CHI TIẾT */}
            <Button
              onClick={() => handleNavigate(`/test-result/${attempt.id}/answer`)}
              size="lg"
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Xem đáp án chi tiết
            </Button>
          </div>
          
          {/* Nút điều hướng khác */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4 pt-4 border-t border-slate-100">
            <Button 
              onClick={() => handleNavigate('/')} 
              variant="ghost" 
              className="flex-1 text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            >
              <Home className="w-4 h-4 mr-2" />
              Về Trang chủ
            </Button>

            <Button 
              onClick={() => handleNavigate('/mindmap')} 
              variant="ghost" 
              className="flex-1 text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Về Sơ đồ tư duy
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 2. PHÂN TÍCH AI */}
      {aiAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-6 h-6 text-primary" />
              Phân tích & Lời khuyên từ AI
            </CardTitle>
            <CardDescription>
              AI đã phân tích bài làm của bạn và đưa ra một số nhận xét.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" defaultValue={['analysis', 'recommendations']}>
              <AccordionItem value="analysis">
                <AccordionTrigger className="font-semibold">Đánh giá chung</AccordionTrigger>
                <AccordionContent className="prose prose-sm max-w-none">
                  <p>{aiAnalysis.analysis}</p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="strengths">
                <AccordionTrigger className="font-semibold text-green-700">Điểm mạnh</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc space-y-2 pl-6">
                    {aiAnalysis.strengths.map((item, idx) => (
                      <li key={idx} className="text-green-800">{item}</li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="weaknesses">
                <AccordionTrigger className="font-semibold text-red-700">Điểm cần cải thiện</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc space-y-2 pl-6">
                    {aiAnalysis.weaknesses.map((item, idx) => (
                      <li key={idx} className="text-red-800">{item}</li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="recommendations">
                <AccordionTrigger className="font-semibold text-blue-700">Lời khuyên</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc space-y-2 pl-6">
                    {aiAnalysis.recommendations.map((item, idx) => (
                      <li key={idx} className="text-blue-800">{item}</li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="suggestedTopics">
                <AccordionTrigger className="font-semibold">Chủ đề nên ôn tập</AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-wrap gap-2">
                    {aiAnalysis.suggestedTopics.map((topic, idx) => (
                      <Badge key={idx} variant="secondary">{topic}</Badge>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* 3. THỐNG KÊ CHỦ ĐỀ YẾU */}
      {weakTopics && weakTopics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-6 h-6 text-destructive" />
              Thống kê chủ đề yếu
            </CardTitle>
            <CardDescription>
              Kết quả chi tiết theo từng chủ đề có trong bài làm.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {weakTopics.map((topic) => (
              <div key={topic.topic}>
                <div className="flex justify-between mb-1">
                  <span className="font-medium">{topic.topic}</span>
                  <span className={`font-semibold ${getScoreColor(topic.accuracy)}`}>
                    {topic.accuracy.toFixed(1)}% 
                    <span className="text-sm text-muted-foreground ml-2">
                      ({topic.correctAnswers}/{topic.totalQuestions})
                    </span>
                  </span>
                </div>
                <Progress value={topic.accuracy} className={`h-2 ${getProgressColor(topic.accuracy)}`} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 🛑 ĐÃ XÓA HOÀN TOÀN PHẦN XEM LẠI ĐÁP ÁN */}
    </div>
  );
}
