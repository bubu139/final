// frontend_nextjs/src/components/test/TestRenderer.tsx
'use client';

import { updateNodeScore } from "@/lib/nodeProgressApi";
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/supabase/auth/use-user';
import { useSupabase } from '@/supabase';
import { TestHistoryService } from '@/services/test-history.service';
import type { Test, Question } from '@/types/test-schema';
// SỬA ĐỔI: Import thêm TestAnswer và TestDifficulty
import type { 
  TestAttempt, 
  WeakTopic, 
  TestDifficulty, 
  TestAnswer 
} from '@/types/test-history'; 
import { QuestionComponent } from './Question';
import { TestResultDetail } from './TestResultDetail';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Loader, ChevronLeft, ChevronRight } from 'lucide-react';

function normalizeType(type: string) {
  const t = type?.toLowerCase() || "";

  if (t.includes("multiple")) return "multiple-choice";
  if (t.includes("true")) return "true-false";
  if (t.includes("short")) return "short-answer";

  return type;
}

// Khai báo kiểu dữ liệu cho phân tích AI (từ backend)
interface AiAnalysisResult {
  analysis: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  suggestedTopics: string[];
}

interface Props {
  testData: Test;
  onRetry?: () => void;
  testId: string;
  topic: string;
  // SỬA ĐỔI: Dùng TestDifficulty
  difficulty: TestDifficulty; 
  nodeId?: string | null;
  isNodeTest?: boolean;
}



interface TestResultState {
  attempt: TestAttempt;
  weakTopics: WeakTopic[]; // Thống kê chủ đề yếu
  aiAnalysis: AiAnalysisResult; // Phân tích bằng văn bản từ AI
}

// URL của backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function TestRenderer({
  testData,
  onRetry,
  testId,
  topic,
  difficulty,
  nodeId,
  isNodeTest
}: Props)

 {
  const router = useRouter();
  const { user } = useUser();
  const { client: supabase } = useSupabase();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<TestResultState | null>(null);
  const [startTime] = useState<number>(Date.now());
  const [isSavingHistory, setIsSavingHistory] = useState(false);

const allQuestions = [
  ...testData.parts.multipleChoice.questions,
  ...testData.parts.trueFalse.questions,
  ...testData.parts.shortAnswer.questions,
].map((q: any) => ({
  ...q,
  type: normalizeType(q.type),
})) as Question[];


  const currentQuestion = allQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / allQuestions.length) * 100;
  const answeredCount = Object.keys(answers).length;
  const canSubmit = answeredCount === allQuestions.length;
  const isBusy = isLoading || isSavingHistory;

  const getSafeUserAnswer = (question: Question, rawAnswer: any) => {
    if (question.type === 'true-false') {
      if (!Array.isArray(rawAnswer)) return Array(4).fill(null);
      const safeAnswer = Array(4).fill(null);
      rawAnswer.forEach((val, index) => {
        if (index < 4) safeAnswer[index] = val;
      });
      return safeAnswer;
    }
    if (question.type === 'short-answer') {
      return Array.isArray(rawAnswer) ? rawAnswer : Array(6).fill('');
    }
    return rawAnswer;
  };

  const handleAnswerChange = useCallback((answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answer,
    }));
  }, [currentQuestion.id]);

  const handleNextQuestion = () => {
    if (currentQuestionIndex < allQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

const checkAnswer = (question: Question, userAnswer: any): boolean => {
  const safeUserAnswer = getSafeUserAnswer(question, userAnswer);
  const qType = normalizeType(question.type);

  if (qType === 'multiple-choice') {
    return safeUserAnswer === (question as any).answer;
  }
  if (qType === 'true-false') {
    return JSON.stringify(safeUserAnswer) === JSON.stringify((question as any).answer);
  }
  if (qType === 'short-answer') {
    return safeUserAnswer?.join('') === (question as any).answer;
  }
  return false;
};


  // Nộp bài - ĐÃ CẬP NHẬT HOÀN TOÀN
  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // BƯỚC 1: Tính điểm và thu thập dữ liệu
      let correctCount = 0;
      const questionScore = 100 / allQuestions.length; // Điểm cho mỗi câu

      // SỬA ĐỔI: Đảm bảo mảng này là kiểu TestAnswer[]
      const answeredQuestions: TestAnswer[] = allQuestions.map((q) => {
        const rawUserAnswer = answers[q.id];
        const userAnswer = getSafeUserAnswer(q, rawUserAnswer);
        const isCorrect = checkAnswer(q, userAnswer);
        if (isCorrect) correctCount++;

        return {
          questionId: q.id,
          questionType: normalizeType(q.type) as
            'multiple-choice' | 'true-false' | 'short-answer',
          prompt: q.prompt, // <-- THÊM TRƯỜNG BỊ THIẾU
          userAnswer: userAnswer,
          correctAnswer: (q as any).answer,
          isCorrect: isCorrect,
          topic: (q as any).topic || topic, 
          score: isCorrect ? questionScore : 0, // <-- THÊM TRƯỜNG BỊ THIẾU
        };
      });

      const score = correctCount * questionScore; // Tính điểm tổng
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      const startedAt = new Date(startTime);
      const completedAt = new Date();

      const multipleChoiceQuestions = answeredQuestions.filter(a => a.questionType === 'multiple-choice');
      const trueFalseQuestions = answeredQuestions.filter(a => a.questionType === 'true-false');
      const shortAnswerQuestions = answeredQuestions.filter(a => a.questionType === 'short-answer');

      const multipleChoiceScore = multipleChoiceQuestions.length > 0 ? (multipleChoiceQuestions.filter(a => a.isCorrect).length / multipleChoiceQuestions.length) * 100 : 0;
      const trueFalseScore = trueFalseQuestions.length > 0 ? (trueFalseQuestions.filter(a => a.isCorrect).length / trueFalseQuestions.length) * 100 : 0;
      const shortAnswerScore = shortAnswerQuestions.length > 0 ? (shortAnswerQuestions.filter(a => a.isCorrect).length / shortAnswerQuestions.length) * 100 : 0;

      // Tạo đối tượng TestAttempt cục bộ
      const fullAttempt: TestAttempt = {
        id: `local-${Date.now()}`,
        testId: testId,
        testTitle: testData.title,
        userId: user ? user.id : 'guest_user',
        answers: answeredQuestions,
        score: score,
        correctAnswers: correctCount,
        totalQuestions: allQuestions.length,
        timeSpent: timeSpent,
        startedAt: startedAt,
        completedAt: completedAt,
        difficulty: difficulty, // Đã sửa type ở Props
        topic: topic,
        multipleChoiceScore: multipleChoiceScore,
        trueFalseScore: trueFalseScore,
        shortAnswerScore: shortAnswerScore,
        submittedAt: completedAt,
      };

      // BƯỚC 2: Tính toán chủ đề yếu (WeakTopics) cục bộ
      const topicStats = new Map<string, { correct: number, total: number }>();
      for (const answer of answeredQuestions) {
        const answerTopic = (answer as any).topic || topic; // Lấy topic của câu hỏi
        if (!topicStats.has(answerTopic)) {
          topicStats.set(answerTopic, { correct: 0, total: 0 });
        }
        const stats = topicStats.get(answerTopic)!;
        stats.total++;
        if (answer.isCorrect) {
          stats.correct++;
        }
      }

      const localWeakTopics: WeakTopic[] = [];
      topicStats.forEach((stats, topicName) => {
        if (stats.total > 0) {
          localWeakTopics.push({
            topic: topicName,
            correctAnswers: stats.correct,
            totalQuestions: stats.total,
            accuracy: (stats.correct / stats.total) * 100,
            lastAttempt: completedAt, // Thêm lastAttempt
          });
        }
      });
      // Sắp xếp theo độ chính xác, thấp nhất lên đầu
      localWeakTopics.sort((a, b) => a.accuracy - b.accuracy);
      
      // BƯỚC 3: Gửi dữ liệu đến Backend để AI phân tích
      const analysisRequest = {
        userId: fullAttempt.userId,
        testAttempt: fullAttempt,
        weakTopics: localWeakTopics
      };

      console.log('📊 Gửi dữ liệu để AI phân tích:', analysisRequest);
      
      const response = await fetch(`${API_BASE_URL}/api/analyze-test-result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(analysisRequest),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Lỗi khi gọi AI phân tích.');
      }
      
      const aiAnalysis: AiAnalysisResult = await response.json();
      console.log('✅ AI đã phân tích:', aiAnalysis);

      // BƯỚC 4: Lưu lịch sử làm bài & gợi ý AI (nếu người dùng đã đăng nhập)
      let persistedAttempt = fullAttempt;
      if (supabase && user) {
        try {
          setIsSavingHistory(true);
          const historyService = new TestHistoryService(supabase);
          const { id: _localId, submittedAt: _submittedAt, ...attemptPayload } = fullAttempt;
          const attemptId = await historyService.saveTestAttempt(attemptPayload);
          persistedAttempt = { ...fullAttempt, id: attemptId };

          const summaryLines = [
            aiAnalysis.analysis ? `Đánh giá: ${aiAnalysis.analysis}` : null,
            aiAnalysis.strengths?.length ? `Điểm mạnh: ${aiAnalysis.strengths.join(', ')}` : null,
            aiAnalysis.weaknesses?.length ? `Điểm yếu: ${aiAnalysis.weaknesses.join(', ')}` : null,
            aiAnalysis.recommendations?.length ? `Lời khuyên: ${aiAnalysis.recommendations.join(' | ')}` : null,
            aiAnalysis.suggestedTopics?.length ? `Chủ đề nên học: ${aiAnalysis.suggestedTopics.join(', ')}` : null,
          ].filter(Boolean);

          if (summaryLines.length > 0) {
            await historyService.saveAIRecommendation({
              userId: user.id,
              content: summaryLines.join('\n'),
              generatedAt: new Date(),
            });
          }
        } catch (saveError) {
          console.error('⚠️ Không thể lưu lịch sử làm bài:', saveError);
        } finally {
          setIsSavingHistory(false);
        }
      }

      // BƯỚC 5: Hiển thị kết quả
      setTestResult({
        attempt: persistedAttempt,
        weakTopics: localWeakTopics,
        aiAnalysis: aiAnalysis
      });
      setIsSubmitted(true);
if (isNodeTest && user && nodeId) {
  try {
    await updateNodeScore(user.id, nodeId, score);
  } catch (err) {
    console.error("Lỗi update score node:", err);
  }
}


    } catch (err: any) {
      console.error('❌ Lỗi khi nộp bài:', err);
      setError(err.message || 'Có lỗi xảy ra khi nộp bài. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetakeTest = () => {
    setCurrentQuestionIndex(0);
    setAnswers({});
    setIsSubmitted(false);
    setError(null);
    setTestResult(null);
  };

  // CẬP NHẬT: Gửi các chủ đề yếu (do AI gợi ý) sang trang adaptive
  const handleTakeAdaptiveTest = () => {
    // Ưu tiên chủ đề do AI gợi ý, nếu không có thì dùng chủ đề yếu đã tính toán
    const topicsToPractice = testResult?.aiAnalysis?.suggestedTopics?.length
      ? testResult.aiAnalysis.suggestedTopics
      : testResult?.weakTopics.map(t => t.topic);
      
    const topicsParam = (topicsToPractice || []).join(',');
    router.push(`/tests/adaptive?topics=${encodeURIComponent(topicsParam)}`);
  };

  if (isSubmitted && testResult) {
    return (
      <TestResultDetail
        attempt={testResult.attempt}
        testData={testData}
        weakTopics={testResult.weakTopics} // <-- Thống kê
        aiAnalysis={testResult.aiAnalysis} // <-- Phân tích văn bản
        onRetakeTest={handleRetakeTest}
        onTakeAdaptiveTest={handleTakeAdaptiveTest}
      />
    );
  }

  // ... (Phần JSX còn lại (Loading, Error, Header, Question...) giữ nguyên như cũ) ...
  if (error) {
    return (
      <div className="space-y-4">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-2">Lỗi</h3>
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Button onClick={() => setError(null)} variant="outline" className="w-full">
          Quay lại
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-indigo-200">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">{testData.title}</CardTitle>
              <CardDescription className="text-base">{topic}</CardDescription>
            </div>
            <Badge className="bg-indigo-600 text-white">
              {difficulty === 'adaptive' ? 'Thích ứng' : 
               difficulty === 'node' ? 'Node Test' : // Thêm hiển thị
               difficulty === 'hard' ? 'Khó' : 
               difficulty === 'medium' ? 'Trung bình' : 'Dễ'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Câu hỏi {currentQuestionIndex + 1} / {allQuestions.length}</span>
              <span>Trả lời: {answeredCount} / {allQuestions.length}</span>
            </div>
            <Progress value={progress} className="h-2.5" />
            <div className="text-xs text-muted-foreground">
              {Math.round(progress)}% hoàn thành
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question */}
      {currentQuestion && (
<QuestionComponent
  question={currentQuestion}
  questionNumber={currentQuestionIndex + 1}
  isSubmitted={false}
  userAnswer={getSafeUserAnswer(currentQuestion, answers[currentQuestion.id])}
  onAnswerChange={handleAnswerChange}
/>


      )}

      {/* Navigation */}
      <div className="flex gap-3">
        <Button
          onClick={handlePreviousQuestion}
          disabled={currentQuestionIndex === 0}
          variant="outline"
          size="lg"
          className="flex-1"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Câu trước
        </Button>
        <Button
          onClick={handleNextQuestion}
          disabled={currentQuestionIndex === allQuestions.length - 1}
          variant="outline"
          size="lg"
          className="flex-1"
        >
          Câu tiếp
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* Question Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tổng quan câu hỏi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {allQuestions.map((q, idx) => {
              const isAnswered = answers[q.id] !== undefined;
              const isCurrent = idx === currentQuestionIndex;

              return (
                <button
                  key={idx}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`
                    w-full aspect-square rounded-lg font-semibold text-sm transition-all
                    ${isCurrent ? 'ring-2 ring-primary' : ''}
                    ${isAnswered ? 'bg-green-100 text-green-900 hover:bg-green-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                  `}
                  title={`Câu ${idx + 1}${isAnswered ? ' (Đã trả lời)' : ''}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Card className={canSubmit ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}>
        <CardContent className="p-6">
          <div className="space-y-4">
            {!canSubmit && (
              <div className="flex items-start gap-3 text-amber-900">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <p className="text-sm">
                  Bạn cần trả lời tất cả <strong>{allQuestions.length - answeredCount}</strong> câu hỏi còn lại trước khi nộp bài.
                </p>
              </div>
            )}
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || isBusy}
              size="lg"
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isBusy ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                'Nộp bài'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isBusy && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center rounded-lg z-50">
          <Card className="bg-white">
            <CardContent className="p-8 flex flex-col items-center gap-4">
              <Loader className="w-12 h-12 animate-spin text-primary" />
              {/* SỬA LỖI: <T> thành </p> */}
              <p className="text-muted-foreground text-center">
                AI đang phân tích và lưu lại lịch sử bài làm của bạn...
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}