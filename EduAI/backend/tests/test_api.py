import json
import os
import sqlite3
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient
from pydantic import ValidationError

from app import database
from app.local_models import LocalModelUnavailable
from app.local_quiz_bank import QuestionBankUnavailable, QuestionCountUnavailable
from app.local_summarizer import SummarizationModelUnavailable
from app.main import app
from app.schemas import AcademicPredictionRequest


class EduAIAPITests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.database_path = Path(self.temp_dir.name) / "test.db"
        self.database_path_patch = patch.object(database, "DATABASE_PATH", self.database_path)
        self.database_path_patch.start()
        self.summarizer_patch = patch(
            "app.main.summarize_study_material",
            return_value="Local extractive summary.",
        )
        self.summarizer_patch.start()
        self.client_context = TestClient(app)
        self.client = self.client_context.__enter__()

    def tearDown(self) -> None:
        self.client_context.__exit__(None, None, None)
        self.summarizer_patch.stop()
        self.database_path_patch.stop()
        self.temp_dir.cleanup()

    def register(self, email: str = "student@example.com") -> tuple[dict, dict[str, str]]:
        response = self.client.post(
            "/api/auth/register",
            json={
                "email": email,
                "password": "SecureTest!2026",
                "full_name": "Test Student",
                "education_level": "Undergraduate",
                "course": "Computer Science",
                "year": 2,
                "career_goal": "AI Engineer",
            },
        )
        self.assertEqual(response.status_code, 200, response.text)
        result = response.json()
        return result, {"Authorization": f"Bearer {result['access_token']}"}

    def test_end_to_end_student_workflows_persist_in_sqlite(self) -> None:
        auth, headers = self.register()
        self.assertEqual(auth["profile"]["education_level"], "Undergraduate")
        self.assertEqual(auth["profile"]["course"], "Computer Science")
        self.assertEqual(auth["profile"]["year"], 2)
        self.assertEqual(auth["profile"]["career_goal"], "AI Engineer")
        self.assertEqual(self.client.get("/health").json()["database"], "ok")
        self.assertEqual(self.client.get("/api/health").json()["status"], "ok")
        self.assertEqual(
            self.client.get("/api/auth/me", headers=headers).json()["user"]["email"],
            "student@example.com",
        )
        self.assertEqual(self.client.get("/api/auth/me").status_code, 401)

        login = self.client.post(
            "/api/auth/login",
            json={"email": "STUDENT@example.com", "password": "SecureTest!2026"},
        )
        self.assertEqual(login.status_code, 200)

        profile = self.client.put(
            "/api/student/profile",
            headers=headers,
            json={"attendance": 92, "study_hours_weekly": 40, "preferences": {"theme": "dark"}},
        )
        self.assertEqual(profile.status_code, 200, profile.text)
        self.assertEqual(profile.json()["study_hours_weekly"], 40)
        with patch(
            "app.main.predict_student_performance",
            return_value={
                "name": "Student Performance Random Forest Regressor",
                "predicted_final_marks": 82.5,
            },
        ) as model_prediction:
            prediction = self.client.post(
                "/api/performance/predict",
                headers=headers,
                json={
                    "study_hours": 4,
                    "attendance": 92,
                    "assignments": 90,
                    "internal_marks": 80,
                    "test_score": 84,
                },
            )
        model_prediction.assert_called_once()
        self.assertEqual(prediction.status_code, 200, prediction.text)
        self.assertEqual(prediction.json()["predicted_final_marks"], 82.5)
        self.assertEqual(
            prediction.json()["prediction_method"],
            "Student Performance Random Forest Regressor",
        )
        analytics = self.client.get("/api/performance/analytics", headers=headers).json()
        self.assertEqual(len(analytics["historical_predictions"]), 1)

        goal = self.client.post(
            "/api/goals",
            headers=headers,
            json={"title": "Finish course", "target_date": "2026-12-15", "milestones": ["Read", "Practice"]},
        )
        self.assertEqual(goal.status_code, 201, goal.text)
        goals = self.client.get("/api/goals", headers=headers).json()
        self.assertEqual(goals[0]["tasks"], ["Read", "Practice"])
        self.assertEqual(
            self.client.post(
                "/api/goals",
                headers=headers,
                json={"title": "Invalid date", "target_date": "tomorrow", "milestones": []},
            ).status_code,
            422,
        )

        career = self.client.post(
            "/api/career/recommend",
            headers=headers,
            json={
                "education_level": "Undergraduate",
                "specialization": "Computer Science",
                "skills": ["python", "sql"],
                "certifications": [],
                "cgpa_percentage": 85,
            },
        )
        self.assertEqual(career.status_code, 200, career.text)
        self.assertTrue(career.json()["top_recommendations"])
        roadmap = self.client.get(
            "/api/career/roadmap",
            headers=headers,
            params={"title": career.json()["top_recommendations"][0]["career_title"]},
        )
        self.assertEqual(roadmap.status_code, 200, roadmap.text)
        self.assertTrue(roadmap.json()["phases"])

        graph = self.client.get("/api/skills/graph", headers=headers)
        self.assertEqual(graph.status_code, 200, graph.text)
        skill = graph.json()["skills"][0]
        changed_skill = self.client.patch(
            f"/api/skills/{skill['id']}",
            headers=headers,
            json={"level": 4},
        )
        self.assertEqual(changed_skill.status_code, 200, changed_skill.text)
        gaps = self.client.get(
            "/api/skills/gap",
            headers=headers,
            params={"career": "Software Engineer"},
        )
        self.assertEqual(gaps.status_code, 200, gaps.text)

        with patch.dict(
            os.environ,
            {
                "GEMINI_API_KEY": "YOUR_NEW_GEMINI_KEY",
                "SECOND_AI_API_KEY": "YOUR_NEW_SECOND_PROVIDER_KEY",
            },
        ):
            assistant = self.client.post(
                "/api/agent/chat",
                headers=headers,
                json={"prompt": "Create a study plan"},
            )
        self.assertEqual(assistant.status_code, 503, assistant.text)
        self.assertIn("credentials are not configured", assistant.json()["detail"])
        self.assertTrue(self.client.get("/api/agent/tools", headers=headers).json()["tools"])
        self.assertEqual(
            self.client.get("/api/jobs/search", headers=headers, params={"q": "student"}).json()["jobs"],
            [],
        )
        resume = self.client.post(
            "/api/resume/analyze",
            headers=headers,
            files={"file": ("resume.txt", b"Python SQL and data analysis project experience.", "text/plain")},
        )
        self.assertEqual(resume.status_code, 200, resume.text)
        self.assertIn("python", resume.json()["detected_skills"])

        habits = self.client.get("/api/habits", headers=headers).json()
        toggled = self.client.post(f"/api/habits/{habits[0]['id']}/toggle", headers=headers)
        self.assertEqual(toggled.status_code, 200, toggled.text)
        self.assertTrue(toggled.json()["completed_today"])
        self.assertTrue(
            next(item for item in self.client.get("/api/habits", headers=headers).json() if item["id"] == habits[0]["id"])[
                "completed_today"
            ]
        )
        undone = self.client.post(f"/api/habits/{habits[0]['id']}/toggle", headers=headers)
        self.assertEqual(undone.status_code, 200, undone.text)
        self.assertFalse(undone.json()["completed_today"])
        self.assertEqual(undone.json()["streak_days"], 0)

        quiz = self.client.post(
            "/api/quiz/generate",
            headers=headers,
            json={"topic": "algebra", "difficulty": "Medium", "question_count": 3},
        )
        self.assertEqual(quiz.status_code, 200, quiz.text)
        questions = quiz.json()["questions"]
        self.assertEqual(len({question["id"] for question in questions}), 3)
        self.assertNotIn("correct_index", questions[0])
        self.assertNotIn("explanation", questions[0])
        answers = {question["id"]: 0 for question in questions}
        submitted = self.client.post(
            "/api/quiz/submit",
            headers=headers,
            json={"quiz_id": quiz.json()["quiz_id"], "answers": answers},
        )
        self.assertEqual(submitted.status_code, 200, submitted.text)
        with database.connect() as connection:
            self.assertEqual(connection.execute("SELECT COUNT(*) FROM quiz_questions").fetchone()[0], 3)
            self.assertEqual(connection.execute("SELECT COUNT(*) FROM quiz_attempts").fetchone()[0], 1)
            self.assertEqual(connection.execute("SELECT COUNT(*) FROM quiz_attempt_answers").fetchone()[0], 3)

        interview = self.client.post(
            "/api/interview/start",
            headers=headers,
            json={"role": "Software Engineer", "type": "Technical"},
        ).json()
        for _ in range(4):
            response = self.client.post(
                "/api/interview/respond",
                headers=headers,
                json={"session_id": interview["session_id"], "answer": "I built a project and explained the trade-offs."},
            )
            self.assertEqual(response.status_code, 200, response.text)
        self.assertTrue(response.json()["is_complete"])
        self.assertEqual(
            self.client.post(
                "/api/interview/respond",
                headers=headers,
                json={"session_id": interview["session_id"], "answer": "This is a late answer."},
            ).status_code,
            409,
        )
        with database.connect() as connection:
            self.assertEqual(
                connection.execute(
                    "SELECT COUNT(*) FROM interview_responses WHERE interview_id = ? AND answer != ''",
                    (interview["session_id"],),
                ).fetchone()[0],
                4,
            )

        document = self.client.post(
            "/api/documents/upload",
            headers=headers,
            files={"file": ("notes.txt", b"Photosynthesis converts light energy into chemical energy.", "text/plain")},
        )
        self.assertEqual(document.status_code, 200, document.text)
        question = self.client.post(
            "/api/documents/ask",
            headers=headers,
            json={"document_id": document.json()["id"], "question": "What converts light energy?"},
        )
        self.assertEqual(question.status_code, 200, question.text)
        self.assertEqual(question.json()["citations"][0]["page"], 1)
        listed_documents = self.client.get("/api/documents", headers=headers)
        self.assertEqual(listed_documents.status_code, 200, listed_documents.text)
        self.assertEqual(listed_documents.json()[0]["id"], document.json()["id"])

        foreign_headers = self.register("other@example.com")[1]
        forbidden_document = self.client.post(
            "/api/documents/ask",
            headers=foreign_headers,
            json={"document_id": document.json()["id"], "question": "Read this"},
        )
        self.assertEqual(forbidden_document.status_code, 404)
        self.assertEqual(self.client.post("/api/quiz/submit", headers=headers, json={"quiz_id": "invalid", "answers": {}}).status_code, 404)
        self.assertTrue(auth["access_token"])

    def test_performance_prediction_requires_all_trained_model_features(self) -> None:
        _, headers = self.register()
        response = self.client.post(
            "/api/performance/predict",
            headers=headers,
            json={"study_hours": 4, "attendance": 92, "test_score": 84},
        )
        self.assertEqual(response.status_code, 422)

    def test_performance_prediction_rejects_non_finite_model_inputs(self) -> None:
        payload = {
            "study_hours": 4,
            "attendance": 92,
            "assignments": 90,
            "internal_marks": float("nan"),
            "test_score": 84,
        }
        with self.assertRaises(ValidationError):
            AcademicPredictionRequest.model_validate(payload)

    def test_performance_prediction_reports_missing_model(self) -> None:
        _, headers = self.register()
        payload = {
            "study_hours": 4,
            "attendance": 92,
            "assignments": 90,
            "internal_marks": 80,
            "test_score": 84,
        }
        with patch(
            "app.main.predict_student_performance",
            side_effect=LocalModelUnavailable("Trained model is unavailable."),
        ):
            response = self.client.post(
                "/api/performance/predict",
                headers=headers,
                json=payload,
            )
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json()["detail"], "Trained model is unavailable.")

    def test_document_summary_reports_missing_local_model(self) -> None:
        _, headers = self.register()
        document = self.client.post(
            "/api/documents/upload",
            headers=headers,
            files={"file": ("notes.txt", b"Photosynthesis stores light energy as chemical energy.", "text/plain")},
        )
        self.assertEqual(document.status_code, 200, document.text)
        with patch(
            "app.main.summarize_study_material",
            side_effect=SummarizationModelUnavailable("Local summarizer is unavailable."),
        ):
            response = self.client.post(
                f"/api/documents/{document.json()['id']}/summarize",
                headers=headers,
            )
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json()["detail"], "Local summarizer is unavailable.")

    def test_random_question_bank_quiz_is_private_and_scoreable(self) -> None:
        _, headers = self.register()
        questions = [
            {
                "question": "Which option is correct?",
                "options": ["Correct", "Wrong", "Wrong too", "Also wrong"],
                "correct_index": 0,
                "explanation": "The first option is correct.",
                "difficulty": "Easy",
                "topic": "Testing",
            }
        ]
        with patch("app.main.sample_random_questions", return_value=questions) as sample:
            generated = self.client.post(
                "/api/quiz/random-bank",
                headers=headers,
                json={"question_count": 1, "difficulty": "Easy"},
            )
        self.assertEqual(generated.status_code, 200, generated.text)
        sample.assert_called_once_with(1, "Easy")
        question = generated.json()["questions"][0]
        self.assertNotIn("correct_index", question)
        result = self.client.post(
            "/api/quiz/submit",
            headers=headers,
            json={"quiz_id": generated.json()["quiz_id"], "answers": {question["id"]: 0}},
        )
        self.assertEqual(result.status_code, 200, result.text)
        self.assertEqual(result.json()["score"], 1)

    def test_document_quiz_uses_source_document_and_can_be_submitted(self) -> None:
        _, headers = self.register()
        document = self.client.post(
            "/api/documents/upload",
            headers=headers,
            files={"file": ("notes.txt", b"Photosynthesis converts light energy into chemical energy.", "text/plain")},
        )
        self.assertEqual(document.status_code, 200, document.text)
        generated_response = json.dumps(
            {
                "questions": [
                    {
                        "question": "What does photosynthesis convert?",
                        "options": [
                            "Chemical energy into light",
                            "Light energy into chemical energy",
                            "Water into light",
                            "Oxygen into glucose",
                        ],
                        "correct_index": 1,
                        "explanation": "The document says light energy becomes chemical energy.",
                        "topic": "Photosynthesis",
                    }
                ]
            }
        )
        with patch("app.main.provider_response", return_value=(generated_response, "gemini", "test-model")) as provider:
            generated = self.client.post(
                f"/api/documents/{document.json()['id']}/quiz",
                headers=headers,
                json={"question_count": 1},
            )
        self.assertEqual(generated.status_code, 200, generated.text)
        provider.assert_called_once()
        question = generated.json()["questions"][0]
        self.assertNotIn("correct_index", question)
        result = self.client.post(
            "/api/quiz/submit",
            headers=headers,
            json={"quiz_id": generated.json()["quiz_id"], "answers": {question["id"]: 1}},
        )
        self.assertEqual(result.status_code, 200, result.text)
        self.assertEqual(result.json()["score"], 1)

    def test_new_quiz_endpoints_enforce_question_count_limits(self) -> None:
        _, headers = self.register()
        random_quiz = self.client.post(
            "/api/quiz/random-bank",
            headers=headers,
            json={"question_count": 5001, "difficulty": "Any"},
        )
        document_quiz = self.client.post(
            "/api/documents/not-a-document/quiz",
            headers=headers,
            json={"question_count": 11},
        )
        invalid_difficulty = self.client.post(
            "/api/quiz/random-bank",
            headers=headers,
            json={"question_count": 1, "difficulty": "Expert"},
        )
        self.assertEqual(random_quiz.status_code, 422)
        self.assertEqual(document_quiz.status_code, 422)
        self.assertEqual(invalid_difficulty.status_code, 422)

    def test_random_quiz_reports_when_filtered_bank_is_too_small(self) -> None:
        _, headers = self.register()
        with patch(
            "app.main.sample_random_questions",
            side_effect=QuestionCountUnavailable("No hard questions are available."),
        ):
            response = self.client.post(
                "/api/quiz/random-bank",
                headers=headers,
                json={"question_count": 1, "difficulty": "Hard"},
            )
        self.assertEqual(response.status_code, 422)
        self.assertEqual(response.json()["detail"], "No hard questions are available.")

    def test_random_quiz_reports_an_unavailable_question_bank(self) -> None:
        _, headers = self.register()
        with patch(
            "app.main.sample_random_questions",
            side_effect=QuestionBankUnavailable("The local question bank is unavailable."),
        ):
            response = self.client.post(
                "/api/quiz/random-bank",
                headers=headers,
                json={"question_count": 1, "difficulty": "Any"},
            )
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json()["detail"], "The local question bank is unavailable.")

    def test_document_quiz_rejects_malformed_ai_output_without_saving_a_quiz(self) -> None:
        _, headers = self.register()
        document = self.client.post(
            "/api/documents/upload",
            headers=headers,
            files={"file": ("notes.txt", b"Photosynthesis stores light energy as chemical energy.", "text/plain")},
        )
        self.assertEqual(document.status_code, 200, document.text)
        with patch("app.main.provider_response", return_value=("not valid JSON", "gemini", "test-model")):
            response = self.client.post(
                f"/api/documents/{document.json()['id']}/quiz",
                headers=headers,
                json={"question_count": 1},
            )
        self.assertEqual(response.status_code, 502)
        self.assertIn("invalid quiz format", response.json()["detail"])
        with database.connect() as connection:
            quiz_count = connection.execute("SELECT COUNT(*) AS count FROM quizzes").fetchone()["count"]
        self.assertEqual(quiz_count, 0)

    def test_register_accepts_legacy_name_field(self) -> None:
        response = self.client.post(
            "/api/auth/register",
            json={
                "email": "legacy-name@example.com",
                "password": "SecureTest!2026",
                "name": "Legacy Student",
            },
        )

        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json()["user"]["full_name"], "Legacy Student")


class DatabaseMigrationTests(unittest.TestCase):
    def test_migrates_legacy_json_rows_without_losing_data(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            database_path = Path(temp_dir) / "legacy.db"
            with patch.object(database, "DATABASE_PATH", database_path):
                connection = sqlite3.connect(database_path)
                connection.executescript(
                    """
                    CREATE TABLE users (
                        id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE,
                        password_hash TEXT NOT NULL, full_name TEXT NOT NULL,
                        role TEXT NOT NULL DEFAULT 'student', created_at TEXT NOT NULL
                    );
                    CREATE TABLE goals (
                        id TEXT PRIMARY KEY, user_id TEXT NOT NULL, title TEXT NOT NULL,
                        target_date TEXT NOT NULL, milestones TEXT NOT NULL DEFAULT '[]',
                        progress INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL
                    );
                    CREATE TABLE quizzes (
                        id TEXT PRIMARY KEY, user_id TEXT NOT NULL, questions TEXT NOT NULL,
                        created_at TEXT NOT NULL
                    );
                    CREATE TABLE habits (
                        id TEXT PRIMARY KEY, user_id TEXT NOT NULL, name TEXT NOT NULL,
                        streak_days INTEGER NOT NULL DEFAULT 0, last_completed TEXT,
                        UNIQUE (user_id, name)
                    );
                    INSERT INTO users VALUES ('u1', 'legacy@example.com', 'hash', 'Legacy', 'student', '2026-01-01');
                    INSERT INTO goals VALUES ('g1', 'u1', 'Legacy goal', '2026-12-01', '["Read", "Practice"]', 0, '2026-01-01');
                    INSERT INTO quizzes VALUES (
                        'q1', 'u1',
                        '[{"id":"1","question":"Legacy question","options":["A","B"],"correct_index":1,"explanation":"Legacy answer","difficulty":"Easy","topic":"Legacy"}]',
                        '2026-01-01'
                    );
                    INSERT INTO habits VALUES ('h1', 'u1', 'Legacy habit', 2, '2026-01-02');
                    """
                )
                connection.commit()
                connection.close()

                database.initialize_database()
                database.initialize_database()

                with database.connect() as migrated:
                    versions = [
                        row["version"]
                        for row in migrated.execute("SELECT version FROM schema_migrations ORDER BY version")
                    ]
                    question = migrated.execute("SELECT * FROM quiz_questions WHERE quiz_id = 'q1'").fetchone()
                    milestones = migrated.execute(
                        "SELECT title FROM goal_milestones WHERE goal_id = 'g1' ORDER BY position"
                    ).fetchall()
                    completion = migrated.execute(
                        "SELECT completed_on FROM habit_completions WHERE habit_id = 'h1'"
                    ).fetchone()

                self.assertEqual(versions, [1, 2, 3, 4, 5, 6])
                self.assertEqual(question["question"], "Legacy question")
                self.assertEqual(json.loads(question["options"]), ["A", "B"])
                self.assertEqual([row["title"] for row in milestones], ["Read", "Practice"])
                self.assertEqual(completion["completed_on"], "2026-01-02")


if __name__ == "__main__":
    unittest.main()
