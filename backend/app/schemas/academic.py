from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

class FacultyResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    name: str
    designation: str
    department: str
    email: str
    phone: Optional[str] = None
    cabin: Optional[str] = None
    office_hours: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None

    class Config:
        from_attributes = True

class SubjectResponse(BaseModel):
    id: int
    code: str
    name: str
    department: str
    semester: int
    credits: int
    syllabus: Optional[str] = None
    faculty_id: Optional[int] = None
    faculty: Optional[FacultyResponse] = None

    class Config:
        from_attributes = True

class AttendanceRecordResponse(BaseModel):
    id: int
    student_id: int
    subject_id: int
    subject_code: Optional[str] = None
    subject_name: Optional[str] = None
    date: datetime
    status: str
    session_type: str
    remarks: Optional[str] = None

    class Config:
        from_attributes = True

class SubjectAttendanceSummary(BaseModel):
    subject_id: int
    subject_code: str
    subject_name: str
    total_sessions: int
    attended_sessions: int
    percentage: float
    is_low_attendance: bool

class AttendanceSummaryResponse(BaseModel):
    overall_percentage: float
    total_sessions: int
    attended_sessions: int
    absent_sessions: int
    has_low_attendance: bool
    subject_breakdown: List[SubjectAttendanceSummary]

class AttendanceMarkRequest(BaseModel):
    student_id: int
    subject_id: int
    status: str # "PRESENT", "ABSENT"
    session_type: Optional[str] = "LECTURE"
    date: Optional[datetime] = None
    remarks: Optional[str] = None

class AcademicResultResponse(BaseModel):
    id: int
    subject_id: int
    subject_code: Optional[str] = None
    subject_name: Optional[str] = None
    semester: int
    internal_marks: int
    external_marks: int
    total_marks: int
    grade: str
    credits_earned: int

    class Config:
        from_attributes = True

class StudentAcademicSummary(BaseModel):
    sgpa: float
    cgpa: float
    total_credits: int
    academic_standing: str
    results: List[AcademicResultResponse]

class TimetableEntryResponse(BaseModel):
    id: int
    subject_id: int
    subject_code: Optional[str] = None
    subject_name: Optional[str] = None
    faculty_name: Optional[str] = None
    day_of_week: int
    day_name: Optional[str] = None
    start_time: str
    end_time: str
    classroom: str
    semester: int

    class Config:
        from_attributes = True

class TimetableOverviewResponse(BaseModel):
    today_day: int
    today_classes: List[TimetableEntryResponse]
    next_class: Optional[TimetableEntryResponse] = None
    weekly_schedule: List[TimetableEntryResponse]

class ExamResponse(BaseModel):
    id: int
    subject_id: int
    subject_code: Optional[str] = None
    subject_name: Optional[str] = None
    exam_type: str
    date: datetime
    time_str: str
    room: str
    max_marks: int

    class Config:
        from_attributes = True
