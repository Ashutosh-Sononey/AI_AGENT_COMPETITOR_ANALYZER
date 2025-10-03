### Full Stack Application Instructions

This project contains a Python ADK agent (backend) and a React/Next.js application (frontend). To run the full application, you must start both servers correctly.

**1. Setup the Environment**

First, set up your Python environment and install the required dependencies from the project's root directory (`AI_AGENT_COMPETITOR_ANALYZER`).

```bash
# Create and activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# IMPORTANT: Set your Gemini API Key
# The application will not function correctly without it.
export GEMINI_API_KEY="YOUR_API_KEY_HERE"
```

**2. Run the Backend Agent Server**

This is the most critical step. You must run the `adk api_server` command from the **root directory of the project**. This allows the server to discover the `agent.py` file. The `--cors-origins` flag is essential to allow the frontend to make requests.

```bash
# From the project root directory (e.g., AI_AGENT_COMPETITOR_ANALYZER/)
adk api_server --cors-origins "http://localhost:3000 http://localhost:3001"
```

The backend will start and be available at `http://127.0.0.1:8000`. Leave this terminal window running.

**3. Run the Frontend Dashboard**

In a **new terminal window**, navigate to the `intelligencedashboard` directory, install the Node.js dependencies using `pnpm`, and start the development server.

```bash
# Navigate to the frontend directory
cd intelligencedashboard

# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

The frontend will start and be available at `http://localhost:3000` (or `http://localhost:3001` if port 3000 is busy). You can now open this URL in your browser to use the application. The dashboard should load and display data from the backend agent.