import math


class ChannelScorer:
    """Score a YouTube channel for curator quality (0-100)."""

    # Weights (sum = 1.0)
    WEIGHTS = {
        "subscriber_score": 0.15,
        "engagement_score": 0.15,
        "email_score": 0.25,
        "description_quality": 0.15,
        "subgenre_score": 0.10,
        "activity_score": 0.10,
        "submit_score": 0.10,
    }

    @staticmethod
    def score(channel_data: dict) -> tuple[int, str]:
        """
        Score a channel and return (score, tier).

        channel_data keys:
            subscriber_count, video_count, view_count,
            emails_pro, emails_personal, description,
            subgenres, has_submit_form, social_links
        """
        scores = {}

        # 1. Subscriber score: sweet spot 1K-500K (not too small, not mainstream)
        subs = channel_data.get("subscriber_count", 0)
        if subs < 100:
            scores["subscriber_score"] = 0.1
        elif subs < 1_000:
            scores["subscriber_score"] = 0.3
        elif subs < 10_000:
            scores["subscriber_score"] = 0.7
        elif subs < 50_000:
            scores["subscriber_score"] = 1.0
        elif subs < 200_000:
            scores["subscriber_score"] = 0.9
        elif subs < 500_000:
            scores["subscriber_score"] = 0.7
        else:
            scores["subscriber_score"] = 0.5

        # 2. Engagement: views-per-video ratio
        videos = channel_data.get("video_count", 0)
        views = channel_data.get("view_count", 0)
        if videos > 0:
            avg_views = views / videos
            if avg_views > 100_000:
                scores["engagement_score"] = 1.0
            elif avg_views > 10_000:
                scores["engagement_score"] = 0.8
            elif avg_views > 1_000:
                scores["engagement_score"] = 0.6
            elif avg_views > 100:
                scores["engagement_score"] = 0.3
            else:
                scores["engagement_score"] = 0.1
        else:
            scores["engagement_score"] = 0.0

        # 3. Email score: having contactable email = massive bonus
        pro_emails = channel_data.get("emails_pro", [])
        personal_emails = channel_data.get("emails_personal", [])
        if pro_emails:
            scores["email_score"] = 1.0
        elif personal_emails:
            scores["email_score"] = 0.7
        else:
            scores["email_score"] = 0.0

        # 4. Description quality: length + keywords
        desc = channel_data.get("description", "") or ""
        desc_lower = desc.lower()
        quality = 0.0

        # Length bonus
        if len(desc) > 500:
            quality += 0.3
        elif len(desc) > 200:
            quality += 0.2
        elif len(desc) > 50:
            quality += 0.1

        # Curator keywords
        curator_keywords = [
            "playlist", "mix", "dj set", "promotion", "promo", "submit",
            "demo", "booking", "label", "record", "curator", "channel",
            "music promotion", "house music", "deep house", "tech house",
        ]
        kw_count = sum(1 for kw in curator_keywords if kw in desc_lower)
        quality += min(kw_count * 0.1, 0.7)
        scores["description_quality"] = min(quality, 1.0)

        # 5. Subgenre specificity: more specific = better curator
        subgenres = channel_data.get("subgenres", [])
        if len(subgenres) >= 3:
            scores["subgenre_score"] = 0.7  # Too broad
        elif len(subgenres) == 2:
            scores["subgenre_score"] = 0.9
        elif len(subgenres) == 1:
            scores["subgenre_score"] = 1.0
        else:
            scores["subgenre_score"] = 0.3

        # 6. Activity: video count as proxy
        if videos > 500:
            scores["activity_score"] = 1.0
        elif videos > 100:
            scores["activity_score"] = 0.8
        elif videos > 30:
            scores["activity_score"] = 0.6
        elif videos > 10:
            scores["activity_score"] = 0.4
        else:
            scores["activity_score"] = 0.2

        # 7. Submit form / social presence
        has_submit = channel_data.get("has_submit_form", False)
        social = channel_data.get("social_links", {})
        submit_score = 0.0
        if has_submit:
            submit_score += 0.6
        submit_score += min(len(social) * 0.1, 0.4)
        scores["submit_score"] = min(submit_score, 1.0)

        # Weighted sum
        total = sum(
            scores[key] * weight
            for key, weight in ChannelScorer.WEIGHTS.items()
        )
        final_score = round(total * 100)
        final_score = max(0, min(100, final_score))

        # Tier
        if final_score >= 80:
            tier = "S"
        elif final_score >= 60:
            tier = "A"
        elif final_score >= 40:
            tier = "B"
        else:
            tier = "C"

        return final_score, tier
