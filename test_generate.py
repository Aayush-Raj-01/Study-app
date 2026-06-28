import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

subject = "React JS"
prompt = f"""
  You are an expert educational counselor. The user wants to study: "{subject}".
  Generate a highly detailed and comprehensive learning roadmap for this subject.
  You must respond strictly with a valid JSON object matching this structure:
  {{
    "nodes": [
      {{ 
        "id": "1", 
        "type": "customNode",
        "data": {{ 
          "label": "Phase 1: Basics",
          "links": [
            {{ "title": "Search YouTube", "url": "https://www.youtube.com/results?search_query=..." }},
            {{ "title": "Google Search", "url": "https://www.google.com/search?q=..." }}
          ]
        }}, 
        "position": {{ "x": 250, "y": 0 }} 
      }}
    ],
    "edges": [
      {{ "id": "e1-2", "source": "1", "target": "2", "animated": true }}
    ]
  }}
  Important:
  1. Create a detailed roadmap with 12 to 20 nodes. Number the phases sequentially (e.g., Phase 1, Phase 2) and DO NOT skip numbers.
  2. Set "type" to "customNode" for EVERY node.
  3. For every node, provide an array of "links". Instead of linking to specific copyrighted books, provide generic Google or YouTube search URLs for the topic.
  4. Create branching paths for parallel topics by adjusting 'x' coordinates (e.g., x: 50 and x: 450).
  5. Increase 'y' by 200 for each subsequent step to create a clean flow and fit the buttons.
  6. Connect all nodes logically using edges so there are no broken paths.
  7. Only output the JSON object.
"""

model = genai.GenerativeModel('gemini-flash-latest')
response = model.generate_content(prompt)
text = response.text.strip()
if text.startswith('```json'):
    text = text[7:]
elif text.startswith('```'):
    text = text[3:]
if text.endswith('```'):
    text = text[:-3]
    
data = json.loads(text.strip())
print(json.dumps(data, indent=2)[:1000])
