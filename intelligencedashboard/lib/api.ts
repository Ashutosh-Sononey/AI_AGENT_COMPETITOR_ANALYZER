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

async function callTool(toolName: string, args: Record<string, any> = {}): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/tools/${toolName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ args }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API call to ${toolName} failed with status ${response.status}:`, errorText);
      throw new Error(`API call to ${toolName} failed: ${errorText}`);
    }

    const result = await response.json();

    if (result && typeof result.output === 'string') {
      // The backend returns a JSON string in the output field
      return JSON.parse(result.output);
    }

    console.error('Invalid response format from tool', toolName, result);
    throw new Error(`Invalid response format from tool ${toolName}`);
  } catch (error) {
    console.error(`Error calling tool ${toolName}:`, error);
    throw error;
  }
}

export async function getCompetitors(showDisabled: boolean = true): Promise<Competitor[]> {
  return await callTool('list_competitors', { show_disabled: showDisabled });
}

export async function addCompetitor(name: string, website_url: string, category: string, priority: string, tags: string, rss_feed_url?: string): Promise<string> {
    const args: any = { name, website_url, category, priority, tags };
    if (rss_feed_url) {
        args.rss_feed_url = rss_feed_url;
    }
    return await callTool('add_competitor', args);
}

export async function runIntelligenceCheck(): Promise<Finding[] | { status: string; message: string }> {
    return await callTool('run_intelligence_check', { format: 'summary' });
}