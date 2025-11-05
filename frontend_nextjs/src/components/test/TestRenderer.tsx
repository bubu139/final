// frontend_nextjs/src/components/test/TestRenderer.tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';
import { useFirestore } from '@/firebase';
import { TestHistoryService } from '@/services/test-history.service';
import type { Test, Question } from '@/types/test-schema';
import type { TestAttempt, WeakTopic } from '@/types/test-history';
import { QuestionComponent } from './Question';
import { TestControls } from './TestControls';
import { TestResultDetail } from './TestResultDetail';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Loader, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  testData: Test;
  onRetry: () => void;
  testId: string;
  topic: string;
  difficulty: string;
}

interface TestResultState {
  attempt: TestAttempt;
  weakTopics: WeakTopic[];
}

export function TestRenderer({ testData, onRetry, testId, topic, difficulty }: Props) {
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<TestResultState | null>(null);
  const [startTime] = useState<number>(Date.now());

  const allQuestions: Question[] = [
    ...testData.parts.multipleChoice.questions,
    ...testData.parts.trueFalse.questions,
    ...testData.parts.shortAnswer.questions,
  ];

  const currentQuestion = allQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / allQuestions.length) * 100;
  const answeredCount = Object.keys(answers).length;
  const canSubmit = answeredCount === allQuestions.length;

  const getSafeUserAnswer = (question: Question, rawAnswer: any) => {
    if (question.type === 'true-false') {
      if (!Array.isArray(rawAnswer)) {
        return Array(4).fill(null);
      }
      const safeAnswer = Array(4).fill(null);
      rawAnswer.forEach((val, index) => {
        if (index < 4) safeAnswer[index] = val;
      });
      return safeAnswer;
    }
    
    if (question.type === 'short-answer') {
      if (!Array.isArray(rawAnswer)) {
        return Array(6).fill('');
      }
      return rawAnswer;
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
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const checkAnswer = (question: Question, userAnswer: any): boolean => {
    const safeUserAnswer = getSafeUserAnswer(question, userAnswer);
    
    if (question.type === 'multiple-choice') {
      return safeUserAnswer === (question as any).answer;
    } else if (question.type === 'true-false') {
      return JSON.stringify(safeUserAnswer) === JSON.stringify((question as any).answer);
    } else if (question.type === 'short-answer') {
      return safeUserAnswer?.join('') === (question as any).answer;
    }
    return false;
  };

  // Nộp bài - PHẦN QUAN TRỌNG ĐÃ SỬA
  const handleSubmit = async () => {
    if (!user) {
      setError('Vui lòng đăng nhập để nộp bài');
      return;
    }

    if (!firestore) {
      setError('Không thể kết nối đến cơ sở dữ liệu. Vui lòng thử lại.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const historyService = new TestHistoryService(firestore);

      // Tính điểm và kiểm tra câu trả lời
      let correctCount = 0;
      const answeredQuestions = allQuestions.map((q) => {
        const rawUserAnswer = answers[q.id];
        const userAnswer = getSafeUserAnswer(q, rawUserAnswer);
        const isCorrect = checkAnswer(q, userAnswer);

        if (isCorrect) correctCount++;

        return {
          questionId: q.id,
          questionType: q.type as 'multiple-choice' | 'true-false' | 'short-answer',
          userAnswer: userAnswer,
          correctAnswer: (q as any).answer,
          isCorrect: isCorrect,
          topic: (q as any).topic || topic,
        };
      });

      const score = (correctCount / allQuestions.length) * 100;
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      const startedAt = new Date(startTime);
      const completedAt = new Date();

      // Tính điểm theo loại câu hỏi
      const multipleChoiceQuestions = answeredQuestions.filter(a => a.questionType === 'multiple-choice');
      const trueFalseQuestions = answeredQuestions.filter(a => a.questionType === 'true-false');
      const shortAnswerQuestions = answeredQuestions.filter(a => a.questionType === 'short-answer');

      const multipleChoiceScore = multipleChoiceQuestions.length > 0 
        ? (multipleChoiceQuestions.filter(a => a.isCorrect).length / multipleChoiceQuestions.length) * 100 
        : 0;
      const trueFalseScore = trueFalseQuestions.length > 0 
        ? (trueFalseQuestions.filter(a => a.isCorrect).length / trueFalseQuestions.length) * 100 
        : 0;
      const shortAnswerScore = shortAnswerQuestions.length > 0 
        ? (shortAnswerQuestions.filter(a => a.isCorrect).length / shortAnswerQuestions.length) * 100 
        : 0;

      // Tạo đối tượng TestAttempt (KHÔNG bao gồm id và submittedAt)
      const attemptData: Omit<TestAttempt, 'id' | 'submittedAt'> = {
        testId: testId,
        testTitle: testData.title,
        userId: user.uid,
        answers: answeredQuestions,
        score: score,
        correctAnswers: correctCount,
        totalQuestions: allQuestions.length,
        timeSpent: timeSpent,
        startedAt: startedAt,
        completedAt: completedAt,
        difficulty: (difficulty === 'adaptive' ? 'medium' : difficulty) as 'easy' | 'medium' | 'hard',
        topic: topic,
        multipleChoiceScore: multipleChoiceScore,
        trueFalseScore: trueFalseScore,
        shortAnswerScore: shortAnswerScore,
      };

      console.log('📊 Attempt data to save:', attemptData);

      // Lưu vào Firestore và nhận lại attemptId
      const attemptId = await historyService.saveTestAttempt(attemptData);

      console.log('✅ Test saved with ID:', attemptId);

      // Tạo đối tượng TestAttempt đầy đủ để hiển thị
      const fullAttempt: TestAttempt = {
        id: attemptId,
        ...attemptData,
        submittedAt: new Date(),
      };

      // Phân tích điểm yếu
      const analysis = await historyService.analyzeWeakTopics(user.uid);

      setTestResult({
        attempt: fullAttempt,
        weakTopics: analysis.weakTopics,
      });
      setIsSubmitted(true);
      
    } catch (err: any) {
      console.error('❌ Error submitting test:', err);
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

  const handleTakeAdaptiveTest = () => {
    router.push('/tests/adaptive');
  };

  if (isSubmitted && testResult) {
    return (
      <TestResultDetail
        attempt={testResult.attempt}
        testData={testData}
        weakTopics={testResult.weakTopics}
        onRetakeTest={handleRetakeTest}
        onTakeAdaptiveTest={handleTakeAdaptiveTest}
      />
    );
  }

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
              disabled={!canSubmit || isLoading || !firestore}
              size="lg"
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                'Nộp bài'
              )}
            </Button>
            {!firestore && (
              <div className="text-sm text-red-600 text-center">
                ⚠️ Không thể kết nối đến cơ sở dữ liệu
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center rounded-lg">
          <Card className="bg-white">
            <CardContent className="p-8 flex flex-col items-center gap-4">
              <Loader className="w-12 h-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Đang xử lý bài nộp của bạn...</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}