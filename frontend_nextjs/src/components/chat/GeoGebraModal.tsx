'use client';

import { useState, useRef, useEffect, FormEvent, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${API_KEY}`;

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
}

export function GeoGebraModal({ isOpen, onOpenChange }: GeoGebraModalProps) {
  const [geogebraPrompt, setGeogebraPrompt] = useState('');
  const [isGeogebraLoading, setIsGeogebraLoading] = useState(false);
  const ggbAppletRef = useRef<any>(null);
  const [isGgbScriptLoaded, setIsGgbScriptLoaded] = useState(false);
  const [isGgbReady, setIsGgbReady] = useState(false);
  const [geogebraError, setGeogebraError] = useState<string | null>(null);
  const [resultCommands, setResultCommands] = useState<string | null>(null);
  const ggbContainerRef = useRef<HTMLDivElement>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(null);
  const { state: sidebarState } = useSidebar();
  
  const isInitializingRef = useRef(false);
  const hasInitializedRef = useRef(false);

  // ✅ Tạo portal container NGOÀI React tree
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Tạo container độc lập
    const container = document.createElement('div');
    container.id = 'geogebra-portal-container';
    container.style.cssText = 'position: fixed; top: -9999px; left: -9999px; width: 100%; height: 100%;';
    document.body.appendChild(container);
    
    setPortalContainer(container);
    
    return () => {
      // Cleanup khi unmount
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    };
  }, []);

  // ✅ Load GeoGebra script
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

  // ✅ Khởi tạo GeoGebra trong portal container
  const initializeGeoGebra = useCallback(() => {
    if (isInitializingRef.current || hasInitializedRef.current) {
      console.log('⏭️ Already initialized or initializing');
      return;
    }

    if (!portalContainer) {
      console.log('⏭️ Portal container not ready');
      return;
    }

    if (!isGgbScriptLoaded || typeof window.GGBApplet === 'undefined') {
      console.log('⏳ Waiting for GeoGebra script...');
      return;
    }

    console.log('🚀 Starting GeoGebra initialization (ONE TIME ONLY)...');
    isInitializingRef.current = true;
    setGeogebraError(null);

    setTimeout(() => {
      if (!portalContainer) {
        console.error('❌ Portal container lost during init');
        isInitializingRef.current = false;
        return;
      }

      try {
        const isMobile = window.innerWidth < 640;
        const width = 800;
        const height = 600;

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
            isInitializingRef.current = false;
            hasInitializedRef.current = true;
          },
          errorHandler: (err: any) => {
            console.error('❌ GeoGebra error:', err);
            setGeogebraError("Lỗi khởi tạo GeoGebra. Vui lòng thử lại.");
            isInitializingRef.current = false;
          }
        };

        console.log('🎨 Creating GeoGebra applet in portal...');
        const applet = new window.GGBApplet(parameters, true);
        applet.inject(portalContainer);

      } catch (error) {
        console.error('❌ Error creating applet:', error);
        setGeogebraError("Lỗi khởi tạo GeoGebra. Vui lòng tải lại trang.");
        isInitializingRef.current = false;
      }
    }, 100);
  }, [isGgbScriptLoaded, portalContainer]);

  // ✅ Khởi tạo khi ready
  useEffect(() => {
    if (isGgbScriptLoaded && portalContainer && !hasInitializedRef.current) {
      initializeGeoGebra();
    }
  }, [isGgbScriptLoaded, portalContainer, initializeGeoGebra]);

  // ✅ Di chuyển GeoGebra vào/ra container hiển thị (ĐÃ SỬA)
  useEffect(() => {
    if (!isGgbReady || !portalContainer) return;

    const ggbElement = portalContainer.firstElementChild as HTMLElement;
    if (!ggbElement) {
      console.warn('⚠️ GeoGebra element not found in portal');
      return;
    }

    if (isOpen) {
      // Di chuyển vào container hiển thị khi modal mở
      if (ggbContainerRef.current && ggbElement.parentElement !== ggbContainerRef.current) {
        console.log('📦 Moving GeoGebra to visible container');
        ggbContainerRef.current.appendChild(ggbElement);
        
        // Resize sau khi di chuyển
        setTimeout(() => {
          if (ggbContainerRef.current && ggbAppletRef.current) {
            const width = ggbContainerRef.current.clientWidth;
            const height = ggbContainerRef.current.clientHeight;
            if (width > 0 && height > 0) {
              try {
                ggbAppletRef.current.setSize(width, height);
                console.log(`📐 Resized to ${width}x${height}`);
              } catch (err) {
                console.warn('⚠️ Failed to resize:', err);
              }
            }
          }
        }, 100);
      }
    } else {
      // Di chuyển về portal (ẩn) khi modal đóng
      if (ggbElement.parentElement !== portalContainer) {
        console.log('📦 Moving GeoGebra back to portal');
        portalContainer.appendChild(ggbElement);
      }
    }
  }, [isOpen, isGgbReady, portalContainer]);

  // ✅ Handle resize khi modal mở
  useEffect(() => {
    if (!isGgbReady || !ggbContainerRef.current || !ggbAppletRef.current || !isOpen) {
      return;
    }

    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (ggbAppletRef.current && ggbContainerRef.current && isOpen) {
          const width = ggbContainerRef.current.clientWidth;
          const height = ggbContainerRef.current.clientHeight;
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
    resizeObserver.observe(ggbContainerRef.current);

    return () => {
      clearTimeout(resizeTimeout);
      resizeObserver.disconnect();
    };
  }, [isGgbReady, sidebarState, isOpen]);

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
  };
  
  const handleRetryLoad = () => {
    console.log('🔄 Retrying GeoGebra load...');
    setGeogebraError(null);
    hasInitializedRef.current = false;
    isInitializingRef.current = false;
    
    if (portalContainer) {
      portalContainer.innerHTML = '';
    }
    ggbAppletRef.current = null;
    setIsGgbReady(false);
    
    setTimeout(() => {
      initializeGeoGebra();
    }, 500);
  };

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
                    <>
                      <Loader className="animate-spin mr-2" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2" />
                      Vẽ hình
                    </>
                  )}
                </Button>

                {geogebraError && (
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

          <div className="flex-1 p-4 bg-gradient-to-b from-white to-blue-50 overflow-hidden flex flex-col">
            <div 
              ref={ggbContainerRef} 
              className="w-full h-full min-h-[300px] bg-white rounded-xl shadow-inner border border-blue-100 relative"
              suppressHydrationWarning
            >
              {(!isGgbScriptLoaded || !isGgbReady) && !geogebraError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100/50 z-10 rounded-xl">
                  <div className='flex flex-col items-center gap-4 text-center p-4'>
                    <Loader className="animate-spin text-primary" size={48} />
                    <p className='text-muted-foreground'>Đang tải công cụ vẽ hình...</p>
                    <p className='text-xs text-muted-foreground'>
                      {!isGgbScriptLoaded ? 'Đang tải thư viện GeoGebra...' : 'Đang khởi tạo...'}
                    </p>
                  </div>
                </div>
              )}
              
              {geogebraError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100/50 z-10 rounded-xl">
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