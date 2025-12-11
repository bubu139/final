// src/types/test-schema.ts

// Đây là các kiểu dữ liệu TypeScript (types)
// được chuyển đổi từ Zod schemas (không còn logic runtime)

export type MultipleChoiceQuestion = {
  id: string;
  type: 'multiple-choice';
  prompt: string;
  options: string[]; // [string, string, string, string]
  answer: number;
};

export type TrueFalseQuestion = {
  id: string;
  type: 'true-false';
  prompt: string;
  statements: string[]; // [string, string, string, string]
  answer: boolean[]; // [boolean, boolean, boolean, boolean]
};

export type ShortAnswerQuestion = {
  id: string;
  type: 'short-answer';
  prompt: string;
  answer: string;
};

export type Question = MultipleChoiceQuestion | TrueFalseQuestion | ShortAnswerQuestion;

export type Test = {
  title: string;
  parts: {
    multipleChoice: {
      title: string;
      questions: MultipleChoiceQuestion[];
    };
    trueFalse: {
      title: string;
      questions: TrueFalseQuestion[];
    };
    shortAnswer: {
      title: string;
      questions: ShortAnswerQuestion[];
    };
  };
};