// frontend_nextjs/src/services/test-history.service.ts
import type { SupabaseClient } from '@supabase/supabase-js';
// SỬA ĐỔI: Import các type mới
import type { 
  TestAttempt, 
  WeakTopic, 
  AIRecommendation, 
  TestAnalysis,
  TestDifficulty 
} from '@/types/test-history';

interface TestAttemptRow {
  id: string;
  user_id: string;
  test_id: string;
  test_title: string;
  answers: TestAttempt['answers'];
  score: number;
  correct_answers: number;
  total_questions: number;
  time_spent: number;
  started_at: string;
  completed_at: string;
  submitted_at: string | null;
  difficulty: string;
  topic: string;
  multiple_choice_score: number;
  true_false_score: number;
  short_answer_score: number;
}

interface AIRecommendationRow {
  user_id: string;
  content: string;
  generated_at: string;
}

export class TestHistoryService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  private mapRowToAttempt(row: TestAttemptRow): TestAttempt {
    return {
      id: row.id,
      userId: row.user_id,
      testId: row.test_id,
      testTitle: row.test_title,
      answers: row.answers ?? [],
      score: Number(row.score ?? 0),
      correctAnswers: Number(row.correct_answers ?? 0),
      totalQuestions: Number(row.total_questions ?? 0),
      timeSpent: Number(row.time_spent ?? 0),
      startedAt: row.started_at ? new Date(row.started_at) : new Date(),
      completedAt: row.completed_at ? new Date(row.completed_at) : new Date(),
      submittedAt: row.submitted_at ? new Date(row.submitted_at) : new Date(),
      // SỬA ĐỔI: Dùng TestDifficulty
      difficulty: (row.difficulty ?? 'medium') as TestDifficulty,
      topic: row.topic ?? '',
      multipleChoiceScore: Number(row.multiple_choice_score ?? 0),
      trueFalseScore: Number(row.true_false_score ?? 0),
      shortAnswerScore: Number(row.short_answer_score ?? 0),
    };
  }

  async saveTestAttempt(attempt: Omit<TestAttempt, 'id' | 'submittedAt'>): Promise<string> {
    const payload = {
      user_id: attempt.userId,
      test_id: attempt.testId,
      test_title: attempt.testTitle,
      answers: attempt.answers,
      score: attempt.score,
      correct_answers: attempt.correctAnswers,
      total_questions: attempt.totalQuestions,
      time_spent: attempt.timeSpent,
      started_at: attempt.startedAt.toISOString(),
      completed_at: attempt.completedAt.toISOString(),
      submitted_at: new Date().toISOString(),
      difficulty: attempt.difficulty,
      topic: attempt.topic,
      multiple_choice_score: attempt.multipleChoiceScore,
      true_false_score: attempt.trueFalseScore,
      short_answer_score: attempt.shortAnswerScore,
    };

    const { data, error } = await this.supabase
      .from('test_attempts')
      .insert(payload)
      .select('id')
      .single();

    if (error) {
      console.error('Failed to save test attempt:', error);
      throw new Error(`Failed to save test attempt: ${error.message}`);
    }

    return data.id;
  }

  async getUserAttempts(userId: string, limitCount: number = 10): Promise<TestAttempt[]> {
    const { data, error } = await this.supabase
      .from('test_attempts')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(limitCount);

    if (error) {
      console.error('Error fetching user attempts:', error);
      throw new Error('Failed to fetch user attempts');
    }

    return (data ?? []).map((row) => this.mapRowToAttempt(row as TestAttemptRow));
  }

  async getAttemptById(attemptId: string): Promise<TestAttempt | null> {
    const { data, error } = await this.supabase
      .from('test_attempts')
      .select('*')
      .eq('id', attemptId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching test attempt:', error);
      throw new Error('Failed to fetch test attempt');
    }

    if (!data) {
      return null;
    }

    return this.mapRowToAttempt(data as TestAttemptRow);
  }

  async getUserTestHistory(userId: string, limitCount: number = 10): Promise<TestAttempt[]> {
    return this.getUserAttempts(userId, limitCount);
  }

  async analyzeWeakTopics(userId: string): Promise<TestAnalysis> {
    try {
      const history = await this.getUserTestHistory(userId, 20);

      if (history.length === 0) {
        return {
          weakTopics: [],
          totalAttempts: 0,
          averageScore: 0,
          improvementRate: 0
        };
      }

      const totalAttempts = history.length;
      const averageScore = history.reduce((sum, a) => sum + a.score, 0) / totalAttempts;

      let improvementRate = 0;
      if (history.length >= 4) {
        const mid = Math.floor(history.length / 2);
        const recentAvg = history.slice(0, mid).reduce((sum, a) => sum + a.score, 0) / mid;
        const oldAvg = history.slice(mid).reduce((sum, a) => sum + a.score, 0) / (history.length - mid);
        improvementRate = oldAvg === 0 ? 0 : ((recentAvg - oldAvg) / oldAvg) * 100;
      }

      const topicStats: Record<string, {
        correct: number;
        total: number;
        lastAttemptDate: Date;
      }> = {};

      history.forEach(attempt => {
        attempt.answers.forEach(answer => {
          const topic = answer.topic || 'Unknown';
          if (!topicStats[topic]) {
            topicStats[topic] = { correct: 0, total: 0, lastAttemptDate: attempt.completedAt };
          }
          topicStats[topic].total++;
          if (answer.isCorrect) {
            topicStats[topic].correct++;
          }
          if (attempt.completedAt > topicStats[topic].lastAttemptDate) {
            topicStats[topic].lastAttemptDate = attempt.completedAt;
          }
        });
      });

      const weakTopics: WeakTopic[] = Object.entries(topicStats)
        .map(([topic, stats]) => ({
          topic,
          accuracy: stats.total === 0 ? 0 : (stats.correct / stats.total) * 100,
          correctAnswers: stats.correct,
          totalQuestions: stats.total,
          lastAttempt: stats.lastAttemptDate,
        }))
        .filter(topic => topic.accuracy < 70)
        .sort((a, b) => a.accuracy - b.accuracy);

      return {
        weakTopics,
        totalAttempts,
        averageScore,
        improvementRate
      };
    } catch (error) {
      console.error('Error analyzing weak topics:', error);
      return {
        weakTopics: [],
        totalAttempts: 0,
        averageScore: 0,
        improvementRate: 0
      };
    }
  }

  async saveAIRecommendation(recommendation: AIRecommendation): Promise<void> {
    const payload: AIRecommendationRow = {
      user_id: recommendation.userId,
      content: recommendation.content,
      generated_at: recommendation.generatedAt.toISOString(),
    };

    const { error } = await this.supabase
      .from('ai_recommendations')
      .insert(payload);

    if (error) {
      console.error('Error saving AI recommendation:', error);
      throw new Error('Failed to save AI recommendation');
    }
  }
}