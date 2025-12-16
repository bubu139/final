'use client';
import { useState, useRef, useEffect, FormEvent } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge'; // Bỏ nếu không dùng để nhẹ file
import { Paperclip, Send, Bot, User, Sparkles, X, File as FileIcon, Compass, Sigma, Share2, Camera, Plus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { MathInput } from '@/components/ui/math-input';
import { MathfieldElement } from 'mathlive';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { API_BASE_URL } from '@/lib/utils';
import { GeoGebraModal } from '@/components/chat/GeoGebraModal';
import Link from 'next/link';
import { MindmapInsightPayload, upsertMindmapInsights } from '@/lib/mindmap-storage';
import { CameraCaptureDialog } from '@/components/chat/CameraCaptureDialog';
import { useIsMobile } from '@/hooks/use-mobile'; //

// ... (GIỮ NGUYÊN CÁC TYPE VÀ INTERFACE: Message, AttachedFile, ChatApiResponse...)
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

const updateNodeScore = async (nodeId: string, score: number) => {
  try {
    const res = await fetch(`${API_BASE_URL}/updateScore`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nodeId, score }),
    });
    if (!res.ok) {
        // const err = await res.json();
        // console.error("Update score lỗi:", err);
    }
  } catch (error) {
    console.error("Lỗi khi gọi updateScore:", error);
  }
};

// ... (GIỮ NGUYÊN CONST SMART_TOOLS VÀ latexSymbols)
const latexSymbols = [
    {
      label: "Mẫu công thức",
      symbols: [
        { display: "x²", insert: "x^2" },
        { display: "aⁿ", insert: "#?^{#?}" },
        { display: "√",  insert: "\\sqrt{#?}" },
        { display: "√n", insert: "\\sqrt[#?]{#?}" },
        { display: "÷",  insert: "\\frac{#?}{#?}" },
        { display: "∫",  insert: "\\int_{#?}^{#?}" },
        { display: "Σ",  insert: "\\sum_{#?}^{#?}" },
        { display: "( )", insert: "\\left(#?\\right)" },
      ]
    },
    {
      label: "Toán tử",
      symbols: [
        { display: "＋", insert: "+" },
        { display: "−", insert: "-" },
        { display: "×", insert: "\\times" },
        { display: "÷", insert: "\\div" },
        { display: "=", insert: "=" },
        { display: "≠", insert: "\\neq" },
        { display: "≤", insert: "\\le" },
        { display: "≥", insert: "\\ge" },
        { display: "±", insert: "\\pm" }
      ]
    },
    {
      label: "Ký hiệu",
      symbols: [
        { display: "α", insert: "\\alpha" },
        { display: "β", insert: "\\beta" },
        { display: "π", insert: "\\pi" },
        { display: "θ", insert: "\\theta" },
        { display: "∞", insert: "\\infty" },
        { display: "∈", insert: "\\in" },
        { display: "∀", insert: "\\forall" },
        { display: "∃", insert: "\\exists" },
        { display: "∪", insert: "\\cup" },
        { display: "∩", insert: "\\cap" },
      ]
    }
  ];

export default function ChatPage() {
  const isMobile = useIsMobile(); // Sử dụng hook để check mobile
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState(''); 
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [mindmapUpdates, setMindmapUpdates] = useState<MindmapInsightPayload[]>([]);
  const [geogebraSuggestion, setGeogebraSuggestion] = useState<GeogebraSuggestion | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  // State mở rộng toolbar trên mobile (nếu cần ẩn bớt nút)
  const [isMobileToolsOpen, setIsMobileToolsOpen] = useState(false);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const mathFieldRef = useRef<MathfieldElement>(null); 

  useEffect(() => {
    setMessages([{
      text: "Xin chào! Hãy đặt câu hỏi toán học để bắt đầu. \n\nVí dụ: Giải phương trình $x^2 - 5x + 6 = 0$",
      isUser: false
    }]);
  }, []);

  const handleInsertSymbol = (latex: string) => {
    const mf = mathFieldRef.current;
    if (mf) {
      mf.executeCommand(['insert', latex, { 
        focus: true, 
        feedback: true,
        mode: 'math'
      }]);
    }
  };

  const handleSend = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() && attachedFiles.length === 0) return;

    // Đóng tools trên mobile khi gửi
    setIsMobileToolsOpen(false);

    const normalizedInput = input.trim();
    const userVisibleText = normalizedInput || '📎 Đã gửi file đính kèm';
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
    const apiMessage = normalizedInput || 'Tôi vừa gửi ảnh bài tập. Hãy nhận diện và hướng dẫn giải chi tiết.';

    setInput('');
    setAttachedFiles([]);
    if (mathFieldRef.current) {
      mathFieldRef.current.value = "";
    }

    try {
      const media = currentFiles.map(file => ({ url: file.content }));

      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: apiMessage, media, history: historyPayload }),
      });

      if (!response.ok) {
        let errorText = 'Đã có lỗi xảy ra.';
        try {
          const errJson = await response.json();
          errorText = errJson.detail || errJson.error || errorText;
        } catch {}
        throw new Error(errorText);
      }

      const result: ChatApiResponse = await response.json();
      const assistantMessage: Message = {
        text: result.reply || 'Lỗi phản hồi.',
        isUser: false
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (Array.isArray(result.mindmap_insights) && result.mindmap_insights.length > 0) {
        const normalized: MindmapInsightPayload[] = result.mindmap_insights
          .filter((node): node is ApiMindmapInsight => Boolean(node && node.node_id && node.label))
          .map((node) => ({
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
          try {
            await upsertMindmapInsights(normalized);
          } catch (err) {
            console.error('Lỗi lưu mindmap:', err);
          }
          normalized.forEach((node) => {
            updateNodeScore(node.nodeId, 100);
          });
        }
      } else {
        setMindmapUpdates([]);
      }

      const geoBlock = result.geogebra;
      if (geoBlock?.should_draw && geoBlock.commands && geoBlock.commands.length > 0) {
        setGeogebraSuggestion({
          prompt: geoBlock.prompt || apiMessage,
          reason: geoBlock.reason || 'Vẽ hình để trực quan hơn.',
          commands: geoBlock.commands,
          consumed: false,
        });
      } else {
        setGeogebraSuggestion(null);
      }
    } catch (error: any) {
      console.error('Lỗi Chat:', error);
      setMessages(prev => [...prev, { text: `Lỗi: ${error.message}`, isUser: false }]);
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
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCameraCapture = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const newFile: AttachedFile = {
        name: `camera_capture.jpg`,
        type: file.type,
        content: e.target?.result as string,
      };
      setAttachedFiles(prev => [...prev, newFile]);
    };
    reader.readAsDataURL(file);
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (!scrollAreaRef.current) return;
    const scrollContainer = scrollAreaRef.current;
    const t = window.setTimeout(() => {
      scrollContainer.scrollTo({ top: scrollContainer.scrollHeight, behavior: 'smooth' });
    }, 100);
    return () => clearTimeout(t);
  }, [messages, mindmapUpdates, attachedFiles]); // Thêm attachedFiles để scroll khi thêm file

  useEffect(() => {
    const adjustPadding = () => {
      if (inputContainerRef.current && scrollAreaRef.current) {
        const height = inputContainerRef.current.clientHeight;
        // Tăng thêm padding trên mobile để tránh bị sát quá
        scrollAreaRef.current.style.paddingBottom = `${height + (isMobile ? 10 : 20)}px`;
      }
    };
    adjustPadding();
    window.addEventListener('resize', adjustPadding);
    const observer = new ResizeObserver(adjustPadding);
    if (inputContainerRef.current) observer.observe(inputContainerRef.current);
    return () => {
      window.removeEventListener('resize', adjustPadding);
      observer.disconnect();
    };
  }, [isMobile]);

  return (
    // THAY ĐỔI: Sử dụng h-[100dvh] cho mobile, bo góc chỉ trên md
    <div className="flex flex-col h-[100dvh] md:h-full bg-white md:rounded-3xl shadow-none md:shadow-2xl overflow-hidden border-0 md:border border-blue-100 relative">
      
      {/* HEADER: Padding nhỏ hơn trên mobile */}
      <header className="bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-3 md:px-6 md:py-5 flex items-center gap-3 md:gap-4 shadow-lg shrink-0">
        <div className="relative">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-full flex items-center justify-center shadow-md">
            <Bot className="w-6 h-6 md:w-7 md:h-7 text-blue-500" />
          </div>
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 md:w-3 md:h-3 bg-green-400 rounded-full border-2 border-white"></div>
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg md:text-xl font-bold text-white truncate">CVT AI - Giải Toán</h1>
          <p className="text-blue-100 text-xs md:text-sm flex items-center gap-1">
            <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-400 rounded-full animate-pulse"></span>
            Đang hoạt động
          </p>
        </div>
        <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-orange-200 animate-pulse" />
      </header>

      {/* MESSAGE LIST: Padding nhỏ hơn */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-blue-50 scroll-smooth" ref={scrollAreaRef}>
        <div className="p-3 md:p-6 flex flex-col gap-4 md:gap-6">
          {messages.map((message, index) => (
            <div key={index} className={cn("flex items-end md:items-start gap-2 md:gap-3", message.isUser ? "justify-end" : "justify-start")}>
              {!message.isUser && (
                <Avatar className="w-8 h-8 md:w-10 md:h-10 border-2 border-white shadow-md mb-1 md:mb-0">
                  <AvatarFallback className="bg-gradient-to-br from-blue-400 to-cyan-500">
                    <Bot className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </AvatarFallback>
                </Avatar>
              )}

              <div
                className={cn(
                  "p-3 md:p-4 rounded-2xl max-w-[85%] md:max-w-[85%] shadow-sm relative group text-sm md:text-base",
                  message.isUser
                    ? "bg-gradient-to-br from-blue-500 to-cyan-600 text-white rounded-tr-none"
                    : "bg-white border border-gray-100 text-gray-800 rounded-tl-none"
                )}
              >
                <div className={cn("prose prose-sm max-w-none break-words dark:prose-invert", message.isUser ? "text-white prose-headings:text-white prose-p:text-white prose-strong:text-white" : "")}>
                  <ReactMarkdown
                    components={{
                      code: ({ node, className, children, ...props }: any) => {
                        return <code className={cn(className, "bg-black/10 px-1 py-0.5 rounded")} {...props}>{children}</code>;
                      }
                    }}
                  >
                    {message.text}
                  </ReactMarkdown>
                </div>
                
                {message.files && message.files.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {message.files.map((file, i) => (
                      <div key={i} className="bg-white/10 p-1.5 rounded-md flex items-center gap-2 text-xs border border-white/20">
                        <FileIcon className="w-3 h-3" />
                        <span className="truncate max-w-[80px] md:max-w-[100px]">{file.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {message.isUser && (
                <Avatar className="w-8 h-8 md:w-10 md:h-10 border-2 border-white shadow-md mb-1 md:mb-0">
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500">
                    <User className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}

          {/* LOADING INDICATOR */}
          {isLoading && (
            <div className="flex items-end gap-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback><Bot className="w-5 h-5" /></AvatarFallback>
              </Avatar>
              <div className="bg-white border border-blue-100 rounded-2xl px-3 py-2 shadow-md flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-100"></div>
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          )}
          
          {geogebraSuggestion && (
            <Card className="border-blue-200 bg-white/90 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between py-2 md:py-3 px-3 md:px-4">
                <CardTitle className="text-xs md:text-sm flex items-center gap-2">
                  <Compass className="w-4 h-4 text-blue-600" /> Gợi ý đồ thị
                </CardTitle>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setIsModalOpen(true)}>Mở ngay</Button>
              </CardHeader>
            </Card>
          )}

          <div ref={endRef} />
        </div>
      </div>

      {/* INPUT AREA: Tối ưu cho mobile */}
      <div ref={inputContainerRef} className="fixed md:absolute bottom-0 left-0 right-0 p-2 md:p-4 bg-white border-t border-blue-100 z-10 shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
        
        {/* FILES PREVIEW */}
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2 max-h-20 overflow-y-auto">
            {attachedFiles.map((file, index) => (
              <div key={index} className="bg-blue-50 px-2 py-1 rounded-md text-xs flex items-center gap-1 border border-blue-200 max-w-[150px]">
                <FileIcon className="w-3 h-3 text-blue-600 shrink-0" />
                <span className="truncate flex-1">{file.name}</span>
                <button onClick={() => removeFile(index)} className="p-1"><X className="w-3 h-3 text-red-500" /></button>
              </div>
            ))}
          </div>
        )}

        {/* MAIN INPUT ROW */}
        <div className="flex gap-1.5 md:gap-2 items-end">
          <input
            type="file" multiple accept="image/*"
            ref={fileInputRef} onChange={handleFileChange} className="hidden"
          />

          {/* GROUP BUTTONS ON MOBILE */}
          <div className={cn("flex gap-1.5 md:gap-2", isMobile ? (isMobileToolsOpen ? "flex" : "hidden") : "flex")}>
             <Button
                type="button" variant="ghost"
                className="flex-shrink-0 w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 p-0"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                title="Đính kèm file"
              >
                <Paperclip className="w-4 h-4 md:w-5 md:h-5" />
              </Button>

              {/* SIGMA POPOVER */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button type="button" variant="ghost" className="flex-shrink-0 w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 p-0">
                    <Sigma className="w-4 h-4 md:w-5 md:h-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[90vw] md:w-80 p-3 md:p-4 mb-2" align="start">
                  <div className="space-y-4 max-h-[40vh] overflow-y-auto">
                    {latexSymbols.map((group) => (
                      <div key={group.label}>
                        <h4 className="font-medium text-xs text-muted-foreground mb-1 uppercase">{group.label}</h4>
                        <div className="grid grid-cols-5 gap-1">
                          {group.symbols.map((symbol) => (
                            <Button
                              key={symbol.display} variant="ghost" size="sm"
                              className="h-8 text-base font-serif"
                              onClick={() => handleInsertSymbol(symbol.insert)} 
                            >
                              {symbol.display}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
          </div>

          {/* Nút Toggle Menu trên Mobile (Thay thế cho các nút bị ẩn) */}
          {isMobile && !isMobileToolsOpen && (
             <Button
             type="button" variant="ghost"
             className="flex-shrink-0 w-9 h-9 rounded-xl bg-gray-50 text-gray-600 p-0"
             onClick={() => setIsMobileToolsOpen(true)}
           >
             <Plus className="w-5 h-5" />
           </Button>
          )}

           {/* Camera luôn hiển thị vì quan trọng */}
           <Button
            type="button" variant="ghost"
            className="flex-shrink-0 w-9 h-9 md:w-10 md:h-10 rounded-xl bg-blue-50 text-blue-600 p-0 hover:bg-blue-100"
            onClick={() => setIsCameraOpen(true)}
            disabled={isLoading}
            title="Chụp ảnh bài tập"
          >
            <Camera className="w-5 h-5 md:w-5 md:h-5" />
          </Button>

          {/* MATH INPUT */}
          <div className="flex-1 min-w-0 bg-blue-50/50 rounded-xl md:rounded-2xl border border-blue-200 focus-within:border-blue-400 focus-within:bg-white transition-all">
            <MathInput
              ref={mathFieldRef}
              value={input}
              onChange={setInput}
              onEnter={handleSend}
              placeholder={isMobile ? "Nhập câu hỏi..." : "Nhập câu hỏi hoặc chụp ảnh..."}
              className="w-full text-sm md:text-base px-2 py-1 md:px-3 md:py-2"
            />
          </div>

          {/* SEND BUTTON */}
          <Button
            type="button"
            onClick={() => handleSend()}
            className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl shadow-md p-0"
            disabled={isLoading || (!input.trim() && attachedFiles.length === 0)}
          >
            <Send className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
        </div>
        
        {/* Hint chỉ hiện trên PC để tiết kiệm chỗ */}
        <p className="hidden md:block text-[10px] text-gray-400 mt-2 text-center">
          Shift + Enter xuống dòng • Hỗ trợ LaTeX
        </p>
      </div>

      {/* FLOATING BUTTON GEOGEBRA: Dời vị trí cao hơn để tránh bàn phím */}
      <Button 
        onClick={() => setIsModalOpen(true)} 
        size="lg" 
        className="fixed bottom-20 md:bottom-32 right-4 md:right-6 w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-full shadow-lg z-30 hover:scale-110 transition-transform p-0"
      >
        <Compass className="w-5 h-5 md:w-6 md:h-6" />
      </Button>

      <GeoGebraModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        autoPrompt={geogebraSuggestion?.prompt}
        autoCommands={!geogebraSuggestion?.consumed ? geogebraSuggestion?.commands : undefined}
        onConsumeAutoCommands={() => setGeogebraSuggestion(prev => prev ? { ...prev, consumed: true } : prev)}
      />

      <CameraCaptureDialog 
        open={isCameraOpen} 
        onOpenChange={setIsCameraOpen}
        onCapture={handleCameraCapture}
      />
    </div>
  );
}