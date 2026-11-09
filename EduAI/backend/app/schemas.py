import re
from datetime import date
from typing import Literal

from pydantic import AliasChoices, BaseModel, ConfigDict, Field, field_validator, model_validator


class RegisterRequest(BaseModel):
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=6, max_length=128)
    full_name: str = Field(
        min_length=1,
        max_length=120,
        validation_alias=AliasChoices("full_name", "name"),
    )
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
    model_config = ConfigDict(allow_inf_nan=False)

    study_hours: float = Field(ge=0, le=24)
    attendance: float = Field(ge=0, le=100)
    assignments: float = Field(ge=0, le=100)
    internal_marks: float = Field(ge=0, le=100)
    test_score: float = Field(ge=0, le=100)


class CareerRecommendationRequest(BaseModel):
    education_level: str = Field(default="", max_length=80)
    specialization: str = Field(default="", max_length=120)
    skills: list[str] = Field(default_factory=list, max_length=50)
    certifications: list[str] = Field(default_factory=list, max_length=50)
    cgpa_percentage: float = Field(default=0, ge=0, le=100)
    intelligences: dict[str, float] = Field(default_factory=dict)
    consent_to_ai_processing: bool = False


class JobRecommendationRequest(BaseModel):
    query: str = Field(min_length=2, max_length=160)
    location: str = Field(default="", max_length=120)
    education_level: str = Field(default="", max_length=80)
    skills: list[str] = Field(default_factory=list, max_length=50)
    certifications: list[str] = Field(default_factory=list, max_length=50)
    consent_to_ai_processing: bool = False

    @field_validator("query")
    @classmethod
    def trim_query(cls, value: str) -> str:
        value = value.strip()
        if len(value) < 2:
            raise ValueError("Enter at least two characters to find job-role suggestions.")
        return value


class SkillLevelUpdate(BaseModel):
    level: int = Field(ge=1, le=5)


class DocumentQuestion(BaseModel):
    document_id: str = Field(min_length=1, max_length=80)
    question: str = Field(min_length=1, max_length=2000)


class QuizGenerateRequest(BaseModel):
    topic: str = Field(min_length=1, max_length=160)
    difficulty: Literal["Easy", "Medium", "Hard"]
    question_count: int = Field(ge=1, le=20)


class RandomQuizGenerateRequest(BaseModel):
    question_count: int = Field(ge=1, le=5000)
    difficulty: Literal["Any", "Easy", "Medium", "Hard"] = "Any"


class DocumentQuizGenerateRequest(BaseModel):
    question_count: int = Field(ge=1, le=10)


class QuizSubmitRequest(BaseModel):
    quiz_id: str = Field(min_length=1, max_length=80)
    answers: dict[str, int]


class AgentChatRequest(BaseModel):
    prompt: str = Field(min_length=1, max_length=4000)
    context: dict[str, object] | None = None
    conversation_id: str | None = Field(default=None, min_length=1, max_length=80)

    @field_validator("prompt")
    @classmethod
    def trim_prompt(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Prompt cannot be empty.")
        return value


class AISummarizeRequest(BaseModel):
    text: str = Field(min_length=1, max_length=20000)
    language: Literal["auto", "English", "Hindi"] = "auto"

    @field_validator("text")
    @classmethod
    def trim_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Text to summarize cannot be empty.")
        return value


class AIQuestionRequest(BaseModel):
    question: str = Field(min_length=2, max_length=2000)

    @field_validator("question")
    @classmethod
    def trim_question(cls, value: str) -> str:
        value = value.strip()
        if len(value) < 2:
            raise ValueError("Question must be at least two characters.")
        return value


AIProviderName = Literal["gemini", "openai", "sambanova", "cohere"]


class AIProviderConfigUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    provider: AIProviderName
    enabled: bool
    model: str | None = Field(default=None, max_length=200)


class AIProviderSettingsUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    primary_provider: AIProviderName
    fallback_provider: AIProviderName
    providers: list[AIProviderConfigUpdate] = Field(min_length=4, max_length=4)

    @model_validator(mode="after")
    def validate_provider_selection(self) -> "AIProviderSettingsUpdate":
        if self.primary_provider == self.fallback_provider:
            raise ValueError("Primary and fallback providers must be different.")
        configured = {provider.provider for provider in self.providers}
        if configured != {"gemini", "openai", "sambanova", "cohere"}:
            raise ValueError("Settings for Gemini, OpenAI, SambaNova, and Cohere are required.")
        enabled = {provider.provider for provider in self.providers if provider.enabled}
        if self.primary_provider not in enabled:
            raise ValueError("The primary provider must be enabled.")
        return self


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

    @field_validator("target_date")
    @classmethod
    def validate_target_date(cls, value: str) -> str:
        try:
            return date.fromisoformat(value).isoformat()
        except ValueError as error:
            raise ValueError("Target date must use YYYY-MM-DD format.") from error

    @field_validator("title")
    @classmethod
    def trim_title(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Goal title cannot be empty.")
        return value

    @field_validator("milestones")
    @classmethod
    def trim_milestones(cls, value: list[str]) -> list[str]:
        milestones = [milestone.strip() for milestone in value]
        if any(not milestone for milestone in milestones):
            raise ValueError("Milestones cannot be empty.")
        return milestones


class HabitToggleResponse(BaseModel):
    id: str
    name: str
    streak_days: int
    completed_today: bool
