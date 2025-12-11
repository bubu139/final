import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
// ... (hàm 'cn' của bạn)


// Ưu tiên biến môi trường, nếu không có thì dùng link Render cứng
// lib/utils.ts
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

