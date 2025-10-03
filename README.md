### Full Stack Application Instructions

This project contains both a Python ADK agent backend and a React frontend. To run the full application, you need to start both servers.

**1. Setup the Environment**

First, set up your Python environment and install the required dependencies.

```bash
# Create and activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Set your Gemini API Key
export GEMINI_API_KEY="YOUR_API_KEY_HERE"
```

**2. Run the Backend Agent Server**

Start the ADK API server. The crucial `--cors-origins` flag allows the frontend (running on `http://localhost:3000`) to make requests to the backend.

```bash
# From the project root directory
# Note: We allow both port 3000 and 3001 for the frontend to avoid issues if port 3000 is occupied.
adk api_server --cors-origins http://localhost:3000 http://localhost:3001
```

The backend will be running on `http://127.0.0.1:8000`.

**3. Run the Frontend Dashboard**

In a **new terminal window**, navigate to the `intelligencedashboard` directory, install the Node.js dependencies, and start the development server.

```bash
# Navigate to the frontend directory
cd intelligencedashboard

# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

The frontend will be running on `http://localhost:3000`. You can now open this URL in your browser to use the application.
