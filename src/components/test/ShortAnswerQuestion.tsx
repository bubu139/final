'use client';

import { useRef, useEffect } from 'react';
import type { ShortAnswerQuestion } from '@/types/test-schema';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

declare global {
  interface Window {
    MathJax: any;
  }
}

interface Props {
  question: ShortAnswerQuestion;
  questionNumber: number;
  isSubmitted: boolean;
  userAnswer: any;
  onAnswerChange: (ans: any) => void;

  correctAnswer?: any;
  highlightMode?: "none" | "review";
}

const ANSWER_LENGTH = 6;

export function ShortAnswerQuestionComponent({
  question,
  questionNumber,
  isSubmitted,
  userAnswer,
  onAnswerChange,
  correctAnswer,
  highlightMode = "none"
}: Props) {

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const safeAnswer = userAnswer || Array(ANSWER_LENGTH).fill("");

  const isCorrect =
    safeAnswer.join("").toLowerCase() === question.answer.toLowerCase();

  useEffect(() => {
    if (typeof window.MathJax !== 'undefined') {
      setTimeout(() => {
        window.MathJax.typeset && window.MathJax.typeset();
      }, 100);
    }
  }, [question]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const { value } = e.target;
    const newAnswer = [...safeAnswer];

    newAnswer[index] = value.slice(-1);
    onAnswerChange(newAnswer);

    if (value && index < ANSWER_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !safeAnswer[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const getCellClass = (index: number) => {
    const correctChar = correctAnswer?.[index] ?? question.answer[index] ?? "";
    const userChar = safeAnswer[index] ?? "";

    // Không review → logic cũ
    if (highlightMode === "none") {
      if (!isSubmitted) return "";
      return isCorrect
        ? "border-green-500 bg-green-50"
        : "border-red-500 bg-red-50";
    }

    // ⭐ REVIEW MODE
    if (highlightMode === "review") {
      if (userChar.toLowerCase() === correctChar?.toLowerCase()) {
        return "bg-green-100 border-green-500 text-green-900";
      }
      if (userChar && userChar.toLowerCase() !== correctChar?.toLowerCase()) {
        return "bg-yellow-100 border-yellow-500 text-yellow-900";
      }
      return "";
    }

    return "";
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">

        <div className="flex items-start gap-4">
          <div className="font-bold text-primary">Câu {questionNumber}:</div>

          <div className="flex-1 prose prose-sm max-w-none">
            <ReactMarkdown>{question.prompt}</ReactMarkdown>
          </div>

          {isSubmitted && highlightMode === "none" && (
            <div className="ml-auto">
              {isCorrect ? (
                <CheckCircle className="text-green-500" />
              ) : (
                <XCircle className="text-red-500" />
              )}
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
                value={safeAnswer[index] || ""}
                onChange={(e) => handleInputChange(e, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                disabled={isSubmitted}
                className={cn(
                  "w-12 h-14 text-center text-2xl font-mono",
                  getCellClass(index)
                )}
              />
            ))}
          </div>

          {highlightMode !== "none" && (
            <div className="pl-4 text-sm text-muted-foreground">
              <p>Đáp án đúng:</p>
              <p className="text-lg font-bold text-green-600 font-mono">
                {correctAnswer || question.answer}
              </p>
            </div>
          )}
        </div>

      </CardContent>
    </Card>
  );
}
