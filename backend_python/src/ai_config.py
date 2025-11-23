# src/ai_config.py
import os
from pathlib import Path
from dotenv import load_dotenv
import google.generativeai as genai

# Tìm file .env ở thư mục root của project
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# Hoặc đơn giản:
# load_dotenv()  # Tự động tìm .env từ thư mục hiện tại và parent

# Lấy API key
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')

if not GOOGLE_API_KEY:
    print("⚠️ ERROR: GOOGLE_API_KEY not found in .env file")
    print(f"Looking for .env at: {env_path}")
    raise ValueError("GOOGLE_API_KEY is required")

# Cấu hình Google AI
genai.configure(api_key=GOOGLE_API_KEY)

print("✅ Google Generative AI configured successfully")
print(f"API Key loaded: {GOOGLE_API_KEY[:10]}...")  # Chỉ hiển thị 10 ký tự đầu