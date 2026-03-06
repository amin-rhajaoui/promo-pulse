"""
Authenticity Scorer — Détecte les fausses chaînes YouTube / bots.

Analyse les métriques publiques de chaque chaîne pour calculer un score
d'authenticité de 0 à 100 et un label (clean / suspect / fake).

Signaux analysés :
  1. Views-per-subscriber ratio (engagement réel)
  2. Views-per-video ratio (audience active)
  3. Subscriber-to-video ratio (croissance naturelle)
  4. Channel age vs subscribers (progression organique)
  5. Description quality (les bots ont souvent des descriptions vides)
  6. Video count consistency (les fermes à clics publient peu)
"""

from datetime import date, timedelta
import math


class AuthenticityScorer:
    """Score l'authenticité d'une chaîne YouTube (0-100)."""

    # --- WEIGHTS ---
    # Sum = 1.0
    WEIGHTS = {
        "views_per_sub":   0.25,  # Le signal le plus fort
        "views_per_video": 0.20,
        "sub_video_ratio": 0.15,
        "age_growth":      0.15,
        "description":     0.10,
        "video_count":     0.10,
        "engagement_consistency": 0.05,
    }

    @classmethod
    def score(cls, channel_data: dict) -> tuple[int, str, dict]:
        """
        Calcule le score d'authenticité.

        Args:
            channel_data: dict avec les clés:
                subscriber_count, video_count, view_count,
                description, published_at (date ou str YYYY-MM-DD)

        Returns:
            (score: int 0-100, label: str, signals: dict)
        """
        subs = channel_data.get("subscriber_count", 0)
        videos = channel_data.get("video_count", 0)
        views = channel_data.get("view_count", 0)
        desc = channel_data.get("description", "") or ""
        published_at = channel_data.get("published_at")

        signals = {}
        scores = {}

        # ──────────────────────────────────────────────
        # 1. VIEWS PER SUBSCRIBER (le signal roi)
        # ──────────────────────────────────────────────
        # Chaîne réelle : chaque abonné génère des vues au fil du temps
        # Chaîne fake : beaucoup d'abonnés, très peu de vues
        if subs > 0 and videos > 0:
            avg_views_per_video = views / videos
            ratio = avg_views_per_video / subs

            if ratio >= 0.5:
                scores["views_per_sub"] = 1.0
                signals["views_per_sub"] = {"ratio": round(ratio, 3), "verdict": "excellent"}
            elif ratio >= 0.2:
                scores["views_per_sub"] = 0.85
                signals["views_per_sub"] = {"ratio": round(ratio, 3), "verdict": "good"}
            elif ratio >= 0.1:
                scores["views_per_sub"] = 0.7
                signals["views_per_sub"] = {"ratio": round(ratio, 3), "verdict": "normal"}
            elif ratio >= 0.05:
                scores["views_per_sub"] = 0.5
                signals["views_per_sub"] = {"ratio": round(ratio, 3), "verdict": "low"}
            elif ratio >= 0.02:
                scores["views_per_sub"] = 0.3
                signals["views_per_sub"] = {"ratio": round(ratio, 3), "verdict": "suspicious"}
            elif ratio >= 0.005:
                scores["views_per_sub"] = 0.15
                signals["views_per_sub"] = {"ratio": round(ratio, 3), "verdict": "very_suspicious"}
            else:
                scores["views_per_sub"] = 0.0
                signals["views_per_sub"] = {"ratio": round(ratio, 4), "verdict": "likely_fake"}
        elif subs > 1000 and videos == 0:
            # Beaucoup d'abonnés mais zéro vidéos = très suspect
            scores["views_per_sub"] = 0.0
            signals["views_per_sub"] = {"ratio": 0, "verdict": "no_videos_with_subs"}
        else:
            scores["views_per_sub"] = 0.5
            signals["views_per_sub"] = {"ratio": 0, "verdict": "insufficient_data"}

        # ──────────────────────────────────────────────
        # 2. VIEWS PER VIDEO (audience active)
        # ──────────────────────────────────────────────
        # Chaîne house music typique : 1K-100K views/video
        if videos > 0:
            avg_vpv = views / videos

            if avg_vpv >= 50_000:
                scores["views_per_video"] = 1.0
                signals["views_per_video"] = {"avg": round(avg_vpv), "verdict": "viral"}
            elif avg_vpv >= 10_000:
                scores["views_per_video"] = 0.9
                signals["views_per_video"] = {"avg": round(avg_vpv), "verdict": "excellent"}
            elif avg_vpv >= 1_000:
                scores["views_per_video"] = 0.75
                signals["views_per_video"] = {"avg": round(avg_vpv), "verdict": "good"}
            elif avg_vpv >= 200:
                scores["views_per_video"] = 0.5
                signals["views_per_video"] = {"avg": round(avg_vpv), "verdict": "moderate"}
            elif avg_vpv >= 50:
                scores["views_per_video"] = 0.3
                signals["views_per_video"] = {"avg": round(avg_vpv), "verdict": "low"}
            else:
                scores["views_per_video"] = 0.1
                signals["views_per_video"] = {"avg": round(avg_vpv), "verdict": "very_low"}
        else:
            scores["views_per_video"] = 0.1
            signals["views_per_video"] = {"avg": 0, "verdict": "no_videos"}

        # ──────────────────────────────────────────────
        # 3. SUBSCRIBER-TO-VIDEO RATIO
        # ──────────────────────────────────────────────
        # Chaîne organique : le ratio subs/vidéos est proportionnel
        # Fake : 500K subs avec 3 vidéos = achat de subs
        if videos > 0:
            subs_per_video = subs / videos

            if subs_per_video <= 500:
                scores["sub_video_ratio"] = 1.0
                signals["sub_video_ratio"] = {"ratio": round(subs_per_video), "verdict": "organic"}
            elif subs_per_video <= 2_000:
                scores["sub_video_ratio"] = 0.7
                signals["sub_video_ratio"] = {"ratio": round(subs_per_video), "verdict": "normal"}
            elif subs_per_video <= 10_000:
                scores["sub_video_ratio"] = 0.4
                signals["sub_video_ratio"] = {"ratio": round(subs_per_video), "verdict": "high"}
            elif subs_per_video <= 50_000:
                scores["sub_video_ratio"] = 0.15
                signals["sub_video_ratio"] = {"ratio": round(subs_per_video), "verdict": "suspicious"}
            else:
                scores["sub_video_ratio"] = 0.0
                signals["sub_video_ratio"] = {"ratio": round(subs_per_video), "verdict": "likely_fake"}
        elif subs > 0:
            scores["sub_video_ratio"] = 0.0
            signals["sub_video_ratio"] = {"ratio": 0, "verdict": "subs_without_content"}
        else:
            scores["sub_video_ratio"] = 0.5
            signals["sub_video_ratio"] = {"ratio": 0, "verdict": "new_channel"}

        # ──────────────────────────────────────────────
        # 4. AGE VS GROWTH (progression organique)
        # ──────────────────────────────────────────────
        # Une chaîne qui gagne 1M subs en 2 mois c'est suspect
        # Sauf si c'est un très gros créateur (views prouvent le contraire)
        channel_age_days = cls._get_age_days(published_at)
        if channel_age_days and channel_age_days > 0 and subs > 0:
            subs_per_day = subs / channel_age_days
            # Ajuster par la taille : les grandes chaînes croissent plus vite
            expected_max = max(50, subs * 0.005)  # ~0.5% de leur taille par jour max

            if subs_per_day <= expected_max:
                scores["age_growth"] = 0.9
                signals["age_growth"] = {
                    "subs_per_day": round(subs_per_day, 1),
                    "channel_age_days": channel_age_days,
                    "verdict": "organic_growth",
                }
            elif subs_per_day <= expected_max * 3:
                scores["age_growth"] = 0.6
                signals["age_growth"] = {
                    "subs_per_day": round(subs_per_day, 1),
                    "channel_age_days": channel_age_days,
                    "verdict": "fast_growth",
                }
            else:
                # Vérifier si les views justifient la croissance
                if views > subs * 5:
                    scores["age_growth"] = 0.5
                    signals["age_growth"] = {
                        "subs_per_day": round(subs_per_day, 1),
                        "verdict": "fast_but_views_support",
                    }
                else:
                    scores["age_growth"] = 0.15
                    signals["age_growth"] = {
                        "subs_per_day": round(subs_per_day, 1),
                        "verdict": "suspicious_growth",
                    }
        else:
            scores["age_growth"] = 0.5
            signals["age_growth"] = {"verdict": "unknown_age"}

        # ──────────────────────────────────────────────
        # 5. DESCRIPTION QUALITY
        # ──────────────────────────────────────────────
        # Les chaînes bots ont souvent des descriptions vides ou copiées
        desc_len = len(desc.strip())
        if desc_len >= 200:
            scores["description"] = 1.0
            signals["description"] = {"length": desc_len, "verdict": "detailed"}
        elif desc_len >= 50:
            scores["description"] = 0.7
            signals["description"] = {"length": desc_len, "verdict": "basic"}
        elif desc_len > 0:
            scores["description"] = 0.4
            signals["description"] = {"length": desc_len, "verdict": "minimal"}
        else:
            scores["description"] = 0.1
            signals["description"] = {"length": 0, "verdict": "empty"}

        # ──────────────────────────────────────────────
        # 6. VIDEO COUNT
        # ──────────────────────────────────────────────
        # Chaîne musicale sérieuse : au moins 10+ vidéos
        if videos >= 100:
            scores["video_count"] = 1.0
            signals["video_count"] = {"count": videos, "verdict": "very_active"}
        elif videos >= 30:
            scores["video_count"] = 0.8
            signals["video_count"] = {"count": videos, "verdict": "active"}
        elif videos >= 10:
            scores["video_count"] = 0.6
            signals["video_count"] = {"count": videos, "verdict": "moderate"}
        elif videos >= 3:
            scores["video_count"] = 0.3
            signals["video_count"] = {"count": videos, "verdict": "low"}
        else:
            scores["video_count"] = 0.1
            signals["video_count"] = {"count": videos, "verdict": "minimal"}

        # ──────────────────────────────────────────────
        # 7. ENGAGEMENT CONSISTENCY
        # ──────────────────────────────────────────────
        # Total views devrait être proportionnel à subs × videos
        # Si total views << subs × videos, les subs sont probablement faux
        if subs > 0 and videos > 0:
            expected_views = subs * videos * 0.1  # 10% des subs voient chaque vidéo = normal
            actual_ratio = views / max(expected_views, 1)

            if actual_ratio >= 0.5:
                scores["engagement_consistency"] = 1.0
                signals["engagement_consistency"] = {"ratio": round(actual_ratio, 2), "verdict": "consistent"}
            elif actual_ratio >= 0.1:
                scores["engagement_consistency"] = 0.6
                signals["engagement_consistency"] = {"ratio": round(actual_ratio, 2), "verdict": "acceptable"}
            elif actual_ratio >= 0.02:
                scores["engagement_consistency"] = 0.3
                signals["engagement_consistency"] = {"ratio": round(actual_ratio, 2), "verdict": "low"}
            else:
                scores["engagement_consistency"] = 0.05
                signals["engagement_consistency"] = {"ratio": round(actual_ratio, 3), "verdict": "inconsistent"}
        else:
            scores["engagement_consistency"] = 0.5
            signals["engagement_consistency"] = {"ratio": 0, "verdict": "unknown"}

        # ──────────────────────────────────────────────
        # CALCUL FINAL
        # ──────────────────────────────────────────────
        total = sum(
            scores.get(key, 0.5) * weight
            for key, weight in cls.WEIGHTS.items()
        )
        final_score = max(0, min(100, round(total * 100)))

        # Hard overrides pour les cas évidents
        if subs > 10_000 and videos > 0 and (views / videos) < 100:
            # 10K+ subs mais moins de 100 views par vidéo = fake
            final_score = min(final_score, 20)
        if subs > 50_000 and videos < 5:
            # 50K+ subs mais moins de 5 vidéos = fake
            final_score = min(final_score, 15)

        # Label
        if final_score >= 65:
            label = "clean"
        elif final_score >= 35:
            label = "suspect"
        else:
            label = "fake"

        signals["_final_score"] = final_score
        signals["_label"] = label

        return final_score, label, signals

    @staticmethod
    def _get_age_days(published_at) -> int | None:
        """Calcule l'âge en jours depuis la date de création."""
        if not published_at:
            return None
        try:
            if isinstance(published_at, date):
                d = published_at
            elif isinstance(published_at, str):
                d = date.fromisoformat(published_at[:10])
            else:
                return None
            delta = date.today() - d
            return max(delta.days, 1)
        except (ValueError, TypeError):
            return None

    @classmethod
    def label_emoji(cls, label: str) -> str:
        return {"clean": "🟢", "suspect": "🟡", "fake": "🔴"}.get(label, "⚪")
