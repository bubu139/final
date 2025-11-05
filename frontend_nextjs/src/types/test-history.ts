// frontend_nextjs/src/types/test-history.ts
export interface QuestionAnswer {
  questionId: string;
  questionType: 'multiple-choice' | 'true-false' | 'short-answer';
  userAnswer: any;
  correctAnswer: any;
  isCorrect: boolean;
  topic: string;
}

export interface TestAttempt {
  id: string;
  testId: string;
  testTitle: string;
  userId: string;
  answers: QuestionAnswer[];
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  timeSpent: number;
  startedAt: Date;
  completedAt: Date;
  submittedAt: Date;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  multipleChoiceScore?: number;
  trueFalseScore?: number;
  shortAnswerScore?: number;
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
  improvementRate: number;
}

export interface AIRecommendation {
  userId: string;
  testId: string;
  analysis: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  suggestedTopics: string[];
  generatedAt: Date;
} 