'use client';

import React, {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useState,
} from 'react';

// Import MathLive để đăng ký <math-field>
import 'mathlive';
import { MathfieldElement } from 'mathlive';

// Khai báo type cho thẻ <math-field> để TSX không báo lỗi
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'math-field': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        // Thuộc tính điều khiển chế độ bàn phím ảo
        'math-virtual-keyboard-policy'?: 'auto' | 'manual' | 'sandboxed';
      };
    }
  }
}

interface MathInputProps {
  value: string;
  onChange: (value: string) => void;
  onEnter: () => void;
  placeholder?: string;
  className?: string;
}

/**
 * MathInput:
 * - Giữ lại MathLive cho nhập LaTeX.
 * - TẮT bàn phím ảo tự bật + tránh lỗi cross-origin bằng policy "sandboxed".
 * - Placeholder custom giống input thường.
 */
export const MathInput = forwardRef<MathfieldElement, MathInputProps>(
  ({ value, onChange, onEnter, placeholder, className }, ref) => {
    const mfRef = useRef<MathfieldElement | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    // Cho phép parent lấy trực tiếp ref tới <math-field>
    useImperativeHandle(ref, () => mfRef.current as MathfieldElement);

    useEffect(() => {
      setIsMounted(true);
    }, []);

    // Lắng nghe input + Enter
    useEffect(() => {
      if (!isMounted) return;
      const mf = mfRef.current;
      if (!mf) return;

      const handleInput = () => {
        onChange(mf.value ?? '');
      };

      const handleKeyDown = (ev: KeyboardEvent) => {
        if (ev.key === 'Enter' && !ev.shiftKey) {
          ev.preventDefault();
          onEnter();
        }
      };

      mf.addEventListener('input', handleInput);
      mf.addEventListener('keydown', handleKeyDown);

      return () => {
        mf.removeEventListener('input', handleInput);
        mf.removeEventListener('keydown', handleKeyDown);
      };
    }, [isMounted, onChange, onEnter]);

    // Đồng bộ value từ ngoài vào MathLive
    useEffect(() => {
      if (!isMounted) return;
      const mf = mfRef.current;
      if (mf && mf.value !== value) {
        mf.value = value;
      }
    }, [value, isMounted]);

    // Khi chưa mount thì render khung trống để tránh lỗi SSR
    if (!isMounted) {
      return <div className={className} style={{ minHeight: '48px' }} />;
    }

    return (
      <div className={`relative ${className ?? ''}`}>
        <math-field
          ref={mfRef}
          // 🔴 Quan trọng: KHÔNG cho virtual keyboard tự bật + chạy trong iframe hiện tại
          math-virtual-keyboard-policy="sandboxed"
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: '16px',
            border: 'none',
            background: 'transparent',
            outline: 'none',
            fontSize: '1rem',
            fontFamily:
              'KaTeX_Main, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            color: '#0f172a',
          }}
        >
          {value}
        </math-field>

        {/* Placeholder giống input thường, chỉ hiện khi chưa nhập gì */}
        {!value && placeholder && (
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-gray-400 font-sans">
            {placeholder}
          </div>
        )}
      </div>
    );
  },
);

MathInput.displayName = 'MathInput';
