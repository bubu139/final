// frontend_nextjs/src/components/test/Question.tsx
'use client';

import { Question as QuestionType, MultipleChoiceQuestion, TrueFalseQuestion, ShortAnswerQuestion } from '@/types/test-schema';
import { MultipleChoiceQuestionComponent } from './MultipleChoiceQuestion';
import { TrueFalseQuestionComponent } from './TrueFalseQuestion';
import { ShortAnswerQuestionComponent } from './ShortAnswerQuestion';
import { AlertTriangle } from 'lucide-react';

interface Props {
  question: QuestionType;
  questionNumber: number;
  isSubmitted: boolean;
  userAnswer: any;
  onAnswerChange: (answer: any) => void;
}

// Type guards để kiểm tra loại câu hỏi
const isMultipleChoiceQuestion = (question: QuestionType): question is MultipleChoiceQuestion => {
  return question.type === 'multiple-choice';
};

const isTrueFalseQuestion = (question: QuestionType): question is TrueFalseQuestion => {
  return question.type === 'true-false';
};

const isShortAnswerQuestion = (question: QuestionType): question is ShortAnswerQuestion => {
  return question.type === 'short-answer';
};

export function QuestionComponent({ question, questionNumber, isSubmitted, userAnswer, onAnswerChange }: Props) {
  // Tạo một bản sao để tránh type narrowing
  const currentQuestion = question;

  // Kiểm tra question tồn tại
  if (!currentQuestion) {
    return (
      <div className="p-4 border border-red-200 rounded-lg bg-red-50 text-red-800">
        <AlertTriangle className="w-5 h-5 inline mr-2" />
        Question is undefined
      </div>
    );
  }

  // Kiểm tra type tồn tại với type assertion an toàn
  if (!('type' in currentQuestion)) {
    return (
      <div className="p-4 border border-red-200 rounded-lg bg-red-50 text-red-800">
        <AlertTriangle className="w-5 h-5 inline mr-2" />
        Question type is missing
      </div>
    );
  }

  // Sử dụng type guards để xác định loại câu hỏi
  if (isMultipleChoiceQuestion(currentQuestion)) {
    return <MultipleChoiceQuestionComponent 
      question={currentQuestion} 
      questionNumber={questionNumber}
      isSubmitted={isSubmitted}
      userAnswer={userAnswer}
      onAnswerChange={onAnswerChange}
    />;
  }
  
  if (isTrueFalseQuestion(currentQuestion)) {
    return <TrueFalseQuestionComponent
      question={currentQuestion}
      questionNumber={questionNumber}
      isSubmitted={isSubmitted}
      userAnswer={userAnswer}
      onAnswerChange={onAnswerChange}
    />;
  }
  
  if (isShortAnswerQuestion(currentQuestion)) {
    return <ShortAnswerQuestionComponent
      question={currentQuestion}
      questionNumber={questionNumber}
      isSubmitted={isSubmitted}
      userAnswer={userAnswer}
      onAnswerChange={onAnswerChange}
     />;
  }

  // Fallback cho unknown type - sử dụng type assertion để tránh lỗi
  const questionType = (currentQuestion as { type: string }).type;
  
  return (
    <div className="p-4 border border-red-200 rounded-lg bg-red-50 text-red-800">
      <AlertTriangle className="w-5 h-5 inline mr-2" />
      Unknown question type: {questionType}
    </div>
  );
}