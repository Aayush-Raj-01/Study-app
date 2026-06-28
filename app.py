import os
import json
import time
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
# Enable CORS for the React frontend (running on port 5173 by default)
CORS(app)


genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

ip_last_request = {}

@app.route('/api/generate-roadmap', methods=['POST'])
def generate_roadmap():
    client_ip = request.remote_addr
    current_time = time.time()
    
    if client_ip in ip_last_request:
        time_since_last = current_time - ip_last_request[client_ip]
        if time_since_last < 60:
            return jsonify({"error": f"Rate limit exceeded. Please wait {int(60 - time_since_last)} seconds before generating another roadmap."}), 429
            
    ip_last_request[client_ip] = current_time

    data = request.get_json()
    if not data or 'subject' not in data:
        return jsonify({"error": "Subject is required"}), 400

    subject = data['subject']

    # Initialize the model (using Gemini 1.5 Flash latest, falling back to gemini-pro)
    
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
                {{ "title": "Video Tutorial", "query": "Basics of topic" }},
                {{ "title": "Study Guide", "query": "Topic study guide" }}
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
      1. Create a detailed roadmap with 15 to 50 nodes. Number the phases sequentially (e.g., Phase 1, Phase 2).
      2. Set "type" to "customNode" for EVERY node.
      3. For every node, provide an array of "links". Instead of providing URLs, provide a search "query" string for YouTube or Google.
      4. Create branching paths for parallel topics by adjusting 'x' coordinates.
      5. Increase 'y' by 200 for each subsequent step to create a clean flow.
      6. Connect all nodes logically using edges so there are no broken paths.
      7. Only output the JSON object.
    """

    try:
        try:
            model = genai.GenerativeModel('gemini-flash-latest')
            response = model.generate_content(prompt)
            text = response.text.strip()
        except Exception as fallback_err:
            print(f"Warning: gemini-flash-latest failed ({fallback_err}), falling back to gemini-pro-latest")
            model = genai.GenerativeModel('gemini-pro-latest')
            response = model.generate_content(prompt)
            text = response.text.strip()
            
        # In case the model still outputs markdown backticks, strip them
        if text.startswith('```json'):
            text = text[7:]
        elif text.startswith('```'):
            text = text[3:]
        if text.endswith('```'):
            text = text[:-3]
                
        data_json = json.loads(text.strip())
        
        if "nodes" in data_json:
            for node in data_json["nodes"]:
                node["type"] = "customNode"
                
        return jsonify(data_json)
            
    except json.JSONDecodeError as e:
        print(f"Failed to parse JSON: {text}")
        return jsonify({"error": "AI returned invalid JSON format."}), 500
    except Exception as e:
        print(f"Error generating roadmap: {e}")
        return jsonify({"error": f"Failed to generate roadmap: {str(e)}"}), 500

if __name__ == '__main__':
    # Run the server on port 3001 to match what React expects
    app.run(port=3001, debug=True)
