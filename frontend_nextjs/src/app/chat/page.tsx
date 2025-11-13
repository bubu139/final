// [CODE FILE: bubu139/riel/riel-f4de1f56e545348352c306da2d48610a40fae0d9/frontend_nextjs/src/app/chat/page.tsx]
'use client';
import { useState, useRef, useEffect, FormEvent } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Paperclip, Send, Bot, User, Sparkles, X, File as FileIcon, Compass, Sigma, Share2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
// import remarkMath from 'remark-math'; // <-- BƯỚC 1: XÓA IMPORT NÀY
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { API_BASE_URL } from '@/lib/utils';
import { GeoGebraModal } from '@/components/chat/GeoGebraModal';
import Link from 'next/link';
import { MindmapInsightPayload, upsertMindmapInsights } from '@/lib/mindmap-storage';

type Message = {
  text: string;
  isUser: boolean;
  files?: { name: string, type: string, content: string }[];
};

type AttachedFile = {
  name: string;
  type: string;
  content: string;
};

type ApiMindmapInsight = {
  node_id: string;
  parent_node_id?: string | null;
  label: string;
  type: 'topic' | 'subtopic' | 'concept';
  weakness_summary?: string;
  action_steps?: string[];
  color?: string;
};

type ApiGeogebraResponse = {
  should_draw?: boolean;
  reason?: string;
  prompt?: string;
  commands?: string[];
};

type ChatApiResponse = {
  reply: string;
  mindmap_insights?: ApiMindmapInsight[];
  geogebra?: ApiGeogebraResponse;
};

type GeogebraSuggestion = {
  prompt: string;
  reason: string;
  commands: string[];
  consumed?: boolean;
};

const latexSymbols = [
  { label: 'Toán tử', symbols: ['+', '-', '\\pm', '\\times', '\\div', '=', '\\neq', '>', '<', '\\geq', '\\leq'] },
  { label: 'Ký hiệu', symbols: ['\\alpha', '\\beta', '\\gamma', '\\delta', '\\epsilon', '\\theta', '\\pi', '\\lambda', '\\mu', '\\sigma', '\\omega', '\\infty', '\\forall', '\\exists', '\\in', '\\notin', '\\cup', '\\cap', '\\subset', '\\supset', '\\approx'] },
  { label: 'Cấu trúc', symbols: ['\\frac{a}{b}', 'a^b', 'a_b', '\\sqrt{x}', '\\sqrt[n]{x}', '\\int_{a}^{b}', '\\sum_{i=1}^{n}', '\\lim_{x\\to\\infty}', '\\vec{a}', '\\log_{a}(b)'] }
];

// Khai báo MathJax trên window để TypeScript không báo lỗi
declare global {
  interface Window {
    MathJax: any;
  }
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [mindmapUpdates, setMindmapUpdates] = useState<MindmapInsightPayload[]>([]);
  const [geogebraSuggestion, setGeogebraSuggestion] = useState<GeogebraSuggestion | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false); 

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([{ 
      text: "Xin chào! Hãy đặt câu hỏi toán học để bắt đầu. Tôi hỗ trợ công thức LaTeX!\n\nVí dụ: Giải phương trình $x^2 - 5x + 6 = 0$", 
      isUser: false 
    }]);
  }, []);
  
  // BƯỚC 2: THÊM useEffect NÀY
  useEffect(() => {
    // Gọi MathJax để typeset lại mỗi khi messages thay đổi
    if (typeof window.MathJax !== 'undefined') {
      try {
        window.MathJax.typesetPromise();
      } catch (e) {
        console.error("Error calling MathJax.typesetPromise():", e);
      }
    }
  }, [messages, isModalOpen]); // Thêm isModalOpen để typeset cả popover

  const handleSend = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() && attachedFiles.length === 0) return;

    const normalizedInput = input.trim();
    const userVisibleText = normalizedInput || '📎 Đã gửi file đính kèm để AI phân tích';
    const userMessage: Message = { text: userVisibleText, isUser: true, files: attachedFiles };

    const historyPayload = messages
      .filter(message => message.text.trim())
      .map(message => ({
        role: message.isUser ? 'user' : 'assistant',
        content: message.text
      }));

    setIsLoading(true);
    setMessages(prev => [...prev, userMessage]);

    const currentFiles = attachedFiles;
    const apiMessage = normalizedInput || 'Học sinh vừa gửi tài liệu/hình ảnh. Hãy hỏi lại để hiểu đề rồi hướng dẫn các bước giải.';
    setInput('');
    setAttachedFiles([]);

    try {
      const media = currentFiles.map(file => ({ url: file.content }));

      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: apiMessage, media, history: historyPayload }),
      });

      if (!response.ok) {
        let errorText = 'Đã có lỗi xảy ra. Vui lòng thử lại.';
        try {
          const errorResult = await response.json();
          errorText = errorResult.detail || errorResult.error || errorText;
        } catch (err) {
          console.error('Failed to parse error response JSON', err);
          errorText = response.statusText;
        }
        throw new Error(errorText);
      }

      const result: ChatApiResponse = await response.json();
      const assistantMessage: Message = {
        text: result.reply || 'Mình đang gặp sự cố khi phản hồi. Bạn thử hỏi lại giúp mình nhé!',
        isUser: false
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (Array.isArray(result.mindmap_insights) && result.mindmap_insights.length > 0) {
        const normalized: MindmapInsightPayload[] = result.mindmap_insights
          .filter((node): node is ApiMindmapInsight => Boolean(node && node.node_id && node.label))
          .map(node => ({
            nodeId: node.node_id,
            parentNodeId: node.parent_node_id ?? null,
            label: node.label,
            type: node.type,
            weaknessSummary: node.weakness_summary,
            actionSteps: node.action_steps,
            color: node.color,
          }));
        if (normalized.length > 0) {
          setMindmapUpdates(normalized);
          upsertMindmapInsights(normalized);
        }
      } else {
        setMindmapUpdates([]);
      }

      const geoBlock = result.geogebra;
      if (geoBlock?.should_draw && geoBlock.commands && geoBlock.commands.length > 0) {
        setGeogebraSuggestion({
          prompt: geoBlock.prompt || apiMessage,
          reason: geoBlock.reason || 'AI khuyên bạn dựng hình/đồ thị để trực quan hóa bài toán.',
          commands: geoBlock.commands,
          consumed: false,
        });
      } else {
        setGeogebraSuggestion(null);
      }
    } catch (error: any) {
      console.error('Error fetching chat response:', error);
      setMessages(prev => [...prev, { text: `Đã có lỗi xảy ra: ${error.message || 'Không xác định'}`, isUser: false }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const filePromises = Array.from(files).map(file => {
      return new Promise<AttachedFile>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            name: file.name,
            type: file.type,
            content: e.target?.result as string,
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    Promise.all(filePromises).then(newFiles => {
      setAttachedFiles(prev => [...prev, ...newFiles]);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Auto-scroll to bottom using sentinel endRef
  useEffect(() => {
    if (!scrollAreaRef.current) return;
    
    const scrollContainer = scrollAreaRef.current;
    
    const t = window.setTimeout(() => {
      try {
        scrollContainer.scrollTo({ top: scrollContainer.scrollHeight, behavior: 'smooth' });
      } catch {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }, 50);

    return () => clearTimeout(t);
  }, [messages]);

  // Adjust padding bottom of scroll area based on input container height
  useEffect(() => {
    const adjustPadding = () => {
      if (inputContainerRef.current && scrollAreaRef.current) {
        const height = inputContainerRef.current.clientHeight;
        scrollAreaRef.current.style.paddingBottom = `${height}px`;
      }
    };

    // Call once immediately on mount
    adjustPadding();
    
    // Add window resize listener
    window.addEventListener('resize', adjustPadding);

    // Observe the input container itself for height changes
    // (from adding files or textarea resize)
    const observer = new ResizeObserver(adjustPadding);
    const inputContainer = inputContainerRef.current;
    if (inputContainer) {
      observer.observe(inputContainer);
    }

    return () => {
      window.removeEventListener('resize', adjustPadding);
      if (inputContainer) {
        observer.unobserve(inputContainer);
      }
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const insertLatex = (symbol: string) => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const text = textareaRef.current.value;
      
      let cursorPosition = start + symbol.length;
      if (symbol.includes('{')) {
        cursorPosition = start + symbol.indexOf('{') + 1;
      } else {
        symbol += ' ';
        cursorPosition = start + symbol.length;
      }

      const newValue = text.substring(0, start) + symbol + text.substring(end);
      
      setInput(newValue);
      
      setTimeout(() => {
        textareaRef.current?.focus();
        textareaRef.current?.setSelectionRange(cursorPosition, cursorPosition);
      }, 0);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-blue-100 relative">
      <header className="bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-5 flex items-center gap-4 shadow-lg">
        <div className="relative">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md">
            <Bot className="w-7 h-7 text-blue-500" />
          </div>
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-white truncate">📚 CVT AI - Giải Toán THPT</h1>
          <p className="text-blue-100 text-sm flex items-center gap-1">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            Đang hoạt động
          </p>
        </div>
        <Sparkles className="w-6 h-6 text-orange-200 animate-pulse" />
      </header>

       <div className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-blue-50" ref={scrollAreaRef}>
        <div className="p-6 flex flex-col gap-6">
            {messages.map((message, index) => (
              <div key={index} className={cn("flex items-start gap-3", message.isUser ? "justify-end" : "justify-start")}>
                {!message.isUser && (
                  <Avatar className="w-10 h-10 border-2 border-white shadow-md">
                    <AvatarFallback className="bg-gradient-to-br from-blue-400 to-cyan-500">
                      <Bot className="w-6 h-6 text-white" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className={cn("max-w-[75%] rounded-2xl p-4 shadow-md",
                  message.isUser ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white" : "bg-white border border-blue-100"
                )}>
                  {/* BƯỚC 1: XÓA remarkPlugins */}
                  <ReactMarkdown className="prose dark:prose-invert max-w-none text-sm leading-relaxed prose-p:my-2"
                    components={{ p: ({node, ...props}) => <p style={{margin: 0}} {...props} /> }}
                  >
                    {message.text}
                  </ReactMarkdown>

                  {message.files && message.files.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {message.files.map((file, idx) => (
                        <div key={idx} className="bg-white/30 px-3 py-1 rounded-lg text-xs flex items-center gap-2">
                          <FileIcon className="w-3 h-3" />
                          <span className="truncate max-w-[150px]">{file.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {message.isUser && (
                  <Avatar className="w-10 h-10 border-2 border-white shadow-md">
                    <AvatarFallback className='bg-gradient-to-br from-gray-600 to-gray-700'>
                      <User className="w-6 h-6 text-white" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-3">
                <Avatar className="w-10 h-10 border-2 border-white shadow-md">
                  <AvatarFallback className="bg-gradient-to-br from-blue-400 to-cyan-500">
                    <Bot className="w-6 h-6 text-white" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-white border border-blue-100 rounded-2xl px-4 py-3 shadow-md flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <span className="text-sm text-muted-foreground">AI đang phân tích toàn bộ cuộc trò chuyện...</span>
                </div>
              </div>
            )}
            {geogebraSuggestion && (
              <Card className="border-blue-200 bg-white/90 shadow-md">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Compass className="w-4 h-4 text-blue-600" /> GeoGebra đã sẵn sàng
                  </CardTitle>
                  <Badge variant="outline" className="text-xs">{geogebraSuggestion.commands.length} lệnh</Badge>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>{geogebraSuggestion.reason}</p>
                  <div className="flex flex-wrap gap-3">
                    <Button type="button" onClick={() => setIsModalOpen(true)}>
                      Mở GeoGebra
                    </Button>
                    <Button type="button" variant="ghost" className="text-muted-foreground" onClick={() => setGeogebraSuggestion(null)}>
                      Ẩn gợi ý
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            {mindmapUpdates.length > 0 && (
              <Card className="border-amber-200 bg-amber-50/70 shadow-md">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-amber-500" /> Mindmap vừa được cập nhật
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {mindmapUpdates.map((node) => (
                      <div key={node.nodeId} className="p-3 rounded-xl bg-white/80 border border-amber-100">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{node.label}</span>
                          <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">{node.type.toUpperCase()}</Badge>
                        </div>
                        {node.weaknessSummary && (
                          <p className="text-xs text-muted-foreground mt-1">{node.weaknessSummary}</p>
                        )}
                        {node.actionSteps && node.actionSteps.length > 0 && (
                          <ul className="text-xs text-blue-700 mt-2 list-disc list-inside space-y-1">
                            {node.actionSteps.map((step, index) => (
                              <li key={index}>{step}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button asChild variant="outline">
                      <Link href="/mindmap">Xem mindmap</Link>
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => setMindmapUpdates([])}>
                      Đã ghi nhớ
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            <div ref={endRef} />
           </div>
      </div>

      <div ref={inputContainerRef} className="fixed bottom-0 left-0 right-0 p-4 sm:px-6 sm:py-5 bg-white border-t border-blue-100 z-10">

        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {attachedFiles.map((file, index) => (
              <div key={index} className="bg-blue-50 px-3 py-2 rounded-lg text-sm flex items-center gap-2 border border-blue-200">
                <FileIcon className="w-4 h-4 text-blue-600" />
                <span className="text-gray-700 truncate max-w-[150px]">{file.name}</span>
                <Button variant="ghost" size="icon" className="w-5 h-5 ml-1" onClick={() => removeFile(index)}>
                  <X className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        )}
        <form onSubmit={handleSend} className="flex gap-3 items-end">
          <input 
            type="file" 
            multiple 
            accept="image/*" 
            ref={fileInputRef} 
            onChange={handleFileChange}
            className="hidden" 
          />
          <Button 
            type="button" 
            variant="default"
            className="flex-shrink-0 w-12 h-12 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-xl"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
          >
            <Paperclip className="w-5 h-5" />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                type="button" 
                variant="default"
                className="flex-shrink-0 w-12 h-12 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-xl"
                disabled={isLoading}
              >
                <Sigma className="w-5 h-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                {latexSymbols.map((group) => (
                  <div key={group.label}>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">{group.label}</h4>
                    <div className="grid grid-cols-5 gap-1">
                      {group.symbols.map((symbol) => (
                        <Button key={symbol} variant="ghost" size="sm" className="h-auto text-base" onClick={() => insertLatex(symbol)}>
                           {/* BƯỚC 1: XÓA remarkPlugins */}
                          <ReactMarkdown>{`$${symbol}$`}</ReactMarkdown>
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <div className="flex-1 relative min-w-0">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Nhập câu hỏi của bạn..."
              rows={1}
              className="w-full px-5 py-3 pr-12 bg-blue-50 border-2 border-blue-200 rounded-2xl focus:border-blue-400 focus:bg-white resize-none transition-all"
              style={{ minHeight: '50px', maxHeight: '150px' }}
              disabled={isLoading}
            />
          </div>
          <Button 
            type="submit" 
            className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
            disabled={isLoading || (!input.trim() && attachedFiles.length === 0)}
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>
        <p className="text-xs text-gray-400 mt-3 text-center">
          Nhấn Enter để gửi • Shift + Enter để xuống dòng
        </p>
      </div>

      <Button onClick={() => setIsModalOpen(true)} size="lg" className="h-auto fixed bottom-28 right-6 w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-full shadow-lg hover:shadow-2xl transition-all duration-300 flex items-center justify-center z-50 cursor-grab active:cursor-grabbing hover:scale-110">
        <Compass className="w-7 h-7" />
      </Button>

      <GeoGebraModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        autoPrompt={geogebraSuggestion?.prompt}
        autoCommands={!geogebraSuggestion?.consumed ? geogebraSuggestion?.commands : undefined}
        onConsumeAutoCommands={() => setGeogebraSuggestion(prev => prev ? { ...prev, consumed: true } : prev)}
      />

    </div>
  );
}