from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import Dict, Any, List
from app.models.setting import AppSetting

DEFAULT_SETTINGS = [
    # GENERAL
    {"key": "college_name", "value": "My College", "value_type": "string", "category": "General", "description": "Name of the institution"},
    {"key": "timezone", "value": "UTC", "value_type": "string", "category": "General", "description": "Default timezone"},
    {"key": "public_registration_enabled", "value": "true", "value_type": "boolean", "category": "General", "description": "Allow public user registration"},
    {"key": "maintenance_mode", "value": "false", "value_type": "boolean", "category": "General", "description": "Put site into maintenance mode"},

    # COMPLAINTS
    {"key": "complaints_enabled", "value": "true", "value_type": "boolean", "category": "Complaints", "description": "Enable complaint module"},
    {"key": "allow_reopen", "value": "false", "value_type": "boolean", "category": "Complaints", "description": "Allow users to reopen closed complaints"},
    {"key": "default_priority", "value": "MEDIUM", "value_type": "string", "category": "Complaints", "description": "Default priority for new complaints"},
    {"key": "maximum_attachment_size", "value": "5", "value_type": "integer", "category": "Complaints", "description": "Max attachment size in MB"},
    {"key": "allowed_attachment_types", "value": "[\"pdf\",\"png\",\"jpg\",\"jpeg\"]", "value_type": "json", "category": "Complaints", "description": "Allowed extensions"},

    # COMMUNITY
    {"key": "community_enabled", "value": "true", "value_type": "boolean", "category": "Community", "description": "Enable community module"},
    {"key": "community_posting_enabled", "value": "true", "value_type": "boolean", "category": "Community", "description": "Allow creating new posts"},
    {"key": "community_question_attachments_enabled", "value": "true", "value_type": "boolean", "category": "Community", "description": "Allow attachments on posts"},
    {"key": "community_url_resources_enabled", "value": "true", "value_type": "boolean", "category": "Community", "description": "Allow URL attachments"},
    {"key": "community_reporting_enabled", "value": "true", "value_type": "boolean", "category": "Community", "description": "Allow reporting posts"},

    # GAMIFICATION
    {"key": "gamification_enabled", "value": "true", "value_type": "boolean", "category": "Gamification", "description": "Enable gamification engine"},
    {"key": "leaderboard_enabled", "value": "true", "value_type": "boolean", "category": "Gamification", "description": "Show public leaderboard"},
    {"key": "badges_enabled", "value": "true", "value_type": "boolean", "category": "Gamification", "description": "Enable badges system"},
    {"key": "point_notifications_enabled", "value": "true", "value_type": "boolean", "category": "Gamification", "description": "Notify users on points"},
    {"key": "points_community_question", "value": "2", "value_type": "integer", "category": "Gamification", "description": "Points for posting a question"},
    {"key": "points_community_answer", "value": "5", "value_type": "integer", "category": "Gamification", "description": "Points for answering"},
    {"key": "points_answer_accepted", "value": "10", "value_type": "integer", "category": "Gamification", "description": "Points for accepted answer"},
    {"key": "points_helpful_reply", "value": "3", "value_type": "integer", "category": "Gamification", "description": "Points for helpful reply"},
    {"key": "points_study_buddy_milestone", "value": "5", "value_type": "integer", "category": "Gamification", "description": "Points for study buddy action"},

    # NOTIFICATIONS
    {"key": "notifications_enabled", "value": "true", "value_type": "boolean", "category": "Notifications", "description": "Master switch for notifications"},
    {"key": "community_notifications_enabled", "value": "true", "value_type": "boolean", "category": "Notifications", "description": "Enable community notifications"},
    {"key": "complaint_notifications_enabled", "value": "true", "value_type": "boolean", "category": "Notifications", "description": "Enable complaint notifications"},
    {"key": "gamification_notifications_enabled", "value": "true", "value_type": "boolean", "category": "Notifications", "description": "Enable gamification notifications"},

    # MODERATION
    {"key": "moderation_enabled", "value": "true", "value_type": "boolean", "category": "Moderation", "description": "Enable moderation suite"},
    {"key": "community_reports_enabled", "value": "true", "value_type": "boolean", "category": "Moderation", "description": "Enable user reports"},
]

async def seed_settings_if_empty(db: AsyncSession):
    res = await db.execute(select(AppSetting).limit(1))
    if not res.scalars().first():
        for s in DEFAULT_SETTINGS:
            setting = AppSetting(**s)
            db.add(setting)
        await db.commit()

async def get_all_settings(db: AsyncSession) -> List[AppSetting]:
    await seed_settings_if_empty(db)
    res = await db.execute(select(AppSetting))
    return res.scalars().all()

async def get_setting(db: AsyncSession, key: str) -> Any:
    res = await db.execute(select(AppSetting).where(AppSetting.key == key))
    setting = res.scalars().first()
    if not setting:
        # Check default fallback in case new keys were added after seeding
        fallback = next((s for s in DEFAULT_SETTINGS if s["key"] == key), None)
        if not fallback:
            return None
        val = fallback["value"]
        vtype = fallback["value_type"]
    else:
        val = setting.value
        vtype = setting.value_type

    if vtype == 'boolean':
        return val.lower() == 'true'
    elif vtype == 'integer':
        return int(val)
    return val

async def update_setting(db: AsyncSession, key: str, value: str):
    res = await db.execute(select(AppSetting).where(AppSetting.key == key))
    setting = res.scalars().first()
    if not setting:
        raise ValueError(f"Setting {key} not found")

    # Validate type and bounds
    vtype = setting.value_type
    if vtype == 'boolean':
        if value.lower() not in ['true', 'false']:
            raise ValueError(f"Setting {key} must be 'true' or 'false'")
    elif vtype == 'integer':
        try:
            val_int = int(value)
            if key.startswith("points_") and val_int < 0:
                raise ValueError("Point values must be non-negative integers")
        except ValueError as e:
            if "Point values" in str(e):
                raise e
            raise ValueError(f"Setting {key} must be an integer")

    setting.value = value
    await db.commit()
    await db.refresh(setting)
    return setting
