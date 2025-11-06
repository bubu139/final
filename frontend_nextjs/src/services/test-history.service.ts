// frontend_nextjs/src/services/test-history.service.ts
import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  serverTimestamp 
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { TestAttempt, WeakTopic, AIRecommendation, TestAnalysis } from '@/types/test-history';

export class TestHistoryService {
  private firestore: Firestore;

  constructor(firestore: Firestore) {
    this.firestore = firestore;
  }

  async saveTestAttempt(attempt: Omit<TestAttempt, 'id' | 'submittedAt'>): Promise<string> {
    try {
      console.log('=== SAVE TEST ATTEMPT DEBUG ===');
      console.log('🚀 Step 1: Check Firestore');
      
      if (!this.firestore) {
        throw new Error('❌ Firestore is not initialized');
      }
      console.log('✅ Firestore exists');

      console.log('🚀 Step 2: Check Auth');
      const auth = getAuth(this.firestore.app);
      console.log('Auth object:', auth);
      
      const currentUser = auth.currentUser;
      console.log('Current user object:', currentUser);
      
      if (!currentUser) {
        console.error('❌ NO USER FOUND!');
        throw new Error('User not authenticated. Please login first.');
      }
      
      console.log('✅ User authenticated:', {
        uid: currentUser.uid,
        email: currentUser.email,
        emailVerified: currentUser.emailVerified,
        isAnonymous: currentUser.isAnonymous
      });

      console.log('🚀 Step 3: Check User ID Match');
      console.log('Attempt userId:', attempt.userId);
      console.log('Current user uid:', currentUser.uid);
      console.log('Match:', attempt.userId === currentUser.uid);

      if (attempt.userId !== currentUser.uid) {
        console.error('❌ USER ID MISMATCH!');
        throw new Error('User ID mismatch');
      }

      console.log('🚀 Step 4: Get ID Token');
      try {
        const token = await currentUser.getIdToken(true);
        console.log('✅ ID Token obtained (first 50 chars):', token.substring(0, 50) + '...');
      } catch (tokenError) {
        console.error('❌ Failed to get ID token:', tokenError);
        throw new Error('Failed to get authentication token');
      }

      console.log('🚀 Step 5: Prepare Data');
      const attemptData = {
        userId: currentUser.uid, // Force correct userId
        testId: attempt.testId,
        testTitle: attempt.testTitle,
        answers: attempt.answers,
        score: attempt.score,
        correctAnswers: attempt.correctAnswers,
        totalQuestions: attempt.totalQuestions,
        timeSpent: attempt.timeSpent,
        difficulty: attempt.difficulty,
        topic: attempt.topic,
        startedAt: Timestamp.fromDate(attempt.startedAt),
        completedAt: Timestamp.fromDate(attempt.completedAt),
        submittedAt: serverTimestamp(),
      };

      console.log('📦 Data to save:', {
        userId: attemptData.userId,
        testId: attemptData.testId,
        score: attemptData.score,
        totalQuestions: attemptData.totalQuestions,
        answersCount: attemptData.answers.length
      });

      console.log('🚀 Step 6: Attempt Firestore Write');
      const testAttemptsRef = collection(this.firestore, 'testAttempts');
      console.log('Collection reference:', testAttemptsRef.path);

      console.log('📝 Calling addDoc...');
      const docRef = await addDoc(testAttemptsRef, attemptData);
      
      console.log('✅✅✅ SUCCESS! Document created:', {
        id: docRef.id,
        path: docRef.path
      });
      
      return docRef.id;

    } catch (error: any) {
      console.error('=== ERROR CAUGHT ===');
      console.error('Error object:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error name:', error.name);
      console.error('Full error:', JSON.stringify(error, null, 2));

      // Check specific error codes
      if (error.code === 'permission-denied') {
        console.error('🚫 PERMISSION DENIED!');
        console.error('This means Firestore Rules are blocking the write');
        console.error('Check Firebase Console → Firestore → Rules');
      }

      if (error.code === 'unauthenticated') {
        console.error('🔐 UNAUTHENTICATED!');
        console.error('User token is invalid or expired');
      }

      throw new Error(`Failed to save test attempt: ${error.message}`);
    }
  }

  async getUserAttempts(userId: string, limitCount: number = 10): Promise<TestAttempt[]> {
    try {
      const testAttemptsRef = collection(this.firestore, 'testAttempts');
      const q = query(
        testAttemptsRef,
        where('userId', '==', userId),
        orderBy('completedAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const attempts: TestAttempt[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        attempts.push({
          id: doc.id,
          ...data,
          startedAt: data.startedAt?.toDate() || new Date(),
          completedAt: data.completedAt?.toDate() || new Date(),
          submittedAt: data.submittedAt?.toDate() || new Date(),
        } as TestAttempt);
      });

      return attempts;
    } catch (error) {
      console.error('Error fetching user attempts:', error);
      throw new Error('Failed to fetch user attempts');
    }
  }

  async getAttemptById(attemptId: string): Promise<TestAttempt | null> {
    try {
      if (!this.firestore) {
        throw new Error('Firestore is not initialized');
      }

      const attemptRef = doc(this.firestore, 'testAttempts', attemptId);
      const attemptSnap = await getDoc(attemptRef);

      if (!attemptSnap.exists()) {
        return null;
      }

      const data = attemptSnap.data();
      return {
        id: attemptSnap.id,
        ...data,
        startedAt: data.startedAt?.toDate() || new Date(),
        completedAt: data.completedAt?.toDate() || new Date(),
        submittedAt: data.submittedAt?.toDate() || new Date(),
      } as TestAttempt;
    } catch (error) {
      console.error('Error fetching test attempt:', error);
      throw new Error('Failed to fetch test attempt');
    }
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
        improvementRate = ((recentAvg - oldAvg) / oldAvg) * 100;
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
          accuracy: (stats.correct / stats.total) * 100,
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
    try {
      const aiRecsRef = collection(this.firestore, 'aiRecommendations');
      await addDoc(aiRecsRef, {
        ...recommendation,
        generatedAt: Timestamp.fromDate(recommendation.generatedAt),
      });
    } catch (error) {
      console.error('Error saving AI recommendation:', error);
      throw new Error('Failed to save AI recommendation');
    }
  }
}