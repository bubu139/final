// frontend_nextjs/src/lib/mindmap-data.ts
import type { MindMapNode } from '@/types/mindmap';

export const mindMapData: MindMapNode = {
  id: 'toan-12',
  label: 'TOÁN 12 - CHÂN TRỜI SÁNG TẠO',
  type: 'topic',
  children: [
    //================== GIẢI TÍCH 12 ==================
    {
      id: 'giai-tich-12',
      label: 'GIẢI TÍCH',
      type: 'topic',
      children: [
        // ============ Khảo sát hàm số ============
        {
          id: 'khao-sat-ham-so',
          label: 'KHẢO SÁT HÀM SỐ',
          type: 'subtopic',
          children: [
            {
              id: 'dao-ham-cap-cao',
              label: 'Đạo hàm cấp cao',
              type: 'concept',
              children: [
                { id: 'dao-ham-cap-1', label: 'Đạo hàm cấp 1: f\'(x) - Tốc độ biến thiên tức thời', type: 'concept', children: [] },
                { id: 'dao-ham-cap-2', label: 'Đạo hàm cấp 2: f\'\'(x) - Độ cong của đồ thị', type: 'concept', children: [] },
                { id: 'y-nghia-dao-ham', label: 'Ý nghĩa: Hệ số góc tiếp tuyến, tốc độ, gia tốc', type: 'concept', children: [] },
              ],
            },
            {
              id: 'tinh-don-dieu',
              label: 'Tính đơn điệu',
              type: 'concept',
              children: [
                {
                  id: 'khai-niem-don-dieu',
                  label: 'Khái niệm',
                  type: 'concept',
                  children: [
                    { id: 'ham-dong-bien', label: 'Hàm đồng biến: x₁ < x₂ ⇒ f(x₁) < f(x₂)', type: 'concept', children: [] },
                    { id: 'ham-nghich-bien', label: 'Hàm nghịch biến: x₁ < x₂ ⇒ f(x₁) > f(x₂)', type: 'concept', children: [] },
                    { id: 'y-nghia-hinh-hoc', label: 'Ý nghĩa: Đồ thị đi lên/xuống từ trái sang phải', type: 'concept', children: [] },
                  ],
                },
                {
                  id: 'dieu-kien-don-dieu',
                  label: 'Điều kiện đạo hàm',
                  type: 'concept',
                  children: [
                    { id: 'dk-dong-bien', label: 'Đồng biến trên K: f\'(x) ≥ 0, ∀x ∈ K (f\'(x)=0 tại hữu hạn điểm)', type: 'concept', children: [] },
                    { id: 'dk-nghich-bien', label: 'Nghịch biến trên K: f\'(x) ≤ 0, ∀x ∈ K (f\'(x)=0 tại hữu hạn điểm)', type: 'concept', children: [] },
                  ],
                },
                {
                  id: 'quy-tac-xet-don-dieu',
                  label: 'Quy trình khảo sát',
                  type: 'concept',
                  children: [
                    { id: 'b1-txd', label: 'Bước 1: Tìm tập xác định D', type: 'concept', children: [] },
                    { id: 'b2-dao-ham', label: 'Bước 2: Tính f\'(x), giải f\'(x) = 0', type: 'concept', children: [] },
                    { id: 'b3-bang-xet-dau', label: 'Bước 3: Lập bảng xét dấu f\'(x)', type: 'concept', children: [] },
                    { id: 'b4-ket-luan', label: 'Bước 4: Kết luận khoảng đồng biến/nghịch biến', type: 'concept', children: [] },
                  ],
                },
              ],
            },
            {
              id: 'cuc-tri',
              label: 'Cực trị',
              type: 'concept',
              children: [
                {
                  id: 'khai-niem-cuc-tri',
                  label: 'Khái niệm',
                  type: 'concept',
                  children: [
                    { id: 'diem-cuc-dai', label: 'Điểm cực đại x₀: f(x) < f(x₀) với x gần x₀', type: 'concept', children: [] },
                    { id: 'diem-cuc-tieu', label: 'Điểm cực tiểu x₀: f(x) > f(x₀) với x gần x₀', type: 'concept', children: [] },
                    { id: 'gia-tri-cuc-tri', label: 'Giá trị cực trị: f(x₀) = y_CĐ hoặc y_CT', type: 'concept', children: [] },
                  ],
                },
                {
                  id: 'dieu-kien-cuc-tri',
                  label: 'Điều kiện',
                  type: 'concept',
                  children: [
                    { id: 'dk-can', label: 'Điều kiện cần: f\'(x₀) = 0 hoặc không tồn tại', type: 'concept', children: [] },
                    { id: 'dk-du-1', label: 'Điều kiện đủ 1: f\'(x) đổi dấu qua x₀', type: 'concept', children: [] },
                    { id: 'dk-du-2', label: 'Điều kiện đủ 2: f\'(x₀)=0 và f\'\'(x₀)≠0', type: 'concept', children: [] },
                  ],
                },
                {
                  id: 'quy-tac-tim-cuc-tri',
                  label: 'Quy trình tìm cực trị',
                  type: 'concept',
                  children: [
                    { id: 'tim-diem-dung', label: 'Bước 1: Tìm điểm dừng (f\'(x)=0)', type: 'concept', children: [] },
                    { id: 'xet-dao-ham', label: 'Bước 2: Xét dấu f\'(x) hoặc tính f\'\'(x)', type: 'concept', children: [] },
                    { id: 'ket-luan-cuc-tri', label: 'Bước 3: Kết luận loại cực trị', type: 'concept', children: [] },
                  ],
                },
              ],
            },
            {
              id: 'gtln-gtnn',
              label: 'Giá trị lớn nhất - nhỏ nhất',
              type: 'concept',
              children: [
                {
                  id: 'dinh-nghia-max-min',
                  label: 'Định nghĩa',
                  type: 'concept',
                  children: [
                    { id: 'max', label: 'Max f(x) = M: f(x) ≤ M, ∀x và ∃x₀: f(x₀) = M', type: 'concept', children: [] },
                    { id: 'min', label: 'Min f(x) = m: f(x) ≥ m, ∀x và ∃x₀: f(x₀) = m', type: 'concept', children: [] },
                    { id: 'so-sanh-cuc-tri', label: 'Khác cực trị: Max/Min toàn cục, cực trị cục bộ', type: 'concept', children: [] },
                  ],
                },
                {
                  id: 'pp-tim-max-min',
                  label: 'Phương pháp tìm trên [a;b]',
                  type: 'concept',
                  children: [
                    { id: 'giai-dao-ham', label: 'Bước 1: Giải f\'(x) = 0 tìm x_i ∈ (a;b)', type: 'concept', children: [] },
                    { id: 'tinh-gia-tri', label: 'Bước 2: Tính f(a), f(b), f(x_i)', type: 'concept', children: [] },
                    { id: 'so-sanh', label: 'Bước 3: So sánh tìm max/min', type: 'concept', children: [] },
                  ],
                },
                {
                  id: 'truong-hop-dac-biet',
                  label: 'Trường hợp đặc biệt',
                  type: 'concept',
                  children: [
                    { id: 'ham-don-dieu', label: 'Hàm đơn điệu: min = f(a), max = f(b)', type: 'concept', children: [] },
                    { id: 'ham-tren-r', label: 'Trên ℝ: Xét giới hạn ±∞', type: 'concept', children: [] },
                  ],
                },
              ],
            },
            {
              id: 'duong-tiem-can',
              label: 'Đường tiệm cận',
              type: 'concept',
              children: [
                {
                  id: 'tiem-can-ngang',
                  label: 'Tiệm cận ngang (TCN)',
                  type: 'concept',
                  children: [
                    { id: 'dk-tcn', label: 'Điều kiện: lim f(x) = b (x→±∞)', type: 'concept', children: [] },
                    { id: 'pt-tcn', label: 'Phương trình: y = b', type: 'concept', children: [] },
                    { id: 'y-nghia-tcn', label: 'Ý nghĩa: Đồ thị tiến gần đường y=b khi x→±∞', type: 'concept', children: [] },
                  ],
                },
                {
                  id: 'tiem-can-dung',
                  label: 'Tiệm cận đứng (TCĐ)',
                  type: 'concept',
                  children: [
                    { id: 'dk-tcd', label: 'Điều kiện: lim f(x) = ±∞ (x→x₀)', type: 'concept', children: [] },
                    { id: 'pt-tcd', label: 'Phương trình: x = x₀', type: 'concept', children: [] },
                    { id: 'y-nghia-tcd', label: 'Ý nghĩa: Đồ thị tiến ra ±∞ khi x→x₀', type: 'concept', children: [] },
                  ],
                },
                {
                  id: 'tiem-can-xien',
                  label: 'Tiệm cận xiên (TCX)',
                  type: 'concept',
                  children: [
                    { id: 'dk-tcx', label: 'Điều kiện: lim[f(x)-(ax+b)] = 0 (x→±∞)', type: 'concept', children: [] },
                    { id: 'pt-tcx', label: 'Phương trình: y = ax + b (a≠0)', type: 'concept', children: [] },
                    { id: 'cach-tim-tcx', label: 'Cách tìm: a=lim f(x)/x, b=lim[f(x)-ax]', type: 'concept', children: [] },
                  ],
                },
              ],
            },
            {
              id: 'do-thi-ham-so',
              label: 'Vẽ đồ thị hàm số',
              type: 'concept',
              children: [
                {
                  id: 'quy-trinh-ve',
                  label: 'Quy trình chung',
                  type: 'concept',
                  children: [
                    { id: 've-b1', label: 'Bước 1: Tìm TXĐ, đạo hàm', type: 'concept', children: [] },
                    { id: 've-b2', label: 'Bước 2: Xét biến thiên (đơn điệu, cực trị)', type: 'concept', children: [] },
                    { id: 've-b3', label: 'Bước 3: Tìm tiệm cận, giới hạn', type: 'concept', children: [] },
                    { id: 've-b4', label: 'Bước 4: Tìm điểm đặc biệt (giao trục, cực trị)', type: 'concept', children: [] },
                    { id: 've-b5', label: 'Bước 5: Vẽ đồ thị', type: 'concept', children: [] },
                  ],
                },
                {
                  id: 'dang-do-thi-co-dien',
                  label: 'Các dạng đồ thị cơ điển',
                  type: 'concept',
                  children: [
                    {
                      id: 'ham-bac-3',
                      label: 'Hàm bậc 3: y = ax³ + bx² + cx + d',
                      type: 'concept',
                      children: [
                        { id: 'b3-diem-uon', label: 'Điểm uốn I(x₀, y₀): x₀=-b/3a, đối xứng qua I', type: 'concept', children: [] },
                        { id: 'b3-cuc-tri', label: 'Có 2 cực trị ⟺ Δ = b²-3ac > 0', type: 'concept', children: [] },
                        { id: 'b3-dang', label: 'Dạng đồ thị: Hình chữ S kéo dài', type: 'concept', children: [] },
                      ],
                    },
                    {
                      id: 'ham-bac-4-trai',
                      label: 'Hàm bậc 4 trái dấu: y = ax⁴ + bx² + c',
                      type: 'concept',
                      children: [
                        { id: 'b4-doi-xung', label: 'Đối xứng qua Oy', type: 'concept', children: [] },
                        { id: 'b4-cuc-tri', label: 'Có 3 cực trị ⟺ ab < 0', type: 'concept', children: [] },
                        { id: 'b4-dang', label: 'Dạng: Chữ W (a>0) hoặc chữ M ngược (a<0)', type: 'concept', children: [] },
                      ],
                    },
                    {
                      id: 'ham-phan-thuc-bac-1',
                      label: 'Hàm phân thức bậc 1/bậc 1: y = (ax+b)/(cx+d)',
                      type: 'concept',
                      children: [
                        { id: 'pt-b1b1-tc', label: 'TCĐ: x = -d/c, TCN: y = a/c', type: 'concept', children: [] },
                        { id: 'pt-b1b1-tam', label: 'Tâm đối xứng: I(-d/c, a/c)', type: 'concept', children: [] },
                        { id: 'pt-b1b1-don-dieu', label: 'Đơn điệu trên mỗi khoảng xác định', type: 'concept', children: [] },
                      ],
                    },
                    {
                      id: 'ham-phan-thuc-bac-2',
                      label: 'Hàm phân thức bậc 2/bậc 1: y = (ax²+bx+c)/(mx+n)',
                      type: 'concept',
                      children: [
                        { id: 'pt-b2b1-tc', label: 'Có TCĐ và TCX (nếu a≠0)', type: 'concept', children: [] },
                        { id: 'pt-b2b1-cuc-tri', label: 'Có 2 cực trị ⟺ y\'=0 có 2 nghiệm phân biệt', type: 'concept', children: [] },
                        { id: 'pt-b2b1-tam', label: 'Tâm đối xứng: giao TCĐ và TCX', type: 'concept', children: [] },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              id: 'bai-toan-tham-so',
              label: 'Bài toán chứa tham số',
              type: 'concept',
              children: [
                { id: 'ts-don-dieu', label: 'Hàm đồng biến/nghịch biến trên K', type: 'concept', children: [] },
                { id: 'ts-cuc-tri', label: 'Hàm có cực trị thỏa điều kiện', type: 'concept', children: [] },
                { id: 'ts-max-min', label: 'Max/Min thỏa điều kiện', type: 'concept', children: [] },
                { id: 'ts-do-thi', label: 'Đồ thị thỏa điều kiện (tiếp tuyến, cắt,...)', type: 'concept', children: [] },
              ],
            },
          ],
        },

        // ============ Hàm số mũ - Logarit ============
        {
          id: 'ham-mu-logarit',
          label: 'HÀM SỐ MŨ - LOGARIT',
          type: 'subtopic',
          children: [
            {
              id: 'so-mu-can-bac-n',
              label: 'Số mũ và căn bậc n',
              type: 'concept',
              children: [
                { id: 'luy-thua-nguyen', label: 'Lũy thừa với số mũ nguyên: aⁿ', type: 'concept', children: [] },
                { id: 'can-bac-n', label: 'Căn bậc n: ⁿ√a (n∈ℕ*, n≥2)', type: 'concept', children: [] },
                { id: 'luy-thua-huu-ti', label: 'Lũy thừa với số mũ hữu tỉ: a^(m/n)', type: 'concept', children: [] },
                { id: 'luy-thua-thuc', label: 'Lũy thừa với số mũ thực: a^α (α∈ℝ)', type: 'concept', children: [] },
              ],
            },
            {
              id: 'tinh-chat-luy-thua',
              label: 'Tính chất lũy thừa',
              type: 'concept',
              children: [
                { id: 'tc-tich', label: 'Tích: aᵐ · aⁿ = a^(m+n)', type: 'concept', children: [] },
                { id: 'tc-thuong', label: 'Thương: aᵐ / aⁿ = a^(m-n)', type: 'concept', children: [] },
                { id: 'tc-luy-thua', label: 'Lũy thừa của lũy thừa: (aᵐ)ⁿ = a^(mn)', type: 'concept', children: [] },
                { id: 'tc-tich-luy-thua', label: 'Tích lũy thừa: (ab)ⁿ = aⁿbⁿ', type: 'concept', children: [] },
                { id: 'tc-so-sanh', label: 'So sánh: Nếu a>1: m<n ⇔ aᵐ<aⁿ; Nếu 0<a<1: m<n ⇔ aᵐ>aⁿ', type: 'concept', children: [] },
              ],
            },
            {
              id: 'ham-so-luy-thua',
              label: 'Hàm số lũy thừa y = xᵅ',
              type: 'concept',
              children: [
                { id: 'txd-luy-thua', label: 'TXĐ: Phụ thuộc α (D=ℝ hoặc D=(0;+∞))', type: 'concept', children: [] },
                { id: 'dao-ham-luy-thua', label: 'Đạo hàm: (xᵅ)\' = α·x^(α-1)', type: 'concept', children: [] },
                { id: 'don-dieu-luy-thua', label: 'Đơn điệu: α>0 đồng biến, α<0 nghịch biến trên (0;+∞)', type: 'concept', children: [] },
                { id: 'do-thi-luy-thua', label: 'Đồ thị: Qua (1,1), dạng phụ thuộc α', type: 'concept', children: [] },
              ],
            },
            {
              id: 'logarit-khai-niem',
              label: 'Khái niệm Logarit',
              type: 'concept',
              children: [
                { id: 'dinh-nghia-log', label: 'Định nghĩa: log_a(b) = c ⟺ aᶜ = b (a>0, a≠1, b>0)', type: 'concept', children: [] },
                { id: 'log-dac-biet', label: 'Logarit đặc biệt: ln(x) = log_e(x), lg(x) = log₁₀(x)', type: 'concept', children: [] },
                { id: 'tinh-chat-co-ban-log', label: 'Tính chất: log_a(1)=0, log_a(a)=1, log_a(aᵇ)=b', type: 'concept', children: [] },
              ],
            },
            {
              id: 'tinh-chat-logarit',
              label: 'Tính chất và quy tắc Logarit',
              type: 'concept',
              children: [
                { id: 'log-tich', label: 'Logarit tích: log_a(xy) = log_a(x) + log_a(y)', type: 'concept', children: [] },
                { id: 'log-thuong', label: 'Logarit thương: log_a(x/y) = log_a(x) - log_a(y)', type: 'concept', children: [] },
                { id: 'log-luy-thua', label: 'Logarit lũy thừa: log_a(xⁿ) = n·log_a(x)', type: 'concept', children: [] },
                { id: 'log-doi-co-so', label: 'Đổi cơ số: log_a(b) = log_c(b)/log_c(a) = 1/log_b(a)', type: 'concept', children: [] },
              ],
            },
            {
              id: 'ham-so-mu',
              label: 'Hàm số mũ y = aˣ',
              type: 'concept',
              children: [
                { id: 'txd-ham-mu', label: 'TXĐ: D = ℝ, TGT: (0; +∞)', type: 'concept', children: [] },
                { id: 'dao-ham-ham-mu', label: 'Đạo hàm: (aˣ)\' = aˣ·ln(a), (eˣ)\' = eˣ', type: 'concept', children: [] },
                { id: 'don-dieu-ham-mu', label: 'Đơn điệu: a>1 đồng biến, 0<a<1 nghịch biến', type: 'concept', children: [] },
                { id: 'do-thi-ham-mu', label: 'Đồ thị: Qua (0,1), tiệm cận ngang y=0', type: 'concept', children: [] },
              ],
            },
            {
              id: 'ham-so-logarit',
              label: 'Hàm số Logarit y = log_a(x)',
              type: 'concept',
              children: [
                { id: 'txd-ham-log', label: 'TXĐ: D = (0; +∞), TGT: ℝ', type: 'concept', children: [] },
                { id: 'dao-ham-ham-log', label: 'Đạo hàm: (log_a(x))\' = 1/(x·ln(a)), (ln(x))\' = 1/x', type: 'concept', children: [] },
                { id: 'don-dieu-ham-log', label: 'Đơn điệu: a>1 đồng biến, 0<a<1 nghịch biến', type: 'concept', children: [] },
                { id: 'do-thi-ham-log', label: 'Đồ thị: Qua (1,0), tiệm cận đứng x=0, đối xứng hàm mũ qua y=x', type: 'concept', children: [] },
              ],
            },
            {
              id: 'phuong-trinh-mu',
              label: 'Phương trình mũ',
              type: 'concept',
              children: [
                { id: 'pt-mu-co-ban', label: 'Cơ bản: aˣ = b ⟺ x = log_a(b) (b>0)', type: 'concept', children: [] },
                { id: 'pt-mu-cung-co-so', label: 'PP đưa về cùng cơ số: a^f(x) = a^g(x) ⟺ f(x) = g(x)', type: 'concept', children: [] },
                { id: 'pt-mu-dat-an', label: 'PP đặt ẩn phụ: Đặt t = aˣ (t>0)', type: 'concept', children: [] },
                { id: 'pt-mu-logarit-hoa', label: 'PP Logarit hóa: Lấy logarit hai vế', type: 'concept', children: [] },
              ],
            },
            {
              id: 'phuong-trinh-logarit',
              label: 'Phương trình Logarit',
              type: 'concept',
              children: [
                { id: 'pt-log-co-ban', label: 'Cơ bản: log_a(x) = b ⟺ x = aᵇ', type: 'concept', children: [] },
                { id: 'pt-log-cung-co-so', label: 'PP đưa về cùng cơ số: log_a(f(x)) = log_a(g(x)) ⟺ f(x) = g(x) > 0', type: 'concept', children: [] },
                { id: 'pt-log-dat-an', label: 'PP đặt ẩn phụ: Đặt t = log_a(x)', type: 'concept', children: [] },
                { id: 'pt-log-mu-hoa', label: 'PP mũ hóa: Dùng a^(log_a(x)) = x', type: 'concept', children: [] },
              ],
            },
            {
              id: 'bat-phuong-trinh-mu-log',
              label: 'Bất phương trình mũ và Logarit',
              type: 'concept',
              children: [
                { id: 'bpt-mu-co-ban', label: 'BPT mũ cơ bản: Xét a>1 hoặc 0<a<1, chú ý đổi chiều', type: 'concept', children: [] },
                { id: 'bpt-log-co-ban', label: 'BPT logarit cơ bản: Điều kiện x>0, chú ý đổi chiều theo cơ số', type: 'concept', children: [] },
                { id: 'bpt-mu-log-pp', label: 'PP giải: Đưa về cùng cơ số, đặt ẩn phụ, logarit/mũ hóa', type: 'concept', children: [] },
              ],
            },
          ],
        },

        // ============ Nguyên hàm - Tích phân ============
        {
          id: 'nguyen-ham-tich-phan',
          label: 'NGUYÊN HÀM - TÍCH PHÂN',
          type: 'subtopic',
          children: [
            {
              id: 'nguyen-ham',
              label: 'Nguyên hàm',
              type: 'concept',
              children: [
                {
                  id: 'khai-niem-nguyen-ham',
                  label: 'Khái niệm',
                  type: 'concept',
                  children: [
                    { id: 'dinh-nghia-nh', label: 'Định nghĩa: F(x) là nguyên hàm của f(x) ⟺ F\'(x) = f(x)', type: 'concept', children: [] },
                    { id: 'ho-nguyen-ham', label: 'Họ nguyên hàm: ∫f(x)dx = F(x) + C', type: 'concept', children: [] },
                    { id: 'y-nghia-nh', label: 'Ý nghĩa: Phép toán ngược của đạo hàm', type: 'concept', children: [] },
                  ],
                },
                {
                  id: 'tinh-chat-nguyen-ham',
                  label: 'Tính chất',
                  type: 'concept',
                  children: [
                    { id: 'nh-tong', label: 'Tổng: ∫[f(x) ± g(x)]dx = ∫f(x)dx ± ∫g(x)dx', type: 'concept', children: [] },
                    { id: 'nh-hang-so', label: 'Nhân hằng số: ∫k·f(x)dx = k·∫f(x)dx', type: 'concept', children: [] },
                  ],
                },
                {
                  id: 'bang-nguyen-ham',
                  label: 'Bảng nguyên hàm cơ bản',
                  type: 'concept',
                  children: [
                    { id: 'nh-luy-thua', label: '∫xⁿdx = x^(n+1)/(n+1) + C (n≠-1)', type: 'concept', children: [] },
                    { id: 'nh-1-x', label: '∫(1/x)dx = ln|x| + C', type: 'concept', children: [] },
                    { id: 'nh-mu', label: '∫eˣdx = eˣ + C, ∫aˣdx = aˣ/ln(a) + C', type: 'concept', children: [] },
                    { id: 'nh-sin-cos', label: '∫sin(x)dx = -cos(x) + C, ∫cos(x)dx = sin(x) + C', type: 'concept', children: [] },
                    { id: 'nh-tang', label: '∫tan(x)dx = -ln|cos(x)| + C, ∫cot(x)dx = ln|sin(x)| + C', type: 'concept', children: [] },
                    { id: 'nh-1-cos2', label: '∫1/cos²(x)dx = tan(x) + C, ∫1/sin²(x)dx = -cot(x) + C', type: 'concept', children: [] },
                  ],
                },
                {
                  id: 'pp-tinh-nguyen-ham',
                  label: 'Phương pháp tính nguyên hàm',
                  type: 'concept',
                  children: [
                    {
                      id: 'pp-doi-bien',
                      label: 'Phương pháp đổi biến số',
                      type: 'concept',
                      children: [
                        { id: 'doi-bien-t-u', label: 'Đặt u = u(x), du = u\'(x)dx', type: 'concept', children: [] },
                        { id: 'doi-bien-vi-du', label: 'VD: ∫f(u(x))·u\'(x)dx, đặt t=u(x)', type: 'concept', children: [] },
                      ],
                    },
                    {
                      id: 'pp-tung-phan',
                      label: 'Phương pháp từng phần',
                      type: 'concept',
                      children: [
                        { id: 'cong-thuc-tp', label: 'Công thức: ∫u·dv = u·v - ∫v·du', type: 'concept', children: [] },
                        { id: 'chon-u-dv', label: 'Chọn u, dv sao cho ∫v·du dễ tính hơn ∫u·dv', type: 'concept', children: [] },
                        { id: 'tp-da-thuc-ln', label: 'Dạng: ∫P(x)·ln(x)dx, ∫P(x)·eˣdx, ∫P(x)·sin/cos(x)dx', type: 'concept', children: [] },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              id: 'tich-phan',
              label: 'Tích phân',
              type: 'concept',
              children: [
                {
                  id: 'khai-niem-tich-phan',
                  label: 'Khái niệm',
                  type: 'concept',
                  children: [
                    { id: 'dinh-nghia-tp', label: 'Định nghĩa: ∫[a→b]f(x)dx = F(b) - F(a)', type: 'concept', children: [] },
                    { id: 'y-nghia-tp', label: 'Ý nghĩa hình học: Diện tích hình phẳng giới hạn bởi đồ thị', type: 'concept', children: [] },
                  ],
                },
                {
                  id: 'tinh-chat-tich-phan',
                  label: 'Tính chất tích phân',
                  type: 'concept',
                  children: [
                    { id: 'tp-doi-can', label: '∫[a→b]f(x)dx = -∫[b→a]f(x)dx', type: 'concept', children: [] },
                    { id: 'tp-tach-can', label: '∫[a→b]f(x)dx = ∫[a→c]f(x)dx + ∫[c→b]f(x)dx', type: 'concept', children: [] },
                    { id: 'tp-tong', label: '∫[a→b][f(x)±g(x)]dx = ∫[a→b]f(x)dx ± ∫[a→b]g(x)dx', type: 'concept', children: [] },
                    { id: 'tp-hang-so', label: '∫[a→b]k·f(x)dx = k·∫[a→b]f(x)dx', type: 'concept', children: [] },
                  ],
                },
                {
                  id: 'pp-tinh-tich-phan',
                  label: 'Phương pháp tính tích phân',
                  type: 'concept',
                  children: [
                    {
                      id: 'tp-doi-bien',
                      label: 'Đổi biến số',
                      type: 'concept',
                      children: [
                        { id: 'tp-doi-bien-ct', label: 'Công thức: ∫[a→b]f(u(x))·u\'(x)dx = ∫[u(a)→u(b)]f(t)dt', type: 'concept', children: [] },
                        { id: 'tp-doi-bien-chu-y', label: 'Chú ý: Đổi cận hoặc trở về biến cũ', type: 'concept', children: [] },
                      ],
                    },
                    {
                      id: 'tp-tung-phan',
                      label: 'Từng phần',
                      type: 'concept',
                      children: [
                        { id: 'tp-tung-phan-ct', label: 'Công thức: ∫[a→b]u·dv = [u·v][a→b] - ∫[a→b]v·du', type: 'concept', children: [] },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              id: 'ung-dung-tich-phan',
              label: 'Ứng dụng tích phân',
              type: 'concept',
              children: [
                {
                  id: 'dien-tich-hinh-phang',
                  label: 'Diện tích hình phẳng',
                  type: 'concept',
                  children: [
                    { id: 'dt-1-do-thi', label: 'Giới hạn bởi 1 đồ thị: S = ∫[a→b]|f(x)|dx', type: 'concept', children: [] },
                    { id: 'dt-2-do-thi', label: 'Giữa 2 đồ thị: S = ∫[a→b]|f(x) - g(x)|dx', type: 'concept', children: [] },
                    { id: 'dt-toa-do-cuc', label: 'Tọa độ cực: S = (1/2)∫[α→β]r²(θ)dθ', type: 'concept', children: [] },
                  ],
                },
                {
                  id: 'the-tich-vat-quay',
                  label: 'Thể tích vật thể tròn xoay',
                  type: 'concept',
                  children: [
                    { id: 'tt-quay-ox', label: 'Quay quanh Ox: V = π∫[a→b]f²(x)dx', type: 'concept', children: [] },
                    { id: 'tt-quay-oy', label: 'Quay quanh Oy: V = π∫[c→d]x²(y)dy', type: 'concept', children: [] },
                    { id: 'tt-giua-2-do-thi', label: 'Giữa 2 đồ thị: V = π∫[a→b][f²(x) - g²(x)]dx', type: 'concept', children: [] },
                  ],
                },
              ],
            },
          ],
        },

        // ============ Số phức ============
        {
          id: 'so-phuc',
          label: 'SỐ PHỨC',
          type: 'subtopic',
          children: [
            {
              id: 'khai-niem-so-phuc',
              label: 'Khái niệm số phức',
              type: 'concept',
              children: [
                { id: 'don-vi-ao', label: 'Đơn vị ảo: i² = -1, i = √(-1)', type: 'concept', children: [] },
                { id: 'dinh-nghia-sp', label: 'Định nghĩa: z = a + bi (a, b ∈ ℝ)', type: 'concept', children: [] },
                { id: 'phan-thuc-ao', label: 'Phần thực: Re(z) = a, Phần ảo: Im(z) = b', type: 'concept', children: [] },
                { id: 'sp-bang-nhau', label: 'Bằng nhau: a+bi = c+di ⟺ a=c và b=d', type: 'concept', children: [] },
              ],
            },
            {
              id: 'bieu-dien-so-phuc',
              label: 'Biểu diễn số phức',
              type: 'concept',
              children: [
                { id: 'mat-phang-phuc', label: 'Mặt phẳng phức: Điểm M(a,b) biểu diễn z = a+bi', type: 'concept', children: [] },
                { id: 'vec-to-sp', label: 'Vector: OM⃗ = (a,b) biểu diễn z = a+bi', type: 'concept', children: [] },
              ],
            },
            {
              id: 'so-phuc-lien-hop',
              label: 'Số phức liên hợp',
              type: 'concept',
              children: [
                { id: 'dinh-nghia-lh', label: 'Định nghĩa: z̄ = a - bi là liên hợp của z = a+bi', type: 'concept', children: [] },
                { id: 'tinh-chat-lh', label: 'Tính chất: z + z̄ = 2a, z·z̄ = a² + b²', type: 'concept', children: [] },
                { id: 'bieu-dien-lh', label: 'Biểu diễn: Đối xứng qua trục thực Ox', type: 'concept', children: [] },
              ],
            },
            {
              id: 'modun-so-phuc',
              label: 'Mô-đun số phức',
              type: 'concept',
              children: [
                { id: 'dinh-nghia-modun', label: 'Định nghĩa: |z| = √(a² + b²)', type: 'concept', children: [] },
                { id: 'y-nghia-modun', label: 'Ý nghĩa: Khoảng cách từ O đến M, độ dài OM⃗', type: 'concept', children: [] },
                { id: 'tinh-chat-modun', label: 'Tính chất: |z·w| = |z|·|w|, |z/w| = |z|/|w|', type: 'concept', children: [] },
              ],
            },
            {
              id: 'phep-toan-so-phuc',
              label: 'Các phép toán',
              type: 'concept',
              children: [
                { id: 'cong-sp', label: 'Cộng: (a+bi) + (c+di) = (a+c) + (b+d)i', type: 'concept', children: [] },
                { id: 'tru-sp', label: 'Trừ: (a+bi) - (c+di) = (a-c) + (b-d)i', type: 'concept', children: [] },
                { id: 'nhan-sp', label: 'Nhân: (a+bi)(c+di) = (ac-bd) + (ad+bc)i', type: 'concept', children: [] },
                { id: 'chia-sp', label: 'Chia: (a+bi)/(c+di) = [(a+bi)(c-di)]/[c²+d²]', type: 'concept', children: [] },
              ],
            },
            {
              id: 'phuong-trinh-bac-2-sp',
              label: 'Phương trình bậc 2 trên ℂ',
              type: 'concept',
              children: [
                { id: 'can-bac-2-am', label: 'Căn bậc 2 số âm: √(-a) = i√a (a>0)', type: 'concept', children: [] },
                { id: 'pt-bac-2-delta-am', label: 'Nếu Δ < 0: x = (-b ± i√|Δ|)/(2a)', type: 'concept', children: [] },
                { id: 'pt-bac-2-delta-duong', label: 'Nếu Δ ≥ 0: Nghiệm thực như thường', type: 'concept', children: [] },
              ],
            },
            {
              id: 'tap-hop-diem-sp',
              label: 'Tập hợp điểm (Nâng cao)',
              type: 'concept',
              children: [
                { id: 'duong-tron-sp', label: 'Đường tròn: |z - z₀| = R', type: 'concept', children: [] },
                { id: 'duong-thang-sp', label: 'Đường thẳng: |z - z₁| = |z - z₂|', type: 'concept', children: [] },
                { id: 'elip-sp', label: 'Elip: |z - z₁| + |z - z₂| = 2a', type: 'concept', children: [] },
              ],
            },
          ],
        },
      ],
    },

    //================== HÌNH HỌC 12 ==================
    {
      id: 'hinh-hoc-12',
      label: 'HÌNH HỌC KHÔNG GIAN',
      type: 'topic',
      children: [
        // ============ Khối đa diện ============
        {
          id: 'khoi-da-dien',
          label: 'KHỐI ĐA DIỆN',
          type: 'subtopic',
          children: [
            {
              id: 'khai-niem-da-dien',
              label: 'Khái niệm hình đa diện',
              type: 'concept',
              children: [
                { id: 'dinh-nghia-hda', label: 'Hình đa diện: Hình gồm các đa giác phẳng ghép lại', type: 'concept', children: [] },
                { id: 'cac-thanh-phan', label: 'Thành phần: Đỉnh, cạnh, mặt', type: 'concept', children: [] },
                { id: 'da-dien-loi', label: 'Đa diện lồi: Luôn nằm về một phía của mỗi mặt', type: 'concept', children: [] },
              ],
            },
            {
              id: 'da-dien-deu',
              label: 'Khối đa diện đều',
              type: 'concept',
              children: [
                { id: 'dinh-nghia-ddd', label: 'Định nghĩa: Các mặt là đa giác đều bằng nhau, các đỉnh đều như nhau', type: 'concept', children: [] },
                { id: 'nam-loai-ddd', label: '5 loại: Tứ diện, Lục diện, Bát diện, Thập nhị diện, Nhị thập diện', type: 'concept', children: [] },
                { id: 'ky-hieu-ddd', label: 'Ký hiệu {p; q}: p cạnh/mặt, q mặt/đỉnh', type: 'concept', children: [] },
              ],
            },
            {
              id: 'khoi-chop',
              label: 'Khối chóp',
              type: 'concept',
              children: [
                {
                  id: 'khai-niem-chop',
                  label: 'Khái niệm',
                  type: 'concept',
                  children: [
                    { id: 'dinh-nghia-chop', label: 'Khối chóp: Đáy là đa giác, các mặt bên là tam giác chung đỉnh', type: 'concept', children: [] },
                    { id: 'chop-deu', label: 'Chóp đều: Đáy là đa giác đều, chân đường cao trùng tâm đáy', type: 'concept', children: [] },
                  ],
                },
                {
                  id: 'the-tich-chop',
                  label: 'Thể tích khối chóp',
                  type: 'concept',
                  children: [
                    { id: 'cong-thuc-chop', label: 'Công thức: V = (1/3)·S_đáy·h', type: 'concept', children: [] },
                    { id: 'chop-cat', label: 'Chóp cụt: V = (h/3)·(S₁ + S₂ + √(S₁S₂))', type: 'concept', children: [] },
                  ],
                },
              ],
            },
            {
              id: 'khoi-lang-tru',
              label: 'Khối lăng trụ',
              type: 'concept',
              children: [
                {
                  id: 'khai-niem-lang-tru',
                  label: 'Khái niệm',
                  type: 'concept',
                  children: [
                    { id: 'dinh-nghia-lt', label: 'Lăng trụ: Hai đáy là hai đa giác song song bằng nhau', type: 'concept', children: [] },
                    { id: 'lt-dung', label: 'Lăng trụ đứng: Cạnh bên vuông góc đáy', type: 'concept', children: [] },
                    { id: 'lt-deu', label: 'Lăng trụ đều: Lăng trụ đứng có đáy là đa giác đều', type: 'concept', children: [] },
                  ],
                },
                {
                  id: 'the-tich-lang-tru',
                  label: 'Thể tích',
                  type: 'concept',
                  children: [
                    { id: 'cong-thuc-lt', label: 'Công thức: V = S_đáy · h', type: 'concept', children: [] },
                  ],
                },
              ],
            },
            {
              id: 'ti-so-the-tich',
              label: 'Tỉ số thể tích',
              type: 'concept',
              children: [
                { id: 'ty-so-simson', label: 'Công thức Simson: V_ABCD.A\'B\'C\'D\'/V_SABCD = AA\'/SA', type: 'concept', children: [] },
                { id: 'ty-so-mat-cat', label: 'Mặt phẳng cắt: Tính theo tỉ lệ các đoạn', type: 'concept', children: [] },
              ],
            },
          ],
        },

        // ============ Mặt tròn xoay ============
        {
          id: 'mat-tron-xoay',
          label: 'MẶT NÓN - MẶT TRỤ - MẶT CẦU',
          type: 'subtopic',
          children: [
            {
              id: 'mat-cau',
              label: 'Mặt cầu',
              type: 'concept',
              children: [
                {
                  id: 'khai-niem-mat-cau',
                  label: 'Khái niệm',
                  type: 'concept',
                  children: [
                    { id: 'dinh-nghia-mc', label: 'Định nghĩa: Tập hợp điểm cách I cố định một khoảng R', type: 'concept', children: [] },
                    { id: 'phuong-trinh-mc', label: 'Phương trình: (x-a)² + (y-b)² + (z-c)² = R²', type: 'concept', children: [] },
                  ],
                },
                {
                  id: 'vi-tri-tuong-doi-mc',
                  label: 'Vị trí tương đối',
                  type: 'concept',
                  children: [
                    { id: 'mc-mat-phang', label: 'Với mặt phẳng: d(I,(P)) so với R', type: 'concept', children: [] },
                    { id: 'mc-duong-thang', label: 'Với đường thẳng: d(I,d) so với R', type: 'concept', children: [] },
                  ],
                },
                {
                  id: 'dien-tich-the-tich-mc',
                  label: 'Diện tích và thể tích',
                  type: 'concept',
                  children: [
                    { id: 'dt-mat-cau', label: 'Diện tích mặt cầu: S = 4πR²', type: 'concept', children: [] },
                    { id: 'tt-khoi-cau', label: 'Thể tích khối cầu: V = (4/3)πR³', type: 'concept', children: [] },
                  ],
                },
              ],
            },
            {
              id: 'mat-non',
              label: 'Mặt nón',
              type: 'concept',
              children: [
                {
                  id: 'khai-niem-mat-non',
                  label: 'Khái niệm',
                  type: 'concept',
                  children: [
                    { id: 'dinh-nghia-mn', label: 'Mặt nón: Đường thẳng d quay quanh trục Δ', type: 'concept', children: [] },
                    { id: 'hinh-non', label: 'Hình nón: Khối tròn xoay sinh bởi tam giác vuông quay quanh cạnh góc vuông', type: 'concept', children: [] },
                    { id: 'yeu-to-non', label: 'Yếu tố: Bán kính đáy r, chiều cao h, đường sinh l (l² = r² + h²)', type: 'concept', children: [] },
                  ],
                },
                {
                  id: 'dien-tich-the-tich-non',
                  label: 'Diện tích và thể tích',
                  type: 'concept',
                  children: [
                    { id: 'dt-xung-quanh-non', label: 'Diện tích xung quanh: S_xq = πrl', type: 'concept', children: [] },
                    { id: 'dt-toan-phan-non', label: 'Diện tích toàn phần: S_tp = πrl + πr²', type: 'concept', children: [] },
                    { id: 'tt-khoi-non', label: 'Thể tích khối nón: V = (1/3)πr²h', type: 'concept', children: [] },
                  ],
                },
              ],
            },
            {
              id: 'mat-tru',
              label: 'Mặt trụ',
              type: 'concept',
              children: [
                {
                  id: 'khai-niem-mat-tru',
                  label: 'Khái niệm',
                  type: 'concept',
                  children: [
                    { id: 'dinh-nghia-mt', label: 'Mặt trụ: Đường thẳng d song song và cách trục Δ một khoảng r', type: 'concept', children: [] },
                    { id: 'hinh-tru', label: 'Hình trụ: Khối tròn xoay sinh bởi hình chữ nhật quay quanh một cạnh', type: 'concept', children: [] },
                    { id: 'yeu-to-tru', label: 'Yếu tố: Bán kính đáy r, chiều cao h', type: 'concept', children: [] },
                  ],
                },
                {
                  id: 'dien-tich-the-tich-tru',
                  label: 'Diện tích và thể tích',
                  type: 'concept',
                  children: [
                    { id: 'dt-xung-quanh-tru', label: 'Diện tích xung quanh: S_xq = 2πrh', type: 'concept', children: [] },
                    { id: 'dt-toan-phan-tru', label: 'Diện tích toàn phần: S_tp = 2πrh + 2πr²', type: 'concept', children: [] },
                    { id: 'tt-khoi-tru', label: 'Thể tích khối trụ: V = πr²h', type: 'concept', children: [] },
                  ],
                },
              ],
            },
          ],
        },

        // ============ Hệ tọa độ Oxyz ============
        {
          id: 'toa-do-khong-gian',
          label: 'HỆ TỌA ĐỘ TRONG KHÔNG GIAN',
          type: 'subtopic',
          children: [
            {
              id: 'he-toa-do-oxyz',
              label: 'Hệ tọa độ Oxyz',
              type: 'concept',
              children: [
                {
                  id: 'toa-do-diem-vector',
                  label: 'Tọa độ điểm và vector',
                  type: 'concept',
                  children: [
                    { id: 'diem-oxyz', label: 'Điểm M(x; y; z) trong không gian', type: 'concept', children: [] },
                    { id: 'vec-to-oxyz', label: 'Vector a⃗ = (x; y; z) = x·i⃗ + y·j⃗ + z·k⃗', type: 'concept', children: [] },
                    { id: 'vec-to-ab', label: 'AB⃗ = (x_B - x_A; y_B - y_A; z_B - z_A)', type: 'concept', children: [] },
                  ],
                },
                {
                  id: 'phep-toan-vector',
                  label: 'Các phép toán vector',
                  type: 'concept',
                  children: [
                    { id: 'cong-vec-to', label: 'Cộng: a⃗ + b⃗ = (x₁+x₂; y₁+y₂; z₁+z₂)', type: 'concept', children: [] },
                    { id: 'nhan-k', label: 'Nhân số: k·a⃗ = (kx; ky; kz)', type: 'concept', children: [] },
                    { id: 'do-dai-vec-to', label: 'Độ dài: |a⃗| = √(x² + y² + z²)', type: 'concept', children: [] },
                    { id: 'khoang-cach-2-diem', label: 'Khoảng cách: AB = √[(x_B-x_A)² + (y_B-y_A)² + (z_B-z_A)²]', type: 'concept', children: [] },
                  ],
                },
                {
                  id: 'tich-vo-huong',
                  label: 'Tích vô hướng',
                  type: 'concept',
                  children: [
                    { id: 'dinh-nghia-tvh', label: 'Định nghĩa: a⃗·b⃗ = x₁x₂ + y₁y₂ + z₁z₂', type: 'concept', children: [] },
                    { id: 'goc-2-vec-to', label: 'Góc: cos(a⃗,b⃗) = (a⃗·b⃗)/(|a⃗|·|b⃗|)', type: 'concept', children: [] },
                    { id: 'vuong-goc', label: 'Vuông góc: a⃗ ⊥ b⃗ ⟺ a⃗·b⃗ = 0', type: 'concept', children: [] },
                  ],
                },
                {
                  id: 'tich-co-huong',
                  label: 'Tích có hướng',
                  type: 'concept',
                  children: [
                    { id: 'dinh-nghia-tch', label: 'Định nghĩa: [a⃗,b⃗] = (y₁z₂-z₁y₂; z₁x₂-x₁z₂; x₁y₂-y₁x₂)', type: 'concept', children: [] },
                    { id: 'tinh-chat-tch', label: 'Tính chất: [a⃗,b⃗] ⊥ a⃗ và [a⃗,b⃗] ⊥ b⃗', type: 'concept', children: [] },
                    { id: 'song-song-vec-to', label: 'Song song: a⃗ // b⃗ ⟺ [a⃗,b⃗] = 0⃗', type: 'concept', children: [] },
                  ],
                },
                {
                  id: 'ung-dung-tich-co-huong',
                  label: 'Ứng dụng',
                  type: 'concept',
                  children: [
                    { id: 'dt-hinh-binh-hanh', label: 'Diện tích hình bình hành: S = |[a⃗,b⃗]|', type: 'concept', children: [] },
                    { id: 'dt-tam-giac', label: 'Diện tích tam giác: S = (1/2)|[AB⃗,AC⃗]|', type: 'concept', children: [] },
                    { id: 'tt-tu-dien', label: 'Thể tích tứ diện: V = (1/6)|[AB⃗,AC⃗]·AD⃗|', type: 'concept', children: [] },
                    { id: 'dong-phang', label: 'Đồng phẳng: [AB⃗,AC⃗]·AD⃗ = 0', type: 'concept', children: [] },
                  ],
                },
              ],
            },
            {
              id: 'phuong-trinh-mat-phang',
              label: 'Phương trình mặt phẳng',
              type: 'concept',
              children: [
                {
                  id: 'vec-to-phap-tuyen',
                  label: 'Vector pháp tuyến',
                  type: 'concept',
                  children: [
                    { id: 'dinh-nghia-vtpt', label: 'Định nghĩa: n⃗ ⊥ (P) gọi là VTPT của (P)', type: 'concept', children: [] },
                    { id: 'cach-tim-vtpt', label: 'Cách tìm: n⃗ = [a⃗,b⃗] với a⃗, b⃗ nằm trong (P)', type: 'concept', children: [] },
                  ],
                },
                {
                  id: 'pt-tong-quat-mp',
                  label: 'Phương trình tổng quát',
                  type: 'concept',
                  children: [
                    { id: 'pt-mp-tq', label: 'PT: Ax + By + Cz + D = 0', type: 'concept', children: [] },
                    { id: 'vtpt-mp', label: 'VTPT: n⃗ = (A; B; C)', type: 'concept', children: [] },
                    { id: 'mp-qua-diem', label: 'Qua M(x₀;y₀;z₀), VTPT n⃗: A(x-x₀) + B(y-y₀) + C(z-z₀) = 0', type: 'concept', children: [] },
                  ],
                },
                {
                  id: 'cac-dang-dac-biet-mp',
                  label: 'Các dạng đặc biệt',
                  type: 'concept',
                  children: [
                    { id: 'mp-toa-do', label: 'Mặt phẳng tọa độ: (Oxy), (Oyz), (Oxz)', type: 'concept', children: [] },
                    { id: 'mp-song-song-toa-do', label: 'Song song tọa độ: x=a, y=b, z=c', type: 'concept', children: [] },
                    { id: 'mp-doan-chan', label: 'Đoạn chắn: x/a + y/b + z/c = 1', type: 'concept', children: [] },
                    { id: 'mp-3-diem', label: 'Qua 3 điểm: Dùng điều kiện đồng phẳng', type: 'concept', children: [] },
                  ],
                },
                {
                  id: 'vi-tri-tuong-doi-mp',
                  label: 'Vị trí tương đối 2 mặt phẳng',
                  type: 'concept',
                  children: [
                    { id: 'mp-song-song', label: 'Song song: n⃗₁ // n⃗₂ và không trùng', type: 'concept', children: [] },
                    { id: 'mp-trung', label: 'Trùng nhau: n⃗₁ // n⃗₂ và qua cùng điểm', type: 'concept', children: [] },
                    { id: 'mp-cat', label: 'Cắt nhau: n⃗₁ không // n⃗₂', type: 'concept', children: [] },
                    { id: 'mp-vuong-goc', label: 'Vuông góc: n⃗₁ · n⃗₂ = 0', type: 'concept', children: [] },
                  ],
                },
              ],
            },
            {
              id: 'phuong-trinh-duong-thang',
              label: 'Phương trình đường thẳng',
              type: 'concept',
              children: [
                {
                  id: 'vec-to-chi-phuong',
                  label: 'Vector chỉ phương',
                  type: 'concept',
                  children: [
                    { id: 'dinh-nghia-vtcp', label: 'Định nghĩa: u⃗ // d gọi là VTCP của d', type: 'concept', children: [] },
                    { id: 'cach-tim-vtcp', label: 'Cách tìm: u⃗ = [n⃗₁,n⃗₂] với d = (P₁)∩(P₂)', type: 'concept', children: [] },
                  ],
                },
                {
                  id: 'pt-tham-so-dt',
                  label: 'Phương trình tham số',
                  type: 'concept',
                  children: [
                    { id: 'pt-ts', label: 'PT: {x = x₀ + at, y = y₀ + bt, z = z₀ + ct}', type: 'concept', children: [] },
                    { id: 'vtcp-dt', label: 'VTCP: u⃗ = (a; b; c)', type: 'concept', children: [] },
                    { id: 'diem-dt', label: 'Qua điểm: M₀(x₀; y₀; z₀)', type: 'concept', children: [] },
                  ],
                },
                {
                  id: 'pt-chinh-tac-dt',
                  label: 'Phương trình chính tắc',
                  type: 'concept',
                  children: [
                    { id: 'pt-ct', label: 'PT: (x-x₀)/a = (y-y₀)/b = (z-z₀)/c', type: 'concept', children: [] },
                    { id: 'dk-pt-ct', label: 'Điều kiện: a, b, c ≠ 0', type: 'concept', children: [] },
                  ],
                },
                {
                  id: 'cac-dang-dac-biet-dt',
                  label: 'Các dạng đặc biệt',
                  type: 'concept',
                  children: [
                    { id: 'dt-qua-2-diem', label: 'Qua 2 điểm: u⃗ = AB⃗', type: 'concept', children: [] },
                    { id: 'dt-giao-2-mp', label: 'Giao 2 mặt phẳng: Giải hệ PT 2 mặt', type: 'concept', children: [] },
                  ],
                },
                {
                  id: 'vi-tri-tuong-doi-dt',
                  label: 'Vị trí tương đối',
                  type: 'concept',
                  children: [
                    { id: 'dt-mp', label: 'Đường và mặt: u⃗·n⃗ = 0 (song song hoặc nằm trong)', type: 'concept', children: [] },
                    { id: '2-dt', label: '2 đường: Xét u⃗₁ và u⃗₂ (song song, trùng, chéo, cắt)', type: 'concept', children: [] },
                    { id: 'dt-vuong-goc', label: 'Vuông góc: u⃗₁ · u⃗₂ = 0', type: 'concept', children: [] },
                  ],
                },
              ],
            },
            {
              id: 'goc-khoang-cach',
              label: 'Góc và khoảng cách',
              type: 'concept',
              children: [
                {
                  id: 'cac-loai-goc',
                  label: 'Các loại góc',
                  type: 'concept',
                  children: [
                    { id: 'goc-2-dt', label: 'Giữa 2 đường thẳng: cos φ = |u⃗₁·u⃗₂|/(|u⃗₁|·|u⃗₂|)', type: 'concept', children: [] },
                    { id: 'goc-dt-mp', label: 'Giữa đường và mặt: sin φ = |u⃗·n⃗|/(|u⃗|·|n⃗|)', type: 'concept', children: [] },
                    { id: 'goc-2-mp', label: 'Giữa 2 mặt: cos φ = |n⃗₁·n⃗₂|/(|n⃗₁|·|n⃗₂|)', type: 'concept', children: [] },
                  ],
                },
                {
                  id: 'cac-loai-khoang-cach',
                  label: 'Các loại khoảng cách',
                  type: 'concept',
                  children: [
                    { id: 'kc-diem-mp', label: 'Điểm đến mặt: d(M,(P)) = |Ax₀+By₀+Cz₀+D|/√(A²+B²+C²)', type: 'concept', children: [] },
                    { id: 'kc-diem-dt', label: 'Điểm đến đường: d(M,Δ) = |[M₀M⃗,u⃗]|/|u⃗|', type: 'concept', children: [] },
                    { id: 'kc-2-dt-cheo', label: '2 đường chéo nhau: d(d₁,d₂) = |[u⃗₁,u⃗₂]·M₁M₂⃗|/|[u⃗₁,u⃗₂]|', type: 'concept', children: [] },
                    { id: 'kc-dt-mp-ss', label: 'Đường và mặt song song: Lấy điểm trên đường', type: 'concept', children: [] },
                    { id: 'kc-2-mp-ss', label: '2 mặt song song: Lấy điểm trên mặt này', type: 'concept', children: [] },
                  ],
                },
              ],
            },
            {
              id: 'phuong-trinh-mat-cau-oxyz',
              label: 'Phương trình mặt cầu',
              type: 'concept',
              children: [
                { id: 'pt-mc-chinh-tac', label: 'Chính tắc: (x-a)² + (y-b)² + (z-c)² = R²', type: 'concept', children: [] },
                { id: 'pt-mc-tong-quat', label: 'Tổng quát: x² + y² + z² - 2ax - 2by - 2cz + d = 0', type: 'concept', children: [] },
                { id: 'tam-ban-kinh', label: 'Tâm I(a;b;c), Bán kính R = √(a²+b²+c²-d)', type: 'concept', children: [] },
                { id: 'mc-vi-tri', label: 'Vị trí: So sánh d(I,(P)) hoặc d(I,Δ) với R', type: 'concept', children: [] },
              ],
            },
          ],
        },
      ],
    },

    //================== XÁC SUẤT THỐNG KÊ ==================
    {
      id: 'xac-suat-thong-ke',
      label: 'XÁC SUẤT - THỐNG KÊ',
      type: 'topic',
      children: [
        {
          id: 'bien-co-ngau-nhien',
          label: 'Biến cố và xác suất',
          type: 'concept',
          children: [
            { id: 'phep-thu', label: 'Phép thử: Hành động có thể lặp lại', type: 'concept', children: [] },
            { id: 'khong-gian-mau', label: 'Không gian mẫu Ω: Tập hợp các kết quả có thể', type: 'concept', children: [] },
            { id: 'bien-co', label: 'Biến cố: Tập con của Ω', type: 'concept', children: [] },
            { id: 'xac-suat-co-dien', label: 'Xác suất cổ điển: P(A) = |A|/|Ω|', type: 'concept', children: [] },
          ],
        },
        {
          id: 'bien-ngau-nhien',
          label: 'Biến ngẫu nhiên',
          type: 'concept',
          children: [
            { id: 'dinh-nghia-bnn', label: 'Định nghĩa: Đại lượng nhận giá trị theo xác suất', type: 'concept', children: [] },
            { id: 'bang-phan-bo', label: 'Bảng phân bố xác suất', type: 'concept', children: [] },
            { id: 'ky-vong', label: 'Kỳ vọng: E(X) = Σ xᵢ·P(X=xᵢ)', type: 'concept', children: [] },
            { id: 'phuong-sai', label: 'Phương sai: V(X) = E(X²) - [E(X)]²', type: 'concept', children: [] },
            { id: 'do-lech-chuan', label: 'Độ lệch chuẩn: σ(X) = √V(X)', type: 'concept', children: [] },
          ],
        },
      ],
    },
  ],
};