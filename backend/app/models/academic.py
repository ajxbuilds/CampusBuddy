from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class FacultyMember(Base):
    __tablename__ = "faculty_members"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    name = Column(String, nullable=False)
    designation = Column(String, nullable=False) # e.g. "Associate Professor & HOD", "Assistant Professor"
    department = Column(String, nullable=False) # e.g. "Computer Science & Engineering"
    email = Column(String, nullable=False, unique=True)
    phone = Column(String, nullable=True)
    cabin = Column(String, nullable=True) # e.g. "Academic Block A, Cabin 304"
    office_hours = Column(String, nullable=True) # e.g. "Mon-Thu 2:00 PM - 4:00 PM"
    avatar_url = Column(String, nullable=True)
    bio = Column(String, nullable=True)

    subjects = relationship("Subject", back_populates="faculty")

class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True, nullable=False) # e.g. "CS401"
    name = Column(String, nullable=False) # e.g. "Data Structures & Algorithms"
    department = Column(String, nullable=False)
    semester = Column(Integer, default=4)
    credits = Column(Integer, default=4)
    syllabus = Column(String, nullable=True)
    faculty_id = Column(Integer, ForeignKey("faculty_members.id", ondelete="SET NULL"), nullable=True)

    faculty = relationship("FacultyMember", back_populates="subjects")
    timetable_entries = relationship("TimetableEntry", back_populates="subject")
    exams = relationship("Exam", back_populates="subject")

class StudentSubject(Base):
    __tablename__ = "student_subjects"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    semester = Column(Integer, default=4)
    academic_year = Column(String, default="2025-2026")

    student = relationship("User", foreign_keys=[student_id])
    subject = relationship("Subject", foreign_keys=[subject_id])

class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    status = Column(String, default="PRESENT") # "PRESENT", "ABSENT"
    session_type = Column(String, default="LECTURE") # "LECTURE", "LAB", "TUTORIAL"
    remarks = Column(String, nullable=True)

    student = relationship("User", foreign_keys=[student_id])
    subject = relationship("Subject", foreign_keys=[subject_id])

class AcademicResult(Base):
    __tablename__ = "academic_results"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    semester = Column(Integer, default=4)
    internal_marks = Column(Integer, default=26) # Max 30
    external_marks = Column(Integer, default=62) # Max 70
    total_marks = Column(Integer, default=88) # Max 100
    grade = Column(String, default="A+")
    credits_earned = Column(Integer, default=4)

    student = relationship("User", foreign_keys=[student_id])
    subject = relationship("Subject", foreign_keys=[subject_id])

class TimetableEntry(Base):
    __tablename__ = "timetable_entries"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    faculty_id = Column(Integer, ForeignKey("faculty_members.id", ondelete="SET NULL"), nullable=True)
    day_of_week = Column(Integer, nullable=False) # 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday
    start_time = Column(String, nullable=False) # "09:00 AM"
    end_time = Column(String, nullable=False) # "10:00 AM"
    classroom = Column(String, nullable=False) # "Room 204", "Computer Lab 2"
    semester = Column(Integer, default=4)

    subject = relationship("Subject", back_populates="timetable_entries")
    faculty = relationship("FacultyMember")

class Exam(Base):
    __tablename__ = "exams"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    exam_type = Column(String, default="MIDTERM") # "INTERNAL", "MIDTERM", "FINAL", "PRACTICAL"
    date = Column(DateTime, nullable=False)
    time_str = Column(String, default="10:00 AM - 01:00 PM")
    room = Column(String, default="Examination Hall A")
    max_marks = Column(Integer, default=100)

    subject = relationship("Subject", back_populates="exams")
