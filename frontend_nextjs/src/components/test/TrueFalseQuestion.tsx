// frontend_nextjs/src/components/test/TrueFalseQuestion.tsx
'use client';

import { useEffect } from 'react';
import type { TrueFalseQuestion } from '@/types/test-schema';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check, CheckCircle, X, XCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

declare global {
  interface Window {
    MathJax: any;
  }
}

interface Props {
  question: TrueFalseQuestion;
  questionNumber: number;
  isSubmitted: boolean;
  userAnswer: (boolean | null)[];
  onAnswerChange: (answer: (boolean | null)[]) => void;
}

export function TrueFalseQuestionComponent({ question, questionNumber, isSubmitted, userAnswer, onAnswerChange }: Props) {
  
  // Đảm bảo userAnswer luôn là mảng hợp lệ
  const safeUserAnswer = userAnswer || [];
  
  useEffect(() => {
    if (typeof window.MathJax !== 'undefined') {
      setTimeout(() => {
        window.MathJax.typeset && window.MathJax.typeset();
      }, 100);
    }
  }, [question]);
  
  const handleSelect = (statementIndex: number, value: boolean) => {
    if (isSubmitted) return;
    
    // Tạo mảng mới với độ dài cố định (4 phần tử)
    const newAnswers = Array(4).fill(null);
    
    // Copy các giá trị hiện có (nếu có)
    safeUserAnswer.forEach((answer, index) => {
      if (index < 4) {
        newAnswers[index] = answer;
      }
    });
    
    // Cập nhật giá trị mới
    newAnswers[statementIndex] = value;
    onAnswerChange(newAnswers);
  };

  const getButtonClass = (statementIndex: number, buttonValue: boolean) => {
    const selected = safeUserAnswer[statementIndex];
    
    if (!isSubmitted) {
        return selected === buttonValue ? 'bg-blue-100 border-blue-400' : 'bg-background hover:bg-muted/50';
    }

    const isCorrect = question.answer?.[statementIndex];
    if (buttonValue === isCorrect) {
        return 'bg-green-100 border-green-500 text-green-900';
    }
    if (selected === buttonValue) {
        return 'bg-red-100 border-red-500 text-red-900';
    }
    return 'bg-background';
  }

  const isQuestionCorrect = isSubmitted && 
                           question.answer && 
                           safeUserAnswer.length === question.answer.length &&
                           JSON.stringify(safeUserAnswer) === JSON.stringify(question.answer);

  // Đảm bảo statements tồn tại
  const safeStatements = question.statements || [];

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
            <div className="flex-shrink-0 font-bold text-primary">Câu {questionNumber}:</div>
            <div className="flex-1 prose prose-sm max-w-none">
                <ReactMarkdown>{question.prompt}</ReactMarkdown>
            </div>
            {isSubmitted && (
                <div className="ml-auto flex-shrink-0">
                    {isQuestionCorrect ? <CheckCircle className="text-green-500" /> : <XCircle className="text-red-500" />}
                </div>
            )}
        </div>
        
        <div className="space-y-4 mt-4">
          {safeStatements.length > 0 ? (
            safeStatements.map((statement, index) => (
              <div key={index} className="p-4 border rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="font-medium mb-2">
                    Mệnh đề {index + 1}:
                  </div>
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{statement}</ReactMarkdown>
                  </div>
                </div>
                <div className="flex-shrink-0 flex items-center gap-2">
                  <Button 
                    variant="outline"
                    className={cn("w-24", getButtonClass(index, true))}
                    onClick={() => handleSelect(index, true)}
                    disabled={isSubmitted}
                  >
                    <Check className="mr-2 h-4 w-4"/> Đúng
                  </Button>
                  <Button 
                    variant="outline" 
                    className={cn("w-24", getButtonClass(index, false))}
                    onClick={() => handleSelect(index, false)}
                    disabled={isSubmitted}
                  >
                    <X className="mr-2 h-4 w-4"/> Sai
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-red-500 p-4 border border-red-200 rounded-lg bg-red-50">
              ❌ Không có mệnh đề nào để hiển thị!
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}