# 🔧 IntelTracker Developer Documentation

**Technical reference for developers maintaining and extending IntelTracker**

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Core Components](#core-components)
- [Data Models](#data-models)
- [Critical Code Sections](#critical-code-sections)
- [Known Issues & Caveats](#known-issues--caveats)
- [Extension Points](#extension-points)
- [Performance Considerations](#performance-considerations)
- [Testing Strategy](#testing-strategy)
- [Debugging Guide](#debugging-guide)
- [Common Pitfalls](#common-pitfalls)
- [Migration Guide](#migration-guide)

---

## Architecture Overview

### System Design

```
┌─────────────────────────────────────────────────┐
│              Google ADK Agent Layer             │
│  (Natural language interface, tool invocation)  │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│           MonitoringEngine (Core)               │
│  - Orchestrates checking workflow               │
│  - Manages rate limiting & error handling       │
│  - Coordinates all subsystems                   │
└──────────────────┬──────────────────────────────┘
                   │
      ┌────────────┼────────────┐
      │            │            │
┌─────▼────┐ ┌────▼─────┐ ┌───▼──────┐
│ Content  │ │   AI     │ │  Trend   │
│Extractor │ │ Analyzer │ │ Analyzer │
└──────────┘ └──────────┘ └──────────┘
      │            │            │
      └────────────┼────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│        Storage Layer (JSON files)               │
│  - competitors.json, trends.json, cache.json    │
│  - config.json, company_context.json            │
└─────────────────────────────────────────────────┘
```

### Data Flow

1. **ADK Tool Invocation** → User command parsed
2. **MonitoringEngine.monitor_competitor()** → Orchestration begins
3. **ContentExtractor** → Fetch & parse content
4. **Cache Filter** → Remove previously seen content
5. **AIAnalyzer** → Generate strategic insights
6. **TrendAnalyzer** → Record historical patterns
7. **ReportGenerator** → Create formatted output
8. **EmailNotifier** → Send notifications (optional)
9. **ExportManager** → Save to files (optional)

---

## Core Components

### 1. ContentExtractor (Lines 292-620)

**Purpose:** Extract content from websites and RSS feeds

**Strategies (in order of execution):**

```python
1. RSS Feed (if available)
   - Most reliable
   - Uses feedparser library
   - Parses entries directly

2. Structured Website Content
   - Looks for article/section/div containers
   - Searches for specific class/id patterns
   - Extracts headings (h1-h6)
   - Processes list items

3. Aggressive Extraction (fallback)
   - Tries ALL headings on page
   - Extracts paragraphs with bold text
   - Pulls from standalone divs
   - Last resort before failure

4. Web Search (final fallback)
   - Uses DuckDuckGo API
   - Searches for recent updates
   - Creates Update objects from results
```

**Key Methods:**

```python
extract_from_rss(url) -> List[Update]
extract_from_website(url) -> List[Update]
_extract_structured_content(soup, url) -> List[Update]
_aggressive_extraction(soup, url) -> List[Update]
_clean_soup(soup) -> BeautifulSoup  # Removes noise
```

**Caveats:**
- JavaScript-heavy sites (like Airtable) fail scraping
- Some sites block User-Agent headers
- Rate limiting required to avoid IP blocks
- HTML structure changes break extraction

### 2. AIAnalyzer (Lines 620-850)

**Purpose:** Generate strategic analysis using Gemini or fallback rules

**Analysis Flow:**

```python
analyze_updates(competitor, category, updates)
    ↓
if GEMINI_AVAILABLE:
    _analyze_with_gemini()
        - Builds prompt with company context
        - Includes 5 most recent updates
        - Requests JSON structured response
        - Parses and validates result
else:
    _basic_analysis()
        - Keyword-based impact assessment
        - Rule-based threat evaluation
        - Generic recommendations
```

**Prompt Structure:**

```
1. Company Context (YOUR business)
2. Competitor Info (name, category, updates)
3. Update Details (titles, content, dates)
4. Analysis Instructions (JSON format)
5. Perspective Framing (from YOUR viewpoint)
```

**Caveats:**
- Gemini may refuse sensitive requests (rare)
- JSON parsing can fail if model doesn't follow format
- Rate limits on Gemini API (15 requests/minute on free tier)
- Analysis quality depends on company context quality

### 3. MonitoringEngine (Lines 1020-1240)

**Purpose:** Orchestrate monitoring workflow

**Critical Method: `monitor_competitor()`**

```python
def monitor_competitor(competitor: CompetitorConfig):
    1. Check if enabled
    2. Try RSS feed (if available)
    3. Try website scraping
    4. Fallback to web search (if both fail)
    5. Filter out previously seen content
    6. Analyze updates with AI
    7. Record trends
    8. Send alerts (if configured)
    9. Update cache and config
    10. Return findings or None
```

**Key State Management:**
- Updates cache after successful check
- Updates competitor.last_checked timestamp
- Saves configuration changes immediately
- Maintains rate limiting between checks

**Caveats:**
- Must call `_filter_new_updates()` before analysis
- Must create `analysis` variable before using it
- Must update cache even if no new content
- Error in one competitor shouldn't crash entire check

### 4. TrendAnalyzer (Lines 900-1020)

**Purpose:** Track historical patterns and activity trends

**Data Structure:**

```json
{
  "competitor_name": {
    "history": [
      {
        "timestamp": "2025-10-03T10:30:00",
        "impact": "High",
        "threat_level": "Medium",
        "summary": "...",
        "key_features": ["..."]
      }
    ],
    "impact_counts": {"High": 5, "Medium": 3},
    "feature_mentions": {"ai": 12, "automation": 8}
  }
}
```

**Analysis Capabilities:**
- Activity trend (increasing/stable/decreasing)
- Average impact over time
- Most mentioned features
- Recent focus areas (last 10 updates)

**Caveats:**
- Keeps only last 50 entries per competitor (memory management)
- Feature extraction is basic (word frequency)
- No sentiment analysis (yet)
- Comparison requires both competitors to have history

---

## Data Models

### CompetitorConfig (Line 80)

```python
@dataclass
class CompetitorConfig:
    name: str                        # REQUIRED
    website_url: Optional[str]       # Primary source
    rss_feed_url: Optional[str]      # Most reliable
    twitter_handle: Optional[str]    # Not implemented yet
    linkedin_url: Optional[str]      # Not implemented yet
    press_release_url: Optional[str] # Not implemented yet
    category: str = "Unknown"        # For analysis context
    priority: str = "Medium"         # High/Medium/Low
    enabled: bool = True             # Active monitoring
    tags: List[str]                  # For filtering
    added_at: str                    # ISO timestamp
    last_checked: Optional[str]      # ISO timestamp
```

**Validation:**
- At least one of website_url or rss_feed_url required
- priority must be High/Medium/Low
- name must be unique

### Update (Line 110)

```python
@dataclass
class Update:
    title: str                   # REQUIRED
    content: str                 # REQUIRED
    source_type: str            # website/rss/search
    url: str                    # REQUIRED
    date: Optional[str]         # From source
    impact: str = "Medium"      # Filled by analyzer
    detected_at: str            # Auto-generated
```

**Content Limits:**
- title: max 250 chars
- content: max 1200 chars
- Longer content is truncated

### Analysis (Line 120)

```python
@dataclass
class Analysis:
    summary: str                          # Max 400 chars
    key_features: List[str]               # Max 5 features
    impact: str                           # Critical/High/Medium/Low
    action: str                           # Max 250 chars
    competitor_name: str
    threat_level: str = "Medium"
    opportunities: List[str]              # Max 4
    strategic_implications: Optional[str] # Max 400 chars
    confidence_score: float = 0.8         # 0.0-1.0
```

### CompanyContext (Line 145)

```python
@dataclass
class CompanyContext:
    company_name: str = "Your Company"
    product_name: Optional[str]
    industry: str = "Technology"
    target_market: str = "General"
    key_features: List[str]
    differentiation: Optional[str]
    current_focus: Optional[str]
    company_stage: str = "Startup"        # Startup/Growth/Established
    team_size: Optional[str]
    positioning: Optional[str]
    strategic_goals: List[str]
    updated_at: str
```

**Used in:**
- AI analysis prompts
- Report generation
- Impact assessment calibration

---

## Critical Code Sections

### 1. Cache Management (Lines 1160-1180)

**Why it's critical:** Prevents duplicate alerts

```python
def _filter_new_updates(self, competitor_name, updates):
    # Creates MD5 hash of title + first 100 chars of content
    # Compares against cache
    # Returns only unseen updates
```

**Hash Function:**
```python
hash = md5(f"{title}{content[:100]}".encode()).hexdigest()
```

**Caveat:** If content changes slightly (typo fix, formatting), it's treated as new.

**Storage:** `cache[f"competitor_{name}"]` = list of hashes (max 100)

### 2. Analysis Variable Assignment (Lines 1115-1125)

**CRITICAL BUG LOCATION:**

```python
# WRONG - will crash:
new_updates = self._filter_new_updates(...)
TrendAnalyzer.record_finding(competitor.name, analysis)  # analysis undefined!

# CORRECT - must create analysis first:
new_updates = self._filter_new_updates(...)
analysis = AIAnalyzer.analyze_updates(...)  # CREATE IT
if not analysis:
    return None
TrendAnalyzer.record_finding(competitor.name, analysis)  # NOW OK
```

**This was the bug you hit earlier.** The analysis must be created after filtering but before using.

### 3. Web Search Fallback (Lines 1100-1110)

```python
if not web_updates:
    logger.info("Trying search...")
    search_updates = self._search_for_updates(competitor)
    if search_updates:
        updates.extend(search_updates)
```

**Why it matters:** JavaScript-heavy sites need this fallback.

**Caveat:** DuckDuckGo API is rate-limited and may return empty results.

### 4. Email Sending (Lines 200-290)

**Two types:**
1. **Digest** - Full report sent on command
2. **Alert** - Instant notification on critical/high updates

**Critical SMTP settings:**
```python
# Gmail REQUIRES App Password (not regular password)
smtp_server = "smtp.gmail.com"
smtp_port = 587  # TLS
username = "your@gmail.com"
password = "16-char-app-password"  # From Google Account
```

**Caveat:** Plain text passwords stored in config.json - secure your system!

---

## Known Issues & Caveats

### 1. JavaScript-Heavy Websites

**Problem:** Sites like Airtable, Notion's "What's New" load content via JavaScript. BeautifulSoup only sees initial HTML (empty).

**Solution:** 
- Use RSS feed (best)
- Web search fallback (implemented)
- Manual checking (last resort)

**Detection:** If aggressive extraction finds 0 updates, likely JS-heavy.

### 2. Rate Limiting

**Default:** 2 seconds between competitor checks

**Why:** Prevent IP blocks and respect servers

**Adjustment:** `configure_monitoring(rate_limit_seconds=5)`

**Caveat:** Too fast = IP block. Too slow = checks take forever.

### 3. Gemini API Limits

**Free Tier:**
- 15 requests per minute
- 1500 requests per day

**Exceeded:** System falls back to rule-based analysis automatically.

**Detection:** Check logs for "Gemini analysis failed"

### 4. Cache Limitations

**Size:** 100 hashes per competitor

**Problem:** Very old updates might be reported as "new" if cache rotated.

**Solution:** Acceptable trade-off for memory efficiency.

**Reset:** `reset_cache(confirm=True)` if needed.

### 5. Email Password Storage

**Security Issue:** SMTP passwords stored in plain text in `data/config.json`

**Mitigation:**
- Use app-specific passwords (not main password)
- Secure file permissions: `chmod 600 data/config.json`
- Don't commit config.json to git
- Consider environment variables for production

**Future:** Encrypt credentials in v13.0

### 6. Concurrent Execution

**Current:** Single-threaded, synchronous

**Problem:** Checking 50 competitors takes time

**Workaround:** Schedule checks during off-hours

**Future:** Async/await in v12.1

### 7. HTML Structure Changes

**Problem:** When competitor redesigns website, extraction breaks

**Detection:** Logs show "No structured content found"

**Solution:** 
- Aggressive extraction kicks in (automatic)
- Find RSS feed (manual)
- Update extraction patterns (code change)

**Self-healing:** System tries multiple strategies automatically.

---

## Extension Points

### Adding New Content Sources

**Location:** ContentExtractor class (Lines 292-620)

**Steps:**
1. Add method `extract_from_SOURCE(url) -> List[Update]`
2. Update `CompetitorConfig` to include new source URL field
3. Update `monitor_competitor()` to call your method
4. Add source type to `SourceType` enum

**Example - Adding Twitter:**

```python
# 1. Add to SourceType enum (Line 75)
class SourceType(Enum):
    TWITTER = "twitter"  # Add this

# 2. Add method to ContentExtractor
@staticmethod
def extract_from_twitter(handle: str) -> List[Update]:
    """Extract tweets from Twitter/X."""
    # Use Twitter API or nitter instance
    # Return List[Update]
    pass

# 3. Update monitor_competitor() (Line 1080)
if competitor.twitter_handle:
    try:
        tweets = ContentExtractor.extract_from_twitter(
            competitor.twitter_handle
        )
        updates.extend(tweets)
    except Exception as e:
        logger.warning(f"Twitter extraction failed: {e}")
```

### Adding New Analysis Engines

**Location:** AIAnalyzer class (Lines 620-850)

**Current:** Gemini 2.5 Flash with rule-based fallback

**To add OpenAI/Claude/Other:**

```python
# Add to AIAnalyzer class
@staticmethod
def _analyze_with_openai(competitor_name, category, updates):
    """Alternative AI analysis using OpenAI."""
    # Similar prompt structure
    # Return Analysis object
    pass

# Update analyze_updates() method
@staticmethod
def analyze_updates(competitor_name, category, updates):
    # Try Gemini first
    if GEMINI_AVAILABLE:
        result = AIAnalyzer._analyze_with_gemini(...)
        if result:
            return result
    
    # Try OpenAI second
    if OPENAI_AVAILABLE:
        result = AIAnalyzer._analyze_with_openai(...)
        if result:
            return result
    
    # Fallback to rules
    return AIAnalyzer._basic_analysis(...)
```

### Adding New Export Formats

**Location:** ExportManager class (Lines 1270-1350)

**Example - Adding Excel:**

```python
@staticmethod
def export_to_excel(findings, filename=None):
    """Export to Excel with formatting."""
    import openpyxl
    
    wb = openpyxl.Workbook()
    ws = wb.active
    
    # Add headers
    ws.append(['Competitor', 'Impact', 'Summary', ...])
    
    # Add data
    for finding in findings:
        ws.append([...])
    
    # Save
    export_path = EXPORTS_DIR / filename
    wb.save(export_path)
    return export_path
```

### Adding New Notification Channels

**Location:** Create new notifier class similar to EmailNotifier (Lines 200-290)

**Example - Slack Integration:**

```python
class SlackNotifier:
    """Send notifications to Slack."""
    
    def __init__(self, webhook_url: str):
        self.webhook_url = webhook_url
    
    def send_digest(self, report: str, findings_count: int) -> bool:
        """Post report to Slack channel."""
        import requests
        
        payload = {
            "text": f"*Competitive Intelligence Update*",
            "attachments": [{
                "text": report[:3000],  # Slack limit
                "color": "good"
            }]
        }
        
        response = requests.post(self.webhook_url, json=payload)
        return response.ok
    
    def send_alert(self, competitor_name, impact, summary):
        """Send instant alert to Slack."""
        # Similar implementation
        pass

# Add to MonitoringEngine
self.slack_notifier = SlackNotifier(config.slack_webhook)
```

### Adding New ADK Tools

**Location:** Tools section (Lines 1300-1800)

**Template:**

```python
@FunctionTool
def your_new_tool(
    tool_context: "ToolContext",
    required_param: str,
    optional_param: Optional[str] = None
) -> str:
    """
    Tool description shown to AI agent.
    
    Args:
        required_param: Description
        optional_param: Description with default
    
    Returns:
        Formatted string response
    """
    # Your logic here
    
    result = "Success message\n\n"
    result += "Details..."
    
    return result

# Add to root_agent.tools list (Line 1750)
```

---

## Performance Considerations

### Memory Usage

**Current:** ~50-100 MB for typical usage

**Scaling factors:**
- Number of competitors: +1 MB per competitor
- Trend history: +100 KB per 100 updates
- Cache size: +50 KB per competitor
- Reports: +1 MB per 10 reports

**Memory management:**
- Trends limited to 50 entries per competitor
- Cache limited to 100 hashes per competitor
- Old reports not auto-deleted (manual cleanup needed)

### Disk Usage

**Typical:** 1-10 MB per day

**Breakdown:**
- Logs: ~100 KB per day (rotates at 10 MB)
- Reports: ~50 KB per report
- Trends: ~10 KB per competitor per day
- Exports: Variable (1-5 MB per export)

**Cleanup strategy:**
```bash
# Manual cleanup
rm data/reports/intel_report_2024*.md
rm data/exports/intel_export_2024*.json
```

### Network Performance

**Request patterns:**
- 1 HTTP request per competitor website
- 1 HTTP request per RSS feed
- 1-2 Gemini API calls per competitor
- 1 SMTP connection per email

**Rate limiting:**
- Default: 2s between competitor checks
- Gemini: 15 req/min (free tier)
- Web scraping: Respectful delay

**Optimization tips:**
- Use RSS feeds (faster, more reliable)
- Increase rate_limit_seconds if getting blocked
- Cache aggressively (already implemented)
- Consider async for 50+ competitors

### Database Performance

**Current:** JSON file-based storage

**Limitations:**
- Sequential reads/writes
- No indexing
- No concurrent access
- Full file rewrite on save

**When to migrate to real database:**
- 100+ competitors
- Multiple users/processes
- Need for complex queries
- Historical analysis beyond trends

**Migration path:**
```python
# v13.0 will support optional SQLite backend
# v14.0 will support PostgreSQL for teams
```

---

## Testing Strategy

### Unit Testing

**Current state:** No automated tests (v12.0)

**Recommended approach:**

```python
# tests/test_content_extractor.py
def test_rss_extraction():
    """Test RSS feed parsing."""
    updates = ContentExtractor.extract_from_rss(
        "https://example.com/feed.xml"
    )
    assert len(updates) > 0
    assert all(u.title for u in updates)

def test_cache_filtering():
    """Test duplicate detection."""
    # Create mock updates
    # Test _filter_new_updates()
    pass

def test_gemini_analysis():
    """Test AI analysis with mock response."""
    # Mock Gemini API
    # Test analysis parsing
    pass
```

**Priority tests:**
1. Content extraction (RSS, web, search)
2. Cache filtering (duplicate detection)
3. Analysis parsing (JSON validation)
4. Email sending (SMTP connection)

### Integration Testing

**Manual test script:**

```python
# test_integration.py
def test_full_workflow():
    """Test complete monitoring workflow."""
    
    # 1. Add test competitor
    add_competitor(
        name="TestCompany",
        website_url="https://example.com/changelog"
    )
    
    # 2. Run check
    findings = MonitoringEngine().monitor_all()
    
    # 3. Verify findings
    assert findings is not None
    
    # 4. Export
    export_intelligence_data(format="json")
    
    # 5. Cleanup
    remove_competitor("TestCompany", confirm=True)
```

### End-to-End Testing

**Using ADK:**

```bash
# Start ADK
adk start

# Test commands
> add competitor named "TestCo" with website "https://example.com"
> check single competitor "TestCo"
> export intelligence data
> remove competitor "TestCo" confirm true
```

### Regression Testing

**Known issues to test:**
1. Analysis variable undefined (Line 1131 bug)
2. Cache not updating after check
3. Email sending with invalid credentials
4. Web scraping on JS-heavy sites
5. Export with no data available

---

## Debugging Guide

### Enable Verbose Logging

```python
# In agent.py (Line 58)
logging.basicConfig(
    level=logging.DEBUG,  # Change from INFO to DEBUG
    format='%(asctime)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler()
    ]
)
```

### Common Debug Points

**1. No content extracted:**

```python
# Add after ContentExtractor.extract_from_website()
logger.debug(f"Raw HTML length: {len(response.text)}")
logger.debug(f"Cleaned HTML length: {len(soup.get_text())}")
logger.debug(f"Found containers: {len(containers)}")
```

**2. Analysis not working:**

```python
# Add in AIAnalyzer._analyze_with_gemini()
logger.debug(f"Prompt length: {len(prompt)} chars")
logger.debug(f"Response text: {text[:200]}")
```

**3. Cache issues:**

```python
# Add in _filter_new_updates()
logger.debug(f"Total updates: {len(updates)}")
logger.debug(f"Cached hashes: {len(seen_hashes)}")
logger.debug(f"New updates: {len(new_updates)}")
```

**4. Email not sending:**

```python
# Add in EmailNotifier.send_digest()
logger.debug(f"SMTP server: {self.config.smtp_server}")
logger.debug(f"SMTP port: {self.config.smtp_port}")
logger.debug(f"From: {self.config.smtp_username}")
logger.debug(f"To: {self.config.notification_email}")
```

### Using Python Debugger

```python
# Add breakpoint in code
import pdb; pdb.set_trace()

# Or use breakpoint() in Python 3.7+
breakpoint()

# Commands:
# n - next line
# s - step into
# c - continue
# p variable - print variable
# l - show current code
# q - quit
```

### Log Analysis

```bash
# View logs in real-time
tail -f data/intel_tracker.log

# Search for errors
grep ERROR data/intel_tracker.log

# Search for specific competitor
grep "Airtable" data/intel_tracker.log

# Count warnings
grep -c WARNING data/intel_tracker.log
```

---

## Common Pitfalls

### 1. Forgetting to Create Analysis Variable

**Symptom:** `NameError: name 'analysis' is not defined`

**Cause:** Using analysis before assignment

**Fix:**
```python
# WRONG
new_updates = self._filter_new_updates(...)
TrendAnalyzer.record_finding(competitor.name, analysis)  # Crashes

# RIGHT
new_updates = self._filter_new_updates(...)
analysis = AIAnalyzer.analyze_updates(...)  # Create first
if not analysis:
    return None
TrendAnalyzer.record_finding(competitor.name, analysis)  # OK
```

### 2. Not Updating Cache

**Symptom:** Same updates reported repeatedly

**Cause:** Cache not saved after filtering

**Fix:**
```python
# Always call after filtering
self._update_cache(competitor.name, updates)
save_cache(self.cache)
```

### 3. Gmail Authentication Failure

**Symptom:** "Authentication failed" or "Username and Password not accepted"

**Cause:** Using regular password instead of App Password

**Fix:**
1. Enable 2FA on Google Account
2. Generate App Password at https://myaccount.google.com/apppasswords
3. Use 16-character App Password in config

### 4. Duplicate Competitors

**Symptom:** Same competitor added multiple times

**Cause:** Case-sensitive name comparison

**Fix:**
```python
# In add_competitor()
if any(c.name.lower() == name.lower() for c in competitors):
    return "Already exists"
```

### 5. Empty Reports

**Symptom:** "No data to export"

**Cause:** Export function running fresh check instead of using historical data

**Fix:** Use trend data, not fresh findings (implemented in v12.0)

### 6. JavaScript Site Scraping

**Symptom:** "Aggressive extraction found 0 updates"

**Cause:** Site loads content dynamically

**Fix:** 
- Find RSS feed (best)
- Web search fallback triggers automatically
- Manual checking as last resort

### 7. Rate Limiting Too Aggressive

**Symptom:** Checks take forever with many competitors

**Cause:** Default 2s delay between checks

**Fix:**
```python
configure_monitoring(rate_limit_seconds=1)  # Faster but riskier
```

### 8. Trend Data Not Showing

**Symptom:** "No historical data" for competitor

**Cause:** Competitor hasn't been checked yet, or had no updates

**Fix:** Run at least one successful check with updates

### 9. Email HTML Not Rendering

**Symptom:** Plain text email received instead of formatted

**Cause:** Email client doesn't support HTML

**Fix:** Already handled - sends both HTML and plain text versions

### 10. Memory Leak with Large History

**Symptom:** Memory usage grows over time

**Cause:** Unlimited trend history

**Fix:** Already implemented - limited to 50 entries per competitor

---

## Migration Guide

### Upgrading from Earlier Versions

**v11.0 → v12.0:**

1. **New files created:**
   - `company_context.json` - Company information
   - No breaking changes to existing files

2. **New dependencies:**
   - No additional dependencies

3. **Configuration changes:**
   - New `configure_company_context()` tool
   - New `configure_email_notifications()` tool
   - Existing configs remain compatible

4. **Migration steps:**
```bash
# 1. Backup existing data
cp -r data data_backup

# 2. Update code
# Replace agent.py with v12.0

# 3. Run once
python agent.py

# 4. Configure company context
# Use ADK or direct tool call

# 5. Verify
# Check data/company_context.json exists
```

### Data Format Changes

**None in v12.0** - All existing data compatible.

**Future (v13.0) - SQLite migration:**

```python
# Migration script will be provided
python migrate_to_sqlite.py

# Will preserve:
# - All competitor configs
# - Historical trends
# - Company context
# - Monitoring settings
```

### Backing Up Data

```bash
# Full backup
tar -czf inteltracker_backup_$(date +%Y%m%d).tar.gz data/

# Restore
tar -xzf inteltracker_backup_20251003.tar.gz
```

### Exporting Before Migration

```python
# Export everything
export_intelligence_data(
    format="json",
    include_trends=True,
    include_all_history=True
)

# Results in portable JSON file
# Can be imported later or used for reference
```

---

## Security Considerations

### Sensitive Data

**Stored in plain text:**
- SMTP passwords (`data/config.json`)
- Gemini API key (environment variable)
- Company context (not sensitive, but business info)

**Mitigation:**
```bash
# Secure file permissions
chmod 600 data/config.json
chmod 700 data/

# Don't commit to git
echo "data/" >> .gitignore

# Use environment variables for production
export SMTP_PASSWORD="..."
export GEMINI_API_KEY="..."
```

### API Keys

**Current:** Environment variable (good)

**Best practice:**
```python
# Use python-dotenv
from dotenv import load_dotenv
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
```

### Web Scraping Ethics

**Current approach:**
- 2s delay between requests (respectful)
- Standard User-Agent (transparent)
- No authentication bypass
- Public content only

**Considerations:**
- Check robots.txt (manual for now)
- Respect rate limits
- Don't scrape private content
- Prefer RSS/APIs over scraping

### Data Privacy

**What we collect:**
- Public competitor information
- Public updates/news
- No personal data
- No cookies/tracking

**Compliance:**
- GDPR: No personal data collected
- CCPA: No consumer data
- Fair use: News/information aggregation

---

## Future Roadmap (Technical)

### v12.1 (Next Release)

**Async web scraping:**
```python
async def monitor_all_async(self):
    tasks = [
        self.monitor_competitor_async(comp)
        for comp in competitors if comp.enabled
    ]
    findings = await asyncio.gather(*tasks)
    return [f for f in findings if f]
```

**Benefits:**
- 10x faster for many competitors
- Better resource utilization
- Non-blocking operations

### v13.0 (Database)

**SQLite backend:**
```python
# Optional database mode
engine = MonitoringEngine(storage="sqlite")

# Or keep JSON
engine = MonitoringEngine(storage="json")
```

**Schema:**
```sql
CREATE TABLE competitors (...);
CREATE TABLE updates (...);
CREATE TABLE analyses (...);
CREATE TABLE trends (...);
CREATE INDEX idx_competitor_name ON competitors(name);
CREATE INDEX idx_update_date ON updates(detected_at);
```

### v14.0 (Team Features)

**Multi-user support:**
- User authentication
- Role-based access
- Shared competitor lists
- Collaborative analysis

**API server:**
```python
# REST API
GET /api/competitors
POST /api/competitors
GET /api/reports
GET /api/trends/:competitor
```

---

## Code Quality Checklist

Before committing changes:

- [ ] Added docstrings to new functions
- [ ] Updated type hints
- [ ] Added error handling
- [ ] Updated DEVELOPER.md if architecture changed
- [ ] Updated README.md if user-facing changes
- [ ] Tested with 3+ competitors
- [ ] Checked logs for warnings/errors
- [ ] Verified exports still work
- [ ] Tested email notifications
- [ ] No hardcoded credentials
- [ ] Sensitive data not logged
- [ ] Memory usage reasonable
- [ ] Rate limiting respected

---

## Contact & Contribution

**For developers extending IntelTracker:**

1. Read this document thoroughly
2. Test changes with real competitors
3. Add debug logging
4. Update documentation
5. Submit PR with clear description

**Key maintainability principles:**
- Fail gracefully (don't crash)
- Log everything (debug mode)
- Fallback strategies (multiple approaches)
- Self-healing (retry on failure)
- User-friendly errors (actionable messages)

---

**Built for startups, maintained by developers who care about quality.**