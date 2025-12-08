// frontend_nextjs/src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

// Lấy URL và ANON KEY từ biến môi trường
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Tạo client Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
