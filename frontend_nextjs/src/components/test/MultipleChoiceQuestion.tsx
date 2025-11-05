// [CODE FILE: bubu139/riel/riel-f4de1f56e545348352c306da2d48610a40fae0d9/frontend_nextjs/src/components/test/MultipleChoiceQuestion.tsx]
'use client';

import { useState, useEffect } from 'react'; // <-- BƯỚC 2: IMPORT useEffect
import type { MultipleChoiceQuestion } from '@/types/test-schema';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
// import remarkMath from 'remark-math'; // <-- BƯỚC 1: XÓA IMPORT NÀY

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
  userAnswer: number | null;
  onAnswerChange: (answer: number) => void;
}

const optionLabels = ['A', 'B', 'C', 'D'];

export function MultipleChoiceQuestionComponent({ question, questionNumber, isSubmitted, userAnswer, onAnswerChange }: Props) {
  const isCorrect = isSubmitted && userAnswer === question.answer;

  // BƯỚC 2: THÊM useEffect
  useEffect(() => {
    if (typeof window.MathJax !== 'undefined') {
      // Sử dụng typeset() thay vì typesetPromise()
      setTimeout(() => {
        window.MathJax.typeset && window.MathJax.typeset();
      }, 100);
    }
  }, [question]);
  const getOptionClass = (index: number) => {
    if (!isSubmitted) {
      return userAnswer === index ? 'bg-blue-100 border-blue-400' : 'bg-background hover:bg-muted/50';
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
            <div className="flex-shrink-0 font-bold text-primary">Câu {questionNumber}:</div>
            <div className="flex-1 prose prose-sm max-w-none">
                 {/* BƯỚC 1: XÓA remarkPlugins */}
                 <ReactMarkdown>{question.prompt}</ReactMarkdown>
            </div>
             {isSubmitted && (
                <div className="ml-auto flex-shrink-0">
                    {isCorrect ? <CheckCircle className="text-green-500" /> : <XCircle className="text-red-500" />}
                </div>
            )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          {question.options.map((option, index) => (
            <Button
              key={index}
              variant="outline"
              className={cn("h-auto justify-start items-start text-left p-4 whitespace-normal", getOptionClass(index))}
              onClick={() => !isSubmitted && onAnswerChange(index)}
              disabled={isSubmitted}
            >
              <div className="flex-shrink-0 font-semibold mr-3">{optionLabels[index]}.</div>
              <div className="flex-1">
                 {/* BƯỚC 1: XÓA remarkPlugins */}
                 <ReactMarkdown className="prose-p:my-0">{option}</ReactMarkdown>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}