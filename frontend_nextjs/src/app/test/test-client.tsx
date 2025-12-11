"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/utils";
import { TestRenderer } from "@/components/test/TestRenderer";
import { Loader, AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NodeTestPage() {
    const searchParams = useSearchParams();

    const nodeId = searchParams.get("nodeId");
    const title = searchParams.get("title");

    const [test, setTest] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!nodeId || !title) {
            setError("Thiếu thông tin node để tạo bài kiểm tra.");
            setLoading(false);
            return;
        }

        const fetchTest = async () => {
            try {
                setLoading(true);
                const res = await fetch(`${API_BASE_URL}/api/generate-node-test`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ topic: title })
                });

                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.detail || "Không thể tạo bài kiểm tra.");
                }

                const data = await res.json();
                setTest(data.test ?? data);
            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };

        fetchTest();
    }, [nodeId, title]);

    return (
        <main className="flex-1 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">

                <Link href="/tests" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                    <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
                </Link>

                <h1 className="text-3xl font-bold mb-2">Bài kiểm tra: {title}</h1>
                <p className="text-muted-foreground mb-8">Bài kiểm tra dựa trên nội dung bạn đang học.</p>

                {loading && (
                    <div className="flex flex-col items-center justify-center text-center gap-4 p-16 border rounded-lg bg-card">
                        <Loader className="w-12 h-12 animate-spin text-primary" />
                        <h2 className="text-xl font-semibold">AI đang tạo đề...</h2>
                    </div>
                )}

                {error && !loading && (
                    <div className="flex flex-col items-center justify-center text-center gap-4 p-16 border border-destructive/50 rounded-lg bg-destructive/10">
                        <AlertTriangle className="w-12 h-12 text-destructive" />
                        <h2 className="text-xl font-semibold text-destructive">Lỗi</h2>
                        <p className="text-destructive/80 max-w-md">{error}</p>
                        <Button onClick={() => window.location.reload()} variant="destructive">Thử lại</Button>
                    </div>
                )}

                {!loading && !error && test && (
                    <TestRenderer
                        testData={test}
                        testId={`node-${nodeId}`}
                        topic={title!}
                        difficulty="node"
                        onRetry={() => window.location.reload()}
                        nodeId={nodeId} // Truyền nodeId
                        isNodeTest={true} // Đánh dấu đây là node test
                    />
                )}

            </div>
        </main>
    );
}