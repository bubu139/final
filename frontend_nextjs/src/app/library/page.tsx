"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { UploadCloud, Database, Sparkles, ShieldCheck, FileText, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useSupabase } from "@/supabase";

const STORAGE_BUCKET = "mathmentor-materials";

interface DocumentRecord {
  id: string;
  file_name: string;
  rag_status: string;
  created_at: string;
  source_path: string;
  mime_type?: string;
  chunk_count?: number;
}

const statusVariant: Record<string, { label: string; className: string }> = {
  ready: { label: "Sẵn sàng", className: "bg-emerald-100 text-emerald-700" },
  uploaded: { label: "Đã tải lên", className: "bg-blue-100 text-blue-700" },
  indexing: { label: "Đang xử lý", className: "bg-amber-100 text-amber-700" },
  failed: { label: "Lỗi", className: "bg-red-100 text-red-700" },
};

const chunkText = (rawText: string, chunkSize = 800) => {
  const sanitized = rawText.replace(/\s+/g, " ").trim();
  if (!sanitized) {
    return [] as string[];
  }
  const chunks: string[] = [];
  for (let i = 0; i < sanitized.length; i += chunkSize) {
    chunks.push(sanitized.slice(i, i + chunkSize));
  }
  return chunks;
};

export default function LibraryPage() {
  const { client, user, isInitialized } = useSupabase();
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [uploading, setUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    if (!client || !user) return;
    const { data, error } = await client
      .from("user_documents")
      .select("id, file_name, rag_status, created_at, source_path, mime_type, chunk_count")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (!error && data) {
      setDocuments(data as DocumentRecord[]);
    }
  }, [client, user]);

  useEffect(() => {
    void fetchDocuments();
  }, [fetchDocuments]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!client || !user) {
      setErrorMessage("Vui lòng đăng nhập để tải tài liệu cá nhân.");
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setStatusMessage("Đang tải lên Supabase Storage...");
    setErrorMessage(null);

    try {
      const path = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await client.storage
        .from(STORAGE_BUCKET)
        .upload(path, file, {
          upsert: true,
          contentType: file.type || "application/octet-stream",
        });

      if (uploadError) {
        throw uploadError;
      }

      setStatusMessage("Đang chia nhỏ nội dung để đưa vào chỉ mục RAG...");
      let rawText = "";
      try {
        rawText = await file.text();
      } catch (err) {
        console.warn("Không thể đọc nội dung file, sẽ chỉ lưu metadata", err);
      }
      const chunks = chunkText(rawText);

      const { data: insertedDoc, error: docError } = await client
        .from("user_documents")
        .insert({
          user_id: user.id,
          file_name: file.name,
          mime_type: file.type,
          source_path: path,
          rag_status: chunks.length ? "indexing" : "uploaded",
        })
        .select()
        .single();

      if (docError || !insertedDoc) {
        throw docError ?? new Error("Không thể tạo bản ghi tài liệu");
      }

      if (chunks.length) {
        const payload = chunks.map((rawContent, index) => {
          const content = rawContent.replace(/\u0000/g, ""); 
          return {
            user_id: user.id,
            document_id: insertedDoc.id,
            chunk_index: index,
            content,
            source_path: path,
            embedding_status: "pending",
          };
        });
        const { error: chunkError } = await client
        .from("document_chunks")
        .insert(payload);
    
        if (chunkError) {
          console.error("Lỗi khi lưu chunk", chunkError);
          alert("Chunk error:\n" + JSON.stringify(chunkError, null, 2));
          setStatusMessage("Đã tải file nhưng chưa thể tạo chunk cho RAG. Vui lòng thử lại trong dashboard Supabase.");
        } else {
          await client
            .from("user_documents")
            .update({ rag_status: "ready", chunk_count: payload.length })
            .eq("id", insertedDoc.id);
          setStatusMessage("Hoàn tất! Tài liệu đã sẵn sàng để AI chat truy xuất.");
        }
      } else {
        setStatusMessage("Đã lưu file và metadata. Bạn có thể dùng tài liệu này khi chat với AI.");
      }

      await fetchDocuments();
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message ?? "Đã xảy ra lỗi không xác định");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const helperText = useMemo(() => {
    if (!user && isInitialized) {
      return "Đăng nhập để đồng bộ tài liệu với tài khoản MathMentor.";
    }
    if (!client && isInitialized) {
      return "Không thể kết nối Supabase. Kiểm tra lại biến môi trường.";
    }
    return null;
  }, [client, user, isInitialized]);

  return (
    <main className="p-4 md:p-8 space-y-8">
      <section className="space-y-3 max-w-3xl">
        <Badge variant="outline" className="w-fit">Kho tài liệu RAG</Badge>
        <h1 className="text-3xl md:text-4xl font-headline font-bold">Tải lên và lập chỉ mục tài liệu cá nhân</h1>
        <p className="text-muted-foreground">
          Upload file PDF, DOCX của bạn vào Supabase Storage, hệ thống sẽ tự động cắt nhỏ nội dung và đánh dấu trạng thái để Gemini
          + RAG có thể truy xuất khi bạn trò chuyện với trợ lý AI.
        </p>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2"><UploadCloud className="w-4 h-4 text-primary" />Đồng bộ thời gian thực</div>
          <div className="flex items-center gap-2"><Database className="w-4 h-4 text-primary" />Lưu trữ trên Supabase</div>
          <div className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" />Sẵn sàng cho AI chat</div>
        </div>
      </section>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Tải tài liệu mới</CardTitle>
          <CardDescription>
            Hỗ trợ .pdf, .docx. Sau khi hoàn tất, các chunk sẽ được gắn với tài khoản của bạn và ưu tiên trong truy xuất RAG.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input type="file" accept=".pdf,.doc,.docx,.txt" disabled={uploading || !client} onChange={handleFileChange} />
            {helperText && <p className="text-sm text-muted-foreground">{helperText}</p>}
          </div>
          {uploading && (
            <div className="space-y-2">
              <Progress value={66} />
              <p className="text-sm text-muted-foreground">{statusMessage ?? "Đang xử lý..."}</p>
            </div>
          )}
          {!uploading && statusMessage && (
            <div className="flex items-center gap-2 text-sm text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
              {statusMessage}
            </div>
          )}
          {errorMessage && (
            <div className="text-sm text-red-600">{errorMessage}</div>
          )}
        </CardContent>
      </Card>

      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pipeline RAG cho tài liệu của bạn</CardTitle>
            <CardDescription>
              Mỗi file trải qua ba bước để đảm bảo kiến thức được gắn thẻ đầy đủ trước khi AI sử dụng.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-primary/10 text-primary"><UploadCloud className="w-5 h-5" /></div>
              <div>
                <p className="font-semibold">1. Upload & lưu trữ</p>
                <p className="text-sm text-muted-foreground">Tệp gốc được đưa vào bucket {STORAGE_BUCKET} với đường dẫn tách theo người dùng.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-primary/10 text-primary"><Sparkles className="w-5 h-5" /></div>
              <div>
                <p className="font-semibold">2. Tách và tạo chunk</p>
                <p className="text-sm text-muted-foreground">Nội dung văn bản được chuẩn hóa, chia ~800 ký tự/chunk và đánh dấu trạng thái embedding.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-primary/10 text-primary"><ShieldCheck className="w-5 h-5" /></div>
              <div>
                <p className="font-semibold">3. Đồng bộ với AI chat</p>
                <p className="text-sm text-muted-foreground">Các chunk sẵn sàng cho pipeline RAG, giúp Gemini ưu tiên kiến thức cá nhân khi giải bài.</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Cách AI chat sử dụng tài liệu</CardTitle>
            <CardDescription>
              Khi bạn hỏi, MathMentor sẽ truy vấn các chunk liên quan và đính vào prompt cho luồng trả lời chính.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p className="flex items-center gap-2 text-base text-foreground"><FileText className="w-4 h-4 text-primary" />RAG ưu tiên chunk gần nhất với câu hỏi.</p>
            <p>Gemini dùng dữ liệu đã truy xuất để kiểm tra chéo và chỉ sinh câu lệnh GeoGebra khi yêu cầu chứa hàm số/hình học.</p>
            <p>Metadata (nguồn file, thời gian upload) được đính kèm để bạn dễ truy vết trong trang lịch sử luyện tập.</p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách tài liệu của bạn</CardTitle>
          <CardDescription>
            Những tài liệu đã tải lên sẽ hiện tại đây. Sau khi trạng thái chuyển sang "Sẵn sàng", AI chat có thể khai thác lập tức.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-sm text-muted-foreground">Chưa có tài liệu nào. Hãy tải file đầu tiên của bạn!</div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => {
                const variant = statusVariant[doc.rag_status] ?? statusVariant.uploaded;
                return (
                  <div key={doc.id} className="p-4 border rounded-lg flex flex-wrap items-center gap-4 justify-between">
                    <div>
                      <p className="font-medium">{doc.file_name}</p>
                      <p className="text-xs text-muted-foreground">{new Date(doc.created_at).toLocaleString("vi-VN")}</p>
                      {doc.chunk_count ? (
                        <p className="text-xs text-muted-foreground">{doc.chunk_count} chunk đã được tạo</p>
                      ) : null}
                    </div>
                    <div className="flex flex-col items-end gap-2 text-right">
                      <Badge className={variant.className}>{variant.label}</Badge>
                      <p className="text-xs text-muted-foreground">
                        Đường dẫn: <code className="text-foreground">{doc.source_path}</code>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
