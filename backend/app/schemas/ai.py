from typing import Optional, List
from pydantic import BaseModel

class AIChatMessage(BaseModel):
    role: str # "user" or "assistant"
    content: str

class AIChatRequest(BaseModel):
    messages: List[AIChatMessage]
    context_category: Optional[str] = None

class AIProcedureAdvice(BaseModel):
    suggested_category: Optional[str] = None
    suggested_priority: Optional[str] = "MEDIUM"
    recommended_action: str # "PEER_COMMUNITY", "FORMAL_COMPLAINT", "VISIT_OFFICE", "INFORMATIONAL"
    required_documents: List[str] = []
    contact_office: Optional[str] = None
    guidance_text: str
    disclaimer: str = "This guidance is informational and provided by the CampusBuddy AI assistant. It does not constitute official college policy and does not automatically file a complaint."

class AIChatResponse(BaseModel):
    reply: str
    structured_advice: Optional[AIProcedureAdvice] = None
