from fastapi import APIRouter, Depends
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.ai import AIChatRequest, AIChatResponse
from app.services.ai_service import generate_guidance

router = APIRouter(prefix="/ai", tags=["AI Assistant"])

@router.post("/chat", response_model=AIChatResponse)
async def chat_with_assistant(
    request: AIChatRequest,
    current_user: User = Depends(get_current_user)
):
    """
    CampusBuddy AI Assistant provides intelligent procedure guidance and issue categorization.
    It does NOT auto-submit complaints and provides explicit disclaimers.
    """
    response = await generate_guidance(
        messages=request.messages,
        context_category=request.context_category
    )
    return response
