'use client';
import { useEffect, useRef } from 'react';

export default function MathJaxConfig() {
  // Dùng useRef để lưu trữ bộ đếm thời gian (timer) cho debounce
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  /**
   * Hàm gọi MathJax render lại trang.
   */
  const typeset = () => {
    if (typeof window !== 'undefined' && window.MathJax?.typesetPromise) {
      window.MathJax.typesetPromise()
        .catch((err: any) => console.error("MathJax typeset error:", err));
    }
  };

  /**
   * Effect này chạy 1 lần duy nhất để:
   * 1. Cấu hình và chèn script MathJax vào trang.
   * 2. Tự động render lần đầu tiên khi script tải xong.
   */
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.MathJax = {
        tex: {
          inlineMath: [['$', '$'], ['\\(', '\\)']],
          displayMath: [['$$', '$$'], ['\\[', '\\]']],
          processEscapes: true,
        },
        options: {
          skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
        }
      };

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
      script.async = true;
      script.id = 'MathJax-script';
      
      // Quan trọng: Gọi typeset() lần đầu tiên sau khi script đã tải xong
      script.onload = () => {
        typeset();
      };
      
      if (!document.getElementById('MathJax-script')) {
        document.head.appendChild(script);
      }
    }
  }, []); // Mảng rỗng đảm bảo effect này chỉ chạy 1 lần

  /**
   * Effect này chạy 1 lần duy nhất để:
   * 1. Tạo một "MutationObserver" để theo dõi thay đổi trên DOM.
   * 2. Bất cứ khi nào nội dung mới (như câu hỏi, tin nhắn chat) được thêm vào,
   * nó sẽ gọi hàm typeset() để render lại toán.
   * 3. Sử dụng "debounce" (độ trễ 100ms) để tránh render quá nhiều lần.
   */
  useEffect(() => {
    // Hàm được gọi khi có thay đổi trên DOM
    const handleMutation = () => {
      // Hủy timer cũ nếu có
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      // Đặt timer mới. MathJax sẽ chỉ chạy 100ms SAU KHI thay đổi cuối cùng kết thúc.
      debounceTimer.current = setTimeout(() => {
        typeset();
      }, 100);
    };

    // Tạo observer
    const observer = new MutationObserver(handleMutation);

    // Bắt đầu "theo dõi" toàn bộ <body> của trang web
    // Bất kỳ node con nào được thêm/bớt (childList) ở bất kỳ đâu (subtree)
    // đều sẽ kích hoạt handleMutation
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Hàm dọn dẹp: Khi component bị hủy, dừng theo dõi
    return () => {
      observer.disconnect();
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []); // Mảng rỗng đảm bảo effect này chỉ chạy 1 lần

  return null;
}