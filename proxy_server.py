from flask import Flask, request, jsonify
from flask_cors import CORS
from agent import root_agent
from google.adk.sessions import Session
import json

app = Flask(__name__)

# Set up CORS to allow requests from the frontend development server.
CORS(app, resources={r"/agent/*": {"origins": ["http://localhost:3000", "http://localhost:3001"]}})

# Simple in-memory session store. For a production app, this would be a database.
session_store = {}
APP_NAME = 'intel_tracker'
USER_ID = 'dashboard-user'
SESSION_ID = 'main-session'

def get_or_create_session():
    """Creates or retrieves the agent session."""
    if SESSION_ID in session_store:
        return session_store[SESSION_ID]
    else:
        session = Session(app_name=APP_NAME, user_id=USER_ID, id=SESSION_ID)
        session_store[SESSION_ID] = session
        return session

@app.route('/agent/run', methods=['POST'])
def run_agent_proxy():
    """
    This endpoint receives a prompt from the frontend, passes it to the agent,
    and returns the agent's response.
    """
    data = request.get_json()
    if not data or 'prompt' not in data:
        return jsonify({"error": "Request must be JSON and include a 'prompt' field."}), 400

    prompt = data['prompt']
    print(f"Proxy server received prompt: {prompt}")

    try:
        # Get the session and instantiate the agent
        session = get_or_create_session()
        agent_instance = root_agent.with_session(session)

        # Run the agent with the given prompt
        events = agent_instance.run(prompt)

        # The response is an array of events. We need the last "model" response.
        last_model_part = events \
            .slice() \
            .reverse() \
            .find(lambda e: e.content.role == 'model' and e.content.parts and e.content.parts[0].text) \
            .content.parts[0].text

        if last_model_part:
            # The agent's response is expected to be a JSON string, but we return it
            # as a JSON object to the frontend for convenience.
            try:
                # The agent output is a JSON *string*, so we parse it first.
                parsed_response = json.loads(last_model_part)
                return jsonify(parsed_response)
            except json.JSONDecodeError:
                # If it's not JSON, it's a conversational response (e.g., from addCompetitor)
                return jsonify({"message": last_model_part})

        return jsonify({"error": "Agent did not produce a valid response."}), 500

    except Exception as e:
        print(f"Error running agent: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Running on port 5001 to avoid conflicts with the default ADK server (8000)
    # and the frontend dev server (3000).
    app.run(port=5001, debug=True)