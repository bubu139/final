import os
import edge_tts
import google.generativeai as genai
from src.ai_config import genai

async def transcribe_audio(file_path: str, mime_type: str = "audio/mp3") -> str:
    """
    Uploads audio file to Gemini and asks for transcription.
    """
    try:
        print(f"Uploading file {file_path} to Gemini...")
        myfile = genai.upload_file(file_path, mime_type=mime_type)
        
        # Use a model that supports audio
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        print("Generating transcription...")
        result = model.generate_content(
            [myfile, "Transcribe this audio exactly. Output only the text."],
        )
        return result.text.strip()
    except Exception as e:
        print(f"Error transcribing audio: {e}")
        raise e

async def generate_audio(text: str, output_path: str, voice: str = "vi-VN-HoaiMyNeural") -> None:
    """
    Generates audio from text using edge-tts.
    """
    try:
        print(f"Generating audio for text: {text[:50]}...")
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(output_path)
        print(f"Audio saved to {output_path}")
    except Exception as e:
        print(f"Error generating audio: {e}")
        raise e
