// frontend_nextjs/src/lib/mindmap-data.ts
import type { MindMapNode } from '@/types/mindmap';

// Dữ liệu chi tiết Chương 1 Giải Tích (Phần bạn đã cung cấp)
const chuong1GiaiTich: MindMapNode = {
  id: 'ung-dung-dao-ham',
  label: 'CHƯƠNG I: ỨNG DỤNG ĐẠO HÀM ĐỂ KHẢO SÁT VÀ VẼ ĐỒ THỊ HÀM SỐ',
  type: 'subtopic',
  children: [
    {
      id: 'tinh-don-dieu',
      label: 'I. TÍNH ĐƠN ĐIỆU CỦA HÀM SỐ',
      type: 'concept',
      children: [
        {
          id: 'dinh-nghia-don-dieu',
          label: 'A. Định nghĩa',
          type: 'concept',
          children: [
            { 
              id: 'dong-bien', 
              label: 'Hàm số Đồng biến trên K: Nếu ∀x₁, x₂ ∈ K, x₁ < x₂ ⇒ f(x₁) < f(x₂). Đồ thị đi lên từ trái sang phải (Hình 1).', 
              type: 'concept',
              children: [] 
            },
            { 
              id: 'nghich-bien', 
              label: 'Hàm số Nghịch biến trên K: Nếu ∀x₁, x₂ ∈ K, x₁ < x₂ ⇒ f(x₁) > f(x₂). Đồ thị đi xuống từ trái sang phải (Hình 2).', 
              type: 'concept',
              children: [] 
            },
            { 
              id: 'khai-niem-don-dieu', 
              label: 'Đơn điệu: Hàm số đồng biến hoặc nghịch biến trên K. Khi xét tính đơn điệu mà không chỉ rõ tập K thì ta hiểu là xét trên tập xác định của hàm số đó.', 
              type: 'concept',
              children: [] 
            },
          ],
        },
        {
          id: 'lien-he-dao-ham',
          label: 'B. Liên hệ giữa Đạo hàm và Tính Đơn điệu (Định lí 1, 2)',
          type: 'concept',
          children: [
            { 
              id: 'dieu-kien-dong-bien', 
              label: "Đồng biến: Nếu f'(x) ≥ 0, ∀x ∈ K và f'(x) = 0 xảy ra tại một số hữu hạn điểm trên K thì hàm số đồng biến trên K.", 
              type: 'concept',
              children: [] 
            },
            { 
              id: 'dieu-kien-nghich-bien', 
              label: "Nghịch biến: Nếu f'(x) ≤ 0, ∀x ∈ K và f'(x) = 0 xảy ra tại một số hữu hạn điểm trên K thì hàm số nghịch biến trên K.", 
              type: 'concept',
              children: [] 
            },
          ],
        },
        {
          id: 'quy-trinh-xet-don-dieu',
          label: 'C. Quy trình xét Tính đơn điệu (Dạng 1)',
          type: 'concept',
          children: [
            { 
              id: 'b1-don-dieu', 
              label: 'Bước 1: Tìm tập xác định D.', 
              type: 'concept',
              children: [] 
            },
            { 
              id: 'b2-don-dieu', 
              label: "Bước 2: Tính f'(x). Tìm xᵢ mà f'(x) = 0 hoặc không tồn tại.", 
              type: 'concept',
              children: [] 
            },
            { 
              id: 'b3-don-dieu', 
              label: 'Bước 3: Lập bảng biến thiên.', 
              type: 'concept',
              children: [] 
            },
            { 
              id: 'b4-don-dieu', 
              label: 'Bước 4: Kết luận về các khoảng đồng biến, nghịch biến.', 
              type: 'concept',
              children: [] 
            },
          ],
        },
      ],
    },
    {
      id: 'cuc-tri',
      label: 'II. CỰC TRỊ CỦA HÀM SỐ',
      type: 'concept',
      children: [
        {
          id: 'dinh-nghia-cuc-tri',
          label: 'A. Định nghĩa và Tên gọi',
          type: 'concept',
          children: [
            {
              id: 'cuc-dai',
              label: 'Cực đại tại x₀: Tồn tại h > 0 sao cho f(x) < f(x₀) với mọi x ∈ (x₀ - h; x₀ + h) ⊂ (a; b) và x ≠ x₀.',
              type: 'concept',
              children: [
                { 
                  id: 'cuc-dai-note-1', 
                  label: 'Giá trị cực đại: f(x₀) (ký hiệu y꜀ᴰ).', 
                  type: 'concept',
                  children: [] 
                },
                { 
                  id: 'cuc-dai-note-2', 
                  label: 'Điểm cực đại của đồ thị: M(x₀; f(x₀))', 
                  type: 'concept',
                  children: [] 
                },
              ],
            },
            {
              id: 'cuc-tieu',
              label: 'Cực tiểu tại x₀: Tồn tại h > 0 sao cho f(x) > f(x₀) với mọi x ∈ (x₀ - h; x₀ + h) ⊂ (a; b) và x ≠ x₀.',
              type: 'concept',
              children: [
                { 
                  id: 'cuc-tieu-note-1', 
                  label: 'Giá trị cực tiểu: f(x₀) (ký hiệu y꜀ᴛ).', 
                  type: 'concept',
                  children: [] 
                },
                { 
                  id: 'cuc-tieu-note-2', 
                  label: 'Các điểm cực đại và cực tiểu được gọi chung là điểm cực trị.', 
                  type: 'concept',
                  children: [] 
                },
              ],
            },
          ],
        },
        {
          id: 'dieu-kien-cuc-tri',
          label: 'B. Điều kiện Cần và Đủ',
          type: 'concept',
          children: [
            { 
              id: 'dk-can-cuc-tri', 
              label: "Điều kiện cần: Nếu hàm số đạt cực trị tại x₀ và có đạo hàm thì f'(x₀) = 0 hoặc f'(x₀) không tồn tại.", 
              type: 'concept',
              children: [] 
            },
            {
              id: 'dk-du-cuc-tri',
              label: "Điều kiện đủ: Đạo hàm f'(x) đổi dấu khi x qua x₀.",
              type: 'concept',
              children: [
                { 
                  id: 'dk-du-cuc-dai', 
                  label: "Cực đại: f'(x) đổi dấu từ Dương (>0) sang Âm (<0).", 
                  type: 'concept',
                  children: [] 
                },
                { 
                  id: 'dk-du-cuc-tieu', 
                  label: "Cực tiểu: f'(x) đổi dấu từ Âm (<0) sang Dương (>0).", 
                  type: 'concept',
                  children: [] 
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'max-min',
      label: 'III. GIÁ TRỊ LỚN NHẤT – NHỎ NHẤT (MAX – MIN)',
      type: 'concept',
      children: [
        {
          id: 'dinh-nghia-max-min',
          label: 'A. Định nghĩa',
          type: 'concept',
          children: [
            { 
              id: 'gtln', 
              label: 'Giá trị lớn nhất (M): max f(x) = M (x∈D) nếu f(x) ≤ M, ∀x ∈ D và ∃x₀ ∈ D: f(x₀) = M.', 
              type: 'concept',
              children: [] 
            },
            { 
              id: 'gtnn', 
              label: 'Giá trị nhỏ nhất (m): min f(x) = m (x∈D) nếu f(x) ≥ m, ∀x ∈ D và ∃x₀ ∈ D: f(x₀) = m.', 
              type: 'concept',
              children: [] 
            },
          ],
        },
        {
          id: 'phuong-phap-max-min',
          label: 'B. Phương pháp tìm MAX/MIN trên đoạn [a; b]',
          type: 'concept',
          children: [
            { 
              id: 'b1-max-min', 
              label: "Bước 1: Giải phương trình f'(x) = 0 tìm x₀ ∈ (a; b).", 
              type: 'concept',
              children: [] 
            },
            { 
              id: 'b2-max-min', 
              label: "Bước 2: Tính toán các giá trị: f(a), f(b), f(x₀), f(xᵢ) (nếu có xᵢ làm f'(x) không xác định).", 
              type: 'concept',
              children: [] 
            },
            { 
              id: 'b3-max-min', 
              label: 'Bước 3: M là giá trị lớn nhất, m là giá trị nhỏ nhất trong các kết quả tính được.', 
              type: 'concept',
              children: [] 
            },
            { 
              id: 'luu-y-max-min', 
              label: 'Lưu ý Đơn điệu: Nếu f(x) đồng biến trên [a; b] thì min f(x) = f(a) và max f(x) = f(b).', 
              type: 'concept',
              children: [] 
            },
          ],
        },
      ],
    },
    {
      id: 'tiem-can',
      label: 'IV. ĐƯỜNG TIỆM CẬN CỦA ĐỒ THỊ HÀM SỐ',
      type: 'concept',
      children: [
        {
          id: 'tcn',
          label: 'A. Tiệm cận ngang (TCN)',
          type: 'concept',
          children: [
            { 
              id: 'dinh-nghia-tcn', 
              label: 'Định nghĩa: Đường thẳng y = m là TCN nếu lim f(x) = m (x→-∞) hoặc lim f(x) = m (x→+∞).', 
              type: 'concept',
              children: [] 
            },
            { 
              id: 'tcn-bac1-bac1', 
              label: 'Hàm số bậc 1/bậc 1 (y = (ax+b)/(cx+d)): TCN là y = a/c.', 
              type: 'concept',
              children: [] 
            },
          ],
        },
        {
          id: 'tcd',
          label: 'B. Tiệm cận đứng (TCĐ)',
          type: 'concept',
          children: [
            { 
              id: 'dinh-nghia-tcd', 
              label: 'Định nghĩa: Đường thẳng x = a là TCĐ nếu ít nhất một trong các giới hạn một bên tại a bằng ±∞.', 
              type: 'concept',
              children: [] 
            },
            { 
              id: 'tcd-bac1-bac1', 
              label: 'Hàm số bậc 1/bậc 1 (y = (ax+b)/(cx+d)): TCĐ là x = -d/c.', 
              type: 'concept',
              children: [] 
            },
          ],
        },
        {
          id: 'tcx',
          label: 'C. Tiệm cận xiên (TCX)',
          type: 'concept',
          children: [
            { 
              id: 'dinh-nghia-tcx', 
              label: 'Định nghĩa: Đường thẳng y = ax + b (a ≠ 0) là TCX nếu lim [f(x) - (ax + b)] = 0 (x→±∞).', 
              type: 'concept',
              children: [] 
            },
            { 
              id: 'tim-tcx', 
              label: 'Cách tìm a, b: a = lim f(x)/x (x→±∞) và b = lim [f(x) - ax] (x→±∞).', 
              type: 'concept',
              children: [] 
            },
            { 
              id: 'luu-y-tcx', 
              label: "Lưu ý: Nếu a=0, TCX trở thành TCN. Đối với hàm phân thức Bậc 2/Bậc 1, có thể chia đa thức để tìm TCX y = a'x + b'.", 
              type: 'concept',
              children: [] 
            },
          ],
        },
      ],
    },
    {
      id: 'khao-sat-ve-do-thi',
      label: 'V. KHẢO SÁT VÀ VẼ ĐỒ THỊ HÀM SỐ (Phân loại)',
      type: 'concept',
      children: [
        {
          id: 'ham-bac-ba',
          label: 'A. Hàm số Bậc Ba (y = ax³ + bx² + cx + d)',
          type: 'concept',
          children: [
            { 
              id: 'tam-doi-xung-bac-ba', 
              label: "Tâm đối xứng: Hoành độ là nghiệm của y'' = 0, tức là x = -b/(3a).", 
              type: 'concept',
              children: [] 
            },
            { 
              id: 'dk-cuc-tri-bac-ba', 
              label: "Điều kiện Cực trị: Có hai cực trị khi a ≠ 0 và Δy' = b² - 3ac > 0.", 
              type: 'concept',
              children: [] 
            },
          ],
        },
        {
          id: 'ham-bac1-bac1',
          label: 'B. Hàm số Bậc 1/Bậc 1 (y = (ax+b)/(cx+d))',
          type: 'concept',
          children: [
            { 
              id: 'tam-doi-xung-bac1-bac1', 
              label: 'Tâm đối xứng: Giao điểm của TCĐ (x = -d/c) và TCN (y = a/c).', 
              type: 'concept',
              children: [] 
            },
            { 
              id: 'dac-diem-bac1-bac1', 
              label: 'Đặc điểm: Luôn đơn điệu trên từng khoảng xác định.', 
              type: 'concept',
              children: [] 
            },
          ],
        },
        {
          id: 'ham-bac2-bac1',
          label: 'C. Hàm số Bậc 2/Bậc 1 (y = (ax²+bx+c)/(mx+n))',
          type: 'concept',
          children: [
            { 
              id: 'dac-diem-bac2-bac1', 
              label: 'Đặc điểm: Có TCĐ và TCX. Tâm đối xứng là giao điểm của TCĐ và TCX.', 
              type: 'concept',
              children: [] 
            },
            { 
              id: 'cuc-tri-bac2-bac1', 
              label: "Cực trị: Có hai điểm cực trị khi phương trình y'=0 có hai nghiệm phân biệt.", 
              type: 'concept',
              children: [] 
            },
          ],
        },
      ],
    },
    {
      id: 'tim-tham-so-m',
      label: 'VI. TÌM THAM SỐ m (Điều kiện Max/Min, Đơn điệu, Cực trị)',
      type: 'concept',
      children: [
        {
          id: 'dk-don-dieu-m',
          label: 'A. Điều kiện Đơn điệu trên ℝ (Hàm bậc ba)',
          type: 'concept',
          children: [
            { 
              id: 'dk-dong-bien-m', 
              label: "Đồng biến: a > 0 và Δy' ≤ 0.", 
              type: 'concept',
              children: [] 
            },
            { 
              id: 'dk-nghich-bien-m', 
              label: "Nghịch biến: a < 0 và Δy' ≤ 0.", 
              type: 'concept',
              children: [] 
            },
          ],
        },
        {
          id: 'dk-cuc-tri-m',
          label: 'B. Điều kiện Cực trị (Hàm bậc ba)',
          type: 'concept',
          children: [
            { 
              id: 'co-hai-cuc-tri-m', 
              label: "Hàm số có hai điểm cực trị: a ≠ 0 và Δy' > 0.", 
              type: 'concept',
              children: [] 
            },
            { 
              id: 'khong-co-cuc-tri-m', 
              label: "Hàm số không có cực trị: Δy' ≤ 0 hoặc suy biến {a = 0, b = 0}.", 
              type: 'concept',
              children: [] 
            },
          ],
        },
      ],
    },
  ],
};

// Cấu trúc dữ liệu mới cho toàn bộ chương trình
export const mindMapData: MindMapNode = {
  id: 'toan-12',
  label: 'TOÀN BỘ KIẾN THỨC TOÁN 12',
  type: 'topic',
  children: [
    //================== GIẢI TÍCH 12 ==================
    {
      id: 'giai-tich-12',
      label: 'GIẢI TÍCH 12',
      type: 'topic',
      children: [
        // CHƯƠNG 1 (Đã có chi tiết ở trên)
        chuong1GiaiTich,

        // CHƯƠNG 2: HÀM SỐ LŨY THỪA, MŨ, LOGARIT
        {
          id: 'ham-so-luy-thua-mu-logarit',
          label: 'CHƯƠNG II: HÀM SỐ LŨY THỪA, HÀM SỐ MŨ VÀ HÀM SỐ LÔGARIT',
          type: 'subtopic',
          children: [
            { 
              id: 'luy-thua', 
              label: 'A. Lũy thừa', 
              type: 'concept', 
              children: [
                { id: 'luy-thua-dinh-nghia', label: '1. Định nghĩa lũy thừa (Số mũ nguyên, hữu tỉ, thực)', type: 'concept', children: [] },
                { id: 'luy-thua-tinh-chat', label: '2. Tính chất của lũy thừa', type: 'concept', children: [] },
                { id: 'luy-thua-so-sanh', label: '3. So sánh các lũy thừa', type: 'concept', children: [] },
              ] 
            },
            { 
              id: 'ham-so-luy-thua', 
              label: 'B. Hàm số lũy thừa', 
              type: 'concept', 
              children: [
                { id: 'hs-luy-thua-dinh-nghia', label: '1. Định nghĩa hàm số lũy thừa', type: 'concept', children: [] },
                { id: 'hs-luy-thua-txa-dinh', label: '2. Tập xác định', type: 'concept', children: [] },
                { id: 'hs-luy-thua-dao-ham', label: '3. Đạo hàm', type: 'concept', children: [] },
                { id: 'hs-luy-thua-khao-sat', label: '4. Khảo sát và đồ thị', type: 'concept', children: [] },
              ] 
            },
            { 
              id: 'logarit', 
              label: 'C. Lôgarit', 
              type: 'concept', 
              children: [
                { id: 'logarit-dinh-nghia', label: '1. Định nghĩa Lôgarit', type: 'concept', children: [] },
                { id: 'logarit-tinh-chat', label: '2. Tính chất và quy tắc (Tổng, hiệu, tích, thương)', type: 'concept', children: [] },
                { id: 'logarit-doi-co-so', label: '3. Công thức đổi cơ số', type: 'concept', children: [] },
              ] 
            },
            { 
              id: 'ham-so-mu-logarit', 
              label: 'D. Hàm số mũ, Hàm số lôgarit', 
              type: 'concept', 
              children: [
                { id: 'hs-mu-dinh-nghia', label: '1. Định nghĩa hàm số mũ', type: 'concept', children: [] },
                { id: 'hs-logarit-dinh-nghia', label: '2. Định nghĩa hàm số lôgarit', type: 'concept', children: [] },
                { id: 'hs-mu-log-tinh-chat', label: '3. Tính chất (Tập xác định, tập giá trị)', type: 'concept', children: [] },
                { id: 'hs-mu-log-dao-ham', label: '4. Đạo hàm', type: 'concept', children: [] },
                { id: 'hs-mu-log-khao-sat', label: '5. Khảo sát và đồ thị', type: 'concept', children: [] },
              ] 
            },
            { 
              id: 'pt-mu-logarit', 
              label: 'E. Phương trình mũ và lôgarit', 
              type: 'concept', 
              children: [
                { id: 'pt-mu-co-ban', label: '1. Phương trình mũ cơ bản', type: 'concept', children: [] },
                { id: 'pt-log-co-ban', label: '2. Phương trình lôgarit cơ bản', type: 'concept', children: [] },
                { id: 'pt-mu-log-pp-giai', label: '3. Các phương pháp giải (Đưa về cùng cơ số, Đặt ẩn phụ, Logarit hóa)', type: 'concept', children: [] },
              ] 
            },
            { 
              id: 'bpt-mu-logarit', 
              label: 'F. Bất phương trình mũ và lôgarit', 
              type: 'concept', 
              children: [
                { id: 'bpt-mu-co-ban', label: '1. Bất phương trình mũ cơ bản', type: 'concept', children: [] },
                { id: 'bpt-log-co-ban', label: '2. Bất phương trình lôgarit cơ bản', type: 'concept', children: [] },
                { id: 'bpt-mu-log-pp-giai', label: '3. Các phương pháp giải', type: 'concept', children: [] },
              ] 
            },
          ],
        },

        // CHƯƠNG 3: NGUYÊN HÀM, TÍCH PHÂN
        {
          id: 'nguyen-ham-tich-phan',
          label: 'CHƯƠNG III: NGUYÊN HÀM - TÍCH PHÂN VÀ ỨNG DỤNG',
          type: 'subtopic',
          children: [
            { 
              id: 'nguyen-ham', 
              label: 'A. Nguyên hàm', 
              type: 'concept', 
              children: [
                { id: 'nguyen-ham-dinh-nghia', label: '1. Định nghĩa và tính chất', type: 'concept', children: [] },
                { id: 'nguyen-ham-bang', label: '2. Bảng nguyên hàm cơ bản', type: 'concept', children: [] },
                { id: 'nguyen-ham-pp', label: '3. Phương pháp tính (Đổi biến số, Từng phần)', type: 'concept', children: [] },
              ] 
            },
            { 
              id: 'tich-phan', 
              label: 'B. Tích phân', 
              type: 'concept', 
              children: [
                { id: 'tich-phan-dinh-nghia', label: '1. Định nghĩa và tính chất', type: 'concept', children: [] },
                { id: 'tich-phan-pp', label: '2. Phương pháp tính (Đổi biến số, Từng phần)', type: 'concept', children: [] },
              ] 
            },
            { 
              id: 'ung-dung-tich-phan', 
              label: 'C. Ứng dụng của tích phân', 
              type: 'concept', 
              children: [
                { id: 'ud-tich-phan-dien-tich', label: '1. Tính diện tích hình phẳng', type: 'concept', children: [] },
                { id: 'ud-tich-phan-the-tich', label: '2. Tính thể tích vật thể tròn xoay', type: 'concept', children: [] },
              ] 
            },
          ],
        },

        // CHƯƠNG 4: SỐ PHỨC
        {
          id: 'so-phuc',
          label: 'CHƯƠNG IV: SỐ PHỨC',
          type: 'subtopic',
          children: [
            { 
              id: 'khai-niem-so-phuc', 
              label: 'A. Khái niệm số phức', 
              type: 'concept', 
              children: [
                { id: 'so-phuc-dinh-nghia', label: '1. Định nghĩa (Dạng đại số z = a + bi)', type: 'concept', children: [] },
                { id: 'so-phuc-bang-nhau', label: '2. Hai số phức bằng nhau', type: 'concept', children: [] },
                { id: 'so-phuc-bieu-dien', label: '3. Biểu diễn hình học (Điểm, Vector)', type: 'concept', children: [] },
                { id: 'so-phuc-lien-hop', label: '4. Số phức liên hợp', type: 'concept', children: [] },
                { id: 'so-phuc-modun', label: '5. Modun của số phức', type: 'concept', children: [] },
              ] 
            },
            { 
              id: 'phep-toan-so-phuc', 
              label: 'B. Các phép toán cộng, trừ, nhân, chia số phức', 
              type: 'concept', 
              children: [] 
            },
            { 
              id: 'pt-bac-hai-so-phuc', 
              label: 'C. Phương trình bậc hai với hệ số thực', 
              type: 'concept', 
              children: [
                { id: 'pt-bac-hai-can', label: '1. Căn bậc hai của số thực âm', type: 'concept', children: [] },
                { id: 'pt-bac-hai-giai', label: '2. Giải phương trình bậc hai', type: 'concept', children: [] },
              ] 
            },
            { 
              id: 'tap-hop-diem-so-phuc', 
              label: 'D. Tập hợp điểm biểu diễn số phức (Nâng cao)', 
              type: 'concept', 
              children: [] 
            },
          ],
        },
      ],
    },

    //================== HÌNH HỌC 12 ==================
    {
      id: 'hinh-hoc-12',
      label: 'HÌNH HỌC 12',
      type: 'topic',
      children: [
        // CHƯƠNG 1: KHỐI ĐA DIỆN
        {
          id: 'khoi-da-dien',
          label: 'CHƯƠNG I: KHỐI ĐA DIỆN',
          type: 'subtopic',
          children: [
            { 
              id: 'khai-niem-khoi-da-dien', 
              label: 'A. Khái niệm về hình đa diện và khối đa diện', 
              type: 'concept', 
              children: [
                { id: 'hinh-da-dien', label: '1. Hình đa diện', type: 'concept', children: [] },
                { id: 'khoi-da-dien', label: '2. Khối đa diện', type: 'concept', children: [] },
              ] 
            },
            { 
              id: 'khoi-da-dien-loi-deu', 
              label: 'B. Khối đa diện lồi và khối đa diện đều', 
              type: 'concept', 
              children: [
                { id: 'da-dien-loi', label: '1. Khối đa diện lồi', type: 'concept', children: [] },
                { id: 'da-dien-deu', label: '2. Khối đa diện đều (5 loại)', type: 'concept', children: [] },
              ] 
            },
            { 
              id: 'the-tich-khoi-da-dien', 
              label: 'C. Thể tích của khối đa diện', 
              type: 'concept', 
              children: [
                { id: 'the-tich-khoi-chop', label: '1. Thể tích khối chóp', type: 'concept', children: [] },
                { id: 'the-tich-khoi-lang-tru', label: '2. Thể tích khối lăng trụ', type: 'concept', children: [] },
                { id: 'ti-so-the-tich', label: '3. Tỉ số thể tích (Simson)', type: 'concept', children: [] },
              ] 
            },
          ],
        },

        // CHƯƠNG 2: MẶT NÓN, MẶT TRỤ, MẶT CẦU
        {
          id: 'mat-tron-xoay',
          label: 'CHƯƠNG II: MẶT NÓN, MẶT TRỤ, MẶT CẦU',
          type: 'subtopic',
          children: [
            { 
              id: 'khai-niem-mat-tron-xoay', 
              label: 'A. Khái niệm về mặt tròn xoay', 
              type: 'concept', 
              children: [] 
            },
            { 
              id: 'mat-cau', 
              label: 'B. Mặt cầu, Khối cầu', 
              type: 'concept', 
              children: [
                { id: 'mat-cau-dinh-nghia', label: '1. Định nghĩa, Vị trí tương đối (với mặt phẳng, đường thẳng)', type: 'concept', children: [] },
                { id: 'mat-cau-dien-tich-the-tich', label: '2. Diện tích mặt cầu, Thể tích khối cầu', type: 'concept', children: [] },
              ] 
            },
            { 
              id: 'mat-non', 
              label: 'C. Mặt nón, Hình nón, Khối nón', 
              type: 'concept', 
              children: [
                { id: 'mat-non-dinh-nghia', label: '1. Định nghĩa, Yếu tố (đường sinh, chiều cao, ...)', type: 'concept', children: [] },
                { id: 'mat-non-dien-tich-the-tich', label: '2. Diện tích xung quanh, Thể tích khối nón', type: 'concept', children: [] },
              ] 
            },
            { 
              id: 'mat-tru', 
              label: 'D. Mặt trụ, Hình trụ, Khối trụ', 
              type: 'concept', 
              children: [
                { id: 'mat-tru-dinh-nghia', label: '1. Định nghĩa, Yếu tố', type: 'concept', children: [] },
                { id: 'mat-tru-dien-tich-the-tich', label: '2. Diện tích xung quanh, Thể tích khối trụ', type: 'concept', children: [] },
              ] 
            },
          ],
        },

        // CHƯƠNG 3: PHƯƠNG PHÁP TỌA ĐỘ TRONG KHÔNG GIAN (Oxyz)
        {
          id: 'hinh-hoc-oxyz',
          label: 'CHƯƠNG III: PHƯƠNG PHÁP TỌA ĐỘ TRONG KHÔNG GIAN (Oxyz)',
          type: 'subtopic',
          children: [
            { 
              id: 'he-toa-do-oxyz', 
              label: 'A. Hệ tọa độ trong không gian', 
              type: 'concept', 
              children: [
                { id: 'oxyz-toa-do-diem-vecto', label: '1. Tọa độ điểm, Tọa độ vector', type: 'concept', children: [] },
                { id: 'oxyz-phep-toan-vecto', label: '2. Các phép toán vector (Tổng, hiệu, tích vô hướng, tích có hướng)', type: 'concept', children: [] },
                { id: 'oxyz-ung-dung-vecto', label: '3. Ứng dụng (Đồng phẳng, Diện tích, Thể tích)', type: 'concept', children: [] },
              ] 
            },
            { 
              id: 'pt-mat-phang', 
              label: 'B. Phương trình mặt phẳng', 
              type: 'concept', 
              children: [
                { id: 'ptmp-tong-quat', label: '1. Vector pháp tuyến, Phương trình tổng quát', type: 'concept', children: [] },
                { id: 'ptmp-cac-truong-hop', label: '2. Các trường hợp riêng (Đi qua 3 điểm, đoạn chắn, ...)', type: 'concept', children: [] },
                { id: 'ptmp-vi-tri-tuong-doi', label: '3. Vị trí tương đối của hai mặt phẳng', type: 'concept', children: [] },
              ] 
            },
            { 
              id: 'pt-duong-thang', 
              label: 'C. Phương trình đường thẳng', 
              type: 'concept', 
              children: [
                { id: 'ptdt-tham-so-chinh-tac', label: '1. Vector chỉ phương, Phương trình tham số, Phương trình chính tắc', type: 'concept', children: [] },
                { id: 'ptdt-vi-tri-tuong-doi', label: '2. Vị trí tương đối (giữa đường và mặt, giữa hai đường thẳng)', type: 'concept', children: [] },
              ] 
            },
            { 
              id: 'pt-mat-cau-oxyz', 
              label: 'D. Phương trình mặt cầu', 
              type: 'concept', 
              children: [
                { id: 'ptmc-chinh-tac-tong-quat', label: '1. Phương trình chính tắc và tổng quát', type: 'concept', children: [] },
                { id: 'ptmc-vi-tri-tuong-doi', label: '2. Vị trí tương đối (với mặt phẳng, với đường thẳng)', type: 'concept', children: [] },
              ] 
            },
            { 
              id: 'vi-tri-goc-khoang-cach', 
              label: 'E. Góc và Khoảng cách', 
              type: 'concept', 
              children: [
                { id: 'goc', label: '1. Góc (giữa hai đường thẳng, đường và mặt, hai mặt phẳng)', type: 'concept', children: [] },
                { id: 'khoang-cach', label: '2. Khoảng cách (từ điểm đến mặt, từ điểm đến đường, giữa hai đường chéo nhau)', type: 'concept', children: [] },
              ] 
            },
          ],
        },
      ],
    },
  ],
};