// frontend_nextjs/src/app/test-result/[attemptId]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/supabase/auth/use-user';
import { useSupabase } from '@/supabase';
import { TestHistoryService } from '@/services/test-history.service';
import type { TestAttempt, WeakTopic } from '@/types/test-history';
import type { Test } from '@/types/test-schema';
import { TestResultDetail } from '@/components/test/TestResultDetail';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/utils';

export default function TestResultPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const { client: supabase, isInitialized, error: supabaseError } = useSupabase();
  
  const attemptId = Array.isArray(params.attemptId) ? params.attemptId[0] : params.attemptId;
  
  const [attempt, setAttempt] = useState<TestAttempt | null>(null);
  const [testData, setTestData] = useState<Test | null>(null);
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isUserLoading || !isInitialized) return;

    if (!user) {
      router.push('/login');
      return;
    }

    if (supabaseError) {
      setError(supabaseError);
      setIsLoading(false);
      return;
    }

    if (!supabase) {
      setError('Không thể kết nối tới Supabase. Vui lòng thử lại sau.');
      setIsLoading(false);
      return;
    }

    if (!attemptId) {
      setError('ID bài kiểm tra không hợp lệ');
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const historyService = new TestHistoryService(supabase);

        // Load attempt
        const attemptData = await historyService.getAttemptById(attemptId);
        if (!attemptData) {
          throw new Error('Không tìm thấy kết quả bài kiểm tra');
        }

        if (attemptData.userId !== user.id) {
          throw new Error('Bạn không có quyền xem kết quả này');
        }

        setAttempt(attemptData);

        // Load weak topics analysis
        const analysis = await historyService.analyzeWeakTopics(user.id);
        setWeakTopics(analysis.weakTopics);
        
        // Re-generate test data (hoặc load từ cache nếu có)
        const response = await fetch(`${API_BASE_URL}/api/generate-test`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            topic: attemptData.topic, 
            difficulty: attemptData.difficulty 
          }),
        });
        
        if (!response.ok) {
          throw new Error('Không thể tải dữ liệu đề thi');
        }
        
        const data = await response.json();
        setTestData(data.test);
        
      } catch (err: any) {
        console.error('Error loading test result:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [attemptId, user, isUserLoading, isInitialized, supabase, supabaseError, router]);

  const handleRetakeTest = () => {
    if (attempt) {
      router.push(`/tests/${attempt.testId}?topic=${encodeURIComponent(attempt.topic)}&difficulty=${attempt.difficulty}`);
    }
  };

  const handleTakeAdaptiveTest = async () => {
    if (!user) return;
    
    try {
      if (!supabase) return;

      const historyService = new TestHistoryService(supabase);
      const analysis = await historyService.analyzeWeakTopics(user.id);

      const weakTopicNames = analysis.weakTopics.map(t => t.topic);
      
      router.push(`/tests/adaptive?topics=${encodeURIComponent(weakTopicNames.join(','))}`);
    } catch (error) {
      console.error('Error generating adaptive test:', error);
    }
  };

  if (isUserLoading || isLoading) {
    return (
      <main className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Đang tải kết quả...</p>
        </div>
      </main>
    );
  }

  if (error || !attempt || !testData) {
    return (
      <main className="flex items-center justify-center h-full p-4">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Đã có lỗi xảy ra</h2>
          <p className="text-muted-foreground mb-6">{error || 'Không thể tải kết quả bài kiểm tra'}</p>
          <Button asChild>
            <Link href="/test-history">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại lịch sử
            </Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Link 
          href="/test-history" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại lịch sử
        </Link>

        <TestResultDetail
          attempt={attempt}
          testData={testData}
          weakTopics={weakTopics}
          onRetakeTest={handleRetakeTest}
          onTakeAdaptiveTest={handleTakeAdaptiveTest}
        />
      </div>
    </main>
  );
}