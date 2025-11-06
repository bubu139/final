// frontend_nextjs/src/components/test/ShortAnswerQuestion.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import type { ShortAnswerQuestion } from '@/types/test-schema';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
  question: ShortAnswerQuestion;
  questionNumber: number;
  isSubmitted: boolean;
  userAnswer: string[];
  onAnswerChange: (answer: string[]) => void;
}

const ANSWER_LENGTH = 6;

export function ShortAnswerQuestionComponent({ question, questionNumber, isSubmitted, userAnswer, onAnswerChange }: Props) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  
  const isCorrect = isSubmitted && userAnswer.join('') === question.answer;

  useEffect(() => {
    if (typeof window.MathJax !== 'undefined') {
      setTimeout(() => {
        window.MathJax.typeset && window.MathJax.typeset();
      }, 100);
    }
  }, [question]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const { value } = e.target;
    const newAnswer = [...(userAnswer || [])];

    newAnswer[index] = value.slice(-1);
    onAnswerChange(newAnswer);

    if (value && index < ANSWER_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !userAnswer?.[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  useEffect(() => {
    inputsRef.current = inputsRef.current.slice(0, ANSWER_LENGTH);
  }, []);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
            <div className="flex-shrink-0 font-bold text-primary">Câu {questionNumber}:</div>
            
            {/* --- SỬA LỖI Ở ĐÂY --- */}
            <div className="flex-1 text-foreground">
                <ReactMarkdown>
                  {(question as any).question || question.prompt}
                </ReactMarkdown>
            </div>
            {/* --- KẾT THÚC SỬA LỖI --- */}
            
            {isSubmitted && (
                <div className="ml-auto flex-shrink-0">
                    {isCorrect ? <CheckCircle className="text-green-500" /> : <XCircle className="text-red-500" />}
                </div>
            )}
        </div>
        
        <div className="mt-4 flex items-center gap-2">
            <div className="flex gap-2">
            {Array.from({ length: ANSWER_LENGTH }).map((_, index) => (
              <Input
                key={index}
                ref={(el) => {
                  inputsRef.current[index] = el;
                }}
                type="text"
                maxLength={1}
                value={userAnswer?.[index] || ''}
                onChange={(e) => handleInputChange(e, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                disabled={isSubmitted}
                className={cn(
                  "w-12 h-14 text-center text-2xl font-mono",
                  isSubmitted && (isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50')
                )}
              />
            ))}
            </div>
             {isSubmitted && !isCorrect && (
                <div className="pl-4">
                    <p className="text-sm text-muted-foreground">Đáp án đúng:</p>
                    <p className="text-lg font-bold text-green-600 font-mono">{question.answer}</p>
                </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}