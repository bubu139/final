'use client';
import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';

// Import MathLive
import 'mathlive';
import { MathfieldElement } from 'mathlive';

// Khai báo Types cho TypeScript nhận diện thẻ <math-field>
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'math-field': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        'math-virtual-keyboard-policy'?: string; // Cập nhật tên attribute mới
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

export const MathInput = forwardRef<MathfieldElement, MathInputProps>(
  ({ value, onChange, onEnter, placeholder, className }, ref) => {
    // Khai báo ref nội bộ là mfRef
    const mfRef = useRef<MathfieldElement>(null);
    
    // State này để đảm bảo component chỉ render math-field khi đã mount trên client
    const [isMounted, setIsMounted] = useState(false);

    useImperativeHandle(ref, () => mfRef.current as MathfieldElement);

    useEffect(() => {
      setIsMounted(true);
    }, []);

    useEffect(() => {
      // Lấy current từ mfRef (chứ không phải mathFieldRef)
      const mf = mfRef.current;
      if (!mf) return;

      // --- CẤU HÌNH MATHFIELD ---
      mf.smartMode = true; 
      
      // SỬA LỖI Ở ĐÂY: Dùng đúng biến 'mf' và đúng thuộc tính mới
      mf.mathVirtualKeyboardPolicy = "manual"; 
      
      // Tắt menu ngữ cảnh mặc định
      mf.menuItems = []; 

      // Xử lý sự kiện thay đổi dữ liệu
      const handleInput = (evt: Event) => {
        const target = evt.target as MathfieldElement;
        onChange(target.value);
      };

      // Xử lý phím Enter
      const handleKeyDown = (evt: KeyboardEvent) => {
        if (evt.key === 'Enter' && !evt.shiftKey) {
          evt.preventDefault();
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

    // Đồng bộ giá trị từ ngoài vào (Controlled Input)
    useEffect(() => {
      const mf = mfRef.current;
      if (mf && mf.value !== value) {
        mf.value = value;
      }
    }, [value, isMounted]);

    if (!isMounted) {
      return <div className={className} style={{ minHeight: '50px' }} />;
    }

    return (
      <div className={`${className || ''} relative`}>
        <math-field
          ref={mfRef}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: '12px',
            border: 'none',
            background: 'transparent',
            outline: 'none',
            fontSize: '1.1rem',
            fontFamily: 'KaTeX_Main, "Times New Roman", serif',
            color: '#334155', // slate-700
          }}
        >
          {value}
        </math-field>

        {/* Placeholder: Chỉ hiện khi không có giá trị */}
        {!value && (
          <div className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400 pointer-events-none text-sm select-none font-sans">
            {placeholder}
          </div>
        )}
      </div>
    );
  }
);

MathInput.displayName = 'MathInput';