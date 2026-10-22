import os
import json
import time
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from google import genai

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

ip_last_request = {}

@app.route('/api/generate-roadmap', methods=['POST'])
def generate_roadmap():
    client_ip = request.remote_addr
    current_time = time.time()
    
    # 5-second cooldown for localhost/dev, 30s for remote
    cooldown = 5 if client_ip in ('127.0.0.1', '::1', 'localhost') else 30
    if client_ip in ip_last_request:
        time_since_last = current_time - ip_last_request[client_ip]
        if time_since_last < cooldown:
            return jsonify({"error": f"Please wait {int(cooldown - time_since_last)} seconds before generating another roadmap."}), 429

    data = request.get_json()
    if not data or 'subject' not in data or not str(data['subject']).strip():
        return jsonify({"error": "Subject is required"}), 400

    subject = str(data['subject']).strip()

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
      1. Create a detailed roadmap with 12 to 25 nodes. Number the phases sequentially (e.g., Phase 1, Phase 2).
      2. Set "type" to "customNode" for EVERY node.
      3. For every node, provide an array of "links". Instead of providing URLs, provide a search "query" string for YouTube or Google.
      4. Create branching paths for parallel topics by adjusting 'x' coordinates (e.g., 50, 250, 450).
      5. Increase 'y' by 200 for each subsequent step to create a clean flow.
      6. Connect all nodes logically using edges so there are no broken paths.
      7. Only output the JSON object.
    """

    try:
        text = None
        # Try gemini-2.5-flash-lite first (fast and highly available), fallback to gemini-2.5-flash
        for model_name in ['gemini-2.5-flash-lite', 'gemini-2.5-flash']:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config={'response_mime_type': 'application/json'}
                )
                text = response.text.strip()
                if text:
                    break
            except Exception as model_err:
                print(f"Warning: {model_name} failed ({model_err}), trying next model...")

        if not text:
            raise Exception("AI service failed to generate content with all available models.")

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

        # Only update cooldown on success
        ip_last_request[client_ip] = time.time()

        return jsonify(data_json)
            
    except json.JSONDecodeError as e:
        print(f"Failed to parse JSON: {text if 'text' in locals() else 'None'}")
        return jsonify({"error": "AI returned invalid JSON format."}), 500
    except Exception as e:
        print(f"Error generating roadmap: {e}")
        return jsonify({"error": f"Failed to generate roadmap: {str(e)}"}), 500

if __name__ == '__main__':
    # Run the server on port 3001 to match what React expects
    app.run(port=3001, debug=True)
