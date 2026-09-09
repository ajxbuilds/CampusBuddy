from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import desc, func

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User, UserRole
from app.models.community import (
    CommunityPost,
    CommunityAnswer,
    Vote,
    VoteTargetType,
    Report,
    ReportStatus,
)
from app.models.notification import NotificationType
from app.schemas.community import (
    PostCreate,
    PostResponse,
    PostDetailResponse,
    AnswerCreate,
    AnswerResponse,
    VoteCreate,
    ReportCreate,
    ReportResponse,
)
from app.services.gamification_service import (
    award_points,
    POINTS_ANSWER_POSTED,
    POINTS_HELPFUL_ANSWER,
    POINTS_ACCEPTED_ANSWER,
)
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
        stmt = stmt.order_by(desc(CommunityPost.upvotes_count + CommunityPost.answers_count * 2))
    elif sort_by == "unanswered":
        stmt = stmt.where(CommunityPost.answers_count == 0).order_by(desc(CommunityPost.created_at))
    elif sort_by == "helpful":
        stmt = stmt.order_by(desc(CommunityPost.upvotes_count))
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
        resp.has_voted = p.id in user_upvoted_ids
        results.append(resp)

    return results

@router.post("/posts", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
    post_in: PostCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
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

    await create_audit_log(
        db=db,
        actor_id=current_user.id,
        action="POST_CREATED",
        resource_type="COMMUNITY_POST",
        resource_id=str(post.id),
        details=f"Posted in {post.category}: {post.title}"
    )

    await db.commit()

    # Re-fetch with author
    stmt = select(CommunityPost).options(selectinload(CommunityPost.author)).where(CommunityPost.id == post.id)
    res = await db.execute(stmt)
    post_loaded = res.scalars().first()
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
            selectinload(CommunityPost.answers).selectinload(CommunityAnswer.author)
        )
        .where(CommunityPost.id == post_id, CommunityPost.is_hidden == False)
    )
    res = await db.execute(stmt)
    post = res.scalars().first()

    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found.")

    # Increment views
    post.views += 1
    await db.commit()

    # Fetch user votes
    user_post_voted = False
    voted_answer_ids = set()
    if current_user:
        pv_stmt = select(Vote).where(
            Vote.user_id == current_user.id,
            Vote.target_type == VoteTargetType.POST,
            Vote.target_id == post.id
        )
        pv_res = await db.execute(pv_stmt)
        user_post_voted = pv_res.scalars().first() is not None

        ans_ids = [a.id for a in post.answers]
        if ans_ids:
            av_stmt = select(Vote.target_id).where(
                Vote.user_id == current_user.id,
                Vote.target_type == VoteTargetType.ANSWER,
                Vote.target_id.in_(ans_ids)
            )
            av_res = await db.execute(av_stmt)
            voted_answer_ids = set(av_res.scalars().all())

    post_resp = PostDetailResponse.model_validate(post)
    post_resp.has_voted = user_post_voted
    for ans in post_resp.answers:
        ans.has_voted = ans.id in voted_answer_ids

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

    # Gamification: Award points to the answer author
    await award_points(
        db=db,
        user_id=current_user.id,
        points=POINTS_ANSWER_POSTED,
        reason="Answered a community peer question",
        reference_type="ANSWER_POSTED",
        reference_id=answer.id
    )

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
    a_stmt = select(CommunityAnswer).options(selectinload(CommunityAnswer.author)).where(CommunityAnswer.id == answer.id)
    a_res = await db.execute(a_stmt)
    return AnswerResponse.model_validate(a_res.scalars().first())

@router.post("/vote")
async def toggle_vote(
    vote_in: VoteCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Check existing vote
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
        t_res = await db.execute(target_stmt)
        target = t_res.scalars().first()
        author_id = target.author_id if target else None
    else:
        target_stmt = select(CommunityAnswer).where(CommunityAnswer.id == vote_in.target_id)
        t_res = await db.execute(target_stmt)
        target = t_res.scalars().first()
        author_id = target.author_id if target else None

    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target content not found.")

    if author_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot upvote your own contribution.")

    if existing_vote:
        # Toggle off (unvote)
        await db.delete(existing_vote)
        target.upvotes_count = max(0, target.upvotes_count - 1)
        action_taken = "unvoted"
    else:
        # Upvote
        new_vote = Vote(
            user_id=current_user.id,
            target_type=vote_in.target_type,
            target_id=vote_in.target_id,
            vote_type="UPVOTE",
            created_at=datetime.now(timezone.utc)
        )
        db.add(new_vote)
        target.upvotes_count += 1
        action_taken = "upvoted"

        # Award points to author for receiving helpful upvote
        if author_id:
            await award_points(
                db=db,
                user_id=author_id,
                points=POINTS_HELPFUL_ANSWER,
                reason="Received an upvote on community answer/post",
                reference_type="HELPFUL_UPVOTE",
                reference_id=vote_in.target_id
            )

    await db.commit()
    return {"status": "success", "action": action_taken, "new_upvotes": target.upvotes_count}

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

    # Unmark previous accepted answers on this post
    clear_stmt = select(CommunityAnswer).where(CommunityAnswer.post_id == post.id, CommunityAnswer.is_accepted == True)
    clear_res = await db.execute(clear_stmt)
    for prev_ans in clear_res.scalars().all():
        prev_ans.is_accepted = False

    # Mark current as accepted
    answer.is_accepted = True
    post.has_accepted_answer = True

    # Award points to answer author
    await award_points(
        db=db,
        user_id=answer.author_id,
        points=POINTS_ACCEPTED_ANSWER,
        reason="Answer accepted as the verified solution",
        reference_type="ACCEPTED_ANSWER",
        reference_id=answer.id
    )

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
    return {"status": "success", "message": "Answer marked as verified solution."}

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
