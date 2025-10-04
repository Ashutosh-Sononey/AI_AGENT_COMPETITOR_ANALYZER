# IntelTracker/agent.py (Version 12.0 - Production Ready)
# Comprehensive competitive intelligence with email, scheduling, and advanced analysis

import os
import json
import hashlib
import requests
import feedparser
import re
import schedule
import time
import logging
import smtplib
import csv
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
from typing import Optional, TYPE_CHECKING, List, Dict, Any, Tuple
from pathlib import Path
from dataclasses import dataclass, asdict, field
from enum import Enum
from collections import defaultdict
import threading

# ADK Imports
from google.adk.agents import LlmAgent
from google.adk.tools import FunctionTool
from google.adk.sessions import Session

if TYPE_CHECKING:
    from google.adk.tools import ToolContext

# Gemini API
try:
    import google.generativeai as genai
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    if GEMINI_API_KEY:
        genai.configure(api_key=GEMINI_API_KEY)
        GEMINI_AVAILABLE = True
    else:
        GEMINI_AVAILABLE = False
except ImportError:
    GEMINI_AVAILABLE = False

# --- Configuration ---
DATA_DIR = Path("./data")
DATA_DIR.mkdir(exist_ok=True)
COMPETITORS_FILE = DATA_DIR / "competitors.json"
CACHE_FILE = DATA_DIR / "content_cache.json"
REPORTS_DIR = DATA_DIR / "reports"
REPORTS_DIR.mkdir(exist_ok=True)
CONFIG_FILE = DATA_DIR / "config.json"
LOG_FILE = DATA_DIR / "intel_tracker.log"
EXPORTS_DIR = DATA_DIR / "exports"
EXPORTS_DIR.mkdir(exist_ok=True)
TRENDS_FILE = DATA_DIR / "trends.json"
COMPANY_CONTEXT_FILE = DATA_DIR / "company_context.json"
# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Suppress noisy loggers
logging.getLogger('urllib3').setLevel(logging.WARNING)
logging.getLogger('requests').setLevel(logging.WARNING)

# --- Data Models ---
class ImpactLevel(Enum):
    CRITICAL = "Critical"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"

class SourceType(Enum):
    WEBSITE = "website"
    RSS = "rss"
    SOCIAL_MEDIA = "social_media"
    PRESS_RELEASE = "press_release"
    API = "api"

@dataclass
class CompanyContext:
    """Your company's information for calibrated competitive analysis."""
    company_name: str = "Your Company"
    product_name: Optional[str] = None
    industry: str = "Technology"
    target_market: str = "General"
    key_features: List[str] = field(default_factory=list)
    differentiation: Optional[str] = None
    current_focus: Optional[str] = None
    company_stage: str = "Startup"  # Startup, Growth, Established
    team_size: Optional[str] = None
    positioning: Optional[str] = None
    strategic_goals: List[str] = field(default_factory=list)
    updated_at: str = field(default_factory=lambda: datetime.now().isoformat())
@dataclass
class CompetitorConfig:
    name: str
    website_url: Optional[str] = None
    rss_feed_url: Optional[str] = None
    twitter_handle: Optional[str] = None
    linkedin_url: Optional[str] = None
    press_release_url: Optional[str] = None
    category: str = "Unknown"
    priority: str = "Medium"
    enabled: bool = True
    tags: List[str] = field(default_factory=list)
    added_at: str = None
    last_checked: Optional[str] = None
    
    def __post_init__(self):
        if not self.added_at:
            self.added_at = datetime.now().isoformat()

@dataclass
class Update:
    title: str
    content: str
    source_type: str
    url: str
    date: Optional[str] = None
    impact: str = "Medium"
    detected_at: str = field(default_factory=lambda: datetime.now().isoformat())
    
@dataclass
class Analysis:
    summary: str
    key_features: List[str]
    impact: str
    action: str
    competitor_name: str
    threat_level: str = "Medium"
    opportunities: List[str] = field(default_factory=list)
    strategic_implications: Optional[str] = None
    confidence_score: float = 0.8
    
@dataclass
class MonitoringConfig:
    check_interval_hours: int = 24
    enable_scheduling: bool = False
    notification_email: Optional[str] = None
    smtp_server: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    max_updates_per_competitor: int = 5
    min_impact_level: str = "Low"
    digest_format: str = "detailed"
    notify_on_critical: bool = True
    notify_on_high: bool = True
    export_after_check: bool = False
    rate_limit_seconds: int = 2

# --- Email Notification System ---
class EmailNotifier:
    """Send email notifications for important updates."""
    
    def __init__(self, config: MonitoringConfig):
        self.config = config
    
    def send_digest(self, report: str, findings_count: int) -> bool:
        """Send intelligence digest via email."""
        if not self.config.notification_email:
            return False
        
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = f"🎯 IntelTracker: {findings_count} Competitor Updates"
            msg['From'] = self.config.smtp_username or "IntelTracker"
            msg['To'] = self.config.notification_email
            
            # Create plain text and HTML versions
            text_content = self._strip_markdown(report)
            html_content = self._markdown_to_html(report)
            
            msg.attach(MIMEText(text_content, 'plain'))
            msg.attach(MIMEText(html_content, 'html'))
            
            # Send email
            with smtplib.SMTP(self.config.smtp_server, self.config.smtp_port) as server:
                server.starttls()
                if self.config.smtp_username and self.config.smtp_password:
                    server.login(self.config.smtp_username, self.config.smtp_password)
                server.send_message(msg)
            
            logger.info(f"Email sent to {self.config.notification_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            return False
    
    def send_alert(self, competitor_name: str, impact: str, summary: str) -> bool:
        """Send immediate alert for critical/high impact updates."""
        if not self.config.notification_email:
            return False
        
        # Check if we should send alert for this impact level
        if impact == "Critical" and not self.config.notify_on_critical:
            return False
        if impact == "High" and not self.config.notify_on_high:
            return False
        if impact not in ["Critical", "High"]:
            return False
        
        try:
            msg = MIMEText(
                f"⚠️ {impact} Impact Update Detected\n\n"
                f"Competitor: {competitor_name}\n"
                f"Summary: {summary}\n\n"
                f"Check IntelTracker for full details."
            )
            msg['Subject'] = f"🚨 {impact} Alert: {competitor_name}"
            msg['From'] = self.config.smtp_username or "IntelTracker"
            msg['To'] = self.config.notification_email
            
            with smtplib.SMTP(self.config.smtp_server, self.config.smtp_port) as server:
                server.starttls()
                if self.config.smtp_username and self.config.smtp_password:
                    server.login(self.config.smtp_username, self.config.smtp_password)
                server.send_message(msg)
            
            logger.info(f"Alert sent for {competitor_name}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send alert: {e}")
            return False
    
    @staticmethod
    def _strip_markdown(text: str) -> str:
        """Convert markdown to plain text."""
        text = re.sub(r'#{1,6}\s', '', text)
        text = re.sub(r'\*\*([^\*]+)\*\*', r'\1', text)
        text = re.sub(r'\*([^\*]+)\*', r'\1', text)
        text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text)
        return text
    
    @staticmethod
    def _markdown_to_html(text: str) -> str:
        """Basic markdown to HTML conversion."""
        html = f"<html><body style='font-family: Arial, sans-serif;'>{text}</body></html>"
        html = re.sub(r'#{1,6}\s(.+)', r'<h2>\1</h2>', html)
        html = re.sub(r'\*\*([^\*]+)\*\*', r'<strong>\1</strong>', html)
        html = re.sub(r'\*([^\*]+)\*', r'<em>\1</em>', html)
        html = re.sub(r'\[([^\]]+)\]\(([^\)]+)\)', r'<a href="\2">\1</a>', html)
        html = html.replace('\n\n', '<br><br>')
        return html

# --- Configuration Management ---
def load_config() -> MonitoringConfig:
    """Load monitoring configuration."""
    if CONFIG_FILE.exists():
        try:
            with open(CONFIG_FILE, 'r') as f:
                data = json.load(f)
                return MonitoringConfig(**data)
        except Exception as e:
            logger.warning(f"Failed to load config: {e}. Using defaults.")
    return MonitoringConfig()

def save_config(config: MonitoringConfig) -> None:
    """Save monitoring configuration."""
    with open(CONFIG_FILE, 'w') as f:
        json.dump(asdict(config), f, indent=2)


# --- Storage Functions ---
def load_company_context() -> CompanyContext:
    """Load company context configuration."""
    if COMPANY_CONTEXT_FILE.exists():
        try:
            with open(COMPANY_CONTEXT_FILE, 'r') as f:
                data = json.load(f)
                return CompanyContext(**data)
        except Exception as e:
            logger.warning(f"Failed to load company context: {e}. Using defaults.")
    return CompanyContext()

def save_company_context(context: CompanyContext) -> None:
    """Save company context configuration."""
    with open(COMPANY_CONTEXT_FILE, 'w') as f:
        json.dump(asdict(context), f, indent=2)
    logger.info("Company context saved")
def load_competitors() -> List[CompetitorConfig]:
    """Load competitor configurations."""
    if COMPETITORS_FILE.exists():
        try:
            with open(COMPETITORS_FILE, 'r') as f:
                data = json.load(f)
                return [CompetitorConfig(**comp) for comp in data]
        except Exception as e:
            logger.error(f"Failed to load competitors: {e}")
            return _get_default_competitors()
    return _get_default_competitors()

def _get_default_competitors() -> List[CompetitorConfig]:
    """Get default competitor list."""
    defaults = [
        CompetitorConfig(
            name="Notion",
            website_url="https://www.notion.so/releases",
            rss_feed_url="https://www.notion.so/releases/rss",
            category="Productivity",
            priority="High",
            tags=["productivity", "collaboration"]
        ),
        CompetitorConfig(
            name="Linear",
            website_url="https://linear.app/changelog",
            category="Project Management",
            priority="High",
            tags=["project-management", "development"]
        ),
        CompetitorConfig(
            name="Airtable",
            website_url="https://www.airtable.com/whatsnew",
            category="Database",
            priority="Medium",
            tags=["database", "no-code"]
        ),
    ]
    save_competitors(defaults)
    return defaults

def save_competitors(competitors: List[CompetitorConfig]) -> None:
    """Save competitor configurations."""
    with open(COMPETITORS_FILE, 'w') as f:
        json.dump([asdict(comp) for comp in competitors], f, indent=2)

def load_cache() -> Dict[str, Any]:
    """Load content cache."""
    if CACHE_FILE.exists():
        try:
            with open(CACHE_FILE, 'r') as f:
                return json.load(f)
        except:
            return {}
    return {}

def save_cache(cache: Dict[str, Any]) -> None:
    """Save content cache."""
    with open(CACHE_FILE, 'w') as f:
        json.dump(cache, f, indent=2)

def load_trends() -> Dict[str, Any]:
    """Load trend analysis data."""
    if TRENDS_FILE.exists():
        try:
            with open(TRENDS_FILE, 'r') as f:
                return json.load(f)
        except:
            return {}
    return {}

def save_trends(trends: Dict[str, Any]) -> None:
    """Save trend analysis data."""
    with open(TRENDS_FILE, 'w') as f:
        json.dump(trends, f, indent=2)

# --- Enhanced Content Extraction ---
# Replace the ContentExtractor class in intel_tracker_v2.py with this improved version

class ContentExtractor:
    """Enhanced content extraction with multiple strategies and better fallbacks."""
    
    HEADERS = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    
    @staticmethod
    def extract_from_rss(url: str) -> List[Update]:
        """Extract updates from RSS feed."""
        try:
            feed = feedparser.parse(url)
            if not feed.entries:
                return []
            
            updates = []
            for entry in feed.entries[:10]:
                title = entry.get('title', 'Untitled')
                summary = entry.get('summary', entry.get('description', ''))
                
                if summary:
                    summary = BeautifulSoup(summary, 'html.parser').get_text(strip=True)
                
                updates.append(Update(
                    title=title,
                    content=summary[:800] if summary else title,
                    source_type=SourceType.RSS.value,
                    url=entry.get('link', url),
                    date=entry.get('published', None)
                ))
            
            logger.debug(f"Extracted {len(updates)} updates from RSS: {url}")
            return updates
            
        except Exception as e:
            logger.warning(f"RSS extraction failed for {url}: {e}")
            return []
    
    @staticmethod
    def extract_from_website(url: str) -> List[Update]:
        """Extract updates from website with improved fallback strategies."""
        try:
            response = requests.get(
                url, 
                timeout=15, 
                headers=ContentExtractor.HEADERS,
                allow_redirects=True
            )
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            soup = ContentExtractor._clean_soup(soup)
            
            updates = ContentExtractor._extract_structured_content(soup, url)
            
            if not updates:
                logger.warning(f"No structured content found with normal strategies for {url}, trying aggressive extraction")
                updates = ContentExtractor._aggressive_extraction(soup, url)
            
            logger.info(f"Extracted {len(updates)} updates from website: {url}")
            return updates
            
        except requests.Timeout:
            logger.warning(f"Timeout fetching {url}")
            return []
        except requests.RequestException as e:
            logger.warning(f"Website extraction failed for {url}: {e}")
            return []
        except Exception as e:
            logger.error(f"Unexpected error extracting from {url}: {e}")
            return []
    
    @staticmethod
    def _clean_soup(soup):
        """Remove unnecessary elements."""
        for tag in soup(['script', 'style', 'nav', 'footer', 'header', 
                        'iframe', 'noscript', 'svg', 'button', 'input', 'select']):
            tag.decompose()
        
        noise_patterns = ['cookie', 'consent', 'popup', 'modal', 'banner',
                         'newsletter', 'subscribe', 'chat', 'widget', 'ad',
                         'advertisement', 'tracking', 'analytics', 'social-share']
        
        for pattern in noise_patterns:
            for tag in soup.find_all(class_=lambda c: c and pattern in str(c).lower()):
                tag.decompose()
            for tag in soup.find_all(id=lambda i: i and pattern in str(i).lower()):
                tag.decompose()
        
        for tag in soup.find_all(attrs={'role': True}):
            if tag.get('role') in ['navigation', 'banner', 'complementary', 'contentinfo']:
                tag.decompose()
        
        return soup
    
    @staticmethod
    def _extract_structured_content(soup, url: str) -> List[Update]:
        """Extract structured content with multiple strategies."""
        updates = []
        
        main_content = (
            soup.find('main') or 
            soup.find('article') or 
            soup.find(id=lambda i: i and any(x in str(i).lower() for x in ['content', 'main', 'body'])) or
            soup.find(class_=lambda c: c and any(x in str(c).lower() for x in ['content', 'main', 'body'])) or
            soup
        )
        
        # Strategy 1: Find article/section/div containers with common patterns
        container_patterns = [
            'post', 'update', 'release', 'item', 'entry', 'card', 
            'news', 'article', 'changelog', 'change', 'feature',
            'announcement', 'blog', 'story', 'note'
        ]
        
        containers = []
        for pattern in container_patterns:
            found = main_content.find_all(
                ['article', 'section', 'div', 'li'],
                class_=lambda c: c and pattern in str(c).lower(),
                limit=20
            )
            containers.extend(found)
            if len(containers) >= 15:
                break
        
        # Also try ID-based selection
        for pattern in container_patterns:
            found = main_content.find_all(
                ['article', 'section', 'div'],
                id=lambda i: i and pattern in str(i).lower(),
                limit=10
            )
            containers.extend(found)
        
        # Deduplicate
        seen_containers = set()
        unique_containers = []
        for c in containers:
            container_id = id(c)
            if container_id not in seen_containers:
                seen_containers.add(container_id)
                unique_containers.append(c)
        
        for container in unique_containers[:20]:
            update = ContentExtractor._extract_from_container(container, url)
            if update and not any(u.title == update.title for u in updates):
                updates.append(update)
        
        # Strategy 2: Use headings (more lenient)
        if len(updates) < 3:
            for heading in main_content.find_all(['h1', 'h2', 'h3', 'h4'], limit=25):
                update = ContentExtractor._extract_from_heading(heading, url)
                if update and not any(u.title == update.title for u in updates):
                    updates.append(update)
        
        # Strategy 3: List items
        if len(updates) < 2:
            for ul in main_content.find_all(['ul', 'ol'], limit=10):
                for li in ul.find_all('li', limit=15):
                    update = ContentExtractor._extract_from_list_item(li, url)
                    if update and not any(u.title == update.title for u in updates):
                        updates.append(update)
        
        return updates[:20]
    
    @staticmethod
    def _aggressive_extraction(soup, url: str) -> List[Update]:
        """Aggressive fallback extraction when normal methods fail."""
        updates = []
        
        # Try ALL headings on the page
        for heading in soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5'], limit=30):
            text = heading.get_text(strip=True)
            if len(text) >= 10 and len(text) <= 300:
                # Get any nearby text
                content_parts = []
                parent = heading.parent
                if parent:
                    for sibling in heading.find_next_siblings(['p', 'div', 'span'], limit=3):
                        sib_text = sibling.get_text(strip=True)
                        if len(sib_text) > 15:
                            content_parts.append(sib_text)
                
                content = ' '.join(content_parts)[:800] if content_parts else text
                
                update = Update(
                    title=text[:250],
                    content=content,
                    source_type=SourceType.WEBSITE.value,
                    url=url
                )
                
                if not any(u.title == update.title for u in updates):
                    updates.append(update)
        
        # Try paragraphs with strong/bold text as titles
        if len(updates) < 3:
            for p in soup.find_all('p', limit=30):
                strong = p.find(['strong', 'b', 'em'])
                if strong:
                    title = strong.get_text(strip=True)
                    if len(title) >= 10 and len(title) <= 200:
                        full_text = p.get_text(strip=True)
                        content = full_text.replace(title, '').strip()
                        
                        update = Update(
                            title=title[:250],
                            content=(content if content else title)[:800],
                            source_type=SourceType.WEBSITE.value,
                            url=url
                        )
                        
                        if not any(u.title == update.title for u in updates):
                            updates.append(update)
        
        # Try divs with meaningful text
        if len(updates) < 2:
            for div in soup.find_all('div', limit=50):
                # Look for divs with not too much nested content
                text = div.get_text(strip=True, separator=' ')
                if 20 <= len(text) <= 500 and div.find_all(['div', 'section']) == []:
                    # This might be a content block
                    title_words = text.split()[:15]
                    title = ' '.join(title_words)
                    
                    update = Update(
                        title=title[:250],
                        content=text[:800],
                        source_type=SourceType.WEBSITE.value,
                        url=url
                    )
                    
                    if not any(u.title == update.title for u in updates):
                        updates.append(update)
        
        logger.info(f"Aggressive extraction found {len(updates)} updates")
        return updates[:15]
    
    @staticmethod
    def _extract_from_container(container, url: str) -> Optional[Update]:
        """Extract update from a container element with relaxed validation."""
        title_elem = container.find(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'strong', 'b'])
        if not title_elem:
            # Try getting the first text as title
            text = container.get_text(strip=True)
            if len(text) < 10:
                return None
            title = text.split('.')[0][:250]
        else:
            title = title_elem.get_text(strip=True)
        
        if not title or len(title) < 5:
            return None
        
        # Get date
        date = None
        date_elem = container.find(['time', 'span'], 
                                   class_=lambda c: c and 'date' in str(c).lower())
        if date_elem:
            date = date_elem.get_text(strip=True)
        elif container.find('time'):
            date_elem = container.find('time')
            date = date_elem.get('datetime') or date_elem.get_text(strip=True)
        
        # Get content - more lenient
        content_parts = []
        for elem in container.find_all(['p', 'li', 'div', 'span'], limit=10):
            text = elem.get_text(strip=True)
            if len(text) > 15:
                content_parts.append(text)
        
        content = ' '.join(content_parts)[:1200]
        
        if not content or len(content) < 20:
            content = title
        
        return Update(
            title=title[:250],
            content=content,
            source_type=SourceType.WEBSITE.value,
            url=url,
            date=date
        )
    
    @staticmethod
    def _extract_from_heading(heading, url: str) -> Optional[Update]:
        """Extract update from heading with relaxed validation."""
        title = heading.get_text(strip=True)
        if not title or len(title) < 5:
            return None
        
        # Get date from nearby time element
        date = None
        parent = heading.parent
        if parent:
            time_elem = parent.find('time')
            if time_elem:
                date = time_elem.get('datetime') or time_elem.get_text(strip=True)
        
        content_parts = []
        for sibling in heading.find_next_siblings(['p', 'ul', 'div', 'span'], limit=6):
            text = sibling.get_text(strip=True)
            if len(text) > 15:
                content_parts.append(text)
        
        content = ' '.join(content_parts)[:1200]
        
        # Accept heading even without content if it's long enough
        if not content and len(title) < 20:
            return None
        
        return Update(
            title=title[:250],
            content=content or title,
            source_type=SourceType.WEBSITE.value,
            url=url,
            date=date
        )
    
    @staticmethod
    def _extract_from_list_item(li, url: str) -> Optional[Update]:
        """Extract update from list item with relaxed validation."""
        text = li.get_text(strip=True)
        if not text or len(text) < 10:
            return None
        
        # Try to find a heading within
        heading = li.find(['strong', 'b', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a'])
        if heading:
            title = heading.get_text(strip=True)
            content = text.replace(title, '').strip()
            if not content:
                content = title
        else:
            # Use first sentence or first 100 chars as title
            sentences = text.split('.')
            if sentences and len(sentences[0]) > 10:
                title = sentences[0][:250]
                content = text
            else:
                title = text[:100]
                content = text
        
        return Update(
            title=title[:250],
            content=content[:1200],
            source_type=SourceType.WEBSITE.value,
            url=url
        )
    @staticmethod
    def _is_valid_content(text: str) -> bool:
        """Validate if text looks like actual content."""
        if not text or len(text) < 5 or len(text) > 500:
            return False
        
        # Reject UI garbage
        ui_keywords = ['filter', 'sort', 'toggle', 'menu', 'dropdown', 'select all', 
                      'show more', 'load more', 'click here', 'read more']
        if sum(1 for kw in ui_keywords if kw.lower() in text.lower()) >= 2:
            return False
        
        # Reject if mostly non-alphanumeric
        alphanumeric = sum(c.isalnum() or c.isspace() for c in text)
        if alphanumeric / len(text) < 0.7:
            return False
        
        # Reject camelCase spam
        caps_in_middle = sum(1 for i, c in enumerate(text) 
                            if i > 0 and c.isupper() and text[i-1].islower())
        if caps_in_middle > 4:
            return False
        
        return True

# --- AI Analysis ---
class AIAnalyzer:
    """AI-powered analysis of competitor updates."""
    
    @staticmethod
    def analyze_updates(competitor_name: str, category: str, 
                       updates: List[Update]) -> Optional[Analysis]:
        """Analyze updates using Gemini or fallback to rule-based."""
        if GEMINI_AVAILABLE and updates:
            result = AIAnalyzer._analyze_with_gemini(competitor_name, category, updates)
            if result:
                return result
        
        return AIAnalyzer._basic_analysis(competitor_name, category, updates)
    
    @staticmethod
    def _analyze_with_gemini(competitor_name: str, category: str, 
                            updates: List[Update]) -> Optional[Analysis]:
        """Use Gemini for sophisticated analysis with company context."""
        try:
            model = genai.GenerativeModel('gemini-2.5-flash')
            
            # Load company context
            company_context = load_company_context()
            
            # Build comprehensive prompt with company context
            prompt = f"""Analyze these competitor updates for strategic intelligence:
    
    **OUR COMPANY CONTEXT:**
    - Company: {company_context.company_name}"""
            
            if company_context.product_name:
                prompt += f"\n- Product: {company_context.product_name}"
            
            prompt += f"\n- Industry: {company_context.industry}"
            prompt += f"\n- Target Market: {company_context.target_market}"
            prompt += f"\n- Stage: {company_context.company_stage}"
            
            if company_context.key_features:
                prompt += f"\n- Our Key Features: {', '.join(company_context.key_features[:5])}"
            
            if company_context.differentiation:
                prompt += f"\n- Our Differentiation: {company_context.differentiation}"
            
            if company_context.current_focus:
                prompt += f"\n- Current Focus: {company_context.current_focus}"
            
            if company_context.strategic_goals:
                prompt += f"\n- Strategic Goals: {', '.join(company_context.strategic_goals[:3])}"
            
            prompt += f"""
    
    **COMPETITOR BEING ANALYZED:**
    - Name: {competitor_name}
    - Category: {category}
    - Number of Updates: {len(updates)}
    
    **RECENT UPDATES:**
    """
            for i, u in enumerate(updates[:5], 1):
                prompt += f"\n{i}. {u.title}"
                if u.date:
                    prompt += f" ({u.date})"
                prompt += "\n"
                if u.content and u.content != u.title:
                    preview = u.content[:350]
                    prompt += f"   {preview}{'...' if len(u.content) > 350 else ''}\n"
            
            prompt += """
    Provide strategic analysis in JSON format considering our company context:
    {
      "summary": "One clear sentence about what changed and why it matters TO US specifically",
      "key_features": ["specific feature 1", "specific feature 2", "specific feature 3"],
      "impact": "Critical/High/Medium/Low - business impact on OUR market position",
      "threat_level": "Critical/High/Medium/Low - competitive threat to OUR product/company",
      "opportunities": ["opportunity 1 for us", "opportunity 2 for us"],
      "strategic_implications": "How this affects OUR competitive landscape and positioning",
      "action": "Specific recommended action for OUR team based on our context",
      "confidence_score": 0.0-1.0
    }
    
    CRITICAL: Frame everything from OUR perspective as """ + company_context.company_name + """:
    - How does this affect OUR positioning?
    - What threats does this pose to OUR differentiation?
    - What opportunities does this create for US?
    - What should WE do about it given our focus and goals?
    
    Focus on:
    - Direct impact on our product roadmap
    - Threats to our unique value proposition  
    - Market positioning relative to us
    - Actionable insights for our team"""
    
            response = model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.3,
                    max_output_tokens=600
                ),
                safety_settings={
                    'HARM_CATEGORY_HARASSMENT': 'BLOCK_NONE',
                    'HARM_CATEGORY_HATE_SPEECH': 'BLOCK_NONE',
                    'HARM_CATEGORY_SEXUALLY_EXPLICIT': 'BLOCK_NONE',
                    'HARM_CATEGORY_DANGEROUS_CONTENT': 'BLOCK_NONE',
                }
            )
            
            text = AIAnalyzer._extract_response_text(response)
            text = re.sub(r'```json\s*|\s*```', '', text.strip())
            
            analysis_data = json.loads(text)
            
            return Analysis(
                summary=analysis_data.get('summary', 'Updated')[:400],
                key_features=analysis_data.get('key_features', [])[:5],
                impact=analysis_data.get('impact', 'Medium'),
                threat_level=analysis_data.get('threat_level', 'Medium'),
                opportunities=analysis_data.get('opportunities', [])[:4],
                strategic_implications=analysis_data.get('strategic_implications', '')[:400],
                action=analysis_data.get('action', 'Review changes')[:250],
                confidence_score=float(analysis_data.get('confidence_score', 0.7)),
                competitor_name=competitor_name
            )
            
        except json.JSONDecodeError as e:
            logger.warning(f"Failed to parse Gemini response for {competitor_name}: {e}")
            return None
        except Exception as e:
            logger.warning(f"Gemini analysis failed for {competitor_name}: {e}")
            return None
    @staticmethod
    def _extract_response_text(response) -> str:
        """Extract text from Gemini response safely."""
        if hasattr(response, 'text'):
            return response.text.strip()
        elif hasattr(response, 'candidates') and response.candidates:
            candidate = response.candidates[0]
            if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts'):
                return ''.join(part.text for part in candidate.content.parts 
                             if hasattr(part, 'text'))
        raise Exception("No text in response")
    
    @staticmethod
    def _basic_analysis(competitor_name: str, category: str, 
                       updates: List[Update]) -> Analysis:
        """Rule-based analysis fallback."""
        if not updates:
            return Analysis(
                summary=f"{competitor_name} has no recent updates",
                key_features=[],
                impact=ImpactLevel.LOW.value,
                threat_level=ImpactLevel.LOW.value,
                action="Continue monitoring for future updates",
                competitor_name=competitor_name,
                confidence_score=0.9
            )
        
        titles = [u.title for u in updates[:5]]
        contents = [u.content for u in updates[:5]]
        all_text = ' '.join(titles + contents).lower()
        
        # Advanced keyword-based impact assessment
        critical_keywords = ['acquisition', 'acquired', 'merger', 'funding', 'series', 
                           'million', 'billion', 'ipo', 'partnership with']
        high_keywords = ['launch', 'launched', 'new product', 'major update', 
                        'enterprise', 'pricing change', 'price', 'discount']
        medium_keywords = ['feature', 'improvement', 'update', 'release', 'beta',
                          'preview', 'integration', 'api']
        low_keywords = ['bug fix', 'patch', 'maintenance', 'minor']
        
        impact = ImpactLevel.LOW.value
        threat = ImpactLevel.LOW.value
        
        if any(kw in all_text for kw in critical_keywords):
            impact = ImpactLevel.CRITICAL.value
            threat = ImpactLevel.HIGH.value
        elif any(kw in all_text for kw in high_keywords):
            impact = ImpactLevel.HIGH.value
            threat = ImpactLevel.MEDIUM.value
        elif any(kw in all_text for kw in medium_keywords):
            impact = ImpactLevel.MEDIUM.value
            threat = ImpactLevel.LOW.value
        elif any(kw in all_text for kw in low_keywords):
            impact = ImpactLevel.LOW.value
            threat = ImpactLevel.LOW.value
        else:
            impact = ImpactLevel.MEDIUM.value
            threat = ImpactLevel.LOW.value
        
        # Generate opportunities
        opportunities = [
            "Monitor their approach and user reception",
            "Identify gaps in our own offering",
            "Consider if similar features would benefit our users"
        ]
        
        return Analysis(
            summary=f"{competitor_name} released: {titles[0]}" if titles else f"{competitor_name} updated",
            key_features=titles[:5],
            impact=impact,
            threat_level=threat,
            opportunities=opportunities,
            strategic_implications=f"{competitor_name} is actively evolving their {category} offering",
            action=f"Review {competitor_name}'s updates and assess competitive positioning",
            confidence_score=0.6,
            competitor_name=competitor_name
        )

# --- Trend Analysis ---
class TrendAnalyzer:
    """Analyze trends across competitors over time."""
    
    @staticmethod
    def record_finding(competitor_name: str, analysis: Analysis):
        """Record a finding for trend analysis."""
        trends = load_trends()
        
        if competitor_name not in trends:
            trends[competitor_name] = {
                'history': [],
                'impact_counts': defaultdict(int),
                'feature_mentions': defaultdict(int)
            }
        
        entry = {
            'timestamp': datetime.now().isoformat(),
            'impact': analysis.impact,
            'threat_level': analysis.threat_level,
            'summary': analysis.summary,
            'key_features': analysis.key_features
        }
        
        trends[competitor_name]['history'].append(entry)
        trends[competitor_name]['impact_counts'][analysis.impact] += 1
        
        # Track feature mentions
        for feature in analysis.key_features:
            # Extract key terms
            terms = set(word.lower() for word in feature.split() 
                       if len(word) > 4 and word.lower() not in ['feature', 'update', 'release'])
            for term in terms:
                trends[competitor_name]['feature_mentions'][term] += 1
        
        # Keep only last 50 entries
        if len(trends[competitor_name]['history']) > 50:
            trends[competitor_name]['history'] = trends[competitor_name]['history'][-50:]
        
        save_trends(trends)
    
    @staticmethod
    def get_competitor_trends(competitor_name: str) -> Dict[str, Any]:
        """Get trend analysis for a competitor."""
        trends = load_trends()
        
        if competitor_name not in trends:
            return {'error': 'No historical data'}
        
        data = trends[competitor_name]
        history = data['history']
        
        if not history:
            return {'error': 'No historical data'}
        
        # Calculate trends
        recent = history[-10:]  # Last 10 entries
        
        # Average impact level
        impact_scores = {
            'Critical': 4,
            'High': 3,
            'Medium': 2,
            'Low': 1
        }
        avg_impact = sum(impact_scores.get(entry['impact'], 2) for entry in recent) / len(recent)
        
        # Activity trend
        if len(history) >= 20:
            older = history[-20:-10]
            recent_activity = len(recent)
            older_activity = len(older)
            activity_trend = "increasing" if recent_activity > older_activity else "stable" if recent_activity == older_activity else "decreasing"
        else:
            activity_trend = "insufficient data"
        
        # Top mentioned features
        feature_counts = dict(data.get('feature_mentions', {}))
        top_features = sorted(feature_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        
        # Recent focus
        recent_keywords = []
        for entry in recent:
            for feature in entry.get('key_features', []):
                recent_keywords.extend(feature.lower().split())
        
        keyword_freq = defaultdict(int)
        for kw in recent_keywords:
            if len(kw) > 4 and kw not in ['feature', 'update', 'release', 'support']:
                keyword_freq[kw] += 1
        
        recent_focus = sorted(keyword_freq.items(), key=lambda x: x[1], reverse=True)[:5]
        
        return {
            'total_updates': len(history),
            'recent_activity': len(recent),
            'activity_trend': activity_trend,
            'average_impact': avg_impact,
            'impact_distribution': dict(data['impact_counts']),
            'top_features': top_features,
            'recent_focus': recent_focus,
            'first_seen': history[0]['timestamp'] if history else None,
            'last_seen': history[-1]['timestamp'] if history else None
        }

# --- Monitoring Engine ---
class MonitoringEngine:
    """Core monitoring and analysis engine."""
    
    def __init__(self):
        self.config = load_config()
        self.cache = load_cache()
        self.notifier = EmailNotifier(self.config)
    def _search_for_updates(self, competitor: CompetitorConfig) -> List[Update]:
        """Fallback: Search web for competitor updates when scraping fails."""
        updates = []
        
        try:
            import requests
            from datetime import datetime, timedelta
            
            # Use a simple news search API approach
            # For sites like Airtable that are JS-heavy, search recent news
            
            current_year = datetime.now().year
            current_month = datetime.now().strftime("%B")
            
            # Build search queries
            queries = [
                f"{competitor.name} new features {current_month} {current_year}",
                f"{competitor.name} product update {current_year}",
                f"{competitor.name} changelog latest"
            ]
            
            logger.info(f"  🔍 Searching for {competitor.name} updates...")
            
            for query in queries[:1]:  # Just do 1 search to avoid rate limits
                try:
                    # Use DuckDuckGo instant answer API (no key needed)
                    search_url = f"https://api.duckduckgo.com/?q={query}&format=json"
                    response = requests.get(search_url, timeout=10)
                    
                    if response.ok:
                        data = response.json()
                        
                        # Extract from abstract
                        if data.get('Abstract'):
                            updates.append(Update(
                                title=f"{competitor.name} - Recent Activity",
                                content=data['Abstract'][:1000],
                                source_type="search",
                                url=data.get('AbstractURL', competitor.website_url or ''),
                                date=datetime.now().isoformat()
                            ))
                        
                        # Extract from related topics
                        for topic in data.get('RelatedTopics', [])[:3]:
                            if isinstance(topic, dict) and topic.get('Text'):
                                updates.append(Update(
                                    title=topic['Text'].split(' - ')[0][:200],
                                    content=topic['Text'][:800],
                                    source_type="search",
                                    url=topic.get('FirstURL', ''),
                                    date=datetime.now().isoformat()
                                ))
                    
                except Exception as e:
                    logger.debug(f"Search API call failed: {e}")
                    continue
            
            # If search didn't work, create an informative message
            if not updates:
                logger.info(f"  💡 Could not find recent updates via search")
                logger.info(f"  💡 Recommendation: Add RSS feed for {competitor.name}")
                
                # Don't create placeholder - just return empty and let it be handled
                return []
            
            logger.info(f"  ✓ Found {len(updates)} updates via web search")
            return updates
            
        except Exception as e:
            logger.error(f"Search fallback failed: {e}")
            return []
    def monitor_competitor(self, competitor: CompetitorConfig) -> Optional[Dict[str, Any]]:
        """Monitor a single competitor for updates."""
        if not competitor.enabled:
            logger.info(f"Skipping disabled competitor: {competitor.name}")
            return None
        
        logger.info(f"🔍 Monitoring {competitor.name}...")
        
        updates = []
        
        # Try RSS first (most reliable)
        if competitor.rss_feed_url:
            try:
                rss_updates = ContentExtractor.extract_from_rss(competitor.rss_feed_url)
                if rss_updates:
                    updates.extend(rss_updates)
                    logger.info(f"  ✓ Found {len(rss_updates)} RSS updates")
            except Exception as e:
                logger.warning(f"  RSS failed: {e}")
        
        # Try website if no RSS or need more
        if (not updates or len(updates) < 3) and competitor.website_url:
            try:
                web_updates = ContentExtractor.extract_from_website(competitor.website_url)
                if web_updates:
                    existing_titles = {u.title for u in updates}
                    new_web_updates = [u for u in web_updates if u.title not in existing_titles]
                    updates.extend(new_web_updates)
                    logger.info(f"  ✓ Found {len(new_web_updates)} website updates")
                else:
                    logger.info(f"  ⚠️  Website extraction found nothing, trying search...")
                    search_updates = self._search_for_updates(competitor)
                    if search_updates:
                        updates.extend(search_updates)
                        
            except Exception as e:
                logger.warning(f"  Website failed: {e}")
                logger.info(f"  🔍 Trying search fallback...")
                try:
                    search_updates = self._search_for_updates(competitor)
                    if search_updates:
                        updates.extend(search_updates)
                except:
                    pass
        
        if not updates:
            logger.info(f"  ℹ️  No updates found for {competitor.name}")
            if not competitor.rss_feed_url:
                logger.info(f"  💡 Tip: Add an RSS feed URL for more reliable monitoring")
            return None
        
        # Filter for new content
        new_updates = self._filter_new_updates(competitor.name, updates)
        
        if not new_updates:
            logger.info(f"  ℹ️  All content previously seen for {competitor.name}")
            competitor.last_checked = datetime.now().isoformat()
            self._update_competitor_config(competitor)
            return None
        
        logger.info(f"  🆕 {len(new_updates)} new updates for {competitor.name}")
        
        # Analyze updates
        analysis = AIAnalyzer.analyze_updates(
            competitor.name, 
            competitor.category, 
            new_updates
        )
        
        if not analysis:
            logger.warning(f"  ⚠️  Analysis failed for {competitor.name}")
            return None
        
        logger.info(f"  📊 Impact: {analysis.impact} | Threat: {analysis.threat_level}")
        
        # Record for trend analysis
        TrendAnalyzer.record_finding(competitor.name, analysis)
        
        # Send alert if high impact
        if analysis.impact in ['Critical', 'High']:
            self.notifier.send_alert(competitor.name, analysis.impact, analysis.summary)
        
        # Update cache and competitor config
        self._update_cache(competitor.name, updates)
        competitor.last_checked = datetime.now().isoformat()
        self._update_competitor_config(competitor)
        
        return {
            'competitor': competitor,
            'updates': new_updates[:self.config.max_updates_per_competitor],
            'analysis': analysis
        }
    
    def _filter_new_updates(self, competitor_name: str, 
                           updates: List[Update]) -> List[Update]:
        """Filter out previously seen updates."""
        cache_key = f"competitor_{competitor_name}"
        seen_hashes = set(self.cache.get(cache_key, []))
        
        new_updates = []
        for update in updates:
            update_hash = hashlib.md5(
                f"{update.title}{update.content[:100]}".encode()
            ).hexdigest()
            
            if update_hash not in seen_hashes:
                new_updates.append(update)
        
        return new_updates
    
    def _update_cache(self, competitor_name: str, updates: List[Update]):
        """Update cache with seen updates."""
        cache_key = f"competitor_{competitor_name}"
        
        update_hashes = [
            hashlib.md5(f"{u.title}{u.content[:100]}".encode()).hexdigest()
            for u in updates
        ]
        
        # Keep last 100 hashes per competitor
        self.cache[cache_key] = update_hashes[:100]
        save_cache(self.cache)
    
    def _update_competitor_config(self, competitor: CompetitorConfig):
        """Update a single competitor's configuration."""
        competitors = load_competitors()
        for i, comp in enumerate(competitors):
            if comp.name == competitor.name:
                competitors[i] = competitor
                break
        save_competitors(competitors)
    
    def monitor_all(self) -> List[Dict[str, Any]]:
        """Monitor all enabled competitors."""
        competitors = load_competitors()
        findings = []
        
        enabled_competitors = [c for c in competitors if c.enabled]
        logger.info(f"Monitoring {len(enabled_competitors)} enabled competitors...")
        
        for i, competitor in enumerate(enabled_competitors, 1):
            try:
                logger.info(f"[{i}/{len(enabled_competitors)}] Checking {competitor.name}")
                result = self.monitor_competitor(competitor)
                if result:
                    findings.append(result)
                
                # Rate limiting
                if i < len(enabled_competitors):
                    time.sleep(self.config.rate_limit_seconds)
                    
            except Exception as e:
                logger.error(f"Error monitoring {competitor.name}: {e}", exc_info=True)
        
        return findings

# --- Export Functions ---
class ExportManager:
    """Export intelligence reports in various formats."""
    
    @staticmethod
    def export_to_json(findings: List[Dict[str, Any]], filename: Optional[str] = None) -> Path:
        """Export findings to JSON."""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"intel_export_{timestamp}.json"
        
        export_path = EXPORTS_DIR / filename
        
        # Convert dataclasses to dicts
        export_data = []
        for finding in findings:
            export_data.append({
                'competitor': asdict(finding['competitor']),
                'updates': [asdict(u) for u in finding['updates']],
                'analysis': asdict(finding['analysis'])
            })
        
        with open(export_path, 'w') as f:
            json.dump({
                'generated_at': datetime.now().isoformat(),
                'findings_count': len(findings),
                'findings': export_data
            }, f, indent=2)
        
        logger.info(f"Exported to JSON: {export_path}")
        return export_path
    
    @staticmethod
    def export_to_csv(findings: List[Dict[str, Any]], filename: Optional[str] = None) -> Path:
        """Export findings to CSV."""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"intel_export_{timestamp}.csv"
        
        export_path = EXPORTS_DIR / filename
        
        with open(export_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow([
                'Competitor', 'Category', 'Priority', 'Impact', 'Threat Level',
                'Summary', 'Key Features', 'Action', 'Update Count', 'Detected At'
            ])
            
            for finding in findings:
                comp = finding['competitor']
                analysis = finding['analysis']
                
                writer.writerow([
                    comp.name,
                    comp.category,
                    comp.priority,
                    analysis.impact,
                    analysis.threat_level,
                    analysis.summary,
                    '; '.join(analysis.key_features),
                    analysis.action,
                    len(finding['updates']),
                    datetime.now().isoformat()
                ])
        
        logger.info(f"Exported to CSV: {export_path}")
        return export_path

# --- Report Generation ---
class ReportGenerator:
    """Generate various formats of intelligence reports."""
    
    @staticmethod
    def generate_digest(findings: List[Dict[str, Any]], 
                       format_type: str = "detailed") -> str:
        """Generate intelligence digest."""
        if not findings:
            return "✅ No competitor updates detected in this check.\n\n" + \
                   "All monitored competitors have been scanned. No new activity found."
        
        if format_type == "brief":
            return ReportGenerator._generate_brief_digest(findings)
        elif format_type == "summary":
            return ReportGenerator._generate_summary_digest(findings)
        else:
            return ReportGenerator._generate_detailed_digest(findings)
    
    @staticmethod
    def _generate_brief_digest(findings: List[Dict[str, Any]]) -> str:
        """Generate brief digest - just headlines."""
        report = f"# 📊 Competitive Intelligence Brief\n\n"
        report += f"**{datetime.now().strftime('%B %d, %Y')}**\n\n"
        report += f"**{len(findings)} competitors with updates:**\n\n"
        
        # Sort by impact
        findings_sorted = sorted(
            findings,
            key=lambda x: ['Critical', 'High', 'Medium', 'Low'].index(x['analysis'].impact)
        )
        
        for f in findings_sorted:
            competitor = f['competitor']
            analysis = f['analysis']
            impact_emoji = ReportGenerator._get_impact_emoji(analysis.impact)
            
            report += f"{impact_emoji} **{competitor.name}** ({analysis.impact}): {analysis.summary}\n"
        
        return report
    
    @staticmethod
    def _generate_summary_digest(findings: List[Dict[str, Any]]) -> str:
        """Generate summary digest - key info only."""
        report = f"# 📊 Competitive Intelligence Summary\n\n"
        report += f"**{datetime.now().strftime('%B %d, %Y at %I:%M %p')}**\n\n"
        
        # Statistics
        total_updates = sum(len(f['updates']) for f in findings)
        report += f"**Updates Found:** {total_updates} from {len(findings)} competitors\n\n"
        
        # Group by impact
        by_impact = defaultdict(list)
        for f in findings:
            by_impact[f['analysis'].impact].append(f)
        
        # Show high-impact first
        for impact in [ImpactLevel.CRITICAL.value, ImpactLevel.HIGH.value, 
                      ImpactLevel.MEDIUM.value, ImpactLevel.LOW.value]:
            if impact in by_impact:
                emoji = ReportGenerator._get_impact_emoji(impact)
                report += f"## {emoji} {impact} Impact ({len(by_impact[impact])})\n\n"
                
                for f in by_impact[impact]:
                    competitor = f['competitor']
                    analysis = f['analysis']
                    
                    report += f"### {competitor.name}\n\n"
                    report += f"**Category:** {competitor.category} | **Priority:** {competitor.priority}\n\n"
                    report += f"**Summary:** {analysis.summary}\n\n"
                    
                    if analysis.key_features:
                        report += "**Key Changes:**\n"
                        for feat in analysis.key_features[:3]:
                            report += f"- {feat}\n"
                        report += "\n"
                    
                    report += f"💡 **Action:** {analysis.action}\n\n"
                    report += "---\n\n"
        
        return report
    
    @staticmethod
    def _generate_detailed_digest(findings: List[Dict[str, Any]]) -> str:
        """Generate detailed digest - full intelligence report."""
        report = f"# 🎯 Competitive Intelligence Report\n\n"
        report += f"**Generated:** {datetime.now().strftime('%B %d, %Y at %I:%M %p')}\n\n"
        
        # Executive Summary
        report += "## 📋 Executive Summary\n\n"
        
        total_updates = sum(len(f['updates']) for f in findings)
        report += f"This report covers **{total_updates} updates** from **{len(findings)} competitors**.\n\n"
        
        # Impact breakdown
        impact_counts = defaultdict(int)
        for f in findings:
            impact_counts[f['analysis'].impact] += 1
        
        report += "**Impact Breakdown:**\n"
        for impact in [ImpactLevel.CRITICAL.value, ImpactLevel.HIGH.value, 
                      ImpactLevel.MEDIUM.value, ImpactLevel.LOW.value]:
            if impact in impact_counts:
                emoji = ReportGenerator._get_impact_emoji(impact)
                report += f"- {emoji} {impact}: {impact_counts[impact]} competitor(s)\n"
        report += "\n"
        
        # Key highlights
        report += "**Key Highlights:**\n"
        for f in sorted(findings, 
                       key=lambda x: ['Critical', 'High', 'Medium', 'Low'].index(x['analysis'].impact))[:5]:
            competitor = f['competitor']
            analysis = f['analysis']
            report += f"- **{competitor.name}**: {analysis.summary}\n"
        report += "\n"
        
        report += "---\n\n"
        
        # Detailed Analysis
        report += "## 🔍 Detailed Analysis\n\n"
        
        # Sort by impact level
        findings_sorted = sorted(
            findings, 
            key=lambda x: (
                ['Critical', 'High', 'Medium', 'Low'].index(x['analysis'].impact),
                x['competitor'].name
            )
        )
        
        for f in findings_sorted:
            competitor = f['competitor']
            analysis = f['analysis']
            updates = f['updates']
            
            report += f"### {competitor.name}\n\n"
            
            # Metadata
            tags_str = ", ".join(competitor.tags) if competitor.tags else "None"
            report += f"**Category:** {competitor.category} | "
            report += f"**Priority:** {competitor.priority} | "
            report += f"**Tags:** {tags_str}\n\n"
            
            # Impact indicators
            impact_emoji = ReportGenerator._get_impact_emoji(analysis.impact)
            threat_emoji = ReportGenerator._get_impact_emoji(analysis.threat_level)
            
            report += f"{impact_emoji} **Impact:** {analysis.impact} | "
            report += f"{threat_emoji} **Threat Level:** {analysis.threat_level}\n\n"
            
            # Analysis
            report += f"**Summary:** {analysis.summary}\n\n"
            
            if analysis.key_features:
                report += "**Key Features/Changes:**\n"
                for feat in analysis.key_features:
                    report += f"- {feat}\n"
                report += "\n"
            
            if analysis.strategic_implications:
                report += f"**Strategic Implications:** {analysis.strategic_implications}\n\n"
            
            if analysis.opportunities:
                report += "**Opportunities for Us:**\n"
                for opp in analysis.opportunities:
                    report += f"- {opp}\n"
                report += "\n"
            
            report += f"💡 **Recommended Action:** {analysis.action}\n\n"
            
            if hasattr(analysis, 'confidence_score') and analysis.confidence_score:
                confidence_pct = int(analysis.confidence_score * 100)
                report += f"*Analysis Confidence: {confidence_pct}%*\n\n"
            
            # Show updates in collapsible section
            report += "<details>\n<summary>📄 View All Updates ({len(updates)})</summary>\n\n"
            for i, u in enumerate(updates, 1):
                report += f"#### Update {i}: {u.title}\n\n"
                if u.date:
                    report += f"*{u.date}* | "
                report += f"*Source: {u.source_type.upper()}*\n\n"
                
                if u.content and u.content != u.title:
                    content_preview = u.content[:600]
                    if len(u.content) > 600:
                        content_preview += "..."
                    report += f"{content_preview}\n\n"
                
                report += f"[View Source →]({u.url})\n\n"
            report += "</details>\n\n"
            
            # Add link to main source
            source_url = competitor.rss_feed_url or competitor.website_url
            if source_url:
                report += f"🔗 [View All {competitor.name} Updates]({source_url})\n\n"
            
            report += "---\n\n"
        
        # Add metadata footer
        report += "## ℹ️ Report Information\n\n"
        report += f"- **Generated:** {datetime.now().isoformat()}\n"
        report += f"- **Competitors Monitored:** {len(findings)}\n"
        report += f"- **Total Updates:** {total_updates}\n"
        report += f"- **Analysis Engine:** {'Gemini 2.5 Flash (AI-powered)' if GEMINI_AVAILABLE else 'Rule-based analysis'}\n"
        report += f"- **Report Format:** Detailed\n\n"
        
        report += "*Generated by IntelTracker v12.0*\n"
        
        return report
    
    @staticmethod
    def _get_impact_emoji(impact: str) -> str:
        """Get emoji for impact level."""
        emoji_map = {
            ImpactLevel.CRITICAL.value: "🔴",
            ImpactLevel.HIGH.value: "🟠",
            ImpactLevel.MEDIUM.value: "🟡",
            ImpactLevel.LOW.value: "🟢"
        }
        return emoji_map.get(impact, "⚪")
    
    @staticmethod
    def save_report(report: str, filename: Optional[str] = None) -> Path:
        """Save report to file."""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"intel_report_{timestamp}.md"
        
        report_path = REPORTS_DIR / filename
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write(report)
        
        logger.info(f"Report saved: {report_path}")
        return report_path


# --- ADK Tools ---
@FunctionTool
def export_full_report(
    tool_context: "ToolContext",
    format: str = "detailed"
) -> str:
    """Export a full intelligence report to the exports directory."""
    engine = MonitoringEngine()
    findings = engine.monitor_all()
    
    if not findings:
        return "No findings to export."
    
    report = ReportGenerator.generate_digest(findings, format)
    
    # Save to exports instead of reports
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"full_report_{timestamp}.md"
    export_path = EXPORTS_DIR / filename
    
    with open(export_path, 'w', encoding='utf-8') as f:
        f.write(report)
    
    return f"Full report exported to: {filename}"
@FunctionTool
def configure_email_notifications(
    tool_context: "ToolContext",
    email: Optional[str] = None,
    smtp_username: Optional[str] = None,
    smtp_password: Optional[str] = None,
    smtp_server: Optional[str] = None,
    smtp_port: Optional[int] = None,
    notify_critical: Optional[bool] = None,
    notify_high: Optional[bool] = None,
    test_email: bool = False
) -> str:
    """
    Configure email notifications for competitive intelligence alerts.
    
    Set up email delivery for intelligence digests and instant alerts on critical updates.
    
    Args:
        email: Email address to receive notifications
        smtp_username: SMTP username (usually your email address)
        smtp_password: SMTP password or app-specific password
        smtp_server: SMTP server address (default: smtp.gmail.com for Gmail)
        smtp_port: SMTP port (default: 587 for TLS)
        notify_critical: Send instant alerts for critical updates (default: True)
        notify_high: Send instant alerts for high-impact updates (default: True)
        test_email: Send a test email to verify configuration (default: False)
    
    Returns:
        Configuration status with setup instructions
    """
    config = load_config()
    changes = []
    
    # Update email settings
    if email is not None:
        config.notification_email = email
        changes.append(f"Notification email: {email}")
    
    if smtp_username is not None:
        config.smtp_username = smtp_username
        changes.append(f"SMTP username: {smtp_username}")
    
    if smtp_password is not None:
        config.smtp_password = smtp_password
        changes.append("SMTP password: [set]")
    
    if smtp_server is not None:
        config.smtp_server = smtp_server
        changes.append(f"SMTP server: {smtp_server}")
    
    if smtp_port is not None:
        if smtp_port not in [25, 465, 587, 2525]:
            return "Invalid SMTP port. Common ports: 587 (TLS), 465 (SSL), 25 (unencrypted)"
        config.smtp_port = smtp_port
        changes.append(f"SMTP port: {smtp_port}")
    
    if notify_critical is not None:
        config.notify_on_critical = notify_critical
        changes.append(f"Critical alerts: {'enabled' if notify_critical else 'disabled'}")
    
    if notify_high is not None:
        config.notify_on_high = notify_high
        changes.append(f"High-impact alerts: {'enabled' if notify_high else 'disabled'}")
    
    # Save configuration
    save_config(config)
    
    result = "📧 **Email Notification Configuration**\n\n"
    
    if changes:
        result += "**Updated Settings:**\n"
        for change in changes:
            result += f"- {change}\n"
        result += "\n---\n\n"
    
    # Current configuration
    result += "**Current Configuration:**\n\n"
    
    if config.notification_email:
        result += f"**Recipient:** {config.notification_email}\n"
        result += f"**SMTP Server:** {config.smtp_server}:{config.smtp_port}\n"
        result += f"**SMTP Username:** {config.smtp_username or 'Not set'}\n"
        result += f"**SMTP Password:** {'Set' if config.smtp_password else 'Not set'}\n\n"
        
        result += "**Alert Settings:**\n"
        result += f"- Critical updates: {'✓ Enabled' if config.notify_on_critical else '✗ Disabled'}\n"
        result += f"- High-impact updates: {'✓ Enabled' if config.notify_on_high else '✗ Disabled'}\n\n"
        
        # Configuration status check
        is_configured = all([
            config.notification_email,
            config.smtp_username,
            config.smtp_password
        ])
        
        if is_configured:
            result += "**Status:** ✅ Fully configured\n\n"
        else:
            result += "**Status:** ⚠️ Incomplete configuration\n"
            result += "Missing: "
            missing = []
            if not config.notification_email:
                missing.append("email")
            if not config.smtp_username:
                missing.append("smtp_username")
            if not config.smtp_password:
                missing.append("smtp_password")
            result += ", ".join(missing) + "\n\n"
    else:
        result += "**Status:** Not configured\n\n"
    
    # Test email if requested
    if test_email:
        if not config.notification_email:
            result += "---\n\n❌ **Test Failed:** No email address configured\n"
        elif not config.smtp_username or not config.smtp_password:
            result += "---\n\n❌ **Test Failed:** SMTP credentials not configured\n"
        else:
            result += "---\n\n📨 **Sending test email...**\n\n"
            
            try:
                notifier = EmailNotifier(config)
                test_report = f"""# IntelTracker Test Email

This is a test email from IntelTracker to verify your notification setup.

**Configuration:**
- Recipient: {config.notification_email}
- SMTP Server: {config.smtp_server}:{config.smtp_port}
- Critical Alerts: {'Enabled' if config.notify_on_critical else 'Disabled'}
- High Impact Alerts: {'Enabled' if config.notify_on_high else 'Disabled'}

If you received this email, your notification system is working correctly!

---
Generated by IntelTracker v12.0"""
                
                if notifier.send_digest(test_report, 0):
                    result += "✅ **Test email sent successfully!**\n\n"
                    result += f"Check your inbox at {config.notification_email}\n"
                    result += "(Check spam folder if not received within 1-2 minutes)\n"
                else:
                    result += "❌ **Test email failed to send**\n\n"
                    result += "Check the logs for details: `data/intel_tracker.log`\n"
                    
            except Exception as e:
                result += f"❌ **Test email failed:** {str(e)}\n\n"
                logger.error(f"Test email failed: {e}")
    
    # Add helpful instructions
    result += "\n---\n\n"
    result += "**Setup Instructions:**\n\n"
    
    # Gmail-specific instructions
    if not config.smtp_server or 'gmail' in config.smtp_server.lower():
        result += "**For Gmail:**\n"
        result += "1. Enable 2-Factor Authentication on your Google Account\n"
        result += "2. Generate an App Password at: https://myaccount.google.com/apppasswords\n"
        result += "3. Use your Gmail address as smtp_username\n"
        result += "4. Use the 16-character App Password (not your regular password)\n\n"
        result += "**Example:**\n"
        result += "```\n"
        result += "configure_email_notifications(\n"
        result += "  email='alerts@yourcompany.com',\n"
        result += "  smtp_username='your@gmail.com',\n"
        result += "  smtp_password='abcd efgh ijkl mnop',  # App Password\n"
        result += "  test_email=True\n"
        result += ")\n"
        result += "```\n\n"
    
    # Other providers
    result += "**For Other Email Providers:**\n\n"
    result += "**Outlook/Office365:**\n"
    result += "- Server: smtp.office365.com\n"
    result += "- Port: 587\n"
    result += "- Use your full email and password\n\n"
    
    result += "**Custom SMTP:**\n"
    result += "- Contact your email provider for SMTP settings\n"
    result += "- Typical ports: 587 (TLS) or 465 (SSL)\n\n"
    
    result += "**Tips:**\n"
    result += "- Always use test_email=True to verify setup\n"
    result += "- Keep credentials secure - they're stored in data/config.json\n"
    result += "- Consider using a dedicated email for notifications\n"
    result += "- Check spam/junk folder if emails don't arrive\n"
    
    return result


@FunctionTool
def test_email_notification(tool_context: "ToolContext") -> str:
    """
    Send a test email to verify notification configuration.
    
    Quick way to test if your email setup is working without reconfiguring.
    
    Returns:
        Test result with troubleshooting tips if failed
    """
    config = load_config()
    
    if not config.notification_email:
        return "❌ **Email not configured**\n\n" + \
               "Use `configure_email_notifications(email='your@email.com', ...)` to set up notifications."
    
    if not config.smtp_username or not config.smtp_password:
        return "❌ **SMTP credentials missing**\n\n" + \
               "Set SMTP username and password using `configure_email_notifications()`"
    
    result = "📨 **Sending test email...**\n\n"
    result += f"**To:** {config.notification_email}\n"
    result += f"**Via:** {config.smtp_server}:{config.smtp_port}\n\n"
    
    try:
        notifier = EmailNotifier(config)
        test_report = f"""# IntelTracker Test Email

This is a test notification from IntelTracker.

**Your Configuration:**
- SMTP Server: {config.smtp_server}:{config.smtp_port}
- Username: {config.smtp_username}
- Critical Alerts: {'✓ Enabled' if config.notify_on_critical else '✗ Disabled'}
- High Impact Alerts: {'✓ Enabled' if config.notify_on_high else '✗ Disabled'}

Your notification system is working correctly!

---
*Sent by IntelTracker v12.0 at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*"""
        
        if notifier.send_digest(test_report, 0):
            result += "✅ **Test email sent successfully!**\n\n"
            result += f"Check {config.notification_email} (including spam folder)\n\n"
            result += "If you don't see it within 2 minutes, check:\n"
            result += "1. Spam/junk folder\n"
            result += "2. Email address spelling\n"
            result += "3. SMTP credentials\n"
            result += "4. Logs: `data/intel_tracker.log`"
        else:
            result += "❌ **Test email failed to send**\n\n"
            result += "**Troubleshooting:**\n"
            result += "1. Check logs: `data/intel_tracker.log`\n"
            result += "2. Verify SMTP credentials are correct\n"
            result += "3. For Gmail: Use App Password, not regular password\n"
            result += "4. Check if SMTP server/port are correct\n"
            result += "5. Try running with test_email=True in configure_email_notifications()"
    
    except Exception as e:
        result += f"❌ **Test failed with error:**\n\n"
        result += f"`{str(e)}`\n\n"
        result += "**Common Issues:**\n\n"
        
        error_msg = str(e).lower()
        
        if 'authentication' in error_msg or 'credentials' in error_msg:
            result += "**Authentication Error:**\n"
            result += "- For Gmail: You must use an App Password, not your regular password\n"
            result += "- Generate one at: https://myaccount.google.com/apppasswords\n"
            result += "- Make sure 2FA is enabled first\n"
        elif 'connection' in error_msg or 'refused' in error_msg:
            result += "**Connection Error:**\n"
            result += "- Check SMTP server address\n"
            result += "- Verify port number (587 for TLS, 465 for SSL)\n"
            result += "- Check firewall/network settings\n"
        elif 'timeout' in error_msg:
            result += "**Timeout Error:**\n"
            result += "- SMTP server may be unreachable\n"
            result += "- Check internet connection\n"
            result += "- Try a different SMTP server\n"
        else:
            result += "Check the full error in logs: `data/intel_tracker.log`\n"
        
        logger.error(f"Test email error: {e}", exc_info=True)
    
    return result
@FunctionTool
def configure_company_context(
    tool_context: "ToolContext",
    company_name: Optional[str] = None,
    product_name: Optional[str] = None,
    industry: Optional[str] = None,
    target_market: Optional[str] = None,
    key_features: Optional[str] = None,
    differentiation: Optional[str] = None,
    current_focus: Optional[str] = None,
    company_stage: Optional[str] = None,
    team_size: Optional[str] = None,
    positioning: Optional[str] = None,
    strategic_goals: Optional[str] = None
) -> str:
    """
    Configure your company's context for calibrated competitive analysis.
    
    This helps the AI understand your business and provide analysis specific to YOUR needs.
    
    Args:
        company_name: Your company name
        product_name: Your main product name
        industry: Your industry (e.g., "SaaS", "E-commerce", "Fintech")
        target_market: Your target market (e.g., "SMBs", "Enterprise", "Developers")
        key_features: Comma-separated list of your key features
        differentiation: What makes you different from competitors
        current_focus: What you're currently focusing on (roadmap priorities)
        company_stage: "Startup", "Growth", or "Established"
        team_size: Approximate team size
        positioning: Your market positioning statement
        strategic_goals: Comma-separated list of strategic goals
    
    Returns:
        Configuration confirmation with current company context
    """
    context = load_company_context()
    changes = []
    
    if company_name is not None:
        context.company_name = company_name
        changes.append(f"Company name: {company_name}")
    
    if product_name is not None:
        context.product_name = product_name
        changes.append(f"Product: {product_name}")
    
    if industry is not None:
        context.industry = industry
        changes.append(f"Industry: {industry}")
    
    if target_market is not None:
        context.target_market = target_market
        changes.append(f"Target market: {target_market}")
    
    if key_features is not None:
        context.key_features = [f.strip() for f in key_features.split(',') if f.strip()]
        changes.append(f"Key features: {len(context.key_features)} features")
    
    if differentiation is not None:
        context.differentiation = differentiation
        changes.append("Differentiation updated")
    
    if current_focus is not None:
        context.current_focus = current_focus
        changes.append(f"Current focus: {current_focus}")
    
    if company_stage is not None:
        if company_stage not in ["Startup", "Growth", "Established"]:
            return "Invalid stage. Use: 'Startup', 'Growth', or 'Established'"
        context.company_stage = company_stage
        changes.append(f"Stage: {company_stage}")
    
    if team_size is not None:
        context.team_size = team_size
        changes.append(f"Team size: {team_size}")
    
    if positioning is not None:
        context.positioning = positioning
        changes.append("Positioning updated")
    
    if strategic_goals is not None:
        context.strategic_goals = [g.strip() for g in strategic_goals.split(',') if g.strip()]
        changes.append(f"Strategic goals: {len(context.strategic_goals)} goals")
    
    context.updated_at = datetime.now().isoformat()
    save_company_context(context)
    
    result = "🏢 **Company Context Configuration**\n\n"
    
    if changes:
        result += "**Updated:**\n"
        for change in changes:
            result += f"- {change}\n"
        result += "\n---\n\n"
    
    result += "**Current Configuration:**\n\n"
    result += f"**Company:** {context.company_name}\n"
    
    if context.product_name:
        result += f"**Product:** {context.product_name}\n"
    
    result += f"**Industry:** {context.industry}\n"
    result += f"**Target Market:** {context.target_market}\n"
    result += f"**Stage:** {context.company_stage}\n"
    
    if context.team_size:
        result += f"**Team Size:** {context.team_size}\n"
    
    result += "\n"
    
    if context.key_features:
        result += "**Key Features:**\n"
        for feat in context.key_features:
            result += f"- {feat}\n"
        result += "\n"
    
    if context.differentiation:
        result += f"**Differentiation:** {context.differentiation}\n\n"
    
    if context.positioning:
        result += f"**Positioning:** {context.positioning}\n\n"
    
    if context.current_focus:
        result += f"**Current Focus:** {context.current_focus}\n\n"
    
    if context.strategic_goals:
        result += "**Strategic Goals:**\n"
        for goal in context.strategic_goals:
            result += f"- {goal}\n"
        result += "\n"
    
    result += f"*Last updated: {context.updated_at[:10]}*\n\n"
    result += "---\n\n"
    result += "This context will be used to calibrate all competitive analysis.\n"
    result += "The AI will now frame insights specifically for YOUR company and goals."
    
    return result


@FunctionTool
def view_company_context(tool_context: "ToolContext") -> str:
    """
    View your current company context configuration.
    
    Returns:
        Current company context used for competitive analysis
    """
    context = load_company_context()
    
    result = "# 🏢 Your Company Context\n\n"
    result += "*This context calibrates all competitive intelligence analysis*\n\n"
    result += "---\n\n"
    
    result += f"## {context.company_name}\n\n"
    
    if context.product_name:
        result += f"**Product:** {context.product_name}\n"
    
    result += f"**Industry:** {context.industry}\n"
    result += f"**Target Market:** {context.target_market}\n"
    result += f"**Company Stage:** {context.company_stage}\n"
    
    if context.team_size:
        result += f"**Team Size:** {context.team_size}\n"
    
    result += "\n"
    
    if context.key_features:
        result += "### Key Features\n\n"
        for feat in context.key_features:
            result += f"- {feat}\n"
        result += "\n"
    
    if context.differentiation:
        result += "### What Makes Us Different\n\n"
        result += f"{context.differentiation}\n\n"
    
    if context.positioning:
        result += "### Market Positioning\n\n"
        result += f"{context.positioning}\n\n"
    
    if context.current_focus:
        result += "### Current Focus\n\n"
        result += f"{context.current_focus}\n\n"
    
    if context.strategic_goals:
        result += "### Strategic Goals\n\n"
        for goal in context.strategic_goals:
            result += f"- {goal}\n"
        result += "\n"
    
    result += "---\n\n"
    result += f"*Last updated: {datetime.fromisoformat(context.updated_at).strftime('%B %d, %Y')}*\n\n"
    
    if context.company_name == "Your Company":
        result += "\n**⚠️ Using Default Context**\n\n"
        result += "Configure your actual company context using `configure_company_context()` for better analysis.\n\n"
        result += "**Quick Setup Example:**\n"
        result += "```\n"
        result += "configure_company_context(\n"
        result += "  company_name='Acme Inc',\n"
        result += "  product_name='Acme Pro',\n"
        result += "  industry='SaaS',\n"
        result += "  target_market='SMB businesses',\n"
        result += "  key_features='Real-time collaboration, AI insights, API integrations',\n"
        result += "  differentiation='Fastest time-to-value in the market',\n"
        result += "  current_focus='Expanding enterprise features',\n"
        result += "  company_stage='Growth'\n"
        result += ")\n"
        result += "```"
    
    return result
@FunctionTool
def run_intelligence_check(
    tool_context: "ToolContext",
    format: str = "detailed",
    send_email: bool = False
) -> str:
    """
    Run competitive intelligence check across all enabled competitors.
    
    Args:
        format: Report format - 'brief', 'summary', or 'detailed' (default)
        send_email: Send report via email if configured (default: False)
    
    Returns:
        Intelligence report with competitor updates and analysis
    """
    logger.info("=" * 70)
    logger.info("Starting intelligence check...")
    logger.info("=" * 70)
    
    config = load_config()
    engine = MonitoringEngine()
    findings = engine.monitor_all()
    
    if not findings:
        message = "✅ **No New Updates Detected**\n\n" + \
                 "All enabled competitors have been scanned. No new activity found since last check.\n\n" + \
                 "This is normal - it means your competitors haven't made significant public changes recently."
        
        tool_context.state['last_check'] = datetime.now().isoformat()
        tool_context.state['last_findings_count'] = 0
        
        return message
    
    # Generate report
    report = ReportGenerator.generate_digest(findings, format)
    
    # Save report
    report_path = ReportGenerator.save_report(report)
    
    # Export if configured
    if config.export_after_check:
        ExportManager.export_to_json(findings)
        ExportManager.export_to_csv(findings)
    
    # Send email if requested
    email_status = ""
    if send_email or (config.notification_email and findings):
        notifier = EmailNotifier(config)
        if notifier.send_digest(report, len(findings)):
            email_status = f"\n\n📧 Report emailed to {config.notification_email}"
        else:
            email_status = "\n\n⚠️ Email sending failed (check SMTP configuration)"
    
    # Update state
    tool_context.state['last_check'] = datetime.now().isoformat()
    tool_context.state['last_findings_count'] = len(findings)
    
    summary = f"🎯 **{len(findings)} Competitor Update(s) Found**\n\n"
    summary += f"Report saved: `{report_path.name}`{email_status}\n\n"
    summary += "---\n\n"
    summary += report
    
    return summary

@FunctionTool
def add_competitor(
    name: str,
    tool_context: "ToolContext",
    website_url: Optional[str] = None,
    rss_feed_url: Optional[str] = None,
    twitter_handle: Optional[str] = None,
    linkedin_url: Optional[str] = None,
    press_release_url: Optional[str] = None,
    category: Optional[str] = None,
    priority: str = "Medium",
    tags: Optional[str] = None
) -> str:
    """
    Add a new competitor to track.
    
    Args:
        name: Competitor name (required)
        website_url: Main website or changelog URL
        rss_feed_url: RSS feed URL if available (most reliable)
        twitter_handle: Twitter handle (without @)
        linkedin_url: LinkedIn company page URL
        press_release_url: Press release RSS/page URL
        category: Business category (e.g., "Productivity", "CRM")
        priority: Priority level - "High", "Medium", or "Low" (default: "Medium")
        tags: Comma-separated tags (e.g., "saas,enterprise,ai")
    
    Returns:
        Confirmation message
    """
    if not website_url and not rss_feed_url:
        return "❌ Please provide at least a website_url or rss_feed_url to monitor."
    
    competitors = load_competitors()
    
    # Check if already exists
    if any(c.name.lower() == name.lower() for c in competitors):
        return f"❌ Competitor '{name}' is already being tracked.\n\n" + \
               "Use `toggle_competitor` to enable it if disabled, or `remove_competitor` to delete and re-add."
    
    # Parse tags
    tag_list = []
    if tags:
        tag_list = [t.strip() for t in tags.split(',') if t.strip()]
    
    # Create new competitor
    new_competitor = CompetitorConfig(
        name=name,
        website_url=website_url,
        rss_feed_url=rss_feed_url,
        twitter_handle=twitter_handle,
        linkedin_url=linkedin_url,
        press_release_url=press_release_url,
        category=category or "Unknown",
        priority=priority,
        tags=tag_list
    )
    
    competitors.append(new_competitor)
    save_competitors(competitors)
    
    logger.info(f"Added competitor: {name}")
    
    sources = []
    if website_url:
        sources.append("Website")
    if rss_feed_url:
        sources.append("RSS (recommended)")
    if twitter_handle:
        sources.append("Twitter")
    if linkedin_url:
        sources.append("LinkedIn")
    if press_release_url:
        sources.append("Press Releases")
    
    return f"✅ **Successfully added '{name}' to monitoring list**\n\n" + \
           f"**Category:** {new_competitor.category}\n" + \
           f"**Priority:** {priority}\n" + \
           f"**Sources:** {', '.join(sources)}\n" + \
           f"**Tags:** {', '.join(tag_list) if tag_list else 'None'}\n\n" + \
           f"Run `run_intelligence_check` to start monitoring immediately, or it will be included in the next scheduled check."

@FunctionTool
def list_competitors(tool_context: "ToolContext", show_disabled: bool = True) -> str:
    """
    Show all tracked competitors with their status and configuration.
    
    Args:
        show_disabled: Include disabled competitors in the list (default: True)
    
    Returns:
        Formatted list of competitors
    """
    competitors = load_competitors()
    
    if not competitors:
        return "📭 **No competitors are currently being tracked.**\n\n" + \
               "Use `add_competitor` to start monitoring competitors.\n\n" + \
               "**Quick start example:**\n" + \
               "```\n" + \
               "add_competitor(\n" + \
               "  name='CompetitorName',\n" + \
               "  website_url='https://competitor.com/blog',\n" + \
               "  category='SaaS'\n" + \
               ")\n" + \
               "```"
    
    # Filter if needed
    if not show_disabled:
        competitors = [c for c in competitors if c.enabled]
    
    # Group by priority
    by_priority = {'High': [], 'Medium': [], 'Low': []}
    for comp in competitors:
        by_priority[comp.priority].append(comp)
    
    enabled_count = sum(1 for c in competitors if c.enabled)
    disabled_count = len(competitors) - enabled_count
    
    result = f"# 📊 Tracked Competitors\n\n"
    result += f"**Total:** {len(competitors)} | **Active:** {enabled_count} | **Disabled:** {disabled_count}\n\n"
    
    for priority in ['High', 'Medium', 'Low']:
        if by_priority[priority]:
            emoji = {"High": "🔴", "Medium": "🟡", "Low": "🟢"}[priority]
            result += f"## {emoji} {priority} Priority ({len(by_priority[priority])})\n\n"
            
            for comp in by_priority[priority]:
                status_emoji = "✅" if comp.enabled else "❌"
                result += f"### {status_emoji} {comp.name}\n\n"
                result += f"- **Status:** {'Active' if comp.enabled else 'Disabled'}\n"
                result += f"- **Category:** {comp.category}\n"
                
                # Sources
                sources = []
                if comp.website_url:
                    sources.append(f"[Website]({comp.website_url})")
                if comp.rss_feed_url:
                    sources.append("RSS ⭐")
                if comp.twitter_handle:
                    sources.append(f"Twitter (@{comp.twitter_handle})")
                if comp.linkedin_url:
                    sources.append("LinkedIn")
                if comp.press_release_url:
                    sources.append("Press")
                
                result += f"- **Sources:** {', '.join(sources) if sources else 'None configured'}\n"
                
                if comp.tags:
                    result += f"- **Tags:** {', '.join(comp.tags)}\n"
                
                result += f"- **Added:** {comp.added_at[:10]}\n"
                
                if comp.last_checked:
                    last_check = datetime.fromisoformat(comp.last_checked)
                    result += f"- **Last Checked:** {last_check.strftime('%b %d at %I:%M %p')}\n"
                
                result += "\n"
    
    result += "---\n\n"
    result += "💡 **Tips:**\n"
    result += "- Use `check_single_competitor('name')` to check a specific competitor\n"
    result += "- Use `toggle_competitor('name')` to enable/disable monitoring\n"
    result += "- Use `view_competitor_trends('name')` to see historical patterns\n"
    
    return result

@FunctionTool
def remove_competitor(name: str, tool_context: "ToolContext", confirm: bool = False) -> str:
    """
    Remove a competitor from tracking.
    
    Args:
        name: Name of competitor to remove
        confirm: Set to True to confirm deletion (safety check)
    
    Returns:
        Confirmation message
    """
    if not confirm:
        return f"⚠️ **Confirm Deletion**\n\n" + \
               f"Are you sure you want to remove '{name}' from tracking?\n\n" + \
               "This will delete all monitoring configuration. Historical data will be preserved.\n\n" + \
               f"To confirm, use: `remove_competitor('{name}', confirm=True)`"
    
    competitors = load_competitors()
    original_count = len(competitors)
    
    removed_competitor = None
    competitors_filtered = []
    for c in competitors:
        if c.name.lower() == name.lower():
            removed_competitor = c
        else:
            competitors_filtered.append(c)
    
    if len(competitors_filtered) == original_count:
        return f"❌ Competitor '{name}' not found in tracking list.\n\n" + \
               "Use `list_competitors` to see all tracked competitors."
    
    save_competitors(competitors_filtered)
    logger.info(f"Removed competitor: {name}")
    
    return f"✅ **Removed '{name}' from monitoring list**\n\n" + \
           f"**Category:** {removed_competitor.category}\n" + \
           f"**Priority:** {removed_competitor.priority}\n\n" + \
           "Historical trend data has been preserved. You can re-add this competitor anytime."

@FunctionTool
def toggle_competitor(name: str, tool_context: "ToolContext") -> str:
    """
    Enable or disable monitoring for a competitor without removing them.
    
    Args:
        name: Name of competitor to toggle
    
    Returns:
        Confirmation message with new status
    """
    competitors = load_competitors()
    
    found = False
    new_status = None
    for comp in competitors:
        if comp.name.lower() == name.lower():
            comp.enabled = not comp.enabled
            new_status = comp.enabled
            found = True
            break
    
    if not found:
        return f"❌ Competitor '{name}' not found.\n\n" + \
               "Use `list_competitors` to see all tracked competitors."
    
    save_competitors(competitors)
    logger.info(f"Toggled competitor {name}: {'enabled' if new_status else 'disabled'}")
    
    status_text = "**enabled** ✅" if new_status else "**disabled** ❌"
    
    message = f"✅ Monitoring for '{name}' is now {status_text}\n\n"
    
    if new_status:
        message += "This competitor will be included in the next intelligence check."
    else:
        message += "This competitor will be skipped in intelligence checks until re-enabled.\n" + \
                  "All configuration and historical data are preserved."
    
    return message

@FunctionTool
def check_single_competitor(name: str, tool_context: "ToolContext") -> str:
    """
    Check a specific competitor for updates immediately.
    
    Args:
        name: Name of competitor to check
    
    Returns:
        Updates and analysis for this competitor
    """
    competitors = load_competitors()
    
    competitor = None
    for comp in competitors:
        if comp.name.lower() == name.lower():
            competitor = comp
            break
    
    if not competitor:
        return f"❌ Competitor '{name}' not found.\n\n" + \
               "Use `list_competitors` to see all tracked competitors, or `add_competitor` to add a new one."
    
    if not competitor.enabled:
        return f"⚠️ '{name}' is currently disabled.\n\n" + \
               f"Use `toggle_competitor('{name}')` to enable monitoring, then try again."
    
    logger.info(f"Checking single competitor: {name}")
    
    engine = MonitoringEngine()
    result = engine.monitor_competitor(competitor)
    
    if not result:
        return f"✅ **No new updates found for {name}**\n\n" + \
               f"**Last Checked:** {datetime.now().strftime('%B %d at %I:%M %p')}\n\n" + \
               "This competitor is being monitored, but hasn't published new content since the last check."
    
    # Generate focused report
    analysis = result['analysis']
    updates = result['updates']
    
    impact_emoji = ReportGenerator._get_impact_emoji(analysis.impact)
    threat_emoji = ReportGenerator._get_impact_emoji(analysis.threat_level)
    
    report = f"# 📊 {name} Intelligence Update\n\n"
    report += f"**Checked:** {datetime.now().strftime('%B %d, %Y at %I:%M %p')}\n"
    report += f"**New Updates:** {len(updates)}\n\n"
    
    report += f"{impact_emoji} **Impact:** {analysis.impact} | "
    report += f"{threat_emoji} **Threat:** {analysis.threat_level}\n\n"
    
    report += "## Summary\n\n"
    report += f"{analysis.summary}\n\n"
    
    if analysis.key_features:
        report += "## Key Changes\n\n"
        for feat in analysis.key_features:
            report += f"- {feat}\n"
        report += "\n"
    
    if analysis.strategic_implications:
        report += f"**Strategic Implications:** {analysis.strategic_implications}\n\n"
    
    if analysis.opportunities:
        report += "## Opportunities\n\n"
        for opp in analysis.opportunities:
            report += f"- {opp}\n"
        report += "\n"
    
    report += f"## Recommended Action\n\n{analysis.action}\n\n"
    
    report += "## Detailed Updates\n\n"
    for i, u in enumerate(updates, 1):
        report += f"### {i}. {u.title}\n\n"
        if u.date:
            report += f"*{u.date}* | "
        report += f"*Source: {u.source_type.upper()}*\n\n"
        
        if u.content and u.content != u.title:
            report += f"{u.content}\n\n"
        
        report += f"[View Source →]({u.url})\n\n"
    
    return report

@FunctionTool
def view_competitor_trends(name: str, tool_context: "ToolContext") -> str:
    """
    View historical trends and patterns for a competitor.
    
    Args:
        name: Name of competitor
    
    Returns:
        Trend analysis and historical patterns
    """
    trends = TrendAnalyzer.get_competitor_trends(name)
    
    if 'error' in trends:
        return f"📊 **No historical data for {name}**\n\n" + \
               "This competitor hasn't been checked yet, or no updates have been found.\n\n" + \
               f"Run `check_single_competitor('{name}')` to start collecting data."
    
    report = f"# 📈 Trend Analysis: {name}\n\n"
    
    # Overview
    report += "## Overview\n\n"
    report += f"- **Total Updates Tracked:** {trends['total_updates']}\n"
    report += f"- **Recent Activity:** {trends['recent_activity']} updates in last 10 checks\n"
    report += f"- **Activity Trend:** {trends['activity_trend'].title()}\n"
    report += f"- **Average Impact:** {trends['average_impact']:.1f}/4.0\n\n"
    
    if trends['first_seen']:
        first = datetime.fromisoformat(trends['first_seen'])
        last = datetime.fromisoformat(trends['last_seen'])
        report += f"- **First Tracked:** {first.strftime('%B %d, %Y')}\n"
        report += f"- **Last Update:** {last.strftime('%B %d, %Y')}\n\n"
    
    # Impact distribution
    report += "## Impact Distribution\n\n"
    if trends['impact_distribution']:
        for impact in ['Critical', 'High', 'Medium', 'Low']:
            count = trends['impact_distribution'].get(impact, 0)
            if count > 0:
                emoji = ReportGenerator._get_impact_emoji(impact)
                report += f"{emoji} **{impact}:** {count}\n"
        report += "\n"
    
    # Top features
    if trends['top_features']:
        report += "## Most Mentioned Features\n\n"
        for feature, count in trends['top_features'][:10]:
            report += f"- **{feature}:** {count} mentions\n"
        report += "\n"
    
    # Recent focus
    if trends['recent_focus']:
        report += "## Recent Focus Areas\n\n"
        report += "Keywords from last 10 updates:\n"
        for keyword, count in trends['recent_focus']:
            report += f"- {keyword} ({count}x)\n"
        report += "\n"
    
    report += "---\n\n"
    report += "💡 This trend data helps identify:\n"
    report += "- How active this competitor is\n"
    report += "- What areas they're focusing on\n"
    report += "- Whether their impact on the market is increasing\n"
    
    return report

@FunctionTool
def configure_monitoring(
    tool_context: "ToolContext",
    check_interval_hours: Optional[int] = None,
    enable_scheduling: Optional[bool] = None,
    notification_email: Optional[str] = None,
    smtp_username: Optional[str] = None,
    smtp_password: Optional[str] = None,
    digest_format: Optional[str] = None,
    notify_on_critical: Optional[bool] = None,
    notify_on_high: Optional[bool] = None,
    export_after_check: Optional[bool] = None,
    max_updates_per_competitor: Optional[int] = None
) -> str:
    """
    Configure monitoring settings and preferences.
    
    Args:
        check_interval_hours: How often to check (hours) for scheduled monitoring
        enable_scheduling: Enable automatic scheduled checks
        notification_email: Email address for notifications
        smtp_username: SMTP username (usually your email)
        smtp_password: SMTP password or app-specific password
        digest_format: Report format - 'brief', 'summary', or 'detailed'
        notify_on_critical: Send immediate alerts for critical updates
        notify_on_high: Send immediate alerts for high impact updates
        export_after_check: Auto-export to JSON/CSV after each check
        max_updates_per_competitor: Maximum updates to include per competitor
    
    Returns:
        Configuration confirmation with current settings
    """
    config = load_config()
    changes = []
    
    if check_interval_hours is not None:
        if check_interval_hours < 1:
            return "❌ Check interval must be at least 1 hour."
        config.check_interval_hours = check_interval_hours
        changes.append(f"Check interval: {check_interval_hours} hours")
    
    if enable_scheduling is not None:
        config.enable_scheduling = enable_scheduling
        changes.append(f"Scheduling: {'enabled' if enable_scheduling else 'disabled'}")
    
    if notification_email is not None:
        config.notification_email = notification_email
        changes.append(f"Notification email: {notification_email}")
    
    if smtp_username is not None:
        config.smtp_username = smtp_username
        changes.append(f"SMTP username: {smtp_username}")
    
    if smtp_password is not None:
        config.smtp_password = smtp_password
        changes.append("SMTP password: [updated]")
    
    if digest_format is not None:
        if digest_format not in ['brief', 'summary', 'detailed']:
            return "❌ Invalid format. Use: 'brief', 'summary', or 'detailed'"
        config.digest_format = digest_format
        changes.append(f"Report format: {digest_format}")
    
    if notify_on_critical is not None:
        config.notify_on_critical = notify_on_critical
        changes.append(f"Critical alerts: {'enabled' if notify_on_critical else 'disabled'}")
    
    if notify_on_high is not None:
        config.notify_on_high = notify_on_high
        changes.append(f"High impact alerts: {'enabled' if notify_on_high else 'disabled'}")
    
    if export_after_check is not None:
        config.export_after_check = export_after_check
        changes.append(f"Auto-export: {'enabled' if export_after_check else 'disabled'}")
    
    if max_updates_per_competitor is not None:
        if max_updates_per_competitor < 1:
            return "❌ Must allow at least 1 update per competitor."
        config.max_updates_per_competitor = max_updates_per_competitor
        changes.append(f"Max updates/competitor: {max_updates_per_competitor}")
    
    save_config(config)
    
    result = "⚙️ **Monitoring Configuration**\n\n"
    
    if changes:
        result += "**Updated Settings:**\n"
        for change in changes:
            result += f"- {change}\n"
        result += "\n---\n\n"
    
    result += "**Current Configuration:**\n\n"
    result += f"- **Check Interval:** {config.check_interval_hours} hours\n"
    result += f"- **Scheduled Monitoring:** {'✅ Enabled' if config.enable_scheduling else '❌ Disabled'}\n"
    result += f"- **Report Format:** {config.digest_format.title()}\n"
    result += f"- **Max Updates/Competitor:** {config.max_updates_per_competitor}\n"
    result += f"- **Auto-Export:** {'✅ Yes' if config.export_after_check else '❌ No'}\n\n"
    
    result += "**Email Notifications:**\n"
    if config.notification_email:
        result += f"- **Email:** {config.notification_email}\n"
        result += f"- **SMTP Server:** {config.smtp_server}:{config.smtp_port}\n"
        result += f"- **Critical Alerts:** {'✅' if config.notify_on_critical else '❌'}\n"
        result += f"- **High Impact Alerts:** {'✅' if config.notify_on_high else '❌'}\n"
    else:
        result += "- Not configured (set notification_email to enable)\n"
    
    result += "\n💡 **Email Setup Tip:** For Gmail, use an [App Password](https://myaccount.google.com/apppasswords)"
    
    return result

@FunctionTool
def export_competitor_summary(
    tool_context: "ToolContext",
    format: str = "markdown"
) -> str:
    """
    Export a summary report of all competitors and their trends.
    
    Great for sharing with team or creating documentation.
    
    Args:
        format: Export format - 'markdown' or 'json' (default: 'markdown')
    
    Returns:
        Path to exported summary
    """
    competitors = load_competitors()
    trends = load_trends()
    company_context = load_company_context()
    
    if not competitors:
        return "No competitors to summarize. Add competitors first."
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    if format.lower() == "markdown":
        # Create markdown summary
        summary = f"# Competitive Intelligence Summary\n\n"
        summary += f"**Company:** {company_context.company_name}\n"
        summary += f"**Generated:** {datetime.now().strftime('%B %d, %Y at %I:%M %p')}\n"
        summary += f"**Competitors Tracked:** {len(competitors)}\n\n"
        
        summary += "---\n\n"
        
        # Group by priority
        by_priority = {'High': [], 'Medium': [], 'Low': []}
        for comp in competitors:
            by_priority[comp.priority].append(comp)
        
        for priority in ['High', 'Medium', 'Low']:
            if by_priority[priority]:
                summary += f"## {priority} Priority Competitors\n\n"
                
                for comp in by_priority[priority]:
                    status = "✅ Active" if comp.enabled else "⏸️ Disabled"
                    summary += f"### {comp.name} ({status})\n\n"
                    summary += f"**Category:** {comp.category}\n"
                    
                    if comp.website_url:
                        summary += f"**Website:** {comp.website_url}\n"
                    if comp.rss_feed_url:
                        summary += f"**RSS:** {comp.rss_feed_url}\n"
                    
                    # Add trend data
                    comp_trends = TrendAnalyzer.get_competitor_trends(comp.name)
                    
                    if 'error' not in comp_trends:
                        summary += f"\n**Activity:**\n"
                        summary += f"- Total updates tracked: {comp_trends['total_updates']}\n"
                        summary += f"- Recent activity: {comp_trends['recent_activity']} updates\n"
                        summary += f"- Trend: {comp_trends['activity_trend'].title()}\n"
                        summary += f"- Average impact: {comp_trends['average_impact']:.1f}/4.0\n"
                        
                        if comp_trends.get('recent_focus'):
                            summary += f"\n**Recent focus areas:**\n"
                            for keyword, count in comp_trends['recent_focus'][:3]:
                                summary += f"- {keyword} ({count}x)\n"
                    
                    summary += "\n"
        
        # Save
        export_path = EXPORTS_DIR / f"competitor_summary_{timestamp}.md"
        with open(export_path, 'w', encoding='utf-8') as f:
            f.write(summary)
        
        return f"✅ **Summary exported**\n\n" + \
               f"**File:** `{export_path.name}`\n" + \
               f"**Format:** Markdown\n" + \
               f"**Competitors:** {len(competitors)}\n\n" + \
               f"Open in any markdown viewer or text editor."
    
    else:  # JSON
        summary_data = {
            'generated_at': datetime.now().isoformat(),
            'company': asdict(company_context),
            'competitors_summary': []
        }
        
        for comp in competitors:
            comp_trends = TrendAnalyzer.get_competitor_trends(comp.name)
            
            comp_summary = {
                'name': comp.name,
                'category': comp.category,
                'priority': comp.priority,
                'enabled': comp.enabled,
                'sources': {
                    'website': comp.website_url,
                    'rss': comp.rss_feed_url
                },
                'stats': comp_trends if 'error' not in comp_trends else {'error': 'No data'}
            }
            
            summary_data['competitors_summary'].append(comp_summary)
        
        export_path = EXPORTS_DIR / f"competitor_summary_{timestamp}.json"
        with open(export_path, 'w') as f:
            json.dump(summary_data, f, indent=2)
        
        return f"✅ **Summary exported to JSON**\n\n" + \
               f"**File:** `{export_path.name}`\n" + \
               f"**Competitors:** {len(competitors)}"
# Replace the export_intelligence_data function with this improved version:

@FunctionTool
def export_intelligence_data(
    tool_context: "ToolContext",
    format: str = "json",
    include_trends: bool = True,
    include_all_history: bool = False
) -> str:
    """
    Export intelligence data for external analysis or backup.
    
    Exports historical trend data and competitor configurations, not just latest findings.
    
    Args:
        format: Export format - 'json' or 'csv' (default: 'json')
        include_trends: Include historical trend data (default: True)
        include_all_history: Include full history vs recent only (default: False)
    
    Returns:
        Export confirmation with file path
    """
    logger.info("Preparing data export from historical records...")
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Load all available data
    competitors = load_competitors()
    trends = load_trends()
    config = load_config()
    company_context = load_company_context()
    
    if not competitors:
        return "No competitor data to export. Add competitors first using `add_competitor`."
    
    if format.lower() == "csv":
        # CSV export - create comprehensive data
        export_path = EXPORTS_DIR / f"intel_export_{timestamp}.csv"
        
        with open(export_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            
            # Header
            writer.writerow([
                'Competitor', 'Category', 'Priority', 'Status', 
                'Website', 'RSS Feed', 'Tags', 
                'Added Date', 'Last Checked',
                'Total Updates Tracked', 'Recent Activity', 
                'Average Impact', 'Activity Trend'
            ])
            
            # Export each competitor with their trend data
            for comp in competitors:
                comp_trends = TrendAnalyzer.get_competitor_trends(comp.name)
                
                total_updates = comp_trends.get('total_updates', 0) if 'error' not in comp_trends else 0
                recent_activity = comp_trends.get('recent_activity', 0) if 'error' not in comp_trends else 0
                avg_impact = comp_trends.get('average_impact', 0) if 'error' not in comp_trends else 0
                activity_trend = comp_trends.get('activity_trend', 'N/A') if 'error' not in comp_trends else 'N/A'
                
                writer.writerow([
                    comp.name,
                    comp.category,
                    comp.priority,
                    'Active' if comp.enabled else 'Disabled',
                    comp.website_url or '',
                    comp.rss_feed_url or '',
                    ', '.join(comp.tags) if comp.tags else '',
                    comp.added_at[:10] if comp.added_at else '',
                    comp.last_checked[:10] if comp.last_checked else 'Never',
                    total_updates,
                    recent_activity,
                    f"{avg_impact:.2f}" if avg_impact else '0',
                    activity_trend
                ])
        
        result = f"✅ **Data exported to CSV**\n\n"
        result += f"**File:** `{export_path.name}`\n"
        result += f"**Location:** `{export_path}`\n"
        result += f"**Competitors:** {len(competitors)}\n"
        result += f"**Enabled:** {sum(1 for c in competitors if c.enabled)}\n\n"
        result += "CSV includes competitor configurations and trend summaries.\n"
        result += "Open in Excel, Google Sheets, or any spreadsheet tool."
        
        return result
    
    else:  # JSON format
        # Build comprehensive export package
        export_data = {
            'exported_at': datetime.now().isoformat(),
            'export_version': '12.0',
            'company_context': asdict(company_context),
            'monitoring_config': asdict(config),
            'competitors': {
                'total': len(competitors),
                'enabled': sum(1 for c in competitors if c.enabled),
                'list': [asdict(comp) for comp in competitors]
            }
        }
        
        # Add trend data if requested
        if include_trends and trends:
            if include_all_history:
                export_data['trends'] = trends
            else:
                # Export only recent history (last 20 entries per competitor)
                recent_trends = {}
                for comp_name, comp_data in trends.items():
                    recent_trends[comp_name] = {
                        'history': comp_data.get('history', [])[-20:],
                        'impact_counts': comp_data.get('impact_counts', {}),
                        'feature_mentions': dict(list(comp_data.get('feature_mentions', {}).items())[:50])
                    }
                export_data['trends'] = recent_trends
        
        # Add statistics
        export_data['statistics'] = {
            'total_competitors': len(competitors),
            'competitors_with_history': len([c for c in competitors if c.name in trends]),
            'total_updates_tracked': sum(
                len(trends.get(c.name, {}).get('history', [])) 
                for c in competitors
            ),
            'last_check': max(
                (c.last_checked for c in competitors if c.last_checked),
                default='Never'
            )
        }
        
        # Save JSON
        export_path = EXPORTS_DIR / f"intel_export_{timestamp}.json"
        with open(export_path, 'w') as f:
            json.dump(export_data, f, indent=2)
        
        result = f"✅ **Data exported to JSON**\n\n"
        result += f"**File:** `{export_path.name}`\n"
        result += f"**Location:** `{export_path}`\n\n"
        
        result += "**Exported Data:**\n"
        result += f"- Competitors: {len(competitors)} ({export_data['competitors']['enabled']} active)\n"
        result += f"- Total updates tracked: {export_data['statistics']['total_updates_tracked']}\n"
        
        if include_trends:
            result += f"- Historical trends: {len([c for c in competitors if c.name in trends])} competitors\n"
            result += f"- History depth: {'Full' if include_all_history else 'Recent (last 20 updates)'}\n"
        
        result += f"- Company context: {company_context.company_name}\n"
        result += f"- Monitoring config: Included\n\n"
        
        result += "JSON format includes:\n"
        result += "- Complete competitor configurations\n"
        result += "- Historical trend analysis\n"
        result += "- Company context settings\n"
        result += "- Monitoring configuration\n"
        result += "- Summary statistics\n\n"
        
        result += "This export can be:\n"
        result += "- Imported into other tools\n"
        result += "- Used for backup/restore\n"
        result += "- Analyzed programmatically\n"
        result += "- Shared with team members"
        
        return result

@FunctionTool
def view_reports_history(tool_context: "ToolContext", limit: int = 10) -> str:
    """
    View history of generated intelligence reports.
    
    Args:
        limit: Number of recent reports to show (default: 10, max: 50)
    
    Returns:
        List of recent reports with metadata and quick stats
    """
    limit = min(limit, 50)  # Cap at 50
    
    reports = sorted(
        REPORTS_DIR.glob("intel_report_*.md"),
        key=lambda p: p.stat().st_mtime,
        reverse=True
    )
    
    if not reports:
        return "📚 **No reports found**\n\n" + \
               "Run `run_intelligence_check` to generate your first competitive intelligence report."
    
    result = f"# 📚 Report History\n\n"
    result += f"**Total Reports:** {len(reports)}\n\n"
    
    for i, report_path in enumerate(reports[:limit], 1):
        stat = report_path.stat()
        timestamp = datetime.fromtimestamp(stat.st_mtime)
        size_kb = stat.st_size / 1024
        
        # Try to extract key info from report
        try:
            with open(report_path, 'r', encoding='utf-8') as f:
                content = f.read()
                # Count competitors mentioned
                comp_count = content.count('###') - content.count('####')
                
        except:
            comp_count = "?"
        
        result += f"## {i}. {report_path.name}\n\n"
        result += f"- **Generated:** {timestamp.strftime('%B %d, %Y at %I:%M %p')}\n"
        result += f"- **Size:** {size_kb:.1f} KB\n"
        result += f"- **Competitors:** ~{comp_count}\n"
        result += f"- **Path:** `{report_path}`\n\n"
    
    if len(reports) > limit:
        result += f"\n*Showing {limit} of {len(reports)} reports. Increase limit parameter to see more.*\n"
    
    result += "\n---\n\n"
    result += "💡 **Tips:**\n"
    result += "- Reports are saved as Markdown files for easy reading\n"
    result += "- You can open them in any text editor or Markdown viewer\n"
    result += "- Reports include collapsible sections for detailed information\n"
    
    return result

@FunctionTool
def compare_competitors(
    competitor1: str,
    competitor2: str,
    tool_context: "ToolContext"
) -> str:
    """
    Compare two competitors side-by-side based on their trends and recent activity.
    
    Args:
        competitor1: Name of first competitor
        competitor2: Name of second competitor
    
    Returns:
        Side-by-side comparison analysis
    """
    trends1 = TrendAnalyzer.get_competitor_trends(competitor1)
    trends2 = TrendAnalyzer.get_competitor_trends(competitor2)
    
    if 'error' in trends1:
        return f"❌ No historical data for '{competitor1}'. Check the name or monitor them first."
    if 'error' in trends2:
        return f"❌ No historical data for '{competitor2}'. Check the name or monitor them first."
    
    report = f"# ⚖️ Competitor Comparison\n\n"
    report += f"## {competitor1} vs {competitor2}\n\n"
    
    # Activity comparison
    report += "### Activity Levels\n\n"
    report += f"| Metric | {competitor1} | {competitor2} |\n"
    report += f"|--------|{'-'*len(competitor1)}--|{'-'*len(competitor2)}--|\n"
    report += f"| Total Updates | {trends1['total_updates']} | {trends2['total_updates']} |\n"
    report += f"| Recent Activity | {trends1['recent_activity']} | {trends2['recent_activity']} |\n"
    report += f"| Trend | {trends1['activity_trend'].title()} | {trends2['activity_trend'].title()} |\n"
    report += f"| Avg Impact | {trends1['average_impact']:.1f}/4.0 | {trends2['average_impact']:.1f}/4.0 |\n\n"
    
    # Impact distribution
    report += "### Impact Distribution\n\n"
    report += f"**{competitor1}:**\n"
    for impact, count in trends1['impact_distribution'].items():
        emoji = ReportGenerator._get_impact_emoji(impact)
        report += f"{emoji} {impact}: {count} "
    report += "\n\n"
    
    report += f"**{competitor2}:**\n"
    for impact, count in trends2['impact_distribution'].items():
        emoji = ReportGenerator._get_impact_emoji(impact)
        report += f"{emoji} {impact}: {count} "
    report += "\n\n"
    
    # Focus areas
    report += "### Recent Focus Areas\n\n"
    report += f"**{competitor1}:**\n"
    if trends1['recent_focus']:
        for keyword, count in trends1['recent_focus'][:5]:
            report += f"- {keyword} ({count}x)\n"
    else:
        report += "- No recent focus data\n"
    report += "\n"
    
    report += f"**{competitor2}:**\n"
    if trends2['recent_focus']:
        for keyword, count in trends2['recent_focus'][:5]:
            report += f"- {keyword} ({count}x)\n"
    else:
        report += "- No recent focus data\n"
    report += "\n"
    
    # Analysis
    report += "### Comparative Analysis\n\n"
    
    more_active = competitor1 if trends1['total_updates'] > trends2['total_updates'] else competitor2
    higher_impact = competitor1 if trends1['average_impact'] > trends2['average_impact'] else competitor2
    
    report += f"- **More Active:** {more_active}\n"
    report += f"- **Higher Average Impact:** {higher_impact}\n"
    
    if trends1['activity_trend'] == 'increasing' and trends2['activity_trend'] != 'increasing':
        report += f"- **Momentum:** {competitor1} is gaining momentum\n"
    elif trends2['activity_trend'] == 'increasing' and trends1['activity_trend'] != 'increasing':
        report += f"- **Momentum:** {competitor2} is gaining momentum\n"
    
    report += "\n💡 Use this comparison to prioritize which competitor requires closer monitoring."
    
    return report

@FunctionTool
def reset_cache(tool_context: "ToolContext", confirm: bool = False) -> str:
    """
    Reset the content cache to establish a new baseline.
    
    WARNING: All content will be considered "new" on the next check, which may result
    in a large number of updates being reported.
    
    Args:
        confirm: Set to True to confirm reset (safety check)
    
    Returns:
        Confirmation message
    """
    if not confirm:
        return "⚠️ **Confirm Cache Reset**\n\n" + \
               "This will clear the cache and treat all competitor content as new.\n\n" + \
               "**Impact:**\n" + \
               "- Next check may report many updates\n" + \
               "- Useful after long periods of inactivity\n" + \
               "- Historical trend data is preserved\n\n" + \
               "To confirm, use: `reset_cache(confirm=True)`"
    
    cache = load_cache()
    entries_count = len(cache)
    
    cache.clear()
    save_cache(cache)
    
    logger.info("Cache reset by user")
    
    return f"✅ **Cache reset complete**\n\n" + \
           f"Cleared {entries_count} cache entries.\n\n" + \
           "All competitor content will be treated as new on the next intelligence check.\n" + \
           "Historical trend data has been preserved."

@FunctionTool
def get_status(tool_context: "ToolContext") -> str:
    """
    Get comprehensive system status, statistics, and health check.
    
    Returns:
        Detailed system status information
    """
    competitors = load_competitors()
    config = load_config()
    cache = load_cache()
    reports = list(REPORTS_DIR.glob("intel_report_*.md"))
    trends = load_trends()
    
    enabled_count = sum(1 for c in competitors if c.enabled)
    
    # Count by priority
    priority_counts = {'High': 0, 'Medium': 0, 'Low': 0}
    for comp in competitors:
        priority_counts[comp.priority] += 1
    
    status = "# 🎯 IntelTracker System Status\n\n"
    status += f"**Version:** 12.0 Production Ready\n"
    status += f"**AI Engine:** {'✅ Gemini 2.5 Flash' if GEMINI_AVAILABLE else '⚠️ Rule-based (Gemini unavailable)'}\n"
    status += f"**Status:** {'🟢 Operational' if enabled_count > 0 else '🟡 No active competitors'}\n\n"
    
    status += "## 📊 Monitoring Overview\n\n"
    status += f"- **Total Competitors:** {len(competitors)}\n"
    status += f"  - 🔴 High Priority: {priority_counts['High']}\n"
    status += f"  - 🟡 Medium Priority: {priority_counts['Medium']}\n"
    status += f"  - 🟢 Low Priority: {priority_counts['Low']}\n"
    status += f"- **Active Monitoring:** {enabled_count} competitors\n"
    status += f"- **Disabled:** {len(competitors) - enabled_count}\n"
    status += f"- **Cache Entries:** {len(cache)}\n"
    status += f"- **Trend Histories:** {len(trends)}\n\n"
    
    status += "## ⚙️ Configuration\n\n"
    status += f"- **Check Interval:** {config.check_interval_hours} hours\n"
    status += f"- **Scheduled Monitoring:** {'✅ Enabled' if config.enable_scheduling else '❌ Disabled'}\n"
    status += f"- **Report Format:** {config.digest_format.title()}\n"
    status += f"- **Max Updates/Competitor:** {config.max_updates_per_competitor}\n"
    status += f"- **Auto-Export:** {'✅ Enabled' if config.export_after_check else '❌ Disabled'}\n"
    status += f"- **Rate Limiting:** {config.rate_limit_seconds}s between checks\n\n"
    
    status += "## 📧 Notifications\n\n"
    if config.notification_email:
        status += f"- **Email:** {config.notification_email}\n"
        status += f"- **Critical Alerts:** {'✅' if config.notify_on_critical else '❌'}\n"
        status += f"- **High Impact Alerts:** {'✅' if config.notify_on_high else '❌'}\n"
    else:
        status += "- ❌ Not configured\n"
        status += "- Use `configure_monitoring` to set up email notifications\n"
    status += "\n"
    
    status += "## 📚 Reports & Data\n\n"
    status += f"- **Total Reports:** {len(reports)}\n"
    
    if reports:
        latest = max(reports, key=lambda p: p.stat().st_mtime)
        latest_time = datetime.fromtimestamp(latest.stat().st_mtime)
        status += f"- **Latest Report:** {latest_time.strftime('%B %d at %I:%M %p')}\n"
        
        total_size = sum(r.stat().st_size for r in reports) / 1024
        status += f"- **Total Report Size:** {total_size:.1f} KB\n"
    
    if 'last_check' in tool_context.state:
        last_check = datetime.fromisoformat(tool_context.state['last_check'])
        time_since = datetime.now() - last_check
        
        status += f"- **Last Check:** {last_check.strftime('%B %d at %I:%M %p')}\n"
        status += f"- **Time Since:** {time_since.days}d {time_since.seconds//3600}h ago\n"
        status += f"- **Last Findings:** {tool_context.state.get('last_findings_count', 0)} updates\n"
    else:
        status += "- **Last Check:** Never (run `run_intelligence_check` to start)\n"
    
    status += "\n## 💾 Storage\n\n"
    status += f"- **Data Directory:** `{DATA_DIR}`\n"
    status += f"- **Reports Directory:** `{REPORTS_DIR}`\n"
    status += f"- **Exports Directory:** `{EXPORTS_DIR}`\n"
    status += f"- **Log File:** `{LOG_FILE}`\n\n"
    
    status += "## 🔧 Quick Actions\n\n"
    status += "- `run_intelligence_check()` - Check all competitors now\n"
    status += "- `list_competitors()` - View tracking list\n"
    status += "- `configure_monitoring()` - Adjust settings\n"
    status += "- `view_reports_history()` - Browse past reports\n"
    
    if not GEMINI_AVAILABLE:
        status += "\n⚠️ **Note:** Gemini API not available. Using rule-based analysis.\n"
        status += "Set `GEMINI_API_KEY` environment variable for AI-powered analysis."
    
    return status

# --- Agent Definition ---
root_agent = LlmAgent(
    name="intel_tracker",
    model="gemini-2.5-flash",
    instruction="""You are IntelTracker, an elite competitive intelligence assistant for startups and businesses.

# YOUR CORE MISSION
Transform raw competitor data into strategic competitive advantage. You're not just a monitoring tool—you're a strategic advisor that helps businesses make smarter decisions based on what their competitors are doing.

# COMPANY-CALIBRATED INTELLIGENCE
CRITICAL: Always frame insights from the user's company perspective:
- Analyze threats to THEIR unique value proposition
- Identify opportunities THEY can exploit
- Recommend actions aligned with THEIR strategic goals
- Consider THEIR market position and stage (Startup/Growth/Established)

On first interaction, if company context isn't configured, proactively ask the user to set it up for personalized analysis.

# YOUR CAPABILITIES

**Intelligence Gathering:**
- Multi-source monitoring (websites, RSS, social media, press releases)
- AI-powered analysis using Gemini 2.5 Flash
- Real-time and scheduled monitoring
- Smart content extraction with fallback strategies

**Strategic Analysis:**
- Competitive threat assessment (Critical/High/Medium/Low)
- Trend identification and pattern recognition
- Side-by-side competitor comparisons
- Historical activity tracking

**Actionable Reporting:**
- Multiple report formats (brief/summary/detailed)
- Email alerts for high-impact updates
- Data exports (JSON/CSV/Markdown)
- Visual dashboards via web interface

# COMMUNICATION PRINCIPLES

**Be Strategic, Not Tactical:**
- Don't just report what happened—explain WHY it matters
- Connect competitor moves to business implications
- Prioritize insights by strategic impact
- Frame everything in terms of competitive advantage

**Be Proactive:**
- Suggest monitoring adjustments based on activity patterns
- Highlight emerging trends before they become obvious
- Recommend specific actions the user should take
- Warn about potential threats early

**Be Clear and Actionable:**
- Use plain language, not jargon
- Provide specific next steps
- Categorize by impact level
- Include confidence scores when available

**Be Context-Aware:**
- Remember the user's company stage and goals
- Adjust recommendations to their resources
- Consider their competitive positioning
- Tailor analysis depth to their needs

# PRIMARY WORKFLOWS

**1. Daily Intelligence Briefing:**
User: "Check competitors" or "What's new?"
→ Run intelligence check
→ Summarize key findings by impact level
→ Highlight top 3 actionable insights
→ Suggest follow-up actions

**2. Deep Dive Analysis:**
User: "Analyze [Competitor]" or "What's [Company] up to?"
→ Check single competitor
→ Review historical trends
→ Identify strategic patterns
→ Provide competitive positioning assessment

**3. Strategic Comparison:**
User: "Compare [A] and [B]"
→ Run side-by-side comparison
→ Analyze relative strengths/weaknesses
→ Identify differentiation opportunities
→ Recommend competitive strategy

**4. Competitor Onboarding:**
User: "Track [Company]"
→ Gather available information
→ Find RSS feeds and sources
→ Set appropriate priority level
→ Run initial baseline check

**5. Export and Reporting:**
User: "Export data" or "Generate report"
→ Confirm desired format
→ Generate comprehensive export
→ Provide access instructions

# INTELLIGENT BEHAVIOR PATTERNS

**When Updates Are Found:**
- Lead with highest-impact findings
- Group related updates together
- Explain competitive implications
- Recommend specific responses
- Update trend analysis

**When No Updates Found:**
- Confirm monitoring is working
- Suggest checking specific competitors
- Review monitoring frequency
- Verify RSS feeds are active
- Don't apologize—this is normal

**When Trends Emerge:**
- Proactively highlight patterns
- Explain significance
- Compare to historical data
- Predict potential next moves
- Recommend preemptive actions

**When Configuration Needed:**
- Explain benefits clearly
- Provide setup examples
- Guide through process
- Test configuration
- Confirm everything works

# ERROR HANDLING & EDGE CASES

**Extraction Failures:**
- Explain what happened clearly
- Suggest RSS feed as alternative
- Offer manual review guidance
- Try search fallback if available

**Missing Data:**
- Work with available information
- Note confidence limitations
- Suggest data collection improvements
- Don't speculate beyond evidence

**Ambiguous Requests:**
- Ask clarifying questions
- Offer specific options
- Explain what each choice does
- Default to most useful interpretation

# ADVANCED FEATURES TO LEVERAGE

**Trend Analysis:**
- Use `view_competitor_trends()` to spot patterns
- Compare activity levels over time
- Identify focus area shifts
- Track impact distributions

**Email Notifications:**
- Encourage setup for critical alerts
- Test configuration proactively
- Explain Gmail app password process
- Suggest notification preferences

**Scheduled Monitoring:**
- Recommend appropriate intervals
- Adjust based on competitor activity
- Balance freshness vs. noise
- Optimize for user's workflow

**Data Exports:**
- Suggest exports for sharing with team
- Recommend formats for different uses
- Explain export contents
- Provide backup recommendations

# AVAILABLE TOOLS REFERENCE

**Core Monitoring:**
- `run_intelligence_check()` - Check all competitors
- `check_single_competitor()` - Deep dive on one
- `view_competitor_trends()` - Historical analysis

**Competitor Management:**
- `add_competitor()` - Add new tracking target
- `list_competitors()` - View all tracked
- `toggle_competitor()` - Enable/disable
- `remove_competitor()` - Delete from tracking

**Analysis & Comparison:**
- `compare_competitors()` - Side-by-side analysis
- `view_reports_history()` - Past intelligence reports

**Configuration:**
- `configure_company_context()` - Set user's company info
- `view_company_context()` - View current context
- `configure_monitoring()` - Adjust monitoring settings
- `configure_email_notifications()` - Setup alerts
- `test_email_notification()` - Test email config

**Export & Data:**
- `export_intelligence_data()` - Export JSON/CSV
- `export_competitor_summary()` - Export summary
- `export_full_report()` - Export complete report
- `get_status()` - System health check
- `reset_cache()` - Fresh baseline

# PERSONALITY & TONE

You are:
- **Professional** but not corporate
- **Insightful** but not overwhelming
- **Proactive** but not pushy
- **Confident** but acknowledge uncertainty
- **Strategic** but practical

You are NOT:
- A passive data collector
- A yes-person who agrees with everything
- A feature list reciter
- A helpdesk robot

# SUCCESS METRICS

You succeed when:
- Users make better competitive decisions
- Strategic insights lead to action
- Time is saved vs. manual monitoring
- Threats are identified early
- Opportunities are captured

You fail when:
- Users are overwhelmed with data
- Insights lack actionable next steps
- Important signals are missed
- Users don't understand implications

Remember: You're not just tracking competitors—you're providing competitive intelligence that drives strategic advantage.""",
    tools=[
        run_intelligence_check,
        check_single_competitor,
        view_competitor_trends,
        compare_competitors,
        add_competitor,
        list_competitors,
        toggle_competitor,
        remove_competitor,
        configure_company_context,
        view_company_context,
        configure_monitoring,
        configure_email_notifications,
        test_email_notification,
        export_intelligence_data,
        export_competitor_summary,
        export_full_report,
        view_reports_history,
        get_status,
        reset_cache,
    ],
)

# --- Scheduled Monitoring (Optional) ---
def scheduled_check():
    """Run scheduled intelligence check."""
    logger.info("Running scheduled check...")
    try:
        engine = MonitoringEngine()
        findings = engine.monitor_all()
        
        if findings:
            config = load_config()
            report = ReportGenerator.generate_digest(findings, config.digest_format)
            ReportGenerator.save_report(report)
            
            # Send email if configured
            if config.notification_email:
                notifier = EmailNotifier(config)
                notifier.send_digest(report, len(findings))
            
            logger.info(f"Scheduled check complete: {len(findings)} findings")
        else:
            logger.info("Scheduled check complete: No new findings")
            
    except Exception as e:
        logger.error(f"Scheduled check failed: {e}", exc_info=True)

def start_scheduler():
    """Start background scheduler if enabled."""
    config = load_config()
    
    if not config.enable_scheduling:
        return
    
    logger.info(f"Starting scheduler: checks every {config.check_interval_hours} hours")
    
    schedule.every(config.check_interval_hours).hours.do(scheduled_check)
    
    def run_scheduler():
        while True:
            schedule.run_pending()
            time.sleep(60)  # Check every minute
    
    scheduler_thread = threading.Thread(target=run_scheduler, daemon=True)
    scheduler_thread.start()

# --- Main Execution ---
if __name__ == "__main__":
    print("=" * 70)
    print("🎯 IntelTracker v12.0 - Production-Ready Competitive Intelligence")
    print("=" * 70)
    print()
    
    # Initialize
    config = load_config()
    competitors = load_competitors()
    
    # Status overview
    enabled_count = sum(1 for c in competitors if c.enabled)
    print(f"📊 Tracking: {len(competitors)} competitors ({enabled_count} active)")
    print(f"⚙️  AI Engine: {'Gemini 2.5 Flash ✅' if GEMINI_AVAILABLE else 'Rule-based ⚠️'}")
    print(f"📝 Report Format: {config.digest_format.title()}")
    
    if config.notification_email:
        print(f"📧 Notifications: {config.notification_email}")
    
    print()
    print("-" * 70)
    print()
    
    # Run intelligence check
    print("🔍 Running intelligence check...\n")
    
    try:
        engine = MonitoringEngine()
        findings = engine.monitor_all()
        
        if findings:
            print()
            print("=" * 70)
            print(f"📊 Found {len(findings)} competitor update(s)")
            print("=" * 70)
            print()
            
            # Generate and save report
            report = ReportGenerator.generate_digest(findings, config.digest_format)
            report_path = ReportGenerator.save_report(report)
            
            # Export if configured
            if config.export_after_check:
                ExportManager.export_to_json(findings)
                print(f"💾 Exported to JSON")
            
            # Display report
            print(report)
            print()
            print("=" * 70)
            print(f"✅ Report saved: {report_path}")
            
            # Send email if configured
            if config.notification_email:
                notifier = EmailNotifier(config)
                if notifier.send_digest(report, len(findings)):
                    print(f"📧 Report emailed to {config.notification_email}")
                else:
                    print("⚠️  Email sending failed")
        else:
            print("✅ No new updates detected")
            print()
            print("All competitors have been checked. No new activity since last check.")
        
        print()
        print("-" * 70)
        
        # Start scheduler if enabled
        if config.enable_scheduling:
            print(f"\n⏰ Scheduler enabled: Will check every {config.check_interval_hours} hours")
            print("Press Ctrl+C to stop...\n")
            start_scheduler()
            
            try:
                while True:
                    time.sleep(1)
            except KeyboardInterrupt:
                print("\n\n👋 Scheduler stopped")
        else:
            print("\n💡 Tip: Use ADK to interact conversationally with IntelTracker")
            print("   Or enable scheduling with: configure_monitoring(enable_scheduling=True)")
        
    except KeyboardInterrupt:
        print("\n\n👋 Exiting IntelTracker")
    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
        print(f"\n❌ Error: {e}")
        print("Check the log file for details: {LOG_FILE}")
    
    print("\n" + "=" * 70)
    print("🚀 IntelTracker ready for use!")
    print("=" * 70)
