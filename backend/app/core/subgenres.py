HOUSE_SUBGENRES: dict[str, list[str]] = {
    "deep_house": [
        "deep house mix",
        "deep house music",
        "deep house 2024",
        "best deep house",
        "deep house playlist",
        "deep house dj set",
        "deep house lounge",
    ],
    "tech_house": [
        "tech house mix",
        "tech house music",
        "tech house 2024",
        "best tech house",
        "tech house dj set",
        "tech house playlist",
        "tech house underground",
    ],
    "afro_house": [
        "afro house mix",
        "afro house music",
        "afro house 2024",
        "best afro house",
        "afro house dj set",
        "afro house playlist",
        "afro house dance",
    ],
    "melodic_house": [
        "melodic house mix",
        "melodic house and techno",
        "melodic house 2024",
        "melodic techno mix",
        "melodic house dj set",
        "melodic house playlist",
    ],
    "progressive_house": [
        "progressive house mix",
        "progressive house music",
        "progressive house 2024",
        "progressive house dj set",
        "progressive house playlist",
    ],
    "minimal_house": [
        "minimal house mix",
        "minimal techno mix",
        "minimal house 2024",
        "minimal deep tech",
        "minimal house dj set",
    ],
    "organic_house": [
        "organic house mix",
        "organic house music",
        "organic house 2024",
        "organic house dj set",
        "organic house downtempo",
    ],
    "house_classics": [
        "classic house mix",
        "90s house music",
        "old school house",
        "classic house music",
        "house classics playlist",
        "chicago house mix",
        "new york house music",
    ],
    "latin_house": [
        "latin house mix",
        "latin house music",
        "latin tech house",
        "brazilian house mix",
        "latin house 2024",
    ],
    "soulful_house": [
        "soulful house mix",
        "soulful house music",
        "soulful deep house",
        "soulful house 2024",
        "soulful house vocal",
        "gospel house mix",
    ],
    "jackin_house": [
        "jackin house mix",
        "jackin house music",
        "jackin house 2024",
        "bass house mix",
        "funky house mix",
        "jackin house dj set",
    ],
    "house_general": [
        "house music mix",
        "house music 2024",
        "house dj set",
        "house music playlist",
        "best house music",
        "house music new releases",
        "underground house mix",
        "house music live set",
        "ibiza house mix",
        "summer house mix",
        "house music radio",
    ],
    "jazzy_house": [
        "jazzy house mix",
        "jazzy house music",
        "jazzy deep house",
        "jazz house 2024",
        "jazzy house dj set",
        "jazzy house playlist",
        "jazz house lounge",
    ],
}


def get_keywords_for_subgenres(selected: list[str]) -> list[str]:
    """Return flat list of keywords for selected subgenres."""
    keywords = []
    for subgenre in selected:
        if subgenre in HOUSE_SUBGENRES:
            keywords.extend(HOUSE_SUBGENRES[subgenre])
    return keywords


def get_all_subgenres() -> list[dict]:
    """Return subgenre list with keyword counts."""
    return [
        {"id": key, "name": key.replace("_", " ").title(), "keyword_count": len(words)}
        for key, words in HOUSE_SUBGENRES.items()
    ]
