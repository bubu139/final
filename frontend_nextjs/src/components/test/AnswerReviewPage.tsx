'use client';

import { useRouter } from "next/navigation";
import type { TestAttempt } from "@/types/test-history";
import type { Test, Question } from "@/types/test-schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { QuestionComponent } from "./Question";

interface AnswerReviewProps {
  attempt: TestAttempt;
  testData: Test;
}

export function AnswerReviewPage({ attempt, testData }: AnswerReviewProps) {
  const router = useRouter();

  const allQuestions: Question[] = [
    ...testData.parts.multipleChoice.questions,
    ...testData.parts.trueFalse.questions,
    ...testData.parts.shortAnswer.questions,
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => router.back()} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </Button>

        <h1 className="text-2xl font-bold">Đáp án bài làm</h1>
      </div>

      {allQuestions.map((q, idx) => {
        const userAns = attempt.answers.find(a => a.questionId === q.id);

        return (
          <Card key={q.id}>
            <CardHeader>
              <CardTitle>Câu {idx + 1}</CardTitle>
            </CardHeader>
            <CardContent>
              <QuestionComponent
                question={q}
                questionNumber={idx + 1}
                isSubmitted={true}
                userAnswer={userAns?.userAnswer}
                correctAnswer={userAns?.correctAnswer}
                highlightMode="review"
                onAnswerChange={() => {}}
              />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
