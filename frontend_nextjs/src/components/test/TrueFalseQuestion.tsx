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
  userAnswer: any;
  onAnswerChange: (ans: any) => void;
mode?: "do" | "review";

  correctAnswer?: any;
  highlightMode?: "none" | "review";
}

export function TrueFalseQuestionComponent({
  question,
  questionNumber,
  isSubmitted,
  userAnswer,
  onAnswerChange,
  correctAnswer,
  highlightMode = "none"
}: Props) {

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

    const newAnswers = Array(4).fill(null);
    safeUserAnswer.forEach((v: any, i: number) => {
      if (i < 4) newAnswers[i] = v;
    });

    newAnswers[statementIndex] = value;
    onAnswerChange(newAnswers);
  };

  const getButtonClass = (idx: number, value: boolean) => {
    const selected = safeUserAnswer[idx];
    const correct = correctAnswer?.[idx];

    // Không review -> giữ nguyên logic cũ
    if (highlightMode === "none") {
      if (!isSubmitted) {
        return selected === value
          ? "bg-blue-100 border-blue-400"
          : "bg-background hover:bg-muted/50";
      }

      if (value === question.answer?.[idx]) {
        return "bg-green-100 border-green-500 text-green-900";
      }
      if (selected === value) {
        return "bg-red-100 border-red-500 text-red-900";
      }
      return "bg-background";
    }

    // ⭐ Chế độ REVIEW ĐÁP ÁN
    if (highlightMode === "review") {
      if (value === correct) {
        return "bg-green-100 border-green-500 text-green-900";
      }
      if (selected === value && selected !== correct) {
        return "bg-yellow-100 border-yellow-500 text-yellow-900";
      }
      return "bg-background";
    }

    return "bg-background";
  };

  const safeStatements = question.statements || [];

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">

        <div className="flex items-start gap-4">
          <div className="font-bold text-primary">Câu {questionNumber}:</div>

          <div className="flex-1 prose prose-sm max-w-none">
            <ReactMarkdown>{question.prompt}</ReactMarkdown>
          </div>

          {isSubmitted && (
            <div className="ml-auto">
              {JSON.stringify(safeUserAnswer) === JSON.stringify(question.answer)
                ? <CheckCircle className="text-green-500" />
                : <XCircle className="text-red-500" />}
            </div>
          )}
        </div>

        <div className="space-y-4 mt-4">
          {safeStatements.map((statement, idx) => (
            <div key={idx} className="p-4 border rounded-lg flex flex-col md:flex-row justify-between gap-4">

              <div className="flex-1">
                <div className="font-medium mb-2">Mệnh đề {idx + 1}:</div>
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{statement}</ReactMarkdown>
                </div>
              </div>

              <div className="flex items-center gap-2">

                <Button
                  variant="outline"
                  className={cn("w-24", getButtonClass(idx, true))}
                  onClick={() => handleSelect(idx, true)}
                  disabled={isSubmitted}
                >
                  <Check className="mr-2 h-4 w-4" /> Đúng
                </Button>

                <Button
                  variant="outline"
                  className={cn("w-24", getButtonClass(idx, false))}
                  onClick={() => handleSelect(idx, false)}
                  disabled={isSubmitted}
                >
                  <X className="mr-2 h-4 w-4" /> Sai
                </Button>

              </div>
            </div>
          ))}
        </div>

      </CardContent>
    </Card>
  );
}
