from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)

def grant_xp(user, amount):
    """
    Grants XP to a user, handles level calculations, and computes/protects user streak 
    using a Duolingo-style streak freeze protection system.
    Returns:
        leveled_up (bool): True if the user leveled up, False otherwise.
    """
    if amount <= 0:
        return False

    # 1. Grant XP and calculate new level
    user.xp += amount
    new_level = 1 + (user.xp // 100) # Every 100 XP is a level
    leveled_up = new_level > user.level
    user.level = new_level

    # 2. Streak and Streak Freeze calculation
    now = timezone.now()
    today = now.date()

    if user.last_activity:
        last_activity_date = user.last_activity.date()
        
        if last_activity_date == today:
            # Already active today, streak remains the same
            pass
        elif last_activity_date == today - timedelta(days=1):
            # Consecutive day! Increment streak
            user.streak += 1
        else:
            # Gapped day (passed more than 24-48 hours since last activity)
            # Apply Duolingo Streak Freeze if available!
            if user.streak_freeze_count > 0:
                user.streak_freeze_count -= 1
                logger.info(f"User {user.email} streak frozen! Remaining freezes: {user.streak_freeze_count}")
                # Streak is protected! It remains the same as yesterday instead of resetting.
                # Treat today as a new consecutive activity day.
                user.streak += 1
            else:
                # No freezes left, reset streak to 1
                user.streak = 1
    else:
        # First activity ever
        user.streak = 1

    # 3. Update last active timestamp
    user.last_activity = now
    user.save(update_fields=['xp', 'level', 'streak', 'streak_freeze_count', 'last_activity'])
    
    return leveled_up
