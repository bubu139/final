# src/services/audio_service.py
import os
import edge_tts
import google.generativeai as genai
from src.ai_config import genai

async def transcribe_audio(file_path: str, mime_type: str = "audio/mp3") -> str:
    """
    Uploads audio file to Gemini and asks for transcription.
    """
    uploaded_file = None
    try:
        print(f"Uploading file {file_path} to Gemini...")
        uploaded_file = genai.upload_file(file_path, mime_type=mime_type)
        
        # Dùng model 1.5-flash cho nhanh và rẻ
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        print("Generating transcription...")
        # Prompt tiếng Việt để nhận diện tốt hơn
        result = model.generate_content(
            [uploaded_file, "Hãy nghe file âm thanh này và chép lại chính xác nội dung thành văn bản. Chỉ trả về nội dung văn bản, không thêm lời dẫn."],
        )
        return result.text.strip()
    except Exception as e:
        print(f"Error transcribing audio: {e}")
        # Trả về thông báo lỗi để AI biết
        return "Không thể nghe được nội dung file âm thanh này." 
    finally:
        # Quan trọng: Xóa file trên Google Server sau khi dùng xong
        if uploaded_file:
            try:
                uploaded_file.delete()
                print("Deleted remote file on Gemini.")
            except:
                pass

async def generate_audio(text: str, output_path: str, voice: str = "vi-VN-HoaiMyNeural") -> None:
    try:
        print(f"Generating audio for text: {text[:50]}...")
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(output_path)
        print(f"Audio saved to {output_path}")
    except Exception as e:
        print(f"Error generating audio: {e}")
        raise e
