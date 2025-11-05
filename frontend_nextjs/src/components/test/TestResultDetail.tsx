// frontend_nextjs/src/components/test/TestResultDetail.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Award, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  Lightbulb,
  Target,
  Clock,
  BookOpen,
  RefreshCw
} from 'lucide-react';
import type { TestAttempt, AIRecommendation, WeakTopic } from '@/types/test-history';
import type { Test, Question } from '@/types/test-schema';
import { API_BASE_URL } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

interface Props {
  attempt: TestAttempt;
  testData: Test;
  weakTopics: WeakTopic[];
  onRetakeTest: () => void;
  onTakeAdaptiveTest: () => void;
}

export function TestResultDetail({ 
  attempt, 
  testData, 
  weakTopics,
  onRetakeTest,
  onTakeAdaptiveTest 
}: Props) {
  const [aiAnalysis, setAiAnalysis] = useState<AIRecommendation | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(true);

  // Gọi MathJax để render LaTeX
  // Thay useEffect hiện tại bằng:
useEffect(() => {
  if (typeof window.MathJax !== 'undefined') {
    setTimeout(() => {
      window.MathJax.typeset && window.MathJax.typeset();
    }, 100);
  }
}, [aiAnalysis]);

  useEffect(() => {
    const fetchAnalysis = async () => {
      setIsLoadingAnalysis(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/analyze-test-result`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: attempt.userId,
            testAttempt: attempt,
            weakTopics: weakTopics,
          }),
        });

        if (!response.ok) throw new Error('Failed to fetch analysis');
        
        const data = await response.json();
        setAiAnalysis({
          userId: attempt.userId,
          testId: attempt.testId,
          ...data,
          generatedAt: new Date(),
        });
      } catch (error) {
        console.error('Error fetching analysis:', error);
      } finally {
        setIsLoadingAnalysis(false);
      }
    };

    fetchAnalysis();
  }, [attempt, weakTopics]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Xuất sắc';
    if (score >= 80) return 'Giỏi';
    if (score >= 70) return 'Khá';
    if (score >= 60) return 'Trung bình';
    return 'Cần cố gắng';
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Lấy thông tin câu hỏi từ testData
  const getQuestionById = (questionId: string): Question | null => {
    const allQuestions = [
      ...testData.parts.multipleChoice.questions,
      ...testData.parts.trueFalse.questions,
      ...testData.parts.shortAnswer.questions,
    ];
    return allQuestions.find(q => q.id === questionId) || null;
  };

  const incorrectAnswers = attempt.answers.filter(a => !a.isCorrect);

  return (
    <div className="space-y-6">
      {/* Header - Overall Score */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-2">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl mb-2">Kết quả bài kiểm tra</CardTitle>
              <CardDescription className="text-base">
                {testData.title} - Hoàn thành lúc {attempt.completedAt.toLocaleString('vi-VN')}
              </CardDescription>
            </div>
            <Badge className="text-lg px-4 py-2 bg-primary">
              <Award className="w-5 h-5 mr-2" />
              {getScoreLabel(attempt.score)}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white rounded-lg">
              <div className={`text-4xl font-bold ${getScoreColor(attempt.score)}`}>
                {attempt.score.toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Điểm tổng</div>
            </div>
            
            <div className="text-center p-4 bg-white rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {attempt.correctAnswers}/{attempt.totalQuestions}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Câu đúng</div>
            </div>
            
            <div className="text-center p-4 bg-white rounded-lg">
              <div className="text-2xl font-bold text-primary flex items-center justify-center gap-2">
                <Clock className="w-5 h-5" />
                {formatTime(attempt.timeSpent)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Thời gian</div>
            </div>
            
            <div className="text-center p-4 bg-white rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {((attempt.correctAnswers / attempt.totalQuestions) * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-muted-foreground mt-1">Độ chính xác</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs: AI Analysis vs Wrong Answers */}
      <Tabs defaultValue="analysis" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analysis">
            <Lightbulb className="w-4 h-4 mr-2" />
            Đánh giá & Lời khuyên
          </TabsTrigger>
          <TabsTrigger value="wrong">
            <AlertCircle className="w-4 h-4 mr-2" />
            Câu làm sai ({incorrectAnswers.length})
          </TabsTrigger>
          <TabsTrigger value="weak-topics">
            <Target className="w-4 h-4 mr-2" />
            Điểm yếu
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: AI Analysis */}
        <TabsContent value="analysis" className="space-y-4">
          {isLoadingAnalysis ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">AI đang phân tích kết quả của bạn...</p>
              </CardContent>
            </Card>
          ) : aiAnalysis ? (
            <>
              {/* Overall Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="text-blue-500" />
                    Phân tích tổng quan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{aiAnalysis.analysis}</p>
                </CardContent>
              </Card>

              {/* Strengths & Weaknesses */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 />
                      Điểm mạnh
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {aiAnalysis.strengths.map((strength, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-600">
                      <XCircle />
                      Điểm cần cải thiện
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {aiAnalysis.weaknesses.map((weakness, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <XCircle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                          <span>{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="text-yellow-500" />
                    Lời khuyên từ AI
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {aiAnalysis.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                        <div className="w-6 h-6 rounded-full bg-yellow-500 text-white flex items-center justify-center flex-shrink-0 font-bold text-sm">
                          {idx + 1}
                        </div>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Suggested Topics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="text-purple-500" />
                    Chủ đề nên ôn tập
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {aiAnalysis.suggestedTopics.map((topic, idx) => (
                      <Badge key={idx} variant="secondary" className="text-sm px-3 py-1">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                <p className="text-muted-foreground">Không thể tải phân tích. Vui lòng thử lại.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab 2: Wrong Answers */}
        <TabsContent value="wrong" className="space-y-4">
          {incorrectAnswers.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Hoàn hảo! 🎉</h3>
                <p className="text-muted-foreground">Bạn đã làm đúng tất cả các câu hỏi!</p>
              </CardContent>
            </Card>
          ) : (
            incorrectAnswers.map((answer, idx) => {
              const question = getQuestionById(answer.questionId);
              if (!question) return null;

              return (
                <Card key={idx} className="border-l-4 border-red-500">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">
                        Câu {idx + 1}: {question.type === 'multiple-choice' ? 'Trắc nghiệm' : 
                              question.type === 'true-false' ? 'Đúng/Sai' : 'Trả lời ngắn'}
                      </CardTitle>
                      <Badge variant="destructive">Sai</Badge>
                    </div>
                    <CardDescription className="mt-2">
                      <ReactMarkdown className="prose prose-sm max-w-none">
                        {question.prompt}
                      </ReactMarkdown>
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    {/* Câu trả lời của user */}
                    <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-sm font-medium text-red-700 mb-1">Câu trả lời của bạn:</p>
                      <p className="text-sm">
                        {question.type === 'multiple-choice' && question.options[answer.userAnswer]}
                        {question.type === 'true-false' && (
                          <div className="space-y-1">
                            {question.statements.map((stmt, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <Badge variant={answer.userAnswer[i] ? 'default' : 'secondary'} className="mt-0.5">
                                  {answer.userAnswer[i] ? 'Đúng' : 'Sai'}
                                </Badge>
                                <ReactMarkdown className="prose prose-sm">{stmt}</ReactMarkdown>
                              </div>
                            ))}
                          </div>
                        )}
                        {question.type === 'short-answer' && (
                          <span className="font-mono">{answer.userAnswer.join('')}</span>
                        )}
                      </p>
                    </div>

                    {/* Đáp án đúng */}
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm font-medium text-green-700 mb-1">Đáp án đúng:</p>
                      <p className="text-sm">
                        {question.type === 'multiple-choice' && question.options[answer.correctAnswer]}
                        {question.type === 'true-false' && (
                          <div className="space-y-1">
                            {question.statements.map((stmt, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <Badge variant={answer.correctAnswer[i] ? 'default' : 'secondary'} className="mt-0.5">
                                  {answer.correctAnswer[i] ? 'Đúng' : 'Sai'}
                                </Badge>
                                <ReactMarkdown className="prose prose-sm">{stmt}</ReactMarkdown>
                              </div>
                            ))}
                          </div>
                        )}
                        {question.type === 'short-answer' && (
                          <span className="font-mono">{answer.correctAnswer}</span>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <BookOpen className="w-4 h-4" />
                      Chủ đề: <Badge variant="outline">{answer.topic}</Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* Tab 3: Weak Topics */}
        <TabsContent value="weak-topics" className="space-y-4">
          {weakTopics.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Target className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Tuyệt vời!</h3>
                <p className="text-muted-foreground">Bạn chưa có điểm yếu rõ rệt nào.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Phân tích theo chủ đề</CardTitle>
                  <CardDescription>
                    Những chủ đề bạn cần tập trung ôn tập thêm
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {weakTopics.map((topic, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{topic.topic}</span>
                        <Badge variant={topic.accuracy >= 70 ? 'default' : 'destructive'}>
                          {topic.accuracy.toFixed(0)}%
                        </Badge>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            topic.accuracy >= 70 ? 'bg-green-500' : 
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
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">Đề kiểm tra thích ứng</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Hệ thống AI sẽ tạo đề thi tập trung vào các chủ đề yếu của bạn để giúp cải thiện nhanh chóng.
                      </p>
                      <Button onClick={onTakeAdaptiveTest} className="w-full">
                        <Lightbulb className="w-4 h-4 mr-2" />
                        Làm đề thích ứng ngay
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button onClick={onRetakeTest} variant="outline" size="lg" className="flex-1">
          <RefreshCw className="w-4 h-4 mr-2" />
          Làm lại bài này
        </Button>
        <Button onClick={onTakeAdaptiveTest} size="lg" className="flex-1">
          <Target className="w-4 h-4 mr-2" />
          Làm đề thích ứng
        </Button>
      </div>
    </div>
  );
}