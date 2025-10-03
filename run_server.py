import google.adk as adk
from agent import root_agent

# This script provides a reliable, programmatic way to start the ADK server,
# ensuring the correct agent and CORS settings are always applied.

if __name__ == "__main__":
    print("Starting ADK server programmatically...")
    print("Agent: intel_tracker")
    print("Host: 127.0.0.1")
    print("Port: 8000")
    print("Allowed CORS Origins: http://localhost:3000, http://localhost:3001")

    adk.serve(
        agent=root_agent,
        host="127.0.0.1",
        port=8000,
        cors_origins=["http://localhost:3000", "http://localhost:3001"]
    )