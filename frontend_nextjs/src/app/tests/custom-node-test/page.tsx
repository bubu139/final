"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader } from "lucide-react";
import { API_BASE_URL } from "@/lib/utils";
import { TestRenderer } from "@/components/test/TestRenderer";
import type { Test } from "@/types/test-schema";

export default function CustomNodeTestPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const nodeId = searchParams.get("nodeId");
  const title = searchParams.get("title") ?? "Bài kiểm tra";

  const [testData, setTestData] = useState<Test | null>(null);
  const [loading, setLoading] = useState(false);

  // =====================================================
  // FETCH ĐỀ THI NODE TEST
  // =====================================================
  useEffect(() => {
    if (!nodeId) return;

    const load = async () => {
      setLoading(true);
      try {
        // 👇 Sửa API endpoint và body
        const res = await fetch(`${API_BASE_URL}/api/generate-test`, { // Sửa endpoint
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            topic: title,
            testType: "node",     // 👈 Thêm
            numQuestions: 5,      // 👈 Thêm (hoặc số bạn muốn)
            // nodeId không còn được dùng ở flow này, nhưng có thể bạn sẽ cần nếu muốn RAG
          }), 
        });

        if (!res.ok) {
          console.error("Lỗi tạo đề node test:", res.status);
          return;
        }

        const data = await res.json();
        setTestData(data.test || data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [nodeId, title]);

  // =====================================================
  // LOADING
  // =====================================================
  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader className="w-10 h-10 animate-spin text-primary" />
        <p className="mt-4">AI đang tạo bài kiểm tra...</p>
      </div>
    );

  // =====================================================
  // KHÔNG CÓ ĐỀ
  // =====================================================
  if (!testData)
    return (
      <p className="text-center py-20 text-muted-foreground">
        Không có dữ liệu bài kiểm tra.
      </p>
    );

  // =====================================================
  // RENDER BẰNG TESTRENDERER — Y NHƯ TEST THƯỜNG
  // =====================================================
  return (
    <TestRenderer
      testData={testData}
      testId={`node-${nodeId}`}
      topic={title}
      difficulty="medium"
      nodeId={nodeId}     // 👈 Custom Node Test option
      isNodeTest={true}   // 👈 Flag để TestRenderer biết đang chạy từ mindmap
      onRetry={() => router.refresh()}  // 👈 Cho giống test thường
    />
  );
}