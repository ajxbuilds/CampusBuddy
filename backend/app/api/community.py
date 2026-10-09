from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import desc, func

from app.core.database import get_db
from app.services.settings_service import get_setting
from app.core.security import get_current_user
from app.models.user import User, UserRole
from app.models.community import (
    CommunityReply,
    CommunityPost,
    CommunityAnswer,
    Vote,
    VoteTargetType,
    Report,
    ReportStatus,
)
from app.models.notification import NotificationType
from app.schemas.community import (
    ReplyCreate,
    ReplyResponse,
    PostCreate,
    PostResponse,
    PostDetailResponse,
    AnswerCreate,
    AnswerResponse,
    VoteCreate,
    ReportCreate,
    ReportResponse,
)
from app.services.gamification_service import award_points, revoke_points, PointEvent
from app.services.complaint_service import create_audit_log, send_notification

router = APIRouter(prefix="/community", tags=["Community"])

@router.get("/posts", response_model=List[PostResponse])
async def list_posts(
    category: Optional[str] = None,
    sort_by: Optional[str] = Query("recent", pattern="^(recent|trending|unanswered|helpful)$"),
    search: Optional[str] = None,
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(CommunityPost)
        .options(selectinload(CommunityPost.author))
        .where(CommunityPost.is_hidden == False)
    )

    if category and category.lower() != "all":
        stmt = stmt.where(func.lower(CommunityPost.category) == category.lower())

    if search:
        term = f"%{search}%"
        stmt = stmt.where((CommunityPost.title.ilike(term)) | (CommunityPost.content.ilike(term)))

    if sort_by == "trending":
        stmt = stmt.order_by(desc(CommunityPost.upvotes_count + CommunityPost.answers_count * 2), desc(CommunityPost.created_at))
    elif sort_by == "unanswered":
        stmt = stmt.where(CommunityPost.answers_count == 0).order_by(desc(CommunityPost.created_at))
    elif sort_by == "helpful":
        stmt = stmt.order_by(desc(CommunityPost.upvotes_count), desc(CommunityPost.created_at))
    else: # recent
        stmt = stmt.order_by(desc(CommunityPost.created_at))

    res = await db.execute(stmt)
    posts = res.scalars().all()

    # Determine user upvotes if logged in
    user_upvoted_ids = set()
    if current_user:
        post_ids = [p.id for p in posts]
        if post_ids:
            votes_stmt = select(Vote.target_id).where(
                Vote.user_id == current_user.id,
                Vote.target_type == VoteTargetType.POST,
                Vote.target_id.in_(post_ids)
            )
            v_res = await db.execute(votes_stmt)
            user_upvoted_ids = set(v_res.scalars().all())

    results = []
    for p in posts:
        resp = PostResponse.model_validate(p)
        resp.user_vote = "UPVOTE" if p.id in user_upvoted_ids else None
        results.append(resp)

    return results

async def _check_community_enabled(db: AsyncSession):
    enabled = await get_setting(db, "community_enabled")
    if enabled is False:
        raise HTTPException(status_code=403, detail="Community module is currently disabled by administrators.")

@router.post("/posts"
, response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
    post_in: PostCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await _check_community_enabled(db)
    posting_enabled = await get_setting(db, "community_posting_enabled")
    if posting_enabled is False:
        raise HTTPException(status_code=403, detail="Creating new posts is currently disabled.")

    post = CommunityPost(
        author_id=current_user.id,
        title=post_in.title,
        content=post_in.content,
        category=post_in.category,
        views=1,
        upvotes_count=0,
        answers_count=0,
        has_accepted_answer=False,
        is_hidden=False,
        created_at=datetime.now(timezone.utc)
    )
    db.add(post)
    await db.flush()

    if post_in.resources:
        from urllib.parse import urlparse
        for res_in in post_in.resources:
            parsed = urlparse(res_in.url)
            if parsed.scheme not in ("http", "https"):
                raise HTTPException(status_code=400, detail="Invalid URL scheme. Only http and https are allowed.")
            new_res = CommunityResource(
                post_id=post.id,
                url=res_in.url,
                title=res_in.title,
                created_by=current_user.id,
                created_at=datetime.now(timezone.utc)
            )
            db.add(new_res)
        await db.flush()

    await create_audit_log(
        db=db,
        actor_id=current_user.id,
        action="POST_CREATED",
        resource_type="COMMUNITY_POST",
        resource_id=str(post.id),
        details=f"Posted in {post.category}: {post.title}"
    )

    # Gamification: Award points for asking a question
    tx = await award_points(
        db=db,
        user_id=current_user.id,
        event_type=PointEvent.COMMUNITY_QUESTION,
        reference_type="community_post",
        reference_id=post.id
    )

    await db.commit()

    # Re-fetch with author
    stmt = select(CommunityPost).options(selectinload(CommunityPost.author)).where(CommunityPost.id == post.id)
    res = await db.execute(stmt)
    post_loaded = res.scalars().first()

    if 'tx' in locals() and tx:
        setattr(post_loaded, 'points_awarded', tx.points)

    return PostResponse.model_validate(post_loaded)

@router.get("/posts/{post_id}", response_model=PostDetailResponse)
async def get_post_detail(
    post_id: int,
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(CommunityPost)
        .options(
            selectinload(CommunityPost.author),
            selectinload(CommunityPost.answers).selectinload(CommunityAnswer.author),
            selectinload(CommunityPost.answers).selectinload(CommunityAnswer.replies).selectinload(CommunityReply.author),
            selectinload(CommunityPost.attachments),
            selectinload(CommunityPost.resources)
        )
        .where(CommunityPost.id == post_id, CommunityPost.is_hidden == False)
    )
    res = await db.execute(stmt)
    post = res.scalars().first()

    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found.")

    # Sync answers_count to real count from loaded answers (fixes stale counter after deletions)
    real_answer_count = len([a for a in post.answers if not a.is_hidden])
    if post.answers_count != real_answer_count:
        post.answers_count = real_answer_count

    post.views += 1
    await db.commit()

    # Load votes
    post_vote = None
    answer_votes = {}
    reply_votes = {}

    if current_user:
        v_stmt = select(Vote).where(Vote.user_id == current_user.id)
        v_res = await db.execute(v_stmt)
        votes = v_res.scalars().all()
        for v in votes:
            if v.target_type == VoteTargetType.POST and v.target_id == post.id:
                post_vote = v.vote_type
            elif v.target_type == VoteTargetType.ANSWER:
                answer_votes[v.target_id] = v.vote_type
            elif v.target_type == VoteTargetType.REPLY:
                reply_votes[v.target_id] = v.vote_type

    post_resp = PostDetailResponse.model_validate(post)
    post_resp.user_vote = post_vote
    for ans in post_resp.answers:
        ans.user_vote = answer_votes.get(ans.id)
        for rep in ans.replies:
            rep.user_vote = reply_votes.get(rep.id)

    return post_resp

@router.post("/posts/{post_id}/answers", response_model=AnswerResponse, status_code=status.HTTP_201_CREATED)
async def create_answer(
    post_id: int,
    answer_in: AnswerCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(CommunityPost).where(CommunityPost.id == post_id)
    res = await db.execute(stmt)
    post = res.scalars().first()

    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found.")

    # Check faculty endorsement if user is a teacher
    is_teacher = (current_user.role == UserRole.TEACHER)

    answer = CommunityAnswer(
        post_id=post.id,
        author_id=current_user.id,
        content=answer_in.content,
        upvotes_count=0,
        is_accepted=False,
        is_faculty_endorsed=is_teacher,
        is_hidden=False,
        created_at=datetime.now(timezone.utc)
    )
    db.add(answer)
    post.answers_count += 1
    await db.flush()

    # Gamification: Award points to the answer author (only if not self-answering)
    tx = None
    if post.author_id != current_user.id:
        tx = await award_points(db=db, user_id=current_user.id, event_type=PointEvent.COMMUNITY_ANSWER, reference_type="community_answer", reference_id=answer.id)

    # Notify question author
    if post.author_id != current_user.id:
        await send_notification(
            db=db,
            user_id=post.author_id,
            title="New Answer on Your Question",
            message=f"{current_user.full_name} answered your question: '{post.title[:50]}...'",
            notification_type=NotificationType.COMMUNITY,
            link=f"/community/{post.id}"
        )

    await db.commit()

    # Re-fetch answer with author
    a_stmt = select(CommunityAnswer).options(selectinload(CommunityAnswer.author), selectinload(CommunityAnswer.replies)).where(CommunityAnswer.id == answer.id)
    a_res = await db.execute(a_stmt)
    ans_loaded = a_res.scalars().first()

    if 'tx' in locals() and tx:
        setattr(ans_loaded, 'points_awarded', tx.points)

    return AnswerResponse.model_validate(ans_loaded)

@router.post("/vote")
async def toggle_vote(
    vote_in: VoteCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    v_stmt = select(Vote).where(
        Vote.user_id == current_user.id,
        Vote.target_type == vote_in.target_type,
        Vote.target_id == vote_in.target_id
    )
    v_res = await db.execute(v_stmt)
    existing_vote = v_res.scalars().first()

    # Target entity
    if vote_in.target_type == VoteTargetType.POST:
        target_stmt = select(CommunityPost).where(CommunityPost.id == vote_in.target_id)
    elif vote_in.target_type == VoteTargetType.ANSWER:
        target_stmt = select(CommunityAnswer).where(CommunityAnswer.id == vote_in.target_id)
    else:
        target_stmt = select(CommunityReply).where(CommunityReply.id == vote_in.target_id)

    t_res = await db.execute(target_stmt)
    target = t_res.scalars().first()

    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target content not found.")

    requested_vote = vote_in.vote_type or "UPVOTE"
    action_taken = ""

    if existing_vote:
        if existing_vote.vote_type == requested_vote:
            # Toggle off (unvote)
            await db.delete(existing_vote)
            if requested_vote == "UPVOTE":
                target.upvotes_count = max(0, target.upvotes_count - 1)
            else:
                target.downvotes_count = max(0, target.downvotes_count - 1)
            action_taken = "unvoted"
        else:
            # Change vote
            if existing_vote.vote_type == "UPVOTE":
                target.upvotes_count = max(0, target.upvotes_count - 1)
                target.downvotes_count += 1
            else:
                target.downvotes_count = max(0, target.downvotes_count - 1)
                target.upvotes_count += 1
            existing_vote.vote_type = requested_vote
            action_taken = f"changed_to_{requested_vote.lower()}"
    else:
        # New vote
        new_vote = Vote(
            user_id=current_user.id,
            target_type=vote_in.target_type,
            target_id=vote_in.target_id,
            vote_type=requested_vote,
            created_at=datetime.now(timezone.utc)
        )
        db.add(new_vote)
        if requested_vote == "UPVOTE":
            target.upvotes_count += 1
        else:
            target.downvotes_count += 1
        action_taken = requested_vote.lower()



    await db.commit()
    return {
        "status": "success",
        "action": action_taken,
        "upvotes": target.upvotes_count,
        "downvotes": target.downvotes_count
    }

@router.patch("/answers/{answer_id}/accept")
async def accept_answer(
    answer_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(CommunityAnswer).options(selectinload(CommunityAnswer.post)).where(CommunityAnswer.id == answer_id)
    res = await db.execute(stmt)
    answer = res.scalars().first()

    if not answer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Answer not found.")

    post = answer.post

    # Only post author or admin can accept solution
    if post.author_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the author who asked this question or an admin can mark an accepted solution."
        )

    # Unmark previous accepted answers on this post and revoke their points
    clear_stmt = select(CommunityAnswer).where(CommunityAnswer.post_id == post.id, CommunityAnswer.is_accepted == True)
    clear_res = await db.execute(clear_stmt)
    for prev_ans in clear_res.scalars().all():
        prev_ans.is_accepted = False
        await revoke_points(db=db, user_id=prev_ans.author_id, event_type=PointEvent.ANSWER_ACCEPTED, reference_type="community_answer", reference_id=prev_ans.id)

    # Mark current as accepted
    answer.is_accepted = True
    post.has_accepted_answer = True

    # Award points to answer author (only if they didn't answer their own question)
    tx = None
    if answer.author_id != post.author_id:
        tx = await award_points(db=db, user_id=answer.author_id, event_type=PointEvent.ANSWER_ACCEPTED, reference_type="community_answer", reference_id=answer.id)

    # Send notification
    await send_notification(
        db=db,
        user_id=answer.author_id,
        title="🌟 Answer Accepted as Solution!",
        message=f"Your answer to '{post.title[:50]}...' was selected as the accepted solution. +20 Points!",
        notification_type=NotificationType.COMMUNITY,
        link=f"/community/{post.id}"
    )

    await db.commit()
    return {"status": "success", "message": "Answer marked as verified solution.", "points_awarded": tx.points if tx else 0}

@router.post("/reports", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def report_content(
    report_in: ReportCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    report = Report(
        reporter_id=current_user.id,
        target_type=report_in.target_type,
        target_id=report_in.target_id,
        reason=report_in.reason,
        status=ReportStatus.PENDING,
        created_at=datetime.now(timezone.utc)
    )
    db.add(report)
    await db.commit()

    # Re-fetch report with reporter
    r_stmt = select(Report).options(selectinload(Report.reporter)).where(Report.id == report.id)
    r_res = await db.execute(r_stmt)
    return ReportResponse.model_validate(r_res.scalars().first())

import os
import uuid
import asyncio
from fastapi import File, UploadFile
from fastapi.responses import FileResponse
from app.models.community import CommunityAttachment
from app.core.config import settings
from app.core.file_validation import validate_upload

# Reuse constants
UPLOAD_DIR = settings.UPLOAD_DIR

@router.post("/posts/{post_id}/attachments")
async def upload_attachment(
    post_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(CommunityPost).where(CommunityPost.id == post_id)
    res = await db.execute(stmt)
    post = res.scalars().first()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    if post.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the author can upload attachments")

    if not file.filename:
        raise HTTPException(status_code=400, detail="Empty filename")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Unsupported file extension")

    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported MIME type")

    if file.size and file.size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail=f"File exceeds {MAX_FILE_SIZE//(1024*1024)}MB limit")
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail=f"File exceeds {MAX_FILE_SIZE//(1024*1024)}MB limit")

    unique_filename = f"{uuid.uuid4()}{ext}"
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    stored_path = os.path.join(UPLOAD_DIR, unique_filename)

    def write_file_sync(path, data):
        with open(path, 'wb') as out_file:
            out_file.write(data)

    await asyncio.to_thread(write_file_sync, stored_path, content)

    attachment = CommunityAttachment(
        post_id=post.id,
        original_filename=file.filename,
        stored_filename=unique_filename,
        mime_type=file.content_type,
        file_size=len(content),
        uploaded_by=current_user.id
    )
    db.add(attachment)
    await db.commit()
    await db.refresh(attachment)

    return {"id": attachment.id, "filename": attachment.original_filename}

@router.get("/attachments/{attachment_id}")
async def download_attachment(
    attachment_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(CommunityAttachment).options(selectinload(CommunityAttachment.post)).where(CommunityAttachment.id == attachment_id)
    res = await db.execute(stmt)
    attachment = res.scalars().first()

    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")

    file_path = os.path.join(UPLOAD_DIR, attachment.stored_filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File physically missing from server")

    return FileResponse(
        path=file_path,
        filename=attachment.original_filename,
        media_type=attachment.mime_type,
        content_disposition_type="inline"
    )

@router.post("/answers/{answer_id}/replies", response_model=ReplyResponse, status_code=status.HTTP_201_CREATED)
async def create_reply(
    answer_id: int,
    reply_in: ReplyCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(CommunityAnswer).options(selectinload(CommunityAnswer.post)).where(CommunityAnswer.id == answer_id)
    res = await db.execute(stmt)
    answer = res.scalars().first()

    if not answer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Answer not found.")

    if reply_in.parent_reply_id:
        parent_stmt = select(CommunityReply).where(CommunityReply.id == reply_in.parent_reply_id, CommunityReply.answer_id == answer_id)
        p_res = await db.execute(parent_stmt)
        if not p_res.scalars().first():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent reply not found.")

    reply = CommunityReply(
        answer_id=answer.id,
        author_id=current_user.id,
        parent_reply_id=reply_in.parent_reply_id,
        content=reply_in.content,
        upvotes_count=0,
        downvotes_count=0,
        is_hidden=False,
        created_at=datetime.now(timezone.utc)
    )
    db.add(reply)
    await db.flush()

    if answer.author_id != current_user.id and not reply_in.parent_reply_id:
        await send_notification(
            db=db,
            user_id=answer.author_id,
            title="New Reply to Your Answer",
            message=f"{current_user.full_name} replied to your answer.",
            notification_type=NotificationType.COMMUNITY,
            link=f"/community/{answer.post_id}"
        )

    await db.commit()

    r_stmt = select(CommunityReply).options(selectinload(CommunityReply.author), selectinload(CommunityReply.replies)).where(CommunityReply.id == reply.id)
    r_res = await db.execute(r_stmt)
    return ReplyResponse.model_validate(r_res.scalars().first())

@router.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(CommunityPost).where(CommunityPost.id == post_id)
    res = await db.execute(stmt)
    post = res.scalars().first()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    if post.author_id != current_user.id and current_user.role not in [UserRole.ADMIN, UserRole.MODERATOR]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this post")

    # 1. Fetch all answers to cascade point revocations
    ans_stmt = select(CommunityAnswer).where(CommunityAnswer.post_id == post.id)
    ans_res = await db.execute(ans_stmt)
    answers = ans_res.scalars().all()

    for ans in answers:
        if ans.is_accepted:
            await revoke_points(db=db, user_id=ans.author_id, event_type=PointEvent.ANSWER_ACCEPTED, reference_type="community_answer", reference_id=ans.id)
        await revoke_points(db=db, user_id=ans.author_id, event_type=PointEvent.COMMUNITY_ANSWER, reference_type="community_answer", reference_id=ans.id)

    # 2. Revoke question points
    await revoke_points(db=db, user_id=post.author_id, event_type=PointEvent.COMMUNITY_QUESTION, reference_type="community_post", reference_id=post.id)

    # 3. Delete post (which cascades deleting answers in DB)
    await db.delete(post)
    await db.commit()

@router.delete("/answers/{answer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_answer(
    answer_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(CommunityAnswer).where(CommunityAnswer.id == answer_id)
    res = await db.execute(stmt)
    ans = res.scalars().first()

    if not ans:
        raise HTTPException(status_code=404, detail="Answer not found")

    if ans.author_id != current_user.id and current_user.role not in [UserRole.ADMIN, UserRole.MODERATOR]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this answer")

    post_stmt = select(CommunityPost).where(CommunityPost.id == ans.post_id)
    post_res = await db.execute(post_stmt)
    post = post_res.scalars().first()

    if post:
        post.answers_count = max(0, post.answers_count - 1)
        if ans.is_accepted:
            post.has_accepted_answer = False
            await revoke_points(db=db, user_id=ans.author_id, event_type=PointEvent.ANSWER_ACCEPTED, reference_type="community_answer", reference_id=ans.id)

    # Revoke answer points
    await revoke_points(db=db, user_id=ans.author_id, event_type=PointEvent.COMMUNITY_ANSWER, reference_type="community_answer", reference_id=ans.id)

    await db.delete(ans)
    await db.commit()

@router.delete("/replies/{reply_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_reply(
    reply_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(CommunityReply).where(CommunityReply.id == reply_id)
    res = await db.execute(stmt)
    rep = res.scalars().first()

    if not rep:
        raise HTTPException(status_code=404, detail="Reply not found")

    if rep.author_id != current_user.id and current_user.role not in [UserRole.ADMIN, UserRole.MODERATOR]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this reply")

    await db.delete(rep)
    await db.commit()
