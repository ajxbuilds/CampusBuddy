import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import logging
import asyncio
from typing import Optional

logger = logging.getLogger(__name__)

def send_email_sync(to_email: str, subject: str, body: str, html_body: Optional[str] = None):
    smtp_enabled = os.getenv("SMTP_ENABLED", "false").lower() == "true"
    if not smtp_enabled:
        return
    
    host = os.getenv("SMTP_HOST", "")
    port = int(os.getenv("SMTP_PORT", "587"))
    username = os.getenv("SMTP_USERNAME", "")
    password = os.getenv("SMTP_PASSWORD", "")
    from_email = os.getenv("SMTP_FROM_EMAIL", "noreply@campusbuddy.edu")
    
    if not all([host, username, password]):
        logger.warning("SMTP is enabled but missing credentials.")
        return

    if not to_email or '@' not in to_email:
        logger.warning(f"Invalid email address provided: {to_email}")
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = from_email
    msg["To"] = to_email
    
    msg.attach(MIMEText(body, "plain"))
    if html_body:
        msg.attach(MIMEText(html_body, "html"))
        
    try:
        with smtplib.SMTP(host, port, timeout=10) as server:
            if os.getenv("SMTP_USE_TLS", "true").lower() == "true":
                server.starttls()
            server.login(username, password)
            server.send_message(msg)
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")

async def send_email_async(to_email: str, subject: str, body: str, html_body: Optional[str] = None):
    await asyncio.to_thread(send_email_sync, to_email, subject, body, html_body)

