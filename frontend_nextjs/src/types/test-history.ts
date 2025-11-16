// frontend_nextjs/src/types/test-history.ts

// Kiểu dữ liệu cho một câu trả lời trong lịch sử
export type AnsweredQuestion = {
  questionId: string;
  questionType: 'multiple-choice' | 'true-false' | 'short-answer';
  userAnswer: any;
  correctAnswer: any;
  isCorrect: boolean;
  topic: string; // Chủ đề của câu hỏi
};

// Kiểu dữ liệu cho một lần làm bài (TestAttempt)
export type TestAttempt = {
  id: string; // ID của document
  userId: string;
  testId: string; // ID của bài test gốc (nếu có)
  testTitle: string;
  answers: AnsweredQuestion[];
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  timeSpent: number; // in seconds
  startedAt: Date;
  completedAt: Date;
  submittedAt: Date; // Dùng cho Firestore server timestamp
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string; // Chủ đề chính của bài test

  // Điểm số theo từng phần
  multipleChoiceScore: number;
  trueFalseScore: number;
  shortAnswerScore: number;
};

// Kiểu dữ liệu cho phân tích chủ đề yếu
export type WeakTopic = {
  topic: string;
  correctAnswers: number;
  totalQuestions: number;
  accuracy: number;
  // --- SỬA LỖI Ở ĐÂY ---
  lastAttempt?: Date; // <-- Thêm dấu '?' để cho phép nó là tùy chọn
};

export type TestAnalysis = {
  weakTopics: WeakTopic[];
  totalAttempts: number;
  averageScore: number;
  improvementRate: number;
};

export type AIRecommendation = {
  userId: string;
  content: string;
  generatedAt: Date;
};