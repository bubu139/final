// frontend_nextjs/src/components/test/MultipleChoiceQuestion.tsx
'use client';

import { useState, useEffect } from 'react';
import type { MultipleChoiceQuestion } from '@/types/test-schema';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// Khai báo MathJax trên window
declare global {
  interface Window {
    MathJax: any;
  }
}

interface Props {
  question: MultipleChoiceQuestion;
  questionNumber: number;
  isSubmitted: boolean;
  userAnswer: any;
  onAnswerChange: (ans: any) => void;

  // dùng khi xem lại đáp án
  correctAnswer?: any;
  highlightMode?: 'none' | 'review';
}

const optionLabels = ['A', 'B', 'C', 'D'];

export function MultipleChoiceQuestionComponent({
  question,
  questionNumber,
  isSubmitted,
  userAnswer,
  onAnswerChange,
  correctAnswer,
  highlightMode = 'none',
}: Props) {
  // đáp án đúng hiệu lực (ưu tiên correctAnswer nếu được truyền từ attempt)
  const effectiveCorrect =
    typeof correctAnswer === 'number' ? correctAnswer : question.answer;

  const isCorrect = isSubmitted && userAnswer === effectiveCorrect;

  useEffect(() => {
    if (typeof window.MathJax !== 'undefined') {
      setTimeout(() => {
        window.MathJax.typeset && window.MathJax.typeset();
      }, 100);
    }
  }, [question]);

  const getOptionClass = (index: number) => {
    // ⭐ CHẾ ĐỘ REVIEW: dùng cho trang "Đáp án bài làm"
    if (highlightMode === 'review') {
      // đáp án đúng → xanh lá
      if (index === effectiveCorrect) {
        return 'bg-green-100 border-green-500 text-green-900';
      }

      // đáp án học sinh đã chọn nhưng sai → vàng
      if (index === userAnswer && userAnswer !== effectiveCorrect) {
        return 'bg-yellow-100 border-yellow-500 text-yellow-900';
      }

      // các đáp án khác giữ nền bình thường
      return 'bg-background';
    }

    // ⭐ CHẾ ĐỘ BÌNH THƯỜNG (đang làm bài / xem kết quả cũ)
    if (!isSubmitted) {
      return userAnswer === index
        ? 'bg-blue-100 border-blue-400'
        : 'bg-background hover:bg-muted/50';
    }

    if (index === question.answer) {
      return 'bg-green-100 border-green-500 text-green-900';
    }

    if (index === userAnswer) {
      return 'bg-red-100 border-red-500 text-red-900';
    }

    return 'bg-background';
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 font-bold text-primary">
            Câu {questionNumber}:
          </div>

          {/* --- SỬA LỖI Ở ĐÂY --- */}
          <div className="flex-1 text-foreground">
            <ReactMarkdown>
              {(question as any).question || question.prompt}
            </ReactMarkdown>
          </div>
          {/* --- KẾT THÚC SỬA LỖI --- */}

          {isSubmitted && (
            <div className="ml-auto flex-shrink-0">
              {isCorrect ? (
                <CheckCircle className="text-green-500" />
              ) : (
                <XCircle className="text-red-500" />
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          {question.options.map((option, index) => (
            <Button
              key={index}
              variant="outline"
              className={cn(
                'h-auto justify-start items-start text-left p-4 whitespace-normal',
                getOptionClass(index),
              )}
              onClick={() => !isSubmitted && onAnswerChange(index)}
              disabled={isSubmitted}
            >
              <div className="flex-shrink-0 font-semibold mr-3">
                {optionLabels[index]}.
              </div>
              <div className="flex-1">
                <ReactMarkdown className="prose-p:my-0">
                  {option}
                </ReactMarkdown>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
