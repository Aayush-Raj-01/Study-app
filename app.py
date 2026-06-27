import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
# Enable CORS for the React frontend (running on port 5173 by default)
CORS(app)

# Configure the Gemini API
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

@app.route('/api/generate-roadmap', methods=['POST'])
def generate_roadmap():
    data = request.get_json()
    if not data or 'subject' not in data:
        return jsonify({"error": "Subject is required"}), 400

    subject = data['subject']

    # Initialize the model (using Gemini 1.5 Flash)
    model = genai.GenerativeModel('gemini-1.5-flash')

    prompt = f"""
      You are an expert educational counselor. The user wants to study: "{subject}".
      Generate a learning roadmap for this subject.
      You must respond strictly with a valid JSON object matching this structure:
      {{
        "nodes": [
          {{ "id": "1", "data": {{ "label": "Step 1 name" }}, "position": {{ "x": 250, "y": 0 }} }},
          {{ "id": "2", "data": {{ "label": "Step 2 name" }}, "position": {{ "x": 250, "y": 100 }} }}
        ],
        "edges": [
          {{ "id": "e1-2", "source": "1", "target": "2", "animated": true }}
        ]
      }}
      Important:
      1. Ensure there are 5-8 nodes forming a coherent learning path.
      2. Spread out the nodes vertically by increasing 'y' by 100 or 150 for each subsequent node to create a good flow.
      3. Connect the nodes chronologically using edges.
      4. Only output the JSON object, absolutely no markdown formatting, no backticks, no explanations. Just valid JSON.
    """

    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        
        # In case the model still outputs markdown backticks, strip them
        if text.startswith('```json'):
            text = text[7:]
        elif text.startswith('```'):
            text = text[3:]
        if text.endswith('```'):
            text = text[:-3]
            
        roadmap_data = json.loads(text.strip())
        return jsonify(roadmap_data)
        
    except Exception as e:
        print(f"Error generating roadmap: {e}")
        return jsonify({"error": "Failed to generate roadmap"}), 500

if __name__ == '__main__':
    # Run the server on port 3001 to match what React expects
    app.run(port=3001, debug=True)
