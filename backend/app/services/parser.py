import re

# Professional email domains
PRO_DOMAINS = {
    "gmail.com", "outlook.com", "hotmail.com", "yahoo.com", "icloud.com",
    "protonmail.com", "zoho.com", "aol.com", "mail.com", "gmx.com",
    "yandex.com", "live.com", "msn.com",
}

# Submit / demo form patterns
SUBMIT_PATTERNS = [
    r"submit(?:hub)?\.com",
    r"toneden\.io",
    r"labelradar\.com",
    r"dailyplaylists\.com",
    r"disco\.ac",
    r"forms?\.gle",
    r"bit\.ly",
    r"linktr\.ee",
    r"hyperfollow",
    r"distrokid\.com",
    r"soundcloud\.com/[\w-]+/(?:submit|demo)",
    r"(?:google|docs\.google)\.com/forms",
]

# Social link patterns
SOCIAL_PATTERNS = {
    "instagram": r"(?:instagram\.com|instagr\.am)/([\w.]+)",
    "soundcloud": r"soundcloud\.com/([\w-]+)",
    "spotify": r"open\.spotify\.com/(?:artist|user)/([\w]+)",
    "twitter": r"(?:twitter\.com|x\.com)/([\w]+)",
    "facebook": r"facebook\.com/([\w.]+)",
    "tiktok": r"tiktok\.com/@([\w.]+)",
    "beatport": r"beatport\.com/artist/([\w-]+)",
    "bandcamp": r"([\w-]+)\.bandcamp\.com",
}

# Email regex
EMAIL_RE = re.compile(
    r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}",
    re.IGNORECASE,
)

# URL regex
URL_RE = re.compile(r"https?://[^\s<>\"'\)]+", re.IGNORECASE)


class ChannelParser:
    """Parse channel description to extract emails, social links, submit forms."""

    @staticmethod
    def parse(description: str) -> dict:
        if not description:
            return {
                "emails_pro": [],
                "emails_personal": [],
                "social_links": {},
                "has_submit_form": False,
                "submit_urls": [],
            }

        text = description.lower()

        # Extract emails
        all_emails = list(set(EMAIL_RE.findall(description)))
        # Filter out image/media extensions
        all_emails = [
            e for e in all_emails
            if not e.endswith((".jpg", ".png", ".gif", ".jpeg", ".webp", ".svg"))
        ]

        emails_pro = []
        emails_personal = []
        for email in all_emails:
            domain = email.split("@")[1].lower()
            if domain in PRO_DOMAINS:
                emails_personal.append(email.lower())
            else:
                emails_pro.append(email.lower())

        # Extract URLs
        all_urls = URL_RE.findall(description)

        # Detect submit / demo forms
        submit_urls = []
        for url in all_urls:
            for pattern in SUBMIT_PATTERNS:
                if re.search(pattern, url, re.IGNORECASE):
                    submit_urls.append(url)
                    break

        # Also check text for submit keywords without URLs
        has_submit_form = bool(submit_urls) or any(
            kw in text
            for kw in ["submit your", "send demo", "send your demo", "demo submission", "submit music"]
        )

        # Extract social links
        social_links = {}
        for platform, pattern in SOCIAL_PATTERNS.items():
            match = re.search(pattern, description, re.IGNORECASE)
            if match:
                social_links[platform] = match.group(0)

        return {
            "emails_pro": emails_pro,
            "emails_personal": emails_personal,
            "social_links": social_links,
            "has_submit_form": has_submit_form,
            "submit_urls": list(set(submit_urls)),
        }

    @staticmethod
    def detect_subgenres(title: str, description: str) -> list[str]:
        """Detect which house subgenres this channel covers."""
        text = f"{title} {description}".lower()
        detected = []

        subgenre_keywords = {
            "Deep House": ["deep house", "deephouse"],
            "Tech House": ["tech house", "techhouse"],
            "Afro House": ["afro house", "afrohouse"],
            "Melodic House": ["melodic house", "melodic techno"],
            "Progressive House": ["progressive house"],
            "Minimal": ["minimal house", "minimal techno", "minimal tech"],
            "Organic House": ["organic house", "downtempo house"],
            "House Classics": ["classic house", "old school house", "90s house", "chicago house"],
            "Latin House": ["latin house", "brazilian house", "latin tech"],
            "Soulful House": ["soulful house", "gospel house", "vocal house"],
            "Jackin House": ["jackin house", "bass house", "funky house", "g-house"],
            "Jazzy House": ["jazzy house", "jazz house", "jazzy deep house"],
        }

        for genre, keywords in subgenre_keywords.items():
            if any(kw in text for kw in keywords):
                detected.append(genre)

        # Fallback: if nothing detected but has generic house keywords
        if not detected:
            generic = ["house music", "house mix", "house dj", "dj set", "dj mix"]
            if any(kw in text for kw in generic):
                detected.append("House")

        return detected
