import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
// ... (hàm 'cn' của bạn)


// Ưu tiên biến môi trường, nếu không có thì dùng link Render cứng
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://final-h94w.onrender.com";
