import os
import json
from fastapi import HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.settings_service import get_setting

# Centralized definitions of supported file types for the platform
SUPPORTED_FILE_TYPES = {
    "pdf": {"extension": ".pdf", "mime_type": "application/pdf", "label": "PDF", "description": "Portable Document Format"},
    "png": {"extension": ".png", "mime_type": "image/png", "label": "PNG", "description": "Image"},
    "jpg": {"extension": ".jpg", "mime_type": "image/jpeg", "label": "JPG", "description": "Image"},
    "jpeg": {"extension": ".jpeg", "mime_type": "image/jpeg", "label": "JPEG", "description": "Image"},
    "webp": {"extension": ".webp", "mime_type": "image/webp", "label": "WEBP", "description": "Image"},
    "gif": {"extension": ".gif", "mime_type": "image/gif", "label": "GIF", "description": "Image"},
    "txt": {"extension": ".txt", "mime_type": "text/plain", "label": "TXT", "description": "Text"},
    "csv": {"extension": ".csv", "mime_type": "text/csv", "label": "CSV", "description": "Spreadsheet"},
    "doc": {"extension": ".doc", "mime_type": "application/msword", "label": "DOC", "description": "Word document"},
    "docx": {"extension": ".docx", "mime_type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "label": "DOCX", "description": "Word document"},
    "xls": {"extension": ".xls", "mime_type": "application/vnd.ms-excel", "label": "XLS", "description": "Spreadsheet"},
    "xlsx": {"extension": ".xlsx", "mime_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "label": "XLSX", "description": "Spreadsheet"},
    "ppt": {"extension": ".ppt", "mime_type": "application/vnd.ms-powerpoint", "label": "PPT", "description": "Presentation"},
    "pptx": {"extension": ".pptx", "mime_type": "application/vnd.openxmlformats-officedocument.presentationml.presentation", "label": "PPTX", "description": "Presentation"},
    "mp4": {"extension": ".mp4", "mime_type": "video/mp4", "label": "MP4", "description": "Video"}
}

async def validate_upload(db: AsyncSession, file: UploadFile):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Empty filename")

    ext = os.path.splitext(file.filename)[1].lower().strip('.')
    if not ext:
        raise HTTPException(status_code=400, detail="File has no extension")

    # Get allowed extensions from DB
    raw_allowed = await get_setting(db, "allowed_attachment_types")

    allowed_list = []
    if isinstance(raw_allowed, str):
        if raw_allowed.startswith('['):
            try:
                allowed_list = json.loads(raw_allowed)
            except:
                allowed_list = []
        else:
            allowed_list = [x.strip().lower() for x in raw_allowed.split(",") if x.strip()]

    if not allowed_list:
        raise HTTPException(status_code=403, detail="Attachments are currently disabled (no allowed types configured).")

    if ext not in allowed_list:
        valid_labels = ", ".join(ext.upper() for ext in allowed_list)
        raise HTTPException(status_code=400, detail=f"Unsupported file extension. Allowed formats: {valid_labels}")

    # Validate MIME type against our centralized dictionary to prevent simple rename spoofing
    expected_mime = None
    if ext in SUPPORTED_FILE_TYPES:
        expected_mime = SUPPORTED_FILE_TYPES[ext]["mime_type"]

    if expected_mime and file.content_type != expected_mime:
        raise HTTPException(status_code=400, detail=f"File extension and MIME type mismatch. Expected {expected_mime} for {ext}.")

    # File size validation
    max_mb = await get_setting(db, "maximum_attachment_size")
    try:
        max_bytes = int(max_mb) * 1024 * 1024
    except:
        max_bytes = 5 * 1024 * 1024

    if file.size and file.size > max_bytes:
        raise HTTPException(status_code=400, detail=f"File exceeds {max_mb}MB limit")

    content = await file.read()
    if len(content) > max_bytes:
        raise HTTPException(status_code=400, detail=f"File exceeds {max_mb}MB limit")

    return content, ext
