from app.core.database import Base
from app.models.user import User, UserRole, StudentProfile
from app.models.complaint import (
    Complaint,
    ComplaintCategory,
    ComplaintStatus,
    ComplaintPriority,
    ComplaintStatusHistory,
    ComplaintEscalation,
    EscalationStatus,
)
from app.models.community import (
    CommunityPost,
    CommunityAnswer,
    CommunityReply,
    CommunityAttachment,
    CommunityResource,
    Vote,
    VoteTargetType,
    Report,
    ReportStatus,
)
from app.models.gamification import Badge, UserBadge, PointTransaction
from app.models.notification import Notification, NotificationType
from app.models.audit import AuditLog
from app.models.study_buddy import (
    StudyBuddyProfile,
    StudyBuddyRequest,
    StudyBuddyConnection,
    ConnectionStatus,
)

__all__ = [
    "Base",
    "User",
    "UserRole",
    "StudentProfile",
    "Complaint",
    "ComplaintCategory",
    "ComplaintStatus",
    "ComplaintPriority",
    "ComplaintStatusHistory",
    "ComplaintEscalation",
    "EscalationStatus",
    "CommunityPost",
    "CommunityAnswer",
    "CommunityReply",
    "CommunityAttachment",
    "CommunityResource",
    "Vote",
    "VoteTargetType",
    "Report",
    "ReportStatus",
    "Badge",
    "UserBadge",
    "PointTransaction",
    "Notification",
    "NotificationType",
    "AuditLog",
    "StudyBuddyProfile",
    "StudyBuddyRequest",
    "StudyBuddyConnection",
    "ConnectionStatus",
]


from .setting import AppSetting

from app.models.user_settings import UserSettings
__all__.append('UserSettings')