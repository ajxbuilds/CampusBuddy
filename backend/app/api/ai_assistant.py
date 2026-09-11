from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.ai import AIChatRequest, AIChatResponse
from app.services.ai_service import generate_guidance

router = APIRouter(prefix="/ai", tags=["AI Assistant"])

@router.post("/chat", response_model=AIChatResponse)
async def chat_with_assistant(
    request: AIChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    CampusBuddy AI Assistant provides intelligent procedure guidance, issue categorization,
    and live college data queries (attendance, schedule, fees, exams, notices).
    """
    response = await generate_guidance(
        messages=request.messages,
        context_category=request.context_category,
        current_page=request.current_page,
        quick_action=request.quick_action,
        current_user=current_user,
        db=db
    )
    return response
