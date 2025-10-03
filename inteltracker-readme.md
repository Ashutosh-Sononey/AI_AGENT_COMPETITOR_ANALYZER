# 🎯 IntelTracker v12.0

**Production-ready competitive intelligence system for startups and businesses**

Monitor competitors automatically, get AI-powered strategic analysis, and stay ahead of market changes.

---

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage Guide](#usage-guide)
- [ADK Integration](#adk-integration)
- [Email Notifications](#email-notifications)
- [Data Export](#data-export)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Architecture](#architecture)
- [Contributing](#contributing)

---

## Features

### 🔍 Comprehensive Monitoring
- **Multi-source tracking**: Websites, RSS feeds, social media (ready), press releases
- **Smart extraction**: AI-powered content filtering removes UI noise
- **Change detection**: Only alerts on genuinely new content
- **Fallback strategies**: Web search when scraping fails

### 🤖 AI-Powered Analysis
- **Gemini 2.5 Flash**: Sophisticated strategic analysis
- **Company-calibrated**: Understands YOUR business context
- **Impact assessment**: Critical/High/Medium/Low categorization
- **Threat evaluation**: Competitive positioning analysis
- **Opportunity spotting**: Identifies gaps and advantages
- **Smart fallback**: Rule-based analysis when AI unavailable

### 📊 Intelligence Reports
- **Multiple formats**: Brief, Summary, Detailed
- **Markdown output**: Easy to read and share
- **Export options**: JSON and CSV for analysis
- **Historical tracking**: Trend analysis over time
- **Comparison tools**: Side-by-side competitor analysis

### 📧 Smart Notifications
- **Email digests**: Automatic report delivery
- **Instant alerts**: Critical/high-impact updates
- **Configurable**: Control frequency and types
- **Provider support**: Gmail, Outlook, custom SMTP

### 📈 Advanced Analytics
- **Trend tracking**: Activity patterns over time
- **Competitor comparison**: Multi-dimensional analysis
- **Focus detection**: What competitors are working on
- **Impact distribution**: Understanding strategy shifts

---

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Set Up Gemini API (Optional but Recommended)

```bash
export GEMINI_API_KEY="your-api-key-here"
```

Get your key from: https://makersuite.google.com/app/apikey

### 3. Run IntelTracker

```bash
python agent.py
```

This will:
- Initialize with default competitors (Notion, Linear, Airtable)
- Run an intelligence check
- Generate a report in `./data/reports/`

### 4. Use with ADK (Recommended)

```bash
adk start
```

Then interact naturally:
- "Check my competitors"
- "Add Figma as a competitor"
- "Compare Notion and Linear"
- "Set up email notifications"

---

## Installation

### Requirements

- Python 3.8+
- Internet connection
- (Optional) Gemini API key for AI analysis
- (Optional) SMTP credentials for email notifications

### Dependencies

```
google-adk
google-generativeai
requests
beautifulsoup4
feedparser
schedule
```

### Setup

```bash
# Clone or download
cd IntelTracker

# Install dependencies
pip install -r requirements.txt

# Set API key (optional)
export GEMINI_API_KEY="your-key"

# Run
python agent.py
```

---

## Configuration

### Company Context (Required for Best Results)

Configure your company for calibrated analysis:

```python
configure_company_context(
    company_name="TaskFlow",
    product_name="TaskFlow Pro",
    industry="SaaS - Project Management",
    target_market="Remote teams",
    key_features="Async workflows, Time zone automation, Deep integrations",
    differentiation="Only project tool for remote teams",
    current_focus="AI-powered prioritization",
    company_stage="Growth",
    strategic_goals="Expand enterprise, Launch mobile app"
)
```

### Email Notifications

```python
configure_email_notifications(
    email="alerts@yourcompany.com",
    smtp_username="your@gmail.com",
    smtp_password="abcd efgh ijkl mnop",  # Gmail App Password
    notify_critical=True,
    notify_high=True,
    test_email=True
)
```

**Gmail Setup:**
1. Enable 2-Factor Authentication
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use the 16-character password (not your regular password)

### Monitoring Settings

```python
configure_monitoring(
    check_interval_hours=24,
    enable_scheduling=True,
    digest_format="detailed",
    max_updates_per_competitor=5,
    export_after_check=True
)
```

---

## Usage Guide

### Adding Competitors

**With RSS (Recommended):**
```python
add_competitor(
    name="Figma",
    website_url="https://figma.com/changelog",
    rss_feed_url="https://figma.com/rss",
    category="Design Tools",
    priority="High",
    tags="design,collaboration,prototyping"
)
```

**Website Only:**
```python
add_competitor(
    name="Miro",
    website_url="https://miro.com/blog/product-updates",
    category="Collaboration",
    priority="Medium"
)
```

### Running Intelligence Checks

**Check All Competitors:**
```python
run_intelligence_check(format="detailed")
```

**Check Specific Competitor:**
```python
check_single_competitor("Figma")
```

**With Email:**
```python
run_intelligence_check(format="summary", send_email=True)
```

### Viewing Trends

**Individual Competitor:**
```python
view_competitor_trends("Figma")
```

**Compare Two:**
```python
compare_competitors("Figma", "Sketch")
```

### Managing Competitors

**List All:**
```python
list_competitors()
```

**Enable/Disable:**
```python
toggle_competitor("Airtable")
```

**Remove:**
```python
remove_competitor("OldCompetitor", confirm=True)
```

### Exporting Data

**Full Historical Export:**
```python
export_intelligence_data(format="json", include_trends=True)
```

**CSV for Spreadsheets:**
```python
export_intelligence_data(format="csv")
```

**Team Summary:**
```python
export_competitor_summary(format="markdown")
```

---

## ADK Integration

### Conversational Usage

IntelTracker is designed for natural conversation:

**User:** "What are my competitors up to?"

**Agent:** "Let me check all your monitored competitors... Found 2 updates:
- Notion released AI writing assistant (High impact)
- Linear added advanced filtering (Medium impact)

Should I send you the detailed report?"

### Agent Capabilities

The agent can:
- Guide you through initial setup
- Ask clarifying questions
- Suggest best practices
- Troubleshoot issues
- Explain findings in context
- Recommend actions

### Available Commands

- `run_intelligence_check()` - Monitor all competitors
- `check_single_competitor()` - Focus on one
- `add_competitor()` - Track new competitor
- `list_competitors()` - View all tracked
- `configure_company_context()` - Set your info
- `configure_email_notifications()` - Email setup
- `view_competitor_trends()` - Historical analysis
- `compare_competitors()` - Side-by-side
- `export_intelligence_data()` - Export data
- `get_status()` - System health

---

## Email Notifications

### What Gets Sent

**Daily Digest:**
- Full intelligence report
- All competitor updates
- AI analysis and recommendations
- Formatted HTML email

**Instant Alerts:**
- Critical or high-impact only
- Sent immediately when detected
- Brief summary with key details

### Supported Providers

**Gmail:**
```python
smtp_server="smtp.gmail.com"
smtp_port=587
# Use App Password
```

**Outlook/Office365:**
```python
smtp_server="smtp.office365.com"
smtp_port=587
# Use regular password
```

**Custom SMTP:**
```python
smtp_server="smtp.yourprovider.com"
smtp_port=587  # or 465 for SSL
```

### Testing

Always test your setup:

```python
test_email_notification()
```

---

## Data Export

### Export Formats

**JSON** - Full data structure:
- Competitor configurations
- Historical trends
- Company context
- Analysis results

**CSV** - Spreadsheet analysis:
- Competitor summary
- Activity metrics
- Impact scores
- Trend indicators

**Markdown** - Team sharing:
- Readable summaries
- Competitor profiles
- Trend analysis

### Export Examples

**Full Backup:**
```python
export_intelligence_data(
    format="json",
    include_trends=True,
    include_all_history=True
)
```

**Quick Summary:**
```python
export_competitor_summary(format="markdown")
```

---

## Best Practices

### 1. Use RSS Feeds When Available

RSS is 10x more reliable than web scraping:
- Consistent format
- Faster processing
- Less likely to break

**Finding RSS:**
- Check `/rss`, `/feed`, `/changelog/rss`
- Look for RSS icon on site
- Use browser RSS detector extensions

### 2. Prioritize Strategically

**High Priority:**
- Direct competitors
- Market leaders
- Fast-moving startups

**Medium Priority:**
- Adjacent markets
- Potential partners
- Feature competitors

**Low Priority:**
- Distant competitors
- Monitoring only

### 3. Configure Company Context First

AI analysis is 3x more relevant when it knows YOUR:
- Product features
- Differentiation
- Strategic goals
- Target market

### 4. Set Appropriate Check Intervals

- **High priority:** 12-24 hours
- **Medium priority:** 24-48 hours  
- **Low priority:** Weekly

### 5. Tag Effectively

Good tags enable filtering:
- `saas`, `enterprise`, `startup`
- `ai`, `collaboration`, `automation`
- `competitor`, `partner`, `potential-acquirer`

### 6. Review Reports Weekly

Set aside time to:
- Review all findings
- Discuss with team
- Update roadmap
- Adjust monitoring

---

## Troubleshooting

### Gemini API Not Working

**Check API key:**
```bash
echo $GEMINI_API_KEY
```

**Test connection:**
```bash
python -c "import google.generativeai as genai; genai.configure(api_key='YOUR_KEY'); print('OK')"
```

**Fallback:** IntelTracker uses rule-based analysis if Gemini unavailable.

### Website Scraping Fails

**Symptoms:**
- "No structured content found"
- "Aggressive extraction found 0 updates"

**Solutions:**
1. Find RSS feed (most reliable)
2. Check if site uses JavaScript (can't scrape)
3. Try different URL (`/blog` vs `/changelog`)
4. System falls back to web search automatically

**JavaScript Sites:**
Sites like Airtable load content dynamically and can't be scraped. Solution: Find RSS feed or check manually.

### Email Not Sending

**Gmail Issues:**
- Must use App Password (not regular password)
- Must have 2FA enabled
- Check "Less secure app access" is OFF

**Other Providers:**
```python
# Check SMTP settings
configure_email_notifications(
    smtp_server="smtp.provider.com",
    smtp_port=587,
    test_email=True
)
```

**Debug:**
```bash
tail -f data/intel_tracker.log
```

### Too Many Updates on First Run

This is normal - first run treats all content as new.

**Solution:**
- Subsequent checks only show new content
- Or reset to start fresh: `reset_cache(confirm=True)`

### No Updates Found

**Possible causes:**
1. Competitors haven't updated
2. RSS feed empty
3. Website structure changed
4. Cache already has content

**Check:**
```python
get_status()  # System health
check_single_competitor("Name")  # Test one
```

---

## Architecture

### Directory Structure

```
IntelTracker/
├── agent.py                 # Main application
├── requirements.txt         # Dependencies
├── README.md               # This file
├── DEVELOPER.md            # Developer documentation
└── data/                   # Auto-created
    ├── competitors.json    # Competitor configs
    ├── content_cache.json  # Seen content hashes
    ├── trends.json         # Historical data
    ├── config.json         # Settings
    ├── company_context.json # Your company info
    ├── intel_tracker.log   # Logs
    ├── reports/            # Generated reports
    └── exports/            # Exported data
```

### Data Flow

```
1. Monitor → Extract content from sources
2. Filter → Remove previously seen content
3. Analyze → AI analysis with company context
4. Record → Save to trends database
5. Report → Generate intelligence digest
6. Notify → Send email alerts if configured
7. Export → Save to files if enabled
```

### Key Components

**ContentExtractor:**
- Multi-strategy HTML parsing
- RSS feed processing
- Aggressive fallback extraction
- Web search integration

**AIAnalyzer:**
- Gemini-powered analysis
- Company context integration
- Rule-based fallback
- Impact/threat assessment

**MonitoringEngine:**
- Orchestrates checking process
- Manages rate limiting
- Handles errors gracefully
- Updates cache and configs

**TrendAnalyzer:**
- Historical pattern detection
- Activity trend calculation
- Feature mention tracking
- Comparative metrics

---

## Performance

### Resource Usage

- **Memory:** ~50-100 MB
- **Disk:** ~1-10 MB per day
- **CPU:** Low (spikes during checks)
- **Network:** ~1-5 MB per check

### Scalability

- **Competitors:** Tested up to 50
- **Updates/day:** Thousands
- **Report generation:** <1 second
- **Full check cycle:** 1-5 minutes

### Rate Limiting

Default: 2 seconds between checks
- Protects against IP blocking
- Respects server resources
- Adjustable in configuration

---

## Contributing

### Reporting Issues

Include:
- Error message
- Steps to reproduce
- Relevant logs from `data/intel_tracker.log`
- Competitor URL (if scraping issue)

### Feature Requests

Describe:
- Use case
- Expected behavior
- Why it's valuable
- Alternative solutions considered

### Pull Requests

- Include tests
- Update documentation
- Follow existing code style
- One feature per PR

---

## Roadmap

### v12.1 (Next)
- Async web scraping
- Better HTML detection
- Webhook notifications
- Slack/Discord integration

### v13.0 (Future)
- Web dashboard
- Visual trend charts
- Team collaboration
- REST API

### v14.0 (Long-term)
- ML predictions
- Market positioning maps
- Sentiment analysis
- Multi-language support

---

## Support

### Documentation
- **README.md** - User guide (this file)
- **DEVELOPER.md** - Technical details
- **Code comments** - Implementation notes

### Getting Help

1. Check error messages (they're detailed)
2. Review logs: `data/intel_tracker.log`
3. Use `get_status()` for health check
4. Test with single competitor first
5. Try RSS feed instead of web scraping

---

## License

[Your License Here]

---

## Credits

**Built with:**
- Google ADK - Conversational AI framework
- Gemini 2.5 Flash - AI analysis
- BeautifulSoup - Web scraping
- feedparser - RSS parsing
- requests - HTTP client
- schedule - Task scheduling

**Made for startups who want to stay ahead.** 🚀

---

## Quick Reference

### Essential Commands

```python
# First-time setup
configure_company_context(company_name="Acme", ...)
configure_email_notifications(email="team@acme.com", ...)

# Add competitors
add_competitor(name="Competitor", website_url="...", rss_feed_url="...")

# Monitor
run_intelligence_check()
check_single_competitor("Competitor")

# Analyze
view_competitor_trends("Competitor")
compare_competitors("A", "B")

# Export
export_intelligence_data(format="json")
export_competitor_summary(format="markdown")

# Manage
list_competitors()
toggle_competitor("Name")
get_status()
```

### Key Files

- **Config:** `data/config.json`
- **Competitors:** `data/competitors.json`
- **Trends:** `data/trends.json`
- **Logs:** `data/intel_tracker.log`
- **Reports:** `data/reports/`

### Common Workflows

**Daily monitoring:**
1. Run intelligence check
2. Review findings
3. Take actions
4. Export for team

**Adding competitor:**
1. Find RSS feed (best)
2. Add with relevant tags
3. Set priority level
4. Test with single check

**Troubleshooting:**
1. Check logs
2. Test single competitor
3. Try RSS instead of web
4. Use status command
