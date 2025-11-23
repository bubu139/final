'use client';

import { useState, useRef, useEffect, FormEvent, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Compass, Sparkles, Loader, Code, RefreshCw, Send } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle as CardTitleComponent } from '@/components/ui/card';
import { useSidebar } from '@/components/ui/sidebar';

// Khai báo GGBApplet trên window
declare global {
  interface Window {
    GGBApplet: any;
  }
}

const API_KEY = 'AIzaSyAt0EJWAJSp55AbEYaQpR86dqmX99byTjI';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

const SYSTEM_PROMPT = `Bạn là trợ lý thông minh chuyên vẽ hình học với GeoGebra.

NHIỆM VỤ: 
1. Phân tích yêu cầu người dùng
2. Suy nghĩ cách vẽ hợp lý (xác định các điểm, đường, hình cần thiết)
3. Chuyển đổi sang lệnh GeoGebra chính xác

QUY TRÌNH LÀM VIỆC:
Bước 1 - SUY NGHĨ (trong <thinking>):
- Phân tích yêu cầu: Cần vẽ gì?
- Xác định các thành phần: Điểm nào? Đường nào? Hình nào?
- Lên kế hoạch: Vẽ theo thứ tự nào? Cần tính toán gì?
- Chọn tọa độ/giá trị hợp lý để hình đẹp, cân đối

Bước 2 - XUẤT LỆNH:
- Chỉ trả về lệnh GeoGebra thuần túy
- Mỗi lệnh một dòng
- Không có chú thích hay giải thích

CÚ PHÁP GEOGEBRA:
# Cơ bản
- Điểm: A = (1, 2)
- Đường thẳng qua 2 điểm: Line(A, B)
- Đoạn thẳng: Segment(A, B)
- Đường tròn: Circle((0,0), 3) hoặc Circle(A, B)

# Đa giác
- Tam giác: Polygon(A, B, C)
- Tứ giác: Polygon(A, B, C, D)

# Hàm số
- Parabol: f: y = x^2 - 4x + 3
- Lượng giác: g: y = sin(x)

CHỈ TRẢ VỀ: <thinking>...</thinking> sau đó là các lệnh GeoGebra thuần túy.`;

interface GeoGebraModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  autoPrompt?: string | null;
  autoCommands?: string[];
  onConsumeAutoCommands?: () => void;
}

export function GeoGebraModal({ isOpen, onOpenChange, autoPrompt, autoCommands, onConsumeAutoCommands }: GeoGebraModalProps) {
  const [geogebraPrompt, setGeogebraPrompt] = useState('');
  const [isGeogebraLoading, setIsGeogebraLoading] = useState(false);
  const ggbAppletRef = useRef<any>(null);
  const [isGgbScriptLoaded, setIsGgbScriptLoaded] = useState(false);
  const [isGgbReady, setIsGgbReady] = useState(false);
  const [geogebraError, setGeogebraError] = useState<string | null>(null);
  const [resultCommands, setResultCommands] = useState<string | null>(null);
  const lastAutoCommandsRef = useRef<string>('');
  
  const [ggbNode, setGgbNode] = useState<HTMLDivElement | null>(null);
  const ggbContainerRef = useCallback((node: HTMLDivElement) => {
    if (node !== null) {
      setGgbNode(node);
    }
  }, []); 

  const { state: sidebarState } = useSidebar();
  // const hasInitializedRef = useRef(false); // <-- ✅ ĐÃ XÓA
  
  // ✅ THÊM state để retry
  const [retryCount, setRetryCount] = useState(0);


  useEffect(() => {
    if (autoPrompt) {
      setGeogebraPrompt(autoPrompt);
    }
  }, [autoPrompt]);

  // Load GeoGebra script
  useEffect(() => {
    const scriptSrc = 'https://www.geogebra.org/apps/deployggb.js';

    if (typeof window !== 'undefined' && typeof window.GGBApplet !== 'undefined') {
      console.log('✅ GeoGebra script already loaded');
      setIsGgbScriptLoaded(true);
      return;
    }

    const handleScriptLoad = () => {
      console.log('✅ GeoGebra script loaded successfully');
      setIsGgbScriptLoaded(true);
    };

    const handleScriptError = (event: string | Event) => {
      console.error('❌ Failed to load GeoGebra script:', event);
      setGeogebraError("Không thể tải thư viện GeoGebra. Vui lòng kiểm tra kết nối mạng.");
    };
    
    let script = document.querySelector(`script[src="${scriptSrc}"]`) as HTMLScriptElement;

    if (!script) {
      console.log('📥 Loading GeoGebra script...');
      script = document.createElement('script');
      script.src = scriptSrc;
      script.async = true;
      script.onload = handleScriptLoad;
      script.onerror = handleScriptError;
      document.body.appendChild(script);
    } else if (typeof window.GGBApplet !== 'undefined') {
      handleScriptLoad();
    } else {
      script.onload = handleScriptLoad;
      script.onerror = handleScriptError;
    }
  }, []);

  // ✅ CẬP NHẬT: Khởi tạo VÀ Dọn dẹp GeoGebra
  useEffect(() => {
    // Chỉ chạy khi script đã tải và div container đã sẵn sàng
    if (!isGgbScriptLoaded || !ggbNode) {
      return;
    }

    // `isOpen` không cần check, vì `ggbNode` sẽ là null khi `isOpen` là false
    
    console.log('🚀 Initializing GeoGebra (run)...');
    setIsGgbReady(false); 
    setGeogebraError(null);

    try {
      const isMobile = window.innerWidth < 640;
      const width = ggbNode.clientWidth;
      const height = ggbNode.clientHeight;

      console.log(`📐 Initial size: ${width}x${height}`);

      const parameters = {
        appName: "classic",
        width: width,
        height: height,
        showToolBar: !isMobile,
        showAlgebraInput: true,
        showMenuBar: !isMobile,
        enableShiftDragZoom: true,
        showResetIcon: true,
        language: "vi",
        appletOnLoad: (api: any) => {
          console.log('✅ GeoGebra applet loaded and ready!');
          ggbAppletRef.current = api;
          setIsGgbReady(true); 
        },
        errorHandler: (err: any) => {
          console.error('❌ GeoGebra error:', err);
          setGeogebraError("Lỗi khởi tạo GeoGebra. Vui lòng thử lại.");
          setIsGgbReady(false);
        }
      };

      console.log('🎨 Creating GeoGebra applet in modal container...');
      const applet = new window.GGBApplet(parameters, true);
      
      applet.inject(ggbNode);

      // ✅ QUAN TRỌNG: Hàm dọn dẹp
      // Sẽ chạy khi component unmount (modal đóng)
      return () => {
        console.log('🧹 Cleaning up GeoGebra applet...');
        if (ggbAppletRef.current) {
          try {
            // Dùng hàm remove() của chính GeoGebra
            ggbAppletRef.current.remove(); 
          } catch (e) {
            console.warn("Error removing GGB applet: ", e);
          }
        }
        ggbAppletRef.current = null;
        setIsGgbReady(false);
        // React sẽ tự động dọn dẹp ggbNode.innerHTML
      }

    } catch (error) {
      console.error('❌ Error creating applet:', error);
      setGeogebraError("Lỗi khởi tạo GeoGebra. Vui lòng tải lại trang.");
      setIsGgbReady(false);
    }
  }, [isGgbScriptLoaded, ggbNode, retryCount]); // ✅ Thêm retryCount vào dependencies


  // Handle resize
  useEffect(() => {
    if (!isGgbReady || !ggbNode || !ggbAppletRef.current || !isOpen) {
      return;
    }

    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (ggbAppletRef.current && ggbNode && isOpen) {
          const width = ggbNode.clientWidth;
          const height = ggbNode.clientHeight;
          if (width > 0 && height > 0) {
            try {
              ggbAppletRef.current.setSize(width, height);
              console.log(`📐 Resized to ${width}x${height}`);
            } catch (err) {
              console.warn('⚠️ Failed to resize:', err);
            }
          }
        }
      }, 300);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(ggbNode);
    
    handleResize();

    return () => {
      clearTimeout(resizeTimeout);
      resizeObserver.disconnect();
    };
  }, [isGgbReady, sidebarState, isOpen, ggbNode]);

  // Handle Submit
  const handleGeogebraSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!geogebraPrompt.trim() || !isGgbReady) return;

    setIsGeogebraLoading(true);
    setGeogebraError(null);
    setResultCommands(null);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: SYSTEM_PROMPT }]
          },
          contents: [{
            role: "user",
            parts: [{ text: geogebraPrompt }]
          }]
        }),
      });

      if (!response.ok) {
        let errorText = 'API request failed';
        try {
          const err = await response.json();
          errorText = err.error?.message || err.detail || response.statusText;
        } catch (e) {
          errorText = response.statusText;
        }
        throw new Error(errorText);
      }
      
      const data = await response.json();

      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Định dạng phản hồi từ AI không hợp lệ.');
      }
      
      const aiResponseText = data.candidates[0].content.parts[0].text.trim();

      const commandLines = aiResponseText
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => 
          line.length > 0 && 
          !line.startsWith('<thinking>') && 
          !line.startsWith('</thinking>')
        );
      
      if (commandLines.length === 0) {
        throw new Error('AI không trả về lệnh nào hợp lệ.');
      }

      setResultCommands(commandLines.join('\n'));
      
      for (const command of commandLines) {
        try {
          if (ggbAppletRef.current) {
            ggbAppletRef.current.evalCommand(command);
          }
        } catch (cmdError) {
          console.error('❌ Error executing command:', command, cmdError);
        }
      }
    } catch (error: any) {
      console.error('❌ Error in handleGeogebraSubmit:', error);
      setGeogebraError(error.message || "Không thể xử lý yêu cầu. Vui lòng thử lại.");
    } finally {
      setIsGeogebraLoading(false);
    }
  };

  // Handle Clear
  const handleGeogebraClear = () => {
    if (ggbAppletRef.current) {
      try {
        ggbAppletRef.current.reset();
      } catch (error) {
        console.error('❌ Error resetting:', error);
      }
    }
    setGeogebraPrompt('');
    setGeogebraError(null);
    setResultCommands(null);
    lastAutoCommandsRef.current = '';
  };
  
  // ✅ CẬP NHẬT: Handle Retry
  const handleRetryLoad = () => {
    console.log('🔄 Retrying GeoGebra load...');
    setGeogebraError(null);
    ggbAppletRef.current = null;
    setIsGgbReady(false); 
    
    if (ggbNode) {
      ggbNode.innerHTML = ''; // Xóa applet cũ bị lỗi
    }
    
    // Tăng state `retryCount` để ép useEffect khởi tạo chạy lại
    setRetryCount(c => c + 1);
  };

  // ✅ Sửa logic loading: Chỉ show loading khi MỞ
  const showLoading = isOpen && (!isGgbScriptLoaded || !isGgbReady) && !geogebraError;

  useEffect(() => {
    if (!isOpen || !isGgbReady) return;
    if (!autoCommands || autoCommands.length === 0) return;
    const serialized = autoCommands.join('\n');
    if (lastAutoCommandsRef.current === serialized) return;
    try {
      autoCommands.forEach((command) => {
        if (ggbAppletRef.current) {
          ggbAppletRef.current.evalCommand(command);
        }
      });
      setResultCommands(serialized);
      lastAutoCommandsRef.current = serialized;
      onConsumeAutoCommands?.();
    } catch (error) {
      console.error('❌ Không thể chạy lệnh GeoGebra tự động', error);
    }
  }, [autoCommands, isGgbReady, isOpen, onConsumeAutoCommands]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[95vh] flex flex-col p-0 gap-0 border-2 border-blue-200">
        <DialogHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-4 flex flex-row items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0">
              <Compass className="text-blue-500 w-6 h-6" />
            </div>
            <DialogTitle className="text-xl font-bold text-white truncate">GeoGebra AI</DialogTitle>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onOpenChange(false)} 
            className="text-white hover:text-blue-100"
          >
            <X />
          </Button>
        </DialogHeader>

        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
          <div className="w-full sm:w-96 bg-gradient-to-b from-blue-50 to-white border-b sm:border-b-0 sm:border-r border-blue-200 flex flex-col">
            {/* ... (Phần code thanh bên trái không đổi) ... */}
            <div className="px-4 py-3 border-b border-blue-200 bg-white">
              <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <Sparkles className="text-blue-500 w-5 h-5" />
                Vẽ hình tự động
              </h3>
            </div>
            <ScrollArea className="flex-1">
              <form onSubmit={handleGeogebraSubmit} className="p-4 space-y-4">
                <Card className="bg-blue-50 border border-blue-100">
                  <CardHeader className='p-3 pb-2'>
                    <CardTitleComponent className="text-sm text-blue-800">💡 Ví dụ:</CardTitleComponent>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 text-sm text-gray-700">
                    <ul className="space-y-1 list-disc list-inside">
                      <li>Vẽ đường tròn tâm O bán kính 3</li>
                      <li>Vẽ parabol y = x² - 4x + 3</li>
                      <li>Vẽ tam giác ABC với A(1,2), B(3,4), C(5,1)</li>
                    </ul>
                  </CardContent>
                </Card>
                <div>
                  <label htmlFor='ggb-ai-input' className="block text-sm font-medium text-gray-700 mb-2">
                    Nhập yêu cầu vẽ hình:
                  </label>
                  <Textarea
                    id="ggb-ai-input"
                    value={geogebraPrompt}
                    onChange={(e) => setGeogebraPrompt(e.target.value)}
                    placeholder="VD: Vẽ đồ thị hàm số y = x² - 2x + 1"
                    className="h-32 text-sm border-2 border-blue-200 rounded-lg focus:border-blue-400"
                    disabled={isGeogebraLoading || !isGgbReady}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isGeogebraLoading || !geogebraPrompt.trim() || !isGgbReady}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold py-3 rounded-lg"
                >
                  {isGeogebraLoading ? (
                    <><Loader className="animate-spin mr-2" />Đang xử lý...</>
                  ) : (
                    <><Send className="mr-2" />Vẽ hình</>
                  )}
                </Button>
                {geogebraError && !showLoading && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                    {geogebraError}
                  </div>
                )}
                {resultCommands && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-green-800 mb-1 flex items-center gap-2">
                      <Code className="w-4 h-4" /> 
                      Lệnh GeoGebra:
                    </p>
                    <pre className="text-xs bg-white p-2 rounded border border-green-300 overflow-x-auto text-gray-800">
                      {resultCommands}
                    </pre>
                  </div>
                )}
              </form>
            </ScrollArea>
            <div className='p-4 border-t border-blue-200'>
              <Button
                onClick={handleGeogebraClear}
                variant="outline"
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700"
                disabled={isGeogebraLoading || !isGgbReady}
              >
                <RefreshCw className="mr-2" />
                Xóa tất cả
              </Button>
            </div>
          </div>

          {/* (Phần JSX cho phần hiển thị bên phải VẪN GIỮ NGUYÊN cấu trúc
              để tránh lỗi xung đột DOM 'removeChild' như trước)
          */}
          <div className="flex-1 p-4 bg-gradient-to-b from-white to-blue-50 overflow-hidden flex flex-col">
            <div className="w-full h-full min-h-[300px] relative rounded-xl shadow-inner overflow-hidden">
              {/* DIV 1: DÀNH RIÊNG CHO GEOGEBRA */}
              <div 
                ref={ggbContainerRef} 
                className="w-full h-full absolute inset-0 bg-white border border-blue-100"
                suppressHydrationWarning 
              />

              {/* DIV 2: OVERLAY LOADING */}
              {showLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100/50 z-10">
                  <div className='flex flex-col items-center gap-4 text-center p-4'>
                    <Loader className="animate-spin text-primary" size={48} />
                    <p className='text-muted-foreground'>Đang tải công cụ vẽ hình...</p>
                    <p className='text-xs text-muted-foreground'>
                      {!isGgbScriptLoaded ? 'Đang tải thư viện GeoGebra...' : 'Đang khởi tạo applet...'}
                    </p>
                  </div>
                </div>
              )}
              
              {/* DIV 3: OVERLAY LỖI */}
              {geogebraError && !showLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100/50 z-10">
                  <div className='flex flex-col items-center gap-4 text-center p-4'>
                    <X className="text-destructive" size={48} />
                    <p className='text-destructive-foreground font-semibold'>Lỗi tải GeoGebra</p>
                    <p className='text-muted-foreground text-sm max-w-md'>{geogebraError}</p>
                    <Button onClick={handleRetryLoad} variant="outline">
                      Thử lại
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}