import json
import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterator


DEFAULT_DATABASE_PATH = Path(__file__).resolve().parents[1] / "data" / "eduai.db"
DATABASE_PATH = Path(os.getenv("EDUAI_DATABASE_PATH", str(DEFAULT_DATABASE_PATH))).expanduser()
SCHEMA_VERSION = 6

_BASE_SCHEMA = (
    """
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE COLLATE NOCASE,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'student',
        created_at TEXT NOT NULL
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS profiles (
        user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        education_level TEXT NOT NULL DEFAULT '',
        course TEXT NOT NULL DEFAULT '',
        year INTEGER NOT NULL DEFAULT 1 CHECK (year BETWEEN 1 AND 12),
        primary_interest TEXT NOT NULL DEFAULT '',
        career_goal TEXT NOT NULL DEFAULT '',
        institution TEXT,
        cgpa REAL CHECK (cgpa IS NULL OR cgpa BETWEEN 0 AND 10),
        attendance REAL CHECK (attendance IS NULL OR attendance BETWEEN 0 AND 100),
        study_hours_weekly REAL CHECK (study_hours_weekly IS NULL OR study_hours_weekly BETWEEN 0 AND 168),
        preferences TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS predictions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        result TEXT NOT NULL,
        created_at TEXT NOT NULL
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS skills (
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        skill_id TEXT NOT NULL,
        level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 5),
        PRIMARY KEY (user_id, skill_id)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS goals (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        target_date TEXT NOT NULL,
        milestones TEXT NOT NULL DEFAULT '[]',
        progress INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
        created_at TEXT NOT NULL
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS habits (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        streak_days INTEGER NOT NULL DEFAULT 0 CHECK (streak_days >= 0),
        last_completed TEXT,
        UNIQUE (user_id, name)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        filename TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS quizzes (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        questions TEXT NOT NULL,
        created_at TEXT NOT NULL
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS interviews (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        interview_type TEXT NOT NULL,
        turn INTEGER NOT NULL DEFAULT 0 CHECK (turn >= 0),
        created_at TEXT NOT NULL
    )
    """,
)

_RELATIONAL_SCHEMA = (
    """
    CREATE TABLE IF NOT EXISTS quiz_questions (
        id TEXT PRIMARY KEY,
        quiz_id TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
        position INTEGER NOT NULL CHECK (position >= 0),
        question TEXT NOT NULL,
        options TEXT NOT NULL,
        correct_index INTEGER NOT NULL CHECK (correct_index >= 0),
        explanation TEXT NOT NULL,
        difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
        topic TEXT NOT NULL,
        UNIQUE (quiz_id, position)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS quiz_attempts (
        id TEXT PRIMARY KEY,
        quiz_id TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        score INTEGER NOT NULL CHECK (score >= 0),
        total_questions INTEGER NOT NULL CHECK (total_questions >= 0),
        submitted_at TEXT NOT NULL
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS quiz_attempt_answers (
        attempt_id TEXT NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
        question_id TEXT NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
        selected_index INTEGER CHECK (selected_index IS NULL OR selected_index >= 0),
        is_correct INTEGER NOT NULL CHECK (is_correct IN (0, 1)),
        PRIMARY KEY (attempt_id, question_id)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS goal_milestones (
        goal_id TEXT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
        position INTEGER NOT NULL CHECK (position >= 0),
        title TEXT NOT NULL,
        completed INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0, 1)),
        PRIMARY KEY (goal_id, position)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS interview_responses (
        id TEXT PRIMARY KEY,
        interview_id TEXT NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
        turn INTEGER NOT NULL CHECK (turn >= 0),
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        clarity INTEGER NOT NULL CHECK (clarity BETWEEN 0 AND 100),
        technical_accuracy INTEGER NOT NULL CHECK (technical_accuracy BETWEEN 0 AND 100),
        confidence_indicator TEXT NOT NULL,
        feedback TEXT NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE (interview_id, turn)
    )
    """,
    "CREATE INDEX IF NOT EXISTS idx_predictions_user_created ON predictions(user_id, created_at DESC)",
    "CREATE INDEX IF NOT EXISTS idx_goals_user_created ON goals(user_id, created_at DESC)",
    "CREATE INDEX IF NOT EXISTS idx_documents_user_created ON documents(user_id, created_at DESC)",
    "CREATE INDEX IF NOT EXISTS idx_quizzes_user_created ON quizzes(user_id, created_at DESC)",
    "CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_submitted ON quiz_attempts(user_id, submitted_at DESC)",
    "CREATE INDEX IF NOT EXISTS idx_interviews_user_created ON interviews(user_id, created_at DESC)",
    "CREATE INDEX IF NOT EXISTS idx_interview_responses_interview_turn ON interview_responses(interview_id, turn)",
)

_ACTIVITY_SCHEMA = (
    """
    CREATE TABLE IF NOT EXISTS habit_completions (
        habit_id TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
        completed_on TEXT NOT NULL,
        created_at TEXT NOT NULL,
        PRIMARY KEY (habit_id, completed_on)
    )
    """,
    "CREATE INDEX IF NOT EXISTS idx_habit_completions_date ON habit_completions(completed_on)",
)

_AI_SCHEMA = (
    """
    CREATE TABLE IF NOT EXISTS ai_runtime_settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        primary_provider TEXT NOT NULL CHECK (primary_provider IN ('groq', 'openai')),
        fallback_provider TEXT NOT NULL CHECK (fallback_provider IN ('groq', 'openai')),
        CHECK (primary_provider != fallback_provider)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS ai_provider_settings (
        provider TEXT PRIMARY KEY CHECK (provider IN ('groq', 'openai')),
        enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
        model TEXT,
        last_status TEXT NOT NULL DEFAULT 'not_checked',
        last_checked_at TEXT,
        last_error TEXT
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS ai_provider_usage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        provider TEXT NOT NULL CHECK (provider IN ('groq', 'openai')),
        model TEXT,
        status TEXT NOT NULL CHECK (status IN ('success', 'error')),
        response_time_ms INTEGER NOT NULL CHECK (response_time_ms >= 0),
        error_code TEXT,
        created_at TEXT NOT NULL
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS agent_conversations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        messages TEXT NOT NULL DEFAULT '[]',
        updated_at TEXT NOT NULL
    )
    """,
    "CREATE INDEX IF NOT EXISTS idx_ai_usage_created ON ai_provider_usage(created_at DESC)",
    "CREATE INDEX IF NOT EXISTS idx_ai_usage_user_created ON ai_provider_usage(user_id, created_at DESC)",
    "CREATE INDEX IF NOT EXISTS idx_agent_conversations_user_updated ON agent_conversations(user_id, updated_at DESC)",
)


@contextmanager
def connect() -> Iterator[sqlite3.Connection]:
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DATABASE_PATH, timeout=15)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    connection.execute("PRAGMA busy_timeout = 15000")
    try:
        yield connection
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def _migrate_legacy_rows(connection: sqlite3.Connection) -> None:
    for quiz in connection.execute("SELECT id, questions FROM quizzes").fetchall():
        try:
            questions = json.loads(quiz["questions"])
        except (TypeError, json.JSONDecodeError) as error:
            raise RuntimeError(f"Cannot migrate malformed questions for quiz {quiz['id']}.") from error
        if not isinstance(questions, list):
            raise RuntimeError(f"Cannot migrate quiz {quiz['id']}: questions must be a JSON array.")
        for position, question in enumerate(questions):
            if not isinstance(question, dict):
                raise RuntimeError(f"Cannot migrate quiz {quiz['id']}: question {position} is not an object.")
            options = question.get("options", [])
            if not isinstance(options, list):
                raise RuntimeError(f"Cannot migrate quiz {quiz['id']}: question {position} options are invalid.")
            connection.execute(
                """
                INSERT INTO quiz_questions (
                    id, quiz_id, position, question, options, correct_index,
                    explanation, difficulty, topic
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    f"{quiz['id']}:{question.get('id', position + 1)}",
                    quiz["id"],
                    position,
                    str(question.get("question", "")),
                    json.dumps(options),
                    int(question.get("correct_index", 0)),
                    str(question.get("explanation", "")),
                    question.get("difficulty", "Medium"),
                    str(question.get("topic", "")),
                ),
            )

    for goal in connection.execute("SELECT id, milestones FROM goals").fetchall():
        try:
            milestones = json.loads(goal["milestones"])
        except (TypeError, json.JSONDecodeError) as error:
            raise RuntimeError(f"Cannot migrate malformed milestones for goal {goal['id']}.") from error
        if not isinstance(milestones, list):
            raise RuntimeError(f"Cannot migrate goal {goal['id']}: milestones must be a JSON array.")
        for position, milestone in enumerate(milestones):
            connection.execute(
                """
                INSERT INTO goal_milestones (goal_id, position, title)
                VALUES (?, ?, ?)
                """,
                (goal["id"], position, str(milestone)),
            )


def _migrate_habit_completions(connection: sqlite3.Connection) -> None:
    for habit in connection.execute(
        "SELECT id, last_completed FROM habits WHERE last_completed IS NOT NULL"
    ).fetchall():
        connection.execute(
            """
            INSERT OR IGNORE INTO habit_completions (habit_id, completed_on, created_at)
            VALUES (?, ?, ?)
            """,
            (habit["id"], habit["last_completed"], datetime.now(timezone.utc).isoformat()),
        )


def _migrate_groq_to_gemini(connection: sqlite3.Connection) -> None:
    connection.execute(
        """
        CREATE TABLE ai_runtime_settings_v5 (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            primary_provider TEXT NOT NULL CHECK (primary_provider IN ('gemini', 'openai')),
            fallback_provider TEXT NOT NULL CHECK (fallback_provider IN ('gemini', 'openai')),
            CHECK (primary_provider != fallback_provider)
        )
        """
    )
    connection.execute(
        """
        INSERT INTO ai_runtime_settings_v5 (id, primary_provider, fallback_provider)
        SELECT id,
               CASE primary_provider WHEN 'groq' THEN 'gemini' ELSE primary_provider END,
               CASE fallback_provider WHEN 'groq' THEN 'gemini' ELSE fallback_provider END
        FROM ai_runtime_settings
        """
    )
    connection.execute(
        """
        CREATE TABLE ai_provider_settings_v5 (
            provider TEXT PRIMARY KEY CHECK (provider IN ('gemini', 'openai')),
            enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
            model TEXT,
            last_status TEXT NOT NULL DEFAULT 'not_checked',
            last_checked_at TEXT,
            last_error TEXT
        )
        """
    )
    connection.execute(
        """
        INSERT INTO ai_provider_settings_v5 (
            provider, enabled, model, last_status, last_checked_at, last_error
        )
        SELECT CASE provider WHEN 'groq' THEN 'gemini' ELSE provider END,
               enabled,
               CASE provider WHEN 'groq' THEN NULL ELSE model END,
               CASE provider WHEN 'groq' THEN 'not_checked' ELSE last_status END,
               CASE provider WHEN 'groq' THEN NULL ELSE last_checked_at END,
               CASE provider WHEN 'groq' THEN NULL ELSE last_error END
        FROM ai_provider_settings
        """
    )
    connection.execute(
        """
        CREATE TABLE ai_provider_usage_v5 (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            provider TEXT NOT NULL CHECK (provider IN ('gemini', 'openai', 'groq')),
            model TEXT,
            status TEXT NOT NULL CHECK (status IN ('success', 'error')),
            response_time_ms INTEGER NOT NULL CHECK (response_time_ms >= 0),
            error_code TEXT,
            created_at TEXT NOT NULL
        )
        """
    )
    connection.execute(
        """
        INSERT INTO ai_provider_usage_v5 (
            id, user_id, provider, model, status, response_time_ms, error_code, created_at
        )
        SELECT id, user_id, provider, model, status, response_time_ms, error_code, created_at
        FROM ai_provider_usage
        """
    )
    connection.execute("DROP TABLE ai_runtime_settings")
    connection.execute("DROP TABLE ai_provider_settings")
    connection.execute("DROP TABLE ai_provider_usage")
    connection.execute("ALTER TABLE ai_runtime_settings_v5 RENAME TO ai_runtime_settings")
    connection.execute("ALTER TABLE ai_provider_settings_v5 RENAME TO ai_provider_settings")
    connection.execute("ALTER TABLE ai_provider_usage_v5 RENAME TO ai_provider_usage")
    connection.execute("CREATE INDEX idx_ai_usage_created ON ai_provider_usage(created_at DESC)")
    connection.execute(
        "CREATE INDEX idx_ai_usage_user_created ON ai_provider_usage(user_id, created_at DESC)"
    )


def _migrate_ai_providers(connection: sqlite3.Connection) -> None:
    providers = tuple(("gemini", "openai", "sambanova", "cohere"))
    allowed = ", ".join(f"'{provider}'" for provider in providers)
    connection.execute(
        f"""
        CREATE TABLE ai_runtime_settings_v6 (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            primary_provider TEXT NOT NULL CHECK (primary_provider IN ({allowed})),
            fallback_provider TEXT NOT NULL CHECK (fallback_provider IN ({allowed})),
            CHECK (primary_provider != fallback_provider)
        )
        """
    )
    primary = os.getenv("AI_PRIMARY_PROVIDER", "sambanova").strip().lower()
    fallback = os.getenv("AI_FALLBACK_PROVIDER", "cohere").strip().lower()
    if primary not in providers:
        primary = "sambanova"
    if fallback not in providers or fallback == primary:
        fallback = next(provider for provider in providers if provider != primary)
    connection.execute(
        """
        INSERT INTO ai_runtime_settings_v6 (id, primary_provider, fallback_provider)
        VALUES (1, ?, ?)
        """,
        (primary, fallback),
    )

    connection.execute(
        f"""
        CREATE TABLE ai_provider_settings_v6 (
            provider TEXT PRIMARY KEY CHECK (provider IN ({allowed})),
            enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
            model TEXT,
            last_status TEXT NOT NULL DEFAULT 'not_checked',
            last_checked_at TEXT,
            last_error TEXT
        )
        """
    )
    connection.execute(
        """
        INSERT INTO ai_provider_settings_v6 (
            provider, enabled, model, last_status, last_checked_at, last_error
        )
        SELECT provider, enabled, model, last_status, last_checked_at, last_error
        FROM ai_provider_settings
        """
    )
    for provider in ("sambanova", "cohere"):
        connection.execute(
            """
            INSERT INTO ai_provider_settings_v6 (provider, model)
            VALUES (?, ?)
            """,
            (provider, os.getenv(f"{provider.upper()}_MODEL") or None),
        )

    connection.execute(
        """
        CREATE TABLE ai_provider_usage_v6 (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            provider TEXT NOT NULL CHECK (
                provider IN ('gemini', 'openai', 'sambanova', 'cohere', 'groq')
            ),
            model TEXT,
            status TEXT NOT NULL CHECK (status IN ('success', 'error')),
            response_time_ms INTEGER NOT NULL CHECK (response_time_ms >= 0),
            error_code TEXT,
            created_at TEXT NOT NULL
        )
        """
    )
    connection.execute(
        """
        INSERT INTO ai_provider_usage_v6 (
            id, user_id, provider, model, status, response_time_ms, error_code, created_at
        )
        SELECT id, user_id, provider, model, status, response_time_ms, error_code, created_at
        FROM ai_provider_usage
        """
    )

    connection.execute("DROP TABLE ai_runtime_settings")
    connection.execute("DROP TABLE ai_provider_settings")
    connection.execute("DROP TABLE ai_provider_usage")
    connection.execute("ALTER TABLE ai_runtime_settings_v6 RENAME TO ai_runtime_settings")
    connection.execute("ALTER TABLE ai_provider_settings_v6 RENAME TO ai_provider_settings")
    connection.execute("ALTER TABLE ai_provider_usage_v6 RENAME TO ai_provider_usage")
    connection.execute("CREATE INDEX idx_ai_usage_created ON ai_provider_usage(created_at DESC)")
    connection.execute(
        "CREATE INDEX idx_ai_usage_user_created ON ai_provider_usage(user_id, created_at DESC)"
    )


def initialize_database() -> None:
    with connect() as connection:
        connection.execute("PRAGMA journal_mode = WAL")
        connection.execute("BEGIN IMMEDIATE")
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version INTEGER PRIMARY KEY,
                applied_at TEXT NOT NULL
            )
            """
        )
        row = connection.execute("SELECT MAX(version) AS version FROM schema_migrations").fetchone()
        current_version = int(row["version"] or 0)
        if current_version > SCHEMA_VERSION:
            raise RuntimeError(
                f"Database schema version {current_version} is newer than this app supports ({SCHEMA_VERSION})."
            )

        if current_version < 1:
            for statement in _BASE_SCHEMA:
                connection.execute(statement)
            connection.execute(
                "INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)",
                (1, datetime.now(timezone.utc).isoformat()),
            )
            current_version = 1

        if current_version < 2:
            for statement in _RELATIONAL_SCHEMA:
                connection.execute(statement)
            _migrate_legacy_rows(connection)
            connection.execute(
                "INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)",
                (2, datetime.now(timezone.utc).isoformat()),
            )
            current_version = 2

        if current_version < 3:
            for statement in _ACTIVITY_SCHEMA:
                connection.execute(statement)
            _migrate_habit_completions(connection)
            connection.execute(
                "INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)",
                (3, datetime.now(timezone.utc).isoformat()),
            )
            current_version = 3

        if current_version < 4:
            for statement in _AI_SCHEMA:
                connection.execute(statement)

            primary_provider = os.getenv("AI_PRIMARY_PROVIDER", "groq").strip().lower()
            fallback_provider = os.getenv("AI_FALLBACK_PROVIDER", "openai").strip().lower()
            if primary_provider not in {"groq", "openai"}:
                primary_provider = "groq"
            if fallback_provider not in {"groq", "openai"} or fallback_provider == primary_provider:
                fallback_provider = "openai" if primary_provider == "groq" else "groq"
            connection.execute(
                """
                INSERT OR IGNORE INTO ai_runtime_settings (id, primary_provider, fallback_provider)
                VALUES (1, ?, ?)
                """,
                (primary_provider, fallback_provider),
            )
            for provider in ("groq", "openai"):
                connection.execute(
                    """
                    INSERT OR IGNORE INTO ai_provider_settings (provider, model)
                    VALUES (?, ?)
                    """,
                    (provider, os.getenv(f"{provider.upper()}_MODEL") or None),
                )
            connection.execute(
                "INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)",
                (4, datetime.now(timezone.utc).isoformat()),
            )
            current_version = 4

        if current_version < 5:
            _migrate_groq_to_gemini(connection)
            connection.execute(
                "INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)",
                (5, datetime.now(timezone.utc).isoformat()),
            )
            current_version = 5

        if current_version < 6:
            _migrate_ai_providers(connection)
            connection.execute(
                "INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)",
                (6, datetime.now(timezone.utc).isoformat()),
            )
            current_version = 6

        connection.execute(f"PRAGMA user_version = {current_version}")
