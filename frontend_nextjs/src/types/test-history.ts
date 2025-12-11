// frontend_nextjs/src/types/test-history.ts

// (Đây là file từ lần trước, đảm bảo bạn đã lưu nó)

export type TestDifficulty = "easy" | "medium" | "hard" | "node" | "adaptive" | string;

// ĐỊNH NGHĨA TestAnswer (Nguyên nhân lỗi 1)
export interface TestAnswer {
  questionId: string | number;
  questionType: 'multiple-choice' | 'true-false' | 'short-answer';
  prompt: string; // <-- Trường này bị thiếu
  topic: string;
  userAnswer: any;
  correctAnswer: any;
  isCorrect: boolean;
  score: number; // <-- Trường này bị thiếu
}

export interface TestAttempt {
  id: string;
  userId: string;
  testId: string;
  testTitle: string;
  answers: TestAnswer[]; // <-- Sử dụng TestAnswer
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  timeSpent: number; // in seconds
  startedAt: Date;
  completedAt: Date;
  submittedAt: Date;
  difficulty: TestDifficulty; 
  topic: string;
  multipleChoiceScore: number;
  trueFalseScore: number;
  shortAnswerScore: number;
}

export interface WeakTopic {
  topic: string;
  accuracy: number;
  correctAnswers: number;
  totalQuestions: number;
  lastAttempt: Date;
}

export interface TestAnalysis {
  weakTopics: WeakTopic[];
  totalAttempts: number;
  averageScore: number;
  improvementRate: number; // percentage
}

export interface AIRecommendation {
  userId: string;
  content: string;
  generatedAt: Date;
}

export interface TestResultData {
    answers: TestAttempt['answers'];
    score: number;
    correctAnswers: number;
    totalQuestions: number;
    timeSpent: number;
    startedAt: Date;
    completedAt: Date;
    multipleChoiceScore: number;
    trueFalseScore: number;
    shortAnswerScore: number;
}