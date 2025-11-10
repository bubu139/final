'use client'

import { ChangeEvent, FormEvent, useMemo, useRef, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { API_BASE_URL } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { Upload, FileText, X, CheckCircle2, XCircle, Loader2 } from 'lucide-react'

type PendingFile = {
  id: string
  file: File
}

type UploadSummary = {
  filename: string
  document_id?: string | null
  chunks: number
  token_estimate: number
  skipped: boolean
  reason?: string | null
  metadata?: {
    topic?: string
    [key: string]: unknown
  } | null
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const value = bytes / Math.pow(k, i)
  return `${value.toFixed(value > 10 || i === 0 ? 0 : 1)} ${sizes[i]}`
}

export default function UploadDocumentsPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const { toast } = useToast()

  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([])
  const [topic, setTopic] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [results, setResults] = useState<UploadSummary[]>([])

  const hasPendingFiles = pendingFiles.length > 0

  const handleFileSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const { files } = event.target
    if (!files || !files.length) return

    const mapped: PendingFile[] = Array.from(files).map((file) => ({
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      file,
    }))

    setPendingFiles((prev) => [...prev, ...mapped])
    // Reset the input so the same file can be selected again if needed.
    event.target.value = ''
  }

  const removeFile = (id: string) => {
    setPendingFiles((prev) => prev.filter((item) => item.id !== id))
  }

  const handleOpenFileDialog = () => {
    fileInputRef.current?.click()
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!hasPendingFiles || isUploading) {
      return
    }

    const formData = new FormData()
    pendingFiles.forEach(({ file }) => {
      formData.append('files', file)
    })

    if (topic.trim()) {
      formData.append('topic', topic.trim())
    }

    try {
      setIsUploading(true)
      setResults([])

      const response = await fetch(`${API_BASE_URL}/api/documents/upload`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Không thể tải tài liệu lên máy chủ.')
      }

      const payload = (await response.json()) as { documents?: UploadSummary[] }
      const summaries = payload.documents ?? []

      setResults(summaries)
      setPendingFiles([])

      const successCount = summaries.filter((item) => !item.skipped).length
      toast({
        title: 'Hoàn tất tải tài liệu',
        description:
          successCount > 0
            ? `Đã đồng bộ ${successCount}/${summaries.length} tài liệu vào kho tri thức.`
            : 'Không có tài liệu nào được xử lý thành công.',
      })
    } catch (error) {
      console.error('Upload failed', error)
      toast({
        title: 'Tải lên thất bại',
        description:
          error instanceof Error
            ? error.message
            : 'Có lỗi xảy ra khi tải tài liệu. Vui lòng thử lại.',
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
    }
  }

  const totalSize = useMemo(
    () =>
      pendingFiles.reduce((acc, item) => {
        return acc + item.file.size
      }, 0),
    [pendingFiles]
  )

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Kho tài liệu AI</h1>
        <p className="text-muted-foreground">
          Tải lên tài liệu tham khảo để trợ lý AI có thể tìm kiếm và trích dẫn thông tin khi trả lời câu hỏi.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Đồng bộ tài liệu</CardTitle>
          <CardDescription>
            Hệ thống sẽ tự động chia nhỏ tài liệu, sinh embedding và lưu vào Supabase cho quy trình RAG.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-[2fr_3fr]">
              <div className="space-y-2">
                <Label htmlFor="topic">Chủ đề (tuỳ chọn)</Label>
                <Input
                  id="topic"
                  placeholder="VD: Hàm số, Hình học không gian..."
                  value={topic}
                  onChange={(event) => setTopic(event.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Chủ đề giúp nhóm các đoạn văn bản trong vector database để truy xuất chính xác hơn.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Tập tin</Label>
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" variant="outline" onClick={handleOpenFileDialog} disabled={isUploading}>
                    <Upload className="mr-2 h-4 w-4" />
                    Chọn tài liệu
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Hỗ trợ PDF, DOCX, DOC. Dung lượng hiện tại: {formatFileSize(totalSize)}
                  </span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileSelection}
                  className="hidden"
                />
              </div>
            </div>

            {hasPendingFiles && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Tài liệu đã chọn</p>
                <ul className="divide-y rounded-lg border">
                  {pendingFiles.map(({ id, file }) => (
                    <li key={id} className="flex items-center justify-between gap-4 p-3 text-sm">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(id)}
                        disabled={isUploading}
                        aria-label={`Xoá ${file.name}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Sau khi tải lên, tài liệu sẽ sẵn sàng cho chatbot sử dụng qua cơ chế truy vấn theo ngữ nghĩa.
              </p>
              <Button type="submit" disabled={!hasPendingFiles || isUploading}>
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Tải lên &amp; nhúng dữ liệu
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Kết quả xử lý</CardTitle>
            <CardDescription>
              Theo dõi số chunk và embedding được lưu trong Supabase sau mỗi lần tải lên.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {results.map((item) => {
              const isSuccess = !item.skipped
              return (
                <div
                  key={`${item.filename}-${item.document_id ?? 'skipped'}`}
                  className="flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    {isSuccess ? (
                      <CheckCircle2 className="mt-1 h-5 w-5 text-emerald-500" />
                    ) : (
                      <XCircle className="mt-1 h-5 w-5 text-destructive" />
                    )}
                    <div>
                      <p className="font-medium">{item.filename}</p>
                      {isSuccess ? (
                        <>
                          {item.document_id && (
                            <p className="text-xs text-muted-foreground break-all">
                              ID tài liệu: {item.document_id}
                            </p>
                          )}
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Badge variant="outline">Chunks: {item.chunks}</Badge>
                            <Badge variant="outline">Tokens ≈ {item.token_estimate}</Badge>
                            {item.metadata?.topic && (
                              <Badge variant="secondary">Chủ đề: {String(item.metadata.topic)}</Badge>
                            )}
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground">{item.reason ?? 'Không rõ nguyên nhân.'}</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
