// This file implements the correct pattern for interacting with the ADK API.
// Instead of calling tools directly, it sends natural language prompts to the
// agent's `/run` endpoint and parses the JSON from the final response.

export interface Competitor {
  name: string;
  enabled: boolean;
  category: string;
  priority: 'High' | 'Medium' | 'Low';
  website_url?: string;
  rss_feed_url?: string;
  tags: string[];
  added_at: string;
  last_checked?: string;
}

export interface Analysis {
    summary: string;
    key_features: string[];
    impact: string;
    action: string;
    competitor_name: string;
    threat_level: string;
    opportunities: string[];
    strategic_implications?: string;
    confidence_score: number;
}

export interface Update {
    title: string;
    content: string;
    source_type: string;
    url: string;
    date?: string;
    impact: string;
    detected_at: string;
}

export interface Finding {
    competitor: Competitor;
    updates: Update[];
    analysis: Analysis;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
const APP_NAME = 'intel_tracker'; // As defined in agent.py
const USER_ID = 'dashboard-user';
const SESSION_ID = 'main-session';

/**
 * A generic function to run a query against the ADK agent.
 * It sends a prompt and expects a JSON response in the agent's final output.
 * @param prompt The natural language prompt to send to the agent.
 * @returns The parsed JSON object from the agent's response.
 */
async function runAgentQuery(prompt: string): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        app_name: APP_NAME,
        user_id: USER_ID,
        session_id: SESSION_ID,
        new_message: {
          role: "user",
          parts: [{ "text": prompt }]
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Agent query failed with status ${response.status}:`, errorText);
      throw new Error(`Agent query failed: ${errorText}`);
    }

    const events = await response.json();

    // The response is an array of events. We need the last "model" response.
    const lastModelPart = events
      .slice()
      .reverse()
      .find((e: any) => e.content?.role === 'model' && e.content?.parts?.[0]?.text)
      ?.content.parts[0].text;

    if (lastModelPart) {
      try {
        // The agent's response is expected to be a JSON string
        return JSON.parse(lastModelPart);
      } catch (e) {
        console.error("Failed to parse JSON from agent's response:", lastModelPart);
        // Fallback for non-json responses, like conversational ones
        return lastModelPart;
      }
    }

    console.error('No valid model response found in events', events);
    throw new Error('No valid model response found');
  } catch (error) {
    console.error(`Error in runAgentQuery for prompt "${prompt}":`, error);
    throw error;
  }
}

export async function getCompetitors(): Promise<Competitor[]> {
  // Explicitly ask for the 'json' output format for robust parsing.
  const prompt = "call list_competitors with output_format='json'";
  return await runAgentQuery(prompt);
}

export async function addCompetitor(name: string, website_url: string, category: string, priority: string, tags: string, rss_feed_url?: string): Promise<string> {
    const rssPart = rss_feed_url ? `and rss feed ${rss_feed_url}` : '';
    // Ask for a human-readable response for the toast message.
    const prompt = `add a new competitor named "${name}" with website url "${website_url}", category "${category}", priority "${priority}", and tags "${tags}" ${rssPart}. Respond with a success message.`;
    return await runAgentQuery(prompt);
}

export async function runIntelligenceCheck(): Promise<Finding[] | { status: string; message: string }> {
    // Explicitly ask for the 'json' output format for robust parsing.
    const prompt = "call run_intelligence_check with output_format='json'";
    return await runAgentQuery(prompt);
}