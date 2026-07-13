import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load env from parent directory
load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))

api_key = os.getenv("GEMINI_API_KEY")
print(f"API Key found: {api_key[:5]}...{api_key[-5:] if api_key else 'None'}")

genai.configure(api_key=api_key)

try:
    print("Testing gemini-1.5-flash...")
    model = genai.GenerativeModel('gemini-1.5-flash')
    response = model.generate_content("Hello")
    print("Success!")
    print(response.text)
except Exception as e:
    print("Error with gemini-1.5-flash:")
    print(e)
