# IntelTracker/agent.py (Version 2.2 - Full Capability)
#
# A self-contained, multi-agent system for competitive intelligence.
# This version restores full interactive capabilities (add, remove, list competitors)
# while maintaining the ADK-aligned autonomous monitoring loop.
#
# Key Restorations:
# 1. Re-introduced `add_competitor`, `remove_competitor`, `list_competitors` tools.
# 2. Updated root agent instructions to handle both autonomous and interactive tasks.

import os
import json
import time
import hashlib
import argparse
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
    {
        "name": "Figma",
        "website_url": "https://twitter.com/figma",
        "twitter_url": "https://twitter.com/figma"
    },
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
    print("Warning: 'google-generativeai' not installed. Reasoning agents disabled.")
    genai = None

# --- Specialized Sub-Agents (Unchanged) ---
analysis_agent = LlmAgent(name="analysis_agent", model="gemini-2.5-flash" if genai else None, instruction="...")
reporting_agent = LlmAgent(name="reporting_agent", model="gemini-2.5-flash" if genai else None, instruction="...")
prediction_agent = LlmAgent(name="prediction_agent", model="gemini-2.5-flash" if genai else None, instruction="...")
comparison_agent = LlmAgent(name="comparison_agent", model="gemini-2.5-flash" if genai else None, instruction="...")
synthesis_agent = LlmAgent(name="synthesis_agent", model="gemini-2.5-flash" if genai else None, instruction="...")
export_agent = LlmAgent(name="export_agent", model="gemini-2.5-flash" if genai else None, instruction="...")

# --- Tools (Agent Capabilities) ---

def _monitor_website_change(competitor_name: str, url: str, tool_context: "ToolContext") -> dict | None:
    print(f"[{competitor_name}] Checking website: {url}")
    try:
        response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=20)
        response.raise_for_status()
        content_text = BeautifulSoup(response.text, "html.parser").get_text(" ", strip=True)
        current_hash = hashlib.sha256(content_text.encode("utf-8")).hexdigest()
        state_key = f"website_hash_{url}"
        last_hash = tool_context.state.get(state_key)
        if last_hash != current_hash:
            tool_context.state[state_key] = current_hash
            return {"type": "website_change", "competitor": competitor_name, "url": url, "content": content_text[:4000]}
        return None
    except requests.RequestException as e:
        return {"type": "error", "competitor": competitor_name, "message": f"Error fetching website {url}: {e}"}

def _monitor_rss_feed(competitor_name: str, url: str, tool_context: "ToolContext") -> list | None:
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

def _monitor_twitter(competitor_name: str, twitter_url: str, tool_context: "ToolContext") -> list | None:
    if not twitter_url: return None
    print(f"[{competitor_name}] Checking Twitter: {twitter_url}")
    if time.time() % 10 < 2: # Placeholder for real API call
        tool_context.state[f"last_tweet_id_{twitter_url}"] = f"tweet_{int(time.time())}"
        return [{"type": "new_tweet", "competitor": competitor_name, "post": {"link": twitter_url, "summary": "A new feature was just announced!"}}]
    return None

@FunctionTool
def run_monitoring_cycle(reason: str, tool_context: "ToolContext") -> str:
    """Runs one full cycle of perceiving competitors and returns raw observations."""
    print(f"\n>>> Running monitoring cycle (Reason: {reason})...")
    competitors = tool_context.state.get("competitors_config", FALLBACK_COMPETITORS_CONFIG)
    if "competitors_config" not in tool_context.state:
        tool_context.state["competitors_config"] = competitors
    observations = []
    for comp in competitors:
        name = comp.get("name", "Unknown")
        if url := comp.get("website_url"):
            if res := _monitor_website_change(name, url, tool_context): observations.append(res)
        if url := comp.get("rss_feed_url"):
            if res := _monitor_rss_feed(name, url, tool_context): observations.extend(res)
        if url := comp.get("twitter_url"):
            if res := _monitor_twitter(name, url, tool_context): observations.extend(res)
    if not observations:
        return "No significant competitor updates were found during this cycle."
    return json.dumps(observations)

@FunctionTool
def send_notification(report: str, tool_context: "ToolContext") -> str:
    """Sends a notification with the provided intelligence report."""
    print("\n" + "="*50 + "\n🚀 NEW INTELLIGENCE REPORT 🚀\n" + "="*50 + f"\n{report}\n" + "="*50 + "\n")
    return "Notification sent successfully."

@FunctionTool
def add_competitor(name: str, website_url: str, tool_context: "ToolContext", rss_feed_url: Optional[str] = None, twitter_url: Optional[str] = None) -> str:
    """Adds a new competitor to the monitoring list for this session."""
    competitors = tool_context.state.get("competitors_config", list(FALLBACK_COMPETITORS_CONFIG))
    competitors.append({"name": name, "website_url": website_url, "rss_feed_url": rss_feed_url, "twitter_url": twitter_url})
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

# --- Root Agent (The Coordinator) ---
root_agent = LlmAgent(
    name="intel_tracker_coordinator",
    model="gemini-2.5-flash" if genai else None,
    instruction="""
    You are the coordinator for a competitive intelligence platform. You handle two primary modes: autonomous monitoring and interactive commands.

    **1. Autonomous Workflow**
    If the request is "run a scheduled monitoring cycle", you MUST:
    1. Call `run_monitoring_cycle`.
    2. If the output is a JSON string, chain the following agents: `analysis_agent` -> `reporting_agent`.
    3. Finally, call `send_notification` with the report.
    4. If the output is "No significant updates...", stop and reply with that message.

    **2. Interactive Commands**
    - To add, remove, or list competitors, use the appropriate tool (`add_competitor`, `remove_competitor`, `list_competitors`).
    - For comparing products, use `comparison_agent`.
    - To export previous results, first use `synthesis_agent` to format the data, then `export_agent`.
    """,
    tools=[
        run_monitoring_cycle,
        send_notification,
        add_competitor,
        remove_competitor,
        list_competitors,
        AgentTool(agent=analysis_agent),
        AgentTool(agent=reporting_agent),
        AgentTool(agent=comparison_agent),
        AgentTool(agent=synthesis_agent),
        AgentTool(agent=export_agent),
    ],
)

# --- Main Execution Block ---
def run_autonomous_mode():
    print("🚀 Starting IntelTracker Agent in Autonomous Mode.")
    session = Session(agent=root_agent)
    while True:
        print(f"[{time.ctime()}] Triggering scheduled monitoring cycle...")
        response = session.run(request="run a scheduled monitoring cycle")
        if "Notification sent" in response.output:
            print(f"[{time.ctime()}] Cycle complete. New updates found and reported.")
        else:
            print(f"[{time.ctime()}] Cycle complete. No new updates found.")
        time.sleep(3600)

def run_interactive_mode():
    print("🎙️ Starting IntelTracker Agent in Interactive Mode.")
    session = Session(agent=root_agent)
    while True:
        user_input = input("USER: ")
        if user_input.lower() in ["exit", "quit"]: break
        response = session.run(request=user_input)
        print(f"AGENT: {response.output}")

def main():
    if not genai:
        print("Cannot run agent: GEMINI_API_KEY is not set or google.generativeai is not installed.")
        return
    parser = argparse.ArgumentParser(description="Run the IntelTracker Agent.")
    parser.add_argument("--interactive", action="store_true", help="Run in interactive mode.")
    args = parser.parse_args()
    if args.interactive:
        run_interactive_mode()
    else:
        run_autonomous_mode()

if __name__ == "__main__":
    main()
