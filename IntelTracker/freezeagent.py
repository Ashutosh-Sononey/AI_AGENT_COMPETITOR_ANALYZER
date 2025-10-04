# IntelTracker/agent.py
#
# A self-contained, multi-agent system for competitive intelligence,
# designed to be run with the ADK CLI and interacted with via a REST API.
#
# Architecture:
# 1. Tools: A suite of functions for data gathering and competitor management.
# 2. Specialized Agents: LlmAgents for specific tasks like analysis,
#    reporting, comparison, and prediction.
# 3. Root Agent: A primary LlmAgent that acts as a central coordinator,
#    understanding user intent and delegating to the appropriate tool or sub-agent.

import os
import json
import hashlib
import requests
import feedparser
from bs4 import BeautifulSoup
from typing import Optional, TYPE_CHECKING

# ADK Imports
from google.adk.agents import LlmAgent
from google.adk.tools import FunctionTool, AgentTool
from google.adk.sessions import Session

if TYPE_CHECKING:
    from google.adk.tools import ToolContext

# --- Configuration ---
FALLBACK_COMPETITORS_CONFIG = [
    {"name": "Notion", "website_url": "https://www.notion.so/changelog"},
    {"name": "Figma", "website_url": "https://twitter.com/figma"},
    {"name": "Canva", "website_url": "https://www.canva.com/whats-new/"},
    {
        "name": "Slack",
        "website_url": "https://slack.com/release-notes/windows",
        "rss_feed_url": "https://slack.com/release-notes/rss",
    },
    {
        "name": "Obsidian",
        "website_url": "https://forum.obsidian.md/c/announcements/13",
        "rss_feed_url": "https://forum.obsidian.md/c/announcements/13.rss",
    },
]

# Configure Gemini API access
try:
    import google.generativeai as genai

    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    if not GEMINI_API_KEY:
        print("Warning: GEMINI_API_KEY not set. Reasoning agents will be disabled.")
        genai = None
    else:
        genai.configure(api_key=GEMINI_API_KEY)
except ImportError:
    print(
        "Warning: 'google-generativeai' is not installed. Reasoning agents will be disabled."
    )
    genai = None


# --- 1. Specialized Sub-Agents ---

analysis_agent = LlmAgent(
    name="analysis_agent",
    model="gemini-2.5-flash" if genai else None,
    instruction="""
    You are a competitive intelligence analyst. Your input is a JSON string of raw observations about competitors.
    Analyze each observation and produce a structured JSON output. The output MUST be a JSON list of objects.
    Each object must contain: "competitor", "source", "link", and a "summary" of 2-3 bullet points on strategically important changes.
    If the input is an empty list, you MUST return an empty JSON list `[]`.
    """,
)

reporting_agent = LlmAgent(
    name="reporting_agent",
    model="gemini-2.5-flash" if genai else None,
    instruction="""
    You are a reporting agent. Your input is structured JSON from the analysis_agent.
    Format this JSON into a clean, human-readable markdown digest.
    - Start with a main title: "Competitive Intelligence Digest" and the current date.
    - For each item, create a sub-header for the competitor, list the source, summary points, and the link.
    - If the input is an empty list or null, output: "No significant competitor updates were found during this cycle."
    """,
)

prediction_agent = LlmAgent(
    name="prediction_agent",
    model="gemini-2.5-flash" if genai else None,
    instruction="""
    You are a "Future Feature Intelligence" analyst. Based on provided competitor updates, predict potential future features or strategic shifts.
    Output a markdown-formatted section titled "Future Outlook & Predictions" with 2-3 bullet points containing your predictions and reasoning.
    """,
)

comparison_agent = LlmAgent(
    name="comparison_agent",
    model="gemini-2.5-flash" if genai else None,
    instruction="""
    You are a "Smart Difference Finder" agent. You will receive 'product_a_description' and 'product_b_description'.
    Generate a markdown-formatted, side-by-side comparison table of key features.
    Conclude with a "Smart Difference" summary: a single paragraph explaining the most significant unique selling proposition of Product A over Product B.
    """,
)

# NEW AGENT: This agent bridges the gap between other agents and the export_agent.
synthesis_agent = LlmAgent(
    name="synthesis_agent",
    model="gemini-2.5-flash" if genai else None,
    instruction="""
    You are a data synthesis agent. Your input is an unstructured block of text (like a markdown report).
    Your task is to convert this text into a structured JSON object suitable for the export_agent.
    The JSON output MUST have a key "insights" which is a list of objects.
    Each object in the list should have a "title" and a "description".
    Extract the main sections and points from the input text to create these insight objects.
    For example, a markdown title becomes a "title" and the subsequent paragraph becomes the "description".
    """,
)


export_agent = LlmAgent(
    name="export_agent",
    model="gemini-2.5-flash" if genai else None,
    instruction="""
    You are a data export agent. Your input is a JSON string containing an "insights" list and an "export_format".
    Your task is to format this data based on the requested 'export_format'.
    - If 'export_format' is 'email', format as a simple, clean HTML email body.
    - If 'export_format' is 'pdf' or 'notion', format as a detailed markdown document.
    - If 'export_format' is 'plaintext', format as a simple text summary.
    If the input is empty, return "No data available for export."
    """,
)


# --- 2. Tools (Agent Capabilities) ---

def _monitor_website_change(
    competitor_name: str, url: str, tool_context: "ToolContext"
) -> dict | None:
    print(f"[{competitor_name}] Checking website: {url}")
    try:
        response = requests.get(
            url, headers={"User-Agent": "Mozilla/5.0"}, timeout=20
        )
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")
        content_text = (soup.find("main") or soup.find("body")).get_text(" ", strip=True)
        current_hash = hashlib.sha256(content_text.encode("utf-8")).hexdigest()
        state_key = f"website_hash_{url}"
        last_hash = tool_context.state.get(state_key)
        if last_hash != current_hash:
            tool_context.state[state_key] = current_hash
            return {"type": "website_change", "competitor": competitor_name, "url": url, "content": content_text[:4000]}
        return None
    except requests.RequestException as e:
        return {"type": "error", "competitor": competitor_name, "message": f"Error fetching website {url}: {e}"}

def _monitor_rss_feed(
    competitor_name: str, url: str, tool_context: "ToolContext"
) -> list | None:
    if not url: return None
    print(f"[{competitor_name}] Checking RSS feed: {url}")
    try:
        feed = feedparser.parse(url)
        state_key = f"seen_rss_entries_{url}"
        seen_entries = set(tool_context.state.get(state_key, []))
        new_posts = []
        for entry in feed.entries:
            entry_id = entry.get("id", entry.get("link"))
            if entry_id not in seen_entries:
                new_posts.append({"type": "new_blog_post", "competitor": competitor_name, "post": {"title": entry.title, "link": entry.link, "summary": BeautifulSoup(entry.summary, "html.parser").get_text(strip=True)}})
                seen_entries.add(entry_id)
        if new_posts:
            tool_context.state[state_key] = list(seen_entries)
            return new_posts
        return None
    except Exception as e:
        return [{"type": "error", "competitor": competitor_name, "message": f"Error fetching RSS feed {url}: {e}"}]

@FunctionTool
def run_monitoring_cycle(reason: str, tool_context: "ToolContext") -> str:
    """Runs one full cycle of perceiving competitors and returns the raw observations as a JSON string."""
    print(f"\n>>> Starting a full monitoring cycle (Reason: {reason})...")
    competitors = tool_context.state.get("competitors_config", FALLBACK_COMPETITORS_CONFIG)
    observations = []
    for competitor in competitors:
        name = competitor.get("name", "Unknown")
        if url := competitor.get("website_url"):
            if result := _monitor_website_change(competitor_name=name, url=url, tool_context=tool_context):
                observations.append(result)
        if url := competitor.get("rss_feed_url"):
            if results := _monitor_rss_feed(competitor_name=name, url=url, tool_context=tool_context):
                observations.extend(results)

    if not observations:
        return "No significant competitor updates were found during this cycle."
    return json.dumps(observations)


@FunctionTool
def add_competitor(name: str, website_url: str, tool_context: "ToolContext", rss_feed_url: Optional[str] = None) -> str:
    """Adds a new competitor to the monitoring list for this session."""
    competitors = tool_context.state.get("competitors_config", list(FALLBACK_COMPETITORS_CONFIG))
    competitors.append({"name": name, "website_url": website_url, "rss_feed_url": rss_feed_url})
    tool_context.state["competitors_config"] = competitors
    return f"Success! Added '{name}' to the monitoring list."


@FunctionTool
def remove_competitor(name: str, tool_context: "ToolContext") -> str:
    """Removes a competitor from the monitoring list for this session."""
    competitors = tool_context.state.get("competitors_config", list(FALLBACK_COMPETITORS_CONFIG))
    competitors = [c for c in competitors if c.get("name") != name]
    tool_context.state["competitors_config"] = competitors
    return f"Success! Removed '{name}' from the monitoring list."


@FunctionTool
def list_competitors(reason: str, tool_context: "ToolContext") -> str:
    """Lists all competitors currently being monitored in this session."""
    competitors = tool_context.state.get("competitors_config", FALLBACK_COMPETITORS_CONFIG)
    return json.dumps(competitors, indent=2)


# --- 3. Root Agent (The Coordinator) ---

root_agent = LlmAgent(
    name="intel_tracker_coordinator",
    model="gemini-2.5-flash" if genai else None,
    instruction="""
    You are the coordinator for a competitive intelligence platform. Your job is to understand the user's request, use available tools, and chain them together by using the output of one tool as the input for the next.

    CORE WORKFLOWS:
    1. Monitoring:
        - When the user asks for an update, call `run_monitoring_cycle`.
        - CHECK the output. If it's a JSON string, you MUST call `analysis_agent` with it.
        - After `analysis_agent` runs, you MUST call `reporting_agent` with its result.
        - If the output is "No significant updates...", relay that message and stop.

    2. Exporting:
        - If the user asks to export the result of the PREVIOUS turn (e.g., "export this as a pdf"), you must orchestrate a two-step process.
        - Step 1: Call the `synthesis_agent`. The `request` for this call MUST be the string content from the previous turn's output.
        - Step 2: Call the `export_agent`. The `request` for this call MUST be a JSON object containing two keys: the `insights` generated by the `synthesis_agent`, and the `export_format` requested by the user (e.g., "pdf", "email").

    OTHER TOOLS:
    - For adding, listing, or removing competitors, use the appropriate management tool.
    - For comparisons, use the `comparison_agent`.
    - For predictions, use the `prediction_agent`.
    """,
    tools=[
        run_monitoring_cycle,
        add_competitor,
        remove_competitor,
        list_competitors,
        AgentTool(agent=analysis_agent),
        AgentTool(agent=reporting_agent),
        AgentTool(agent=prediction_agent),
        AgentTool(agent=comparison_agent),
        AgentTool(agent=synthesis_agent),
        AgentTool(agent=export_agent),
    ],
)


# --- Main execution block for local testing ---
def main():
    """Main function to run the agent locally."""
    if not genai:
        print("Cannot run agent locally without 'google-generativeai' and a GEMINI_API_KEY.")
        return

    print("IntelTracker Agent is running. Type 'check for updates' or other commands.")
    session = Session(agent=root_agent)

    while True:
        user_input = input("USER: ")
        if user_input.lower() in ["exit", "quit"]:
            break
        response = session.run(request=user_input)
        print(f"AGENT: {response.output}")


if __name__ == "__main__":
    main()
