'use client';
import { useEffect, useRef } from 'react';

export default function MathJaxConfig() {
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  /**
   * Chuẩn hóa LaTeX trong DOM trước khi MathJax render:
   * - \begin{tabular} -> \begin{array}
   * - \end{tabular}   -> \end{array}
   * - Bỏ các cặp $...$ bên trong array
   * - Xóa \hline (tránh \hlinex, \hlinef'(x) ...)
   * - Đổi "earrow" -> "\searrow" cho bảng biến thiên
   */
  const normalizeLatexInDOM = () => {
    if (typeof document === 'undefined') return;

    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT
    );

    let node: Node | null = walker.nextNode();
    while (node) {
      const text = node.textContent;
      if (text && (text.includes('\\begin{tabular}') || text.includes('\\begin{array}'))) {
        let processed = text
          .replace(/\\begin\{tabular\}/g, '\\begin{array}')
          .replace(/\\end\{tabular\}/g, '\\end{array}');

        // Xử lý riêng từng block array
        processed = processed.replace(
          /(\\begin\{array[\s\S]*?\\end\{array\})/g,
          (block) => {
            let out = block;

            // Bỏ $...$ bên trong array: $x$ -> x, $-\infty$ -> -\infty, ...
            out = out.replace(/\$([^\$]+)\$/g, '$1');

            // Xóa toàn bộ \hline (kể cả trường hợp dính chữ: \hlinex -> x)
            out = out.replace(/\\hline\s*/g, '');

            // earrow -> \searrow (mũi tên giảm)
            out = out.replace(/\bearrow\b/g, '\\searrow');

            return out;
          }
        );

        node.textContent = processed;
      }
      node = walker.nextNode();
    }
  };

  const typeset = () => {
    if (typeof window !== 'undefined' && window.MathJax?.typesetPromise) {
      // Chuẩn hóa trước khi render
      normalizeLatexInDOM();

      window.MathJax.typesetPromise().catch((err: any) =>
        console.error('MathJax typeset error:', err)
      );
    }
  };

  // Nạp script MathJax lần đầu
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.MathJax = {
        tex: {
          inlineMath: [['$', '$'], ['\\(', '\\)']],
          displayMath: [['$$', '$$'], ['\\[', '\\]']],
          processEscapes: true,
        },
        options: {
          skipHtmlTags: [
            'script',
            'noscript',
            'style',
            'textarea',
            'pre',
            'code',
          ],
        },
      };

      const script = document.createElement('script');
      script.src =
        'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
      script.async = true;
      script.id = 'MathJax-script';

      script.onload = () => {
        typeset();
      };

      if (!document.getElementById('MathJax-script')) {
        document.head.appendChild(script);
      }
    }
  }, []);

  // Quan sát DOM, khi nội dung thay đổi thì typeset lại (debounce)
  useEffect(() => {
    const handleMutation = () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      debounceTimer.current = setTimeout(() => {
        typeset();
      }, 100);
    };

    const observer = new MutationObserver(handleMutation);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return null;
}
