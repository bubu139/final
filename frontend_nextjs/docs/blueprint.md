# MathMentor – Bản thiết kế sản phẩm

MathMentor là hệ thống học tập cá nhân hóa dành cho học sinh phổ thông, triển khai trên Vercel và Supabase. Ứng dụng được chia thành bốn mô-đun chính (AI Chat, Mindmap, Bài kiểm tra và Trang cá nhân). Mỗi mô-đun vừa hoạt động độc lập, vừa chia sẻ dữ liệu để xây dựng chân dung học tập cho từng học sinh.


## 1. AI Chat (Gia sư số)
- **Luồng xử lý hai nhánh**: Khi học sinh gửi câu hỏi, backend tạo hai tác vụ song song.
  - *Luồng trả lời*: Máy chủ áp dụng pipeline RAG (vector store + tài liệu giáo khoa) để trích xuất thông tin liên quan, sau đó kết hợp câu trả lời của Gemini với bộ kiểm tra chéo nhằm loại bỏ thông tin sai. AI đóng vai trò gia sư: không đưa đáp án ngay mà gợi mở kiến thức nền, đề xuất các bước giải, yêu cầu học sinh thử lại trước khi tiết lộ lời giải.
  - *Luồng vẽ hình*: Yêu cầu được chuyển thành prompt chuyên biệt cho Gemini. Model trả về cú pháp Geogebra (GGBScript) để dựng hàm số hoặc hình học, và iframe Geogebra trên trang chỉ render bản vẽ mới khi người dùng chuyển sang bài toán khác.
- **Khai thác dữ liệu người học**:
  - Lưu trữ lịch sử hội thoại, kiến thức học sinh chưa nắm và các câu trả lời sai.
  - Ghi nhận điểm mạnh/yếu, kỹ năng cần bổ sung và đẩy vào kho dữ liệu cá nhân (dùng cho mindmap, dashboard và đề thích ứng).
- **Hiển thị**: Nội dung được render từ LaTeX sang MathJax/KaTeX, chia rõ heading lớn/nhỏ để dễ theo dõi.

## 2. Mindmap (Lộ trình học tập)
- **Đồng bộ với AI Chat**: Khi AI phát hiện một kỹ năng mới, hệ thống tạo/ cập nhật node trong mindmap của học sinh.
- **Tương tác node**:
  - Nhấn vào node để mở modal hiển thị mô tả kiến thức, tài liệu tham khảo, nút “Tạo bài tập”, “Tạo bài kiểm tra” và trạng thái hoàn thành.
  - Node chuyển màu xanh khi học sinh vượt qua bài kiểm tra tương ứng.
- **Đề xuất nội dung**: Mindmap thể hiện mức độ thành thạo thông qua thang màu (xanh lá: đã vững, vàng: đang học, đỏ: yếu) và hiển thị tiến trình tổng quan.


## 3. Bài kiểm tra
- **Loại đề**: kiểm tra thường xuyên cá nhân hóa, giữa kỳ, cuối kỳ và THPTQG.
  - Kiểm tra thường xuyên lấy dữ liệu từ AI Chat + lịch sử làm bài để dựng đề phù hợp năng lực, cân bằng độ khó và chủ đề mà học sinh đang thiếu.
  - Các đề giữa kỳ/cuối kỳ/THPTQG dựa trên file mẫu chuẩn của Bộ GD&ĐT, đảm bảo đủ chuyên đề.
- **Sau khi nộp**:
  - AI đối chiếu câu trả lời với đáp án, xác định lỗi tư duy, thống kê điểm mạnh – điểm yếu, kiến thức cần củng cố, lời khuyên và cách học.
  - Kết quả + bài làm được lưu ở lịch sử; dữ liệu phân tích (weak topics, khuyến nghị) dùng để sinh bài kiểm tra thích ứng lần sau.
  - Trang kết quả hiển thị điểm tổng, phân bố theo dạng bài, các chủ đề yếu, checklist kiến thức cần học và CTA luyện tập thích ứng.

## 4. Trang cá nhân người dùng
- Thông tin hồ sơ, tiến độ học tập, điểm mạnh/yếu và biểu đồ (tròn/cột) thống kê điểm số, thời gian học.
- Lịch sử làm bài và danh sách kỹ năng cần cải thiện, mỗi mục link tới mindmap node tương ứng hoặc đề luyện tập.
- Từ dữ liệu tích lũy, AI dựng mindmap lộ trình học phù hợp và cập nhật định kỳ sau mỗi phiên chat hoặc bài kiểm tra.

## Hướng dẫn giao diện & trải nghiệm
- Tông màu chính: xanh lam nhạt (#A0E9FF) kết hợp nền trắng (#F5F5F5) để tạo cảm giác nhẹ nhàng, tập trung.
- Font chữ thân thiện (VD: "PT Sans", "Inter"). Heading lớn nhỏ rõ ràng; sử dụng icon tối giản.
- Các thẻ kết quả, mindmap node và chat bubble có border-radius mềm mại, bóng nhẹ.
- Chuyển cảnh mượt khi mở node, chuyển tab hoặc hiển thị phân tích, giúp trải nghiệm học liền mạch.