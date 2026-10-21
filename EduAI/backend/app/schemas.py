import re
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class RegisterRequest(BaseModel):
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=1, max_length=120)
    education_level: str = Field(default="", max_length=80)
    course: str = Field(default="", max_length=120)
    year: int = Field(default=1, ge=1, le=12)
    primary_interest: str = Field(default="", max_length=120)
    career_goal: str = Field(default="", max_length=160)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        value = value.strip().lower()
        if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", value):
            raise ValueError("Enter a valid email address.")
        return value

    @field_validator("full_name")
    @classmethod
    def trim_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Name cannot be empty.")
        return value


class LoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=1, max_length=128)


class ProfileUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    education_level: str | None = Field(default=None, max_length=80)
    course: str | None = Field(default=None, max_length=120)
    year: int | None = Field(default=None, ge=1, le=12)
    primary_interest: str | None = Field(default=None, max_length=120)
    career_goal: str | None = Field(default=None, max_length=160)
    institution: str | None = Field(default=None, max_length=160)
    cgpa: float | None = Field(default=None, ge=0, le=10)
    attendance: float | None = Field(default=None, ge=0, le=100)
    study_hours_weekly: float | None = Field(default=None, ge=0, le=168)
    preferences: dict[str, object] | None = None


class AcademicPredictionRequest(BaseModel):
    study_hours: float = Field(ge=0, le=24)
    attendance: float = Field(ge=0, le=100)
    resources: float | None = Field(default=None, ge=0, le=10)
    extracurricular: float | None = Field(default=None, ge=0, le=10)
    motivation: float | None = Field(default=None, ge=0, le=10)
    internet: float | None = Field(default=None, ge=0, le=10)
    gender: float | None = None
    age: float | None = Field(default=None, ge=10, le=100)
    learning_style: float | None = None
    online_courses: float | None = Field(default=None, ge=0, le=100)
    discussions: float | None = Field(default=None, ge=0, le=100)
    assignment_completion: float | None = Field(default=None, ge=0, le=100)
    exam_score: float | None = Field(default=None, ge=0, le=100)
    edutech: float | None = None
    stress_level: float | None = Field(default=None, ge=0, le=10)


class CareerRecommendationRequest(BaseModel):
    education_level: str = Field(default="", max_length=80)
    specialization: str = Field(default="", max_length=120)
    skills: list[str] = Field(default_factory=list, max_length=50)
    certifications: list[str] = Field(default_factory=list, max_length=50)
    cgpa_percentage: float = Field(default=0, ge=0, le=100)
    intelligences: dict[str, float] = Field(default_factory=dict)


class SkillLevelUpdate(BaseModel):
    level: int = Field(ge=1, le=5)


class DocumentQuestion(BaseModel):
    document_id: str = Field(min_length=1, max_length=80)
    question: str = Field(min_length=1, max_length=2000)


class QuizGenerateRequest(BaseModel):
    topic: str = Field(min_length=1, max_length=160)
    difficulty: Literal["Easy", "Medium", "Hard"]
    question_count: int = Field(ge=1, le=20)


class QuizSubmitRequest(BaseModel):
    quiz_id: str = Field(min_length=1, max_length=80)
    answers: dict[str, int]


class AgentChatRequest(BaseModel):
    prompt: str = Field(min_length=1, max_length=4000)
    context: dict[str, object] | None = None


class InterviewStartRequest(BaseModel):
    role: str = Field(min_length=1, max_length=160)
    type: Literal["Technical", "HR", "Behavioral"]


class InterviewResponseRequest(BaseModel):
    session_id: str = Field(min_length=1, max_length=80)
    answer: str = Field(min_length=1, max_length=4000)


class GoalCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    target_date: str = Field(min_length=1, max_length=40)
    milestones: list[str] = Field(default_factory=list, max_length=30)


class HabitToggleResponse(BaseModel):
    id: str
    name: str
    streak_days: int
    completed_today: bool
