"""
Leaderboard service — weekly league standings.

Modelled on Duolingo's leagues rather than a single global XP ranking, because
a lifetime-XP board is unwinnable: an early user accumulates a lead nobody can
close, so it stops motivating anyone. Ranking by *this week's* XP inside a
tier of comparable learners means everyone starts level every Monday.

Two ideas do the work:

- **Weekly XP.** Ranking uses users.week_xp, which rolls over lazily against
  users.week_start (see user_service.add_xp). Nothing schedules a reset — a
  tally belonging to an earlier week simply reads as zero.
- **Leagues.** users.league is stored, not derived. Duolingo promotes and
  relegates at the week boundary, so a learner stays in their league all week
  even once their XP would place them elsewhere. Deriving the league from XP
  on each read would make people jump tiers mid-week, which is a different
  (and worse) game.
"""

from dataclasses import dataclass
from sqlalchemy.orm import Session

from app.models.models import User
from app.services.user_service import xp_earned_this_week


@dataclass(frozen=True)
class League:
    code: str
    title: str
    icon: str
    # Rank within the league at week's end that earns promotion / forces
    # relegation. Applied by apply_weekly_promotions().
    promote_top: int
    relegate_bottom: int


# Ordered worst -> best; index position is the tier, so promotion is just a
# step forward in this list.
LEAGUES: list[League] = [
    League("bronze", "Bronze League", "🥉", promote_top=3, relegate_bottom=0),
    League("silver", "Silver League", "🥈", promote_top=3, relegate_bottom=2),
    League("gold", "Gold League", "🥇", promote_top=3, relegate_bottom=2),
    League("sapphire", "Sapphire League", "💎", promote_top=3, relegate_bottom=2),
    League("diamond", "Diamond League", "👑", promote_top=0, relegate_bottom=2),
]

LEAGUES_BY_CODE = {league.code: league for league in LEAGUES}
DEFAULT_LEAGUE = LEAGUES[0].code


def get_league(code: str | None) -> League:
    """Resolve a stored league code, falling back to bronze for anything
    unrecognised so a bad value can never 500 the leaderboard."""
    return LEAGUES_BY_CODE.get(code or "", LEAGUES[0])


def get_leaderboard(db: Session, current_user_id: int) -> list[dict]:
    """Standings for the current user's league, ranked by this week's XP.

    Sorting happens in Python rather than SQL because week_xp is only valid
    when week_start is the current week — a user who hasn't played since last
    week still holds a stale non-zero week_xp in the column, and ordering by
    it directly would rank them on XP they no longer have. xp_earned_this_week
    applies that rule per row. Fine at this scale (a league caps at ~30 users);
    a production version would zero out stale rows in a weekly job and let the
    database sort.
    """
    current_user = db.query(User).filter(User.id == current_user_id).first()
    league_code = (current_user.league if current_user else None) or DEFAULT_LEAGUE

    members = db.query(User).filter(User.league == league_code).all()

    ranked = sorted(
        members,
        # Ties break by lifetime XP then name, so the order is stable across
        # requests instead of shuffling on every page load.
        key=lambda u: (-xp_earned_this_week(u), -u.xp_total, u.name),
    )

    league = get_league(league_code)

    return [
        {
            "rank": index + 1,
            "user_id": user.id,
            "name": user.name,
            "xp_total": user.xp_total,
            "week_xp": xp_earned_this_week(user),
            "is_current_user": user.id == current_user_id,
            "league_code": league.code,
            "league_title": league.title,
            "league_icon": league.icon,
            # Zone the learner would land in if the week ended now. Drives the
            # promotion/relegation banding in the UI.
            "zone": _zone_for(index + 1, len(ranked), league),
        }
        for index, user in enumerate(ranked)
    ]


def _zone_for(rank: int, total: int, league: League) -> str:
    """'promotion' | 'relegation' | 'neutral' for a rank in a league."""
    if league.promote_top and rank <= league.promote_top:
        return "promotion"
    if league.relegate_bottom and rank > total - league.relegate_bottom:
        return "relegation"
    return "neutral"
