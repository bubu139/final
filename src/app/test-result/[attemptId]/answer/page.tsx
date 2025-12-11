'use client';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSupabase } from "@/supabase";
import { TestHistoryService } from "@/services/test-history.service";
import { AnswerReviewPage } from "@/components/test/AnswerReviewPage";
import type { TestAttempt } from "@/types/test-history";
import type { Test } from "@/types/test-schema";
import { API_BASE_URL } from "@/lib/utils";
import { Loader } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AnswerReview() {
  const params = useParams();
  const router = useRouter();
  const attemptId = params.attemptId as string;

  const { client: supabase } = useSupabase();

  const [attempt, setAttempt] = useState<TestAttempt | null>(null);
  const [testData, setTestData] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!attemptId || !supabase) return;

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const historyService = new TestHistoryService(supabase);

        // 1. LẤY ATTEMPT TỪ LỊCH SỬ
        const raw = await historyService.getAttemptById(attemptId);
        if (!raw) {
          if (!cancelled) setError("Không tìm thấy dữ liệu bài làm.");
          return;
        }

        const attemptData = raw as TestAttempt;
        if (!cancelled) setAttempt(attemptData);

        // 2. GỌI LẠI ĐỀ THI TỪ API generate-test
        const res = await fetch(`${API_BASE_URL}/api/generate-test`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: attemptData.topic,
            difficulty: attemptData.difficulty,
          }),
        });

        if (!res.ok) {
          throw new Error(`Không thể tải đề thi (status ${res.status}).`);
        }

        const json = await res.json();

        if (!json?.test) {
          throw new Error("API không trả về dữ liệu đề thi (test).");
        }

        if (!cancelled) {
          setTestData(json.test as Test);
        }
      } catch (err: any) {
        console.error("❌ Lỗi khi tải dữ liệu trang đáp án:", err);
        if (!cancelled) {
          setError(
            err?.message ||
              "Đã xảy ra lỗi khi tải đáp án. Vui lòng thử lại sau."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [attemptId, supabase]);

  // ĐANG LOAD
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  // LỖI HOẶC THIẾU DATA
  if (error || !attempt || !testData) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Lỗi khi tải đáp án bài làm</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-red-600 font-medium">
              {error || "Không thể tải dữ liệu bài làm hoặc đề thi."}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.back()}>
                Quay lại
              </Button>
              <Button
                variant="ghost"
                onClick={() => router.push("/test-history")}
              >
                Về lịch sử làm bài
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // DATA OK → HIỂN THỊ TRANG ĐÁP ÁN
  return <AnswerReviewPage attempt={attempt} testData={testData} />;
}
