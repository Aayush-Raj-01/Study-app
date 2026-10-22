import os
from dotenv import load_dotenv
from google import genai

load_dotenv()
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

try:
    for m in client.models.list():
        print(f"Model: {m.name}")
except Exception as e:
    print(f"Failed to list models: {e}")
