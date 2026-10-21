import json
import os
import re
import sqlite3
import uuid
from contextlib import asynccontextmanager
from datetime import date, datetime, timedelta, timezone
from io import BytesIO
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from docx import Document
from fastapi import Depends, FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pypdf import PdfReader

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

from .database import connect, initialize_database
from .schemas import (
    AcademicPredictionRequest,
    AgentChatRequest,
    CareerRecommendationRequest,
    DocumentQuestion,
    GoalCreateRequest,
    InterviewResponseRequest,
    InterviewStartRequest,
    LoginRequest,
    ProfileUpdate,
    QuizGenerateRequest,
    QuizSubmitRequest,
    RegisterRequest,
    SkillLevelUpdate,
)
from .security import (
    create_access_token,
    hash_password,
    read_access_token,
    validate_secret,
    verify_password,
)


@asynccontextmanager
async def lifespan(_: FastAPI):
    validate_secret()
    initialize_database()
    yield


app = FastAPI(
    title="EduAI API",
    description="Local API for the EduAI learning dashboard and student tools.",
    version="1.0.0",
    lifespan=lifespan,
)

origins = [
    origin.strip()
    for origin in os.getenv(
        "EDUAI_CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

bearer_scheme = HTTPBearer(auto_error=False)
MAX_UPLOAD_BYTES = 10 * 1024 * 1024


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def iso_now() -> str:
    return utc_now().isoformat()


def json_value(value: Any) -> Any:
    return json.loads(value) if isinstance(value, str) else value


def public_user(row: sqlite3.Row) -> dict[str, str]:
    return {
        "id": row["id"],
        "email": row["email"],
        "full_name": row["full_name"],
        "role": row["role"],
        "created_at": row["created_at"],
    }


def public_profile(row: sqlite3.Row | None) -> dict[str, Any] | None:
    if row is None:
        return None
    result = dict(row)
    result["id"] = result["user_id"]
    result["preferences"] = json_value(result["preferences"])
    return result


def current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> sqlite3.Row:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="A valid bearer token is required.")
    user_id = read_access_token(credentials.credentials)
    if user_id is None:
        raise HTTPException(status_code=401, detail="The access token is invalid or expired.")
    with connect() as connection:
        user = connection.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    if user is None:
        raise HTTPException(status_code=401, detail="The account for this token no longer exists.")
    return user


def profile_for(user_id: str) -> dict[str, Any] | None:
    with connect() as connection:
        row = connection.execute("SELECT * FROM profiles WHERE user_id = ?", (user_id,)).fetchone()
    return public_profile(row)


def require_owned_row(
    connection: sqlite3.Connection,
    table: str,
    record_id: str,
    user_id: str,
) -> sqlite3.Row:
    allowed_tables = {"documents", "quizzes", "interviews"}
    if table not in allowed_tables:
        raise ValueError("Unsupported table.")
    row = connection.execute(
        f"SELECT * FROM {table} WHERE id = ? AND user_id = ?",
        (record_id, user_id),
    ).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="The requested item was not found.")
    return row


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "eduai-backend"}


@app.post("/api/auth/register")
def register(payload: RegisterRequest) -> dict[str, Any]:
    user_id = str(uuid.uuid4())
    created_at = iso_now()
    try:
        with connect() as connection:
            connection.execute(
                """
                INSERT INTO users (id, email, password_hash, full_name, created_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (user_id, payload.email, hash_password(payload.password), payload.full_name, created_at),
            )
            connection.execute(
                """
                INSERT INTO profiles (
                    user_id, education_level, course, year, primary_interest, career_goal, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    user_id,
                    payload.education_level,
                    payload.course,
                    payload.year,
                    payload.primary_interest,
                    payload.career_goal,
                    created_at,
                ),
            )
            user = connection.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
            profile = connection.execute("SELECT * FROM profiles WHERE user_id = ?", (user_id,)).fetchone()
    except sqlite3.IntegrityError as error:
        if "users.email" in str(error):
            raise HTTPException(status_code=409, detail="An account with this email already exists.") from error
        raise
    return {
        "access_token": create_access_token(user_id),
        "token_type": "bearer",
        "user": public_user(user),
        "profile": public_profile(profile),
    }


@app.post("/api/auth/login")
def login(payload: LoginRequest) -> dict[str, Any]:
    with connect() as connection:
        user = connection.execute(
            "SELECT * FROM users WHERE email = ? COLLATE NOCASE",
            (payload.email.strip(),),
        ).fetchone()
        profile = (
            connection.execute("SELECT * FROM profiles WHERE user_id = ?", (user["id"],)).fetchone()
            if user
            else None
        )
    if user is None or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Email or password is incorrect.")
    return {
        "access_token": create_access_token(user["id"]),
        "token_type": "bearer",
        "user": public_user(user),
        "profile": public_profile(profile),
    }


@app.get("/api/auth/me")
def get_me(user: sqlite3.Row = Depends(current_user)) -> dict[str, Any]:
    return {"user": public_user(user), "profile": profile_for(user["id"])}


@app.get("/api/student/profile")
def get_student_profile(user: sqlite3.Row = Depends(current_user)) -> dict[str, Any]:
    profile = profile_for(user["id"])
    if profile is None:
        raise HTTPException(status_code=404, detail="Student profile was not found.")
    return profile


@app.put("/api/student/profile")
def update_student_profile(
    payload: ProfileUpdate,
    user: sqlite3.Row = Depends(current_user),
) -> dict[str, Any]:
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        profile = profile_for(user["id"])
        if profile is None:
            raise HTTPException(status_code=404, detail="Student profile was not found.")
        return profile
    if "preferences" in updates:
        updates["preferences"] = json.dumps(updates["preferences"])
    columns = ", ".join(f"{column} = ?" for column in updates)
    values = [*updates.values(), user["id"]]
    with connect() as connection:
        connection.execute(f"UPDATE profiles SET {columns} WHERE user_id = ?", values)
        row = connection.execute("SELECT * FROM profiles WHERE user_id = ?", (user["id"],)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Student profile was not found.")
    return public_profile(row) or {}


@app.post("/api/performance/predict")
def predict_performance(
    payload: AcademicPredictionRequest,
    user: sqlite3.Row = Depends(current_user),
) -> dict[str, Any]:
    study_mark = min(payload.study_hours * 10.0, 100.0)
    components = {
        "exam_score": payload.exam_score if payload.exam_score is not None else min(90.0, 40.0 + payload.study_hours * 4.0),
        "attendance": payload.attendance,
        "study_hours": study_mark,
    }
    predicted = round(
        components["exam_score"] * 0.5
        + components["attendance"] * 0.25
        + components["study_hours"] * 0.25,
        1,
    )
    level = "Exceptional" if predicted >= 85 else "Proficient" if predicted >= 70 else "Average" if predicted >= 50 else "At Risk"
    risk_factors = []
    if payload.attendance < 75:
        risk_factors.append("Attendance is below 75%.")
    if payload.study_hours < 5:
        risk_factors.append("Weekly study time may be too low for the current goals.")
    recommendations = []
    if payload.attendance < 85:
        recommendations.append("Build a consistent attendance routine and review missed material.")
    if payload.study_hours < 10:
        recommendations.append("Schedule focused study sessions throughout the week.")
    if not recommendations:
        recommendations.append("Maintain your current routine and use practice questions to check understanding.")
    result = {
        "predicted_final_marks": predicted,
        "performance_level": level,
        "confidence": 0.55,
        "risk_factors": risk_factors,
        "recommendations": recommendations,
        "feature_contributions": {
            "exam_score": round(components["exam_score"] * 0.5, 1),
            "attendance": round(components["attendance"] * 0.25, 1),
            "study_hours": round(components["study_hours"] * 0.25, 1),
        },
    }
    with connect() as connection:
        connection.execute(
            "INSERT INTO predictions (id, user_id, result, created_at) VALUES (?, ?, ?, ?)",
            (str(uuid.uuid4()), user["id"], json.dumps(result), iso_now()),
        )
    return result


@app.get("/api/performance/analytics")
def performance_analytics(user: sqlite3.Row = Depends(current_user)) -> dict[str, Any]:
    with connect() as connection:
        rows = connection.execute(
            "SELECT result FROM predictions WHERE user_id = ? ORDER BY created_at DESC LIMIT 20",
            (user["id"],),
        ).fetchall()
    results = [json_value(row["result"]) for row in rows]
    values = [float(item["predicted_final_marks"]) for item in reversed(results)]
    trend = "stable"
    if len(values) > 1:
        change = values[-1] - values[0]
        trend = "improving" if change > 3 else "declining" if change < -3 else "stable"
    profile = profile_for(user["id"]) or {}
    return {
        "historical_predictions": results,
        "trend": trend,
        "attendance_rate": profile.get("attendance") or 0,
        "avg_study_hours": profile.get("study_hours_weekly") or 0,
    }


CAREER_CATALOG = [
    {
        "career_title": "Software Engineer",
        "category": "Technology",
        "skills": ["programming", "python", "javascript", "problem solving", "software development"],
        "key_prerequisites": ["Programming fundamentals", "Data structures", "Version control"],
        "market_demand": "Very High",
        "median_salary_range": "Varies by location and experience",
        "roadmap_summary": "Build software fundamentals, ship projects, and practice technical interviews.",
    },
    {
        "career_title": "Data Analyst",
        "category": "Data & Analytics",
        "skills": ["sql", "statistics", "python", "data analysis", "visualization", "excel"],
        "key_prerequisites": ["Spreadsheets", "SQL", "Statistics"],
        "market_demand": "High",
        "median_salary_range": "Varies by location and experience",
        "roadmap_summary": "Learn SQL and statistics, then publish clear analysis projects.",
    },
    {
        "career_title": "UX/UI Designer",
        "category": "Design",
        "skills": ["design", "user research", "figma", "prototyping", "communication"],
        "key_prerequisites": ["Visual design fundamentals", "User research", "Prototyping"],
        "market_demand": "Stable",
        "median_salary_range": "Varies by location and experience",
        "roadmap_summary": "Practice user research and build a case-study based design portfolio.",
    },
    {
        "career_title": "Cybersecurity Analyst",
        "category": "Security",
        "skills": ["cybersecurity", "networking", "linux", "security", "problem solving"],
        "key_prerequisites": ["Networking", "Linux fundamentals", "Security basics"],
        "market_demand": "High",
        "median_salary_range": "Varies by location and experience",
        "roadmap_summary": "Learn networking and defensive security, then build a lab portfolio.",
    },
]


@app.post("/api/career/recommend")
def recommend_careers(
    payload: CareerRecommendationRequest,
    user: sqlite3.Row = Depends(current_user),
) -> dict[str, Any]:
    requested_skills = {skill.strip().lower() for skill in payload.skills if skill.strip()}
    requested_skills.update(
        skill.strip().lower() for skill in payload.specialization.split(",") if skill.strip()
    )
    ranked = []
    for entry in CAREER_CATALOG:
        matched = requested_skills.intersection(entry["skills"])
        score = min(96, 55 + len(matched) * 9 + (5 if payload.cgpa_percentage >= 75 else 0))
        ranked.append(
            {
                "career_title": entry["career_title"],
                "recommendation_score": score,
                "model_confidence": round(min(0.92, 0.62 + len(matched) * 0.06), 2),
                "category": entry["category"],
                "key_prerequisites": entry["key_prerequisites"],
                "market_demand": entry["market_demand"],
                "median_salary_range": entry["median_salary_range"],
                "roadmap_summary": entry["roadmap_summary"],
            }
        )
    ranked.sort(key=lambda item: item["recommendation_score"], reverse=True)
    strengths = sorted(requested_skills)[:6]
    return {
        "top_recommendations": ranked[:4],
        "identified_strengths": strengths,
        "suitability_score": round(sum(item["recommendation_score"] for item in ranked[:3]) / 3),
    }


@app.get("/api/career/roadmap")
def career_roadmap(
    title: str = Query(min_length=1, max_length=160),
    _: sqlite3.Row = Depends(current_user),
) -> dict[str, Any]:
    career = next((item for item in CAREER_CATALOG if item["career_title"].lower() == title.lower()), None)
    if career is None:
        raise HTTPException(status_code=404, detail="No roadmap is available for that career yet.")
    return {
        "career": career["career_title"],
        "phases": [
            {
                "phase": 1,
                "title": "Build the foundations",
                "duration_weeks": 6,
                "milestones": career["key_prerequisites"],
                "projects": ["Complete a small portfolio project using the core skills."],
            },
            {
                "phase": 2,
                "title": "Demonstrate your skills",
                "duration_weeks": 8,
                "milestones": ["Publish a portfolio", "Request structured feedback"],
                "projects": [career["roadmap_summary"]],
            },
        ],
    }


SKILL_CATALOG = [
    ("python", "Python", "Programming", 3, ["Build a small data project"]),
    ("sql", "SQL", "Data", 3, ["Design and query a sample database"]),
    ("communication", "Communication", "Professional", 3, ["Present a project summary"]),
    ("problem-solving", "Problem Solving", "Professional", 4, ["Practice structured problem solving"]),
    ("data-analysis", "Data Analysis", "Data", 3, ["Analyze and visualize a public dataset"]),
    ("web-development", "Web Development", "Programming", 3, ["Build an accessible web application"]),
]


def skill_graph_for(user_id: str) -> dict[str, Any]:
    with connect() as connection:
        saved = {
            row["skill_id"]: row["level"]
            for row in connection.execute("SELECT skill_id, level FROM skills WHERE user_id = ?", (user_id,))
        }
    skills = []
    for skill_id, name, category, required, projects in SKILL_CATALOG:
        level = saved.get(skill_id, 2)
        status = "mastered" if level >= required else "weak" if level <= 1 else "learning"
        skills.append(
            {
                "id": skill_id,
                "name": name,
                "category": category,
                "level": level,
                "required_level": required,
                "status": status,
                "gap": max(0, required - level),
                "projects": projects,
                "resources": [],
            }
        )
    return {
        "skills": skills,
        "edges": [
            {"source": "python", "target": "data-analysis", "strength": 0.8},
            {"source": "sql", "target": "data-analysis", "strength": 0.8},
            {"source": "communication", "target": "problem-solving", "strength": 0.4},
            {"source": "web-development", "target": "problem-solving", "strength": 0.5},
        ],
    }


@app.get("/api/skills/graph")
def get_skill_graph(user: sqlite3.Row = Depends(current_user)) -> dict[str, Any]:
    return skill_graph_for(user["id"])


@app.patch("/api/skills/{skill_id}")
def update_skill(
    skill_id: str,
    payload: SkillLevelUpdate,
    user: sqlite3.Row = Depends(current_user),
) -> dict[str, Any]:
    if skill_id not in {skill[0] for skill in SKILL_CATALOG}:
        raise HTTPException(status_code=404, detail="Skill was not found.")
    with connect() as connection:
        connection.execute(
            """
            INSERT INTO skills (user_id, skill_id, level) VALUES (?, ?, ?)
            ON CONFLICT(user_id, skill_id) DO UPDATE SET level = excluded.level
            """,
            (user["id"], skill_id, payload.level),
        )
    return next(skill for skill in skill_graph_for(user["id"])["skills"] if skill["id"] == skill_id)


@app.get("/api/skills/gap")
def get_skill_gaps(
    career: str = Query(min_length=1, max_length=160),
    user: sqlite3.Row = Depends(current_user),
) -> dict[str, Any]:
    match = next((item for item in CAREER_CATALOG if item["career_title"].lower() == career.lower()), None)
    if match is None:
        raise HTTPException(status_code=404, detail="No skill map is available for that career.")
    graph = skill_graph_for(user["id"])
    mastered = {skill["name"].lower() for skill in graph["skills"] if skill["level"] >= 4}
    required = {item.lower() for item in match["skills"]}
    return {
        "mastered": sorted(required.intersection(mastered)),
        "in_progress": sorted(required.intersection({s["name"].lower() for s in graph["skills"]}) - mastered),
        "missing": sorted(required - {s["name"].lower() for s in graph["skills"]}),
        "recommended_courses": [],
    }


def extract_document_text(filename: str, content_type: str, data: bytes) -> str:
    suffix = Path(filename).suffix.lower()
    if suffix in {".txt", ".md"} or content_type.startswith("text/"):
        return data.decode("utf-8-sig", errors="replace")
    if suffix == ".pdf" or content_type == "application/pdf":
        return "\n".join(page.extract_text() or "" for page in PdfReader(BytesIO(data)).pages)
    if suffix == ".docx" or content_type.endswith("wordprocessingml.document"):
        document = Document(BytesIO(data))
        return "\n".join(paragraph.text for paragraph in document.paragraphs)
    raise HTTPException(status_code=415, detail="Upload a UTF-8 text, Markdown, PDF, or DOCX document.")


async def read_upload(file: UploadFile) -> tuple[str, str]:
    filename = Path(file.filename or "upload").name
    data = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Files must be 10 MB or smaller.")
    try:
        text = extract_document_text(filename, file.content_type or "", data).strip()
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=422, detail="The uploaded document could not be read.") from error
    if not text:
        raise HTTPException(status_code=422, detail="No readable text was found in the uploaded document.")
    return filename, text[:500_000]


def document_summary(document_id: str, filename: str, content: str) -> dict[str, Any]:
    sentences = [part.strip() for part in re.split(r"(?<=[.!?])\s+|\n+", content) if len(part.strip()) > 20]
    words = re.findall(r"\b[\w'-]{4,}\b", content.lower())
    frequent = []
    for word in words:
        if word not in {"this", "that", "with", "from", "have", "were", "which", "their", "about", "there"}:
            if word not in frequent:
                frequent.append(word)
            if len(frequent) >= 8:
                break
    concepts = [word.title() for word in frequent[:5]]
    return {
        "id": document_id,
        "filename": filename,
        "file_type": Path(filename).suffix.lstrip(".").upper() or "TEXT",
        "summary": " ".join(sentences[:3])[:700] or content[:700],
        "key_concepts": concepts,
        "definitions": [],
        "important_questions": [f"What are the main ideas in {filename}?"],
        "flashcards": [
            {"front": f"What is an important idea about {concept}?", "back": next((s for s in sentences if concept.lower() in s.lower()), content[:240])}
            for concept in concepts[:4]
        ],
    }


@app.post("/api/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    user: sqlite3.Row = Depends(current_user),
) -> dict[str, Any]:
    filename, content = await read_upload(file)
    document_id = str(uuid.uuid4())
    with connect() as connection:
        connection.execute(
            "INSERT INTO documents (id, user_id, filename, content, created_at) VALUES (?, ?, ?, ?, ?)",
            (document_id, user["id"], filename, content, iso_now()),
        )
    return document_summary(document_id, filename, content)


@app.post("/api/documents/ask")
def ask_document(
    payload: DocumentQuestion,
    user: sqlite3.Row = Depends(current_user),
) -> dict[str, Any]:
    with connect() as connection:
        row = require_owned_row(connection, "documents", payload.document_id, user["id"])
    question_terms = set(re.findall(r"\w+", payload.question.lower()))
    paragraphs = [part.strip() for part in re.split(r"\n+|(?<=[.!?])\s+", row["content"]) if part.strip()]
    relevant = sorted(
        paragraphs,
        key=lambda paragraph: len(question_terms.intersection(re.findall(r"\w+", paragraph.lower()))),
        reverse=True,
    )
    excerpt = relevant[0] if relevant else row["content"][:500]
    return {
        "answer": f"Based on {row['filename']}: {excerpt[:700]}",
        "citations": [{"page": 1, "excerpt": excerpt[:240]}],
    }


@app.get("/api/documents/{document_id}/flashcards")
def get_flashcards(document_id: str, user: sqlite3.Row = Depends(current_user)) -> dict[str, Any]:
    with connect() as connection:
        row = require_owned_row(connection, "documents", document_id, user["id"])
    return {"flashcards": document_summary(document_id, row["filename"], row["content"])["flashcards"]}


def make_quiz_questions(topic: str, difficulty: str, count: int) -> list[dict[str, Any]]:
    templates = [
        {
            "question": f"Which action best checks whether you understand {topic}?",
            "options": ["Reread the same page without pausing", "Explain the idea from memory and check for gaps", "Highlight every sentence", "Skip practice"],
            "correct_index": 1,
            "explanation": f"Explaining {topic} from memory helps reveal what you understand and what needs review.",
        },
        {
            "question": f"How should you begin applying {topic} to an unfamiliar problem?",
            "options": ["Identify the relevant concept and work through the steps", "Copy an unrelated answer", "Ignore the problem details", "Guess without checking"],
            "correct_index": 0,
            "explanation": f"Connect the problem to a relevant concept in {topic}, then check each step.",
        },
        {
            "question": f"What is a useful way to review {topic} over time?",
            "options": ["Study it once and never revisit it", "Practice retrieval at spaced intervals", "Only review familiar sections", "Avoid feedback"],
            "correct_index": 1,
            "explanation": "Spaced retrieval practice helps strengthen long-term recall.",
        },
        {
            "question": f"When comparing two ideas from {topic}, what should you do?",
            "options": ["List their similarities and differences using examples", "Assume they mean the same thing", "Ignore evidence", "Memorize their names only"],
            "correct_index": 0,
            "explanation": "Comparing examples and evidence makes similarities and differences clearer.",
        },
        {
            "question": f"What should you do after getting a practice question about {topic} wrong?",
            "options": ["Review the reasoning, correct the gap, and try a similar question", "Skip all future practice", "Memorize only the answer letter", "Avoid checking the explanation"],
            "correct_index": 0,
            "explanation": "Reviewing the reasoning and trying again turns mistakes into useful feedback.",
        },
    ]
    return [
        {"id": str(index + 1), **templates[index % len(templates)], "difficulty": difficulty, "topic": topic}
        for index in range(count)
    ]


@app.post("/api/quiz/generate")
def generate_quiz(
    payload: QuizGenerateRequest,
    user: sqlite3.Row = Depends(current_user),
) -> dict[str, Any]:
    quiz_id = str(uuid.uuid4())
    questions = make_quiz_questions(payload.topic, payload.difficulty, payload.question_count)
    with connect() as connection:
        connection.execute(
            "INSERT INTO quizzes (id, user_id, questions, created_at) VALUES (?, ?, ?, ?)",
            (quiz_id, user["id"], json.dumps(questions), iso_now()),
        )
    return {
        "quiz_id": quiz_id,
        "questions": [
            {
                key: value
                for key, value in question.items()
                if key not in {"correct_index", "explanation"}
            }
            for question in questions
        ],
    }


@app.post("/api/quiz/submit")
def submit_quiz(
    payload: QuizSubmitRequest,
    user: sqlite3.Row = Depends(current_user),
) -> dict[str, Any]:
    with connect() as connection:
        row = require_owned_row(connection, "quizzes", payload.quiz_id, user["id"])
    questions = json_value(row["questions"])
    correct = sum(
        1 for question in questions
        if payload.answers.get(question["id"]) == question["correct_index"]
    )
    total = len(questions)
    accuracy = round(correct / total * 100, 1) if total else 0
    weak_topics = sorted({question["topic"] for question in questions if payload.answers.get(question["id"]) != question["correct_index"]})
    strong_topics = sorted({question["topic"] for question in questions if payload.answers.get(question["id"]) == question["correct_index"]})
    return {
        "score": correct,
        "total_questions": total,
        "accuracy": accuracy,
        "time_seconds": 0,
        "weak_topics": weak_topics,
        "strong_topics": strong_topics,
        "recommended_actions": ["Review the missed questions and retry with a new practice set."] if weak_topics else ["Keep practicing to reinforce your understanding."],
    }


@app.post("/api/agent/chat")
def agent_chat(
    payload: AgentChatRequest,
    user: sqlite3.Row = Depends(current_user),
) -> dict[str, Any]:
    prompt = payload.prompt.strip()
    response = (
        "The local EduAI assistant is connected. I can help you plan a study session, "
        "break a goal into steps, or explain material you upload. "
        "For generated AI answers, configure an AI provider in the backend before deployment."
    )
    if any(term in prompt.lower() for term in ("study plan", "study schedule", "study routine")):
        response = "Try two focused 25-minute study blocks, a 5-minute break, and a short active-recall review. Adjust the subjects and timing to your schedule."
    return {
        "id": str(uuid.uuid4()),
        "sender": "agent",
        "text": response,
        "timestamp": iso_now(),
        "suggested_actions": ["Create a study goal", "Upload a document"],
    }


@app.get("/api/agent/tools")
def agent_tools(_: sqlite3.Row = Depends(current_user)) -> dict[str, Any]:
    return {
        "tools": [
            {"name": "study_planning", "description": "Create a practical study routine.", "parameters": {"type": "object"}},
            {"name": "document_learning", "description": "Ask questions about an uploaded study document.", "parameters": {"type": "object"}},
            {"name": "goal_tracking", "description": "Review and plan learning goals.", "parameters": {"type": "object"}},
        ]
    }


@app.post("/api/resume/analyze")
async def analyze_resume(
    file: UploadFile = File(...),
    user: sqlite3.Row = Depends(current_user),
) -> dict[str, Any]:
    _, content = await read_upload(file)
    text = content.lower()
    skills = ["python", "sql", "javascript", "react", "communication", "project management", "data analysis", "leadership"]
    detected = [skill for skill in skills if skill in text]
    missing = [skill for skill in ("communication", "project management", "data analysis") if skill not in detected]
    score = min(95, 45 + min(len(content) // 100, 20) + len(detected) * 4)
    suggestions = [
        "Add measurable outcomes to experience bullets.",
        "Tailor the skills section to the role you are applying for.",
    ]
    if len(content) < 300:
        suggestions.insert(0, "Add more detail about projects, experience, and results.")
    return {
        "ats_score": score,
        "detected_skills": detected,
        "missing_skills": missing,
        "suggestions": suggestions,
        "bullet_point_improvements": [],
    }


INTERVIEW_QUESTIONS = {
    "Technical": "Describe a technical project you worked on and one trade-off you made.",
    "HR": "What kind of team environment helps you do your best work?",
    "Behavioral": "Tell me about a time you faced a challenging problem and how you handled it.",
}


@app.post("/api/interview/start")
def start_interview(
    payload: InterviewStartRequest,
    user: sqlite3.Row = Depends(current_user),
) -> dict[str, str]:
    session_id = str(uuid.uuid4())
    with connect() as connection:
        connection.execute(
            """
            INSERT INTO interviews (id, user_id, role, interview_type, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (session_id, user["id"], payload.role, payload.type, iso_now()),
        )
    return {"session_id": session_id, "first_question": INTERVIEW_QUESTIONS[payload.type]}


@app.post("/api/interview/respond")
def respond_interview(
    payload: InterviewResponseRequest,
    user: sqlite3.Row = Depends(current_user),
) -> dict[str, Any]:
    with connect() as connection:
        session = require_owned_row(connection, "interviews", payload.session_id, user["id"])
        turn = session["turn"] + 1
        connection.execute("UPDATE interviews SET turn = ? WHERE id = ?", (turn, session["id"]))
    answer = payload.answer.strip()
    clarity = min(100, 35 + len(answer.split()) * 2)
    complete = turn >= 4
    return {
        "feedback": {
            "clarity": clarity,
            "technical_accuracy": min(100, 40 + len(answer.split())),
            "confidence_indicator": "Developing" if clarity < 70 else "Strong",
            "notes": ["Use a specific example and explain your reasoning.", "Keep the answer structured and concise."],
        },
        "next_question": None if complete else f"What did you learn from that experience in your {session['role']} work?",
        "is_complete": complete,
    }


@app.get("/api/jobs/search")
def search_jobs(
    q: str = Query(default="", max_length=160),
    loc: str = Query(default="", max_length=120),
    _: sqlite3.Row = Depends(current_user),
) -> dict[str, list[Any]]:
    # Avoid inventing live listings; configure a trusted jobs provider to populate results.
    return {"jobs": []}


@app.get("/api/goals")
def list_goals(user: sqlite3.Row = Depends(current_user)) -> list[dict[str, Any]]:
    with connect() as connection:
        rows = connection.execute(
            "SELECT id, title, progress, target_date, milestones FROM goals WHERE user_id = ? ORDER BY created_at DESC",
            (user["id"],),
        ).fetchall()
    return [
        {
            "id": row["id"],
            "title": row["title"],
            "progress": row["progress"],
            "deadline": row["target_date"],
            "tasks": json_value(row["milestones"]),
        }
        for row in rows
    ]


@app.post("/api/goals", status_code=201)
def create_goal(
    payload: GoalCreateRequest,
    user: sqlite3.Row = Depends(current_user),
) -> dict[str, Any]:
    goal_id = str(uuid.uuid4())
    with connect() as connection:
        connection.execute(
            """
            INSERT INTO goals (id, user_id, title, target_date, milestones, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (goal_id, user["id"], payload.title.strip(), payload.target_date, json.dumps(payload.milestones), iso_now()),
        )
    return {
        "id": goal_id,
        "title": payload.title.strip(),
        "progress": 0,
        "deadline": payload.target_date,
        "tasks": payload.milestones,
    }


@app.get("/api/habits")
def list_habits(user: sqlite3.Row = Depends(current_user)) -> list[dict[str, Any]]:
    defaults = ["Focused study", "Review notes", "Take a learning break"]
    today = date.today().isoformat()
    with connect() as connection:
        for name in defaults:
            connection.execute(
                "INSERT OR IGNORE INTO habits (id, user_id, name) VALUES (?, ?, ?)",
                (str(uuid.uuid4()), user["id"], name),
            )
        rows = connection.execute(
            "SELECT id, name, streak_days, last_completed FROM habits WHERE user_id = ? ORDER BY name",
            (user["id"],),
        ).fetchall()
    return [
        {
            "id": row["id"],
            "name": row["name"],
            "streak_days": row["streak_days"],
            "completed_today": row["last_completed"] == today,
        }
        for row in rows
    ]


@app.post("/api/habits/{habit_id}/toggle")
def toggle_habit(habit_id: str, user: sqlite3.Row = Depends(current_user)) -> dict[str, Any]:
    today = date.today()
    with connect() as connection:
        row = connection.execute(
            "SELECT * FROM habits WHERE id = ? AND user_id = ?",
            (habit_id, user["id"]),
        ).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Habit was not found.")
        last_completed = row["last_completed"]
        if last_completed == today.isoformat():
            streak = max(0, row["streak_days"] - 1)
            new_last_completed = None
        else:
            yesterday = (today - timedelta(days=1)).isoformat()
            streak = row["streak_days"] + 1 if last_completed == yesterday else 1
            new_last_completed = today.isoformat()
        connection.execute(
            "UPDATE habits SET streak_days = ?, last_completed = ? WHERE id = ?",
            (streak, new_last_completed, habit_id),
        )
    return {
        "id": habit_id,
        "name": row["name"],
        "streak_days": streak,
        "completed_today": new_last_completed == today.isoformat(),
    }
