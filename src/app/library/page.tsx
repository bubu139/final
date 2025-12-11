"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { UploadCloud, Database, Sparkles, ShieldCheck, FileText, CheckCircle2, Bot, FileSignature } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useSupabase } from "@/supabase";
import { Switch } from "@/components/ui/switch";
// 1. IMPORT THÊM RADIO VÀ LABEL
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const STORAGE_BUCKET = "mathmentor-materials";

interface DocumentRecord {
  id: string;
  file_name: string;
  rag_status: string;
  created_at: string;
  source_path: string;
  mime_type?: string;
  chunk_count?: number;
  visibility?: "private" | "public";
}

// (Hàm statusVariant và chunkText giữ nguyên)
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
const sanitizeFileName = (fileName: string): string => {
  const dotIndex = fileName.lastIndexOf('.');
  const name = dotIndex > -1 ? fileName.slice(0, dotIndex) : fileName;
  const extension = dotIndex > -1 ? fileName.slice(dotIndex) : '';
  let sanitized = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  sanitized = sanitized
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  if (!sanitized) {
    sanitized = "file";
  }
  return `${sanitized}${extension}`;
};


export default function LibraryPage() {
  const { client, user, isInitialized } = useSupabase();
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  // 2. THÊM STATE CHO ĐỀ THI MẪU
  const [testMaterials, setTestMaterials] = useState<DocumentRecord[]>([]);

  const [uploading, setUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadVisibility, setUploadVisibility] = useState<"private" | "public">("private");

  // 3. THÊM STATE CHO MỤC ĐÍCH UPLOAD
  const [uploadPurpose, setUploadPurpose] = useState<'chat' | 'test'>('chat');

  // Fetch tài liệu chat
  const fetchChatDocuments = useCallback(async () => {
    if (!client || !user) return;
    const { data, error } = await client
      .from("user_documents")
      .select("id, file_name, rag_status, created_at, source_path, mime_type, chunk_count, visibility")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setDocuments(data as DocumentRecord[]);
    }
  }, [client, user]);

  // 4. THÊM HÀM FETCH CHO ĐỀ THI MẪU
  const fetchTestMaterials = useCallback(async () => {
    if (!client || !user) return;
    const { data, error } = await client
      .from("test_materials") // 👈 Bảng mới
      .select("id, file_name, rag_status, created_at, source_path, mime_type, chunk_count, visibility")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setTestMaterials(data as DocumentRecord[]);
    }
  }, [client, user]);

  useEffect(() => {
    void fetchChatDocuments();
    void fetchTestMaterials(); // 👈 Gọi cả hai
  }, [fetchChatDocuments, fetchTestMaterials]);

  // 5. CẬP NHẬT `handleFileChange` ĐỂ CHIA LOGIC
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!client || !user) {
      setErrorMessage("Vui lòng đăng nhập để tải tài liệu.");
      return;
    }
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setStatusMessage(`Đang chuẩn bị tải ${files.length} tệp...`);
    setErrorMessage(null);

    // Xác định bảng và khóa ngoại dựa trên mục đích
    const isChatUpload = uploadPurpose === 'chat';
    const metadataTable = isChatUpload ? "user_documents" : "test_materials";
    const chunkTable = isChatUpload ? "document_chunks" : "test_material_chunks";
    const foreignKeyColumn = isChatUpload ? "document_id" : "material_id";

    let successCount = 0;
    let errorCount = 0;
    const errorMessages: string[] = [];


    // Tải lại cả hai danh sách
    void fetchChatDocuments();
    void fetchTestMaterials();
    event.target.value = "";
  };

  // (HelperText giữ nguyên)
  const helperText = useMemo(() => {
    if (!user && isInitialized) {
      return "Đăng nhập để đồng bộ tài liệu với tài khoản MathMentor.";
    }
    if (!client && isInitialized) {
      return "Không thể kết nối Supabase. Kiểm tra lại biến môi trường.";
    }
    return null;
  }, [client, user, isInitialized]);


  // HÀM RENDER UI CHO DANH SÁCH TÀI LIỆU (ĐỂ TÁI SỬ DỤNG)
  const renderDocumentList = (docList: DocumentRecord[]) => {
    if (docList.length === 0) {
      return <div className="text-sm text-muted-foreground">Chưa có tài liệu nào.</div>;
    }
    return (
      <div className="space-y-4">
        {docList.map((doc) => {
          const variant = statusVariant[doc.rag_status] ?? statusVariant.uploaded;
          const isPublic = doc.visibility === "public";
          return (
            <div key={doc.id} className="p-4 border rounded-lg flex flex-wrap items-center gap-4 justify-between">
              <div>
                <p className="font-medium">{doc.file_name}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(doc.created_at).toLocaleString("vi-VN")}
                </p>
                {doc.chunk_count ? (
                  <p className="text-xs text-muted-foreground">{doc.chunk_count} chunk đã được tạo</p>
                ) : null}
                <p className="text-xs text-muted-foreground mt-1">
                  {isPublic ? "🔓 Kho chung" : "🔒 Riêng tư"}
                </p>
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
    );
  };


  return (
    <main className="p-4 md:p-8 space-y-8">
      <section className="space-y-3 max-w-3xl">
        <Badge variant="outline" className="w-fit">Kho tài liệu RAG</Badge>
        <h1 className="text-3xl md:text-4xl font-headline font-bold">Tải lên và lập chỉ mục tài liệu</h1>
        <p className="text-muted-foreground">
          Tải lên tài liệu PDF, DOCX... Hệ thống sẽ tự động cắt nhỏ và lập chỉ mục để AI Chat và AI Sinh Đề Thi có thể sử dụng.
        </p>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2"><UploadCloud className="w-4 h-4 text-primary" />Đồng bộ thời gian thực</div>
          <div className="flex items-center gap-2"><Database className="w-4 h-4 text-primary" />Lưu trữ trên Supabase</div>
          <div className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" />Sẵn sàng cho AI</div>
        </div>
      </section>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Tải tài liệu mới</CardTitle>
          <CardDescription>
            Chọn mục đích tải lên, chế độ chia sẻ, sau đó chọn tệp của bạn.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* 6. THÊM BỘ CHỌN MỤC ĐÍCH */}
          <div className="space-y-3">
            <Label className="font-medium">Mục đích tải lên</Label>
            <RadioGroup
              value={uploadPurpose}
              onValueChange={(val) => setUploadPurpose(val as 'chat' | 'test')}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="chat" id="r-chat" />
                <Label htmlFor="r-chat" className="cursor-pointer flex items-center gap-2"><Bot className="w-4 h-4" /> Cho AI Chat</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="test" id="r-test" />
                <Label htmlFor="r-test" className="cursor-pointer flex items-center gap-2"><FileSignature className="w-4 h-4" /> Cho Sinh Đề Thi</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex items-start justify-between gap-4 text-sm">
            <div>
              <p className="font-medium">Chế độ chia sẻ</p>
              <p className="text-xs text-muted-foreground">
                Bật <strong>Kho chung</strong> nếu bạn muốn tài liệu này được dùng cho tất cả học sinh.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Riêng tư</span>
              <Switch
                checked={uploadVisibility === "public"}
                onCheckedChange={(checked) => setUploadVisibility(checked ? "public" : "private")}
              />
              <span className="text-xs text-muted-foreground">Kho chung</span>
            </div>
          </div>

          <div className="space-y-2">
            <Input
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              disabled={uploading || !client}
              onChange={handleFileChange}
              multiple
            />
            {helperText && <p className="text-sm text-muted-foreground">{helperText}</p>}
          </div>

          {/* (Phần hiển thị trạng thái giữ nguyên) */}
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

      {/* (Phần pipeline RAG giữ nguyên) */}
      <section className="grid gap-6 md:grid-cols-2">
        {/* ... Card "Pipeline RAG" ... */}
        {/* ... Card "Cách AI chat sử dụng" ... */}
      </section>

      {/* 7. HIỂN THỊ CẢ 2 DANH SÁCH */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bot className="w-5 h-5" /> Danh sách tài liệu AI Chat</CardTitle>
          <CardDescription>
            Những tài liệu này sẽ được dùng khi bạn trò chuyện với AI.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderDocumentList(documents)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileSignature className="w-5 h-5" /> Danh sách Đề mẫu (Sinh bài kiểm tra)</CardTitle>
          <CardDescription>
            Những tài liệu này sẽ được dùng làm RAG khi AI tạo bài kiểm tra.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderDocumentList(testMaterials)}
        </CardContent>
      </Card>

    </main>
  );
}