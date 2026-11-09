import json
import os
import tempfile
import unittest
from io import BytesIO
from pathlib import Path
from unittest.mock import patch
from urllib.error import HTTPError

from fastapi.testclient import TestClient

from app import ai_providers, database
from app.main import _ai_request_lock, _ai_request_times, app


class AIProviderTests(unittest.TestCase):
    def setUp(self) -> None:
        self.environment_patch = patch.dict(
            os.environ,
            {
                "GEMINI_API_KEY": "test-gemini-secret",
                "SECOND_AI_API_KEY": "test-openai-secret",
                "SAMBANOVA_API_KEY": "test-sambanova-secret",
                "COHERE_API_KEY": "test-cohere-secret",
                "AI_PRIMARY_PROVIDER": "gemini",
                "AI_FALLBACK_PROVIDER": "openai",
                "GEMINI_MODEL": "gemini-chat-test",
                "OPENAI_MODEL": "openai-chat-test",
                "SAMBANOVA_MODEL": "sambanova-chat-test",
                "COHERE_MODEL": "cohere-chat-test",
                "AI_RATE_LIMIT_PER_MINUTE": "10",
            },
        )
        self.environment_patch.start()
        self.temp_dir = tempfile.TemporaryDirectory()
        self.database_path = Path(self.temp_dir.name) / "test.db"
        self.database_path_patch = patch.object(database, "DATABASE_PATH", self.database_path)
        self.database_path_patch.start()
        self.client_context = TestClient(app)
        self.client = self.client_context.__enter__()
        response = self.client.post(
            "/api/auth/register",
            json={
                "email": "ai-student@example.com",
                "password": "SecureTest!2026",
                "full_name": "AI Test Student",
                "course": "Computer Science",
            },
        )
        self.assertEqual(response.status_code, 200, response.text)
        self.user_id = response.json()["user"]["id"]
        self.headers = {"Authorization": f"Bearer {response.json()['access_token']}"}
        with database.connect() as connection:
            connection.execute(
                "UPDATE ai_provider_settings SET model = ? WHERE provider = 'gemini'",
                ("gemini-chat-test",),
            )
            connection.execute(
                "UPDATE ai_provider_settings SET model = ? WHERE provider = 'openai'",
                ("openai-chat-test",),
            )
        with _ai_request_lock:
            _ai_request_times.clear()

    def tearDown(self) -> None:
        self.client_context.__exit__(None, None, None)
        self.database_path_patch.stop()
        self.environment_patch.stop()
        self.temp_dir.cleanup()
        with _ai_request_lock:
            _ai_request_times.clear()

    def promote_admin(self) -> None:
        with database.connect() as connection:
            connection.execute("UPDATE users SET role = 'admin' WHERE id = ?", (self.user_id,))

    def test_primary_falls_back_on_temporary_failure_and_records_safe_usage(self) -> None:
        with patch(
            "app.ai_providers.generate_chat",
            side_effect=[
                ai_providers.ProviderFailure("gemini", "timeout", "Provider request timed out.", True),
                "OpenAI response",
            ],
        ) as generate:
            result = ai_providers.provider_response(self.user_id, [{"role": "user", "content": "Help me study"}])

        self.assertEqual(result, ("OpenAI response", "openai", "openai-chat-test"))
        self.assertEqual(generate.call_count, 2)
        with database.connect() as connection:
            usage = connection.execute(
                "SELECT provider, status, error_code FROM ai_provider_usage ORDER BY id"
            ).fetchall()
        self.assertEqual([(row["provider"], row["status"]) for row in usage], [("gemini", "error"), ("openai", "success")])
        self.assertEqual(usage[0]["error_code"], "timeout")
        self.assertNotIn("test-gemini-secret", json.dumps([dict(row) for row in usage]))

    def test_auto_discovers_and_persists_missing_gemini_model(self) -> None:
        with database.connect() as connection:
            connection.execute(
                "UPDATE ai_provider_settings SET model = NULL WHERE provider = 'gemini'"
            )

        with patch.dict(os.environ, {"GEMINI_MODEL": ""}), patch(
            "app.ai_providers.list_models",
            return_value=["models/gemini-available"],
        ) as discover, patch(
            "app.ai_providers.generate_chat",
            return_value="Gemini response",
        ) as generate:
            result = ai_providers.provider_response(
                self.user_id,
                [{"role": "user", "content": "Help me study"}],
            )

        self.assertEqual(
            result,
            ("Gemini response", "gemini", "models/gemini-available"),
        )
        discover.assert_called_once_with("gemini")
        generate.assert_called_once_with(
            "gemini",
            "models/gemini-available",
            [{"role": "user", "content": "Help me study"}],
        )
        with database.connect() as connection:
            model = connection.execute(
                "SELECT model FROM ai_provider_settings WHERE provider = 'gemini'"
            ).fetchone()["model"]
        self.assertEqual(model, "models/gemini-available")

    def test_invalid_credentials_and_quota_do_not_trigger_fallback(self) -> None:
        for failure in (
            ai_providers.ProviderFailure("gemini", "invalid_credentials", "Provider credentials were rejected."),
            ai_providers.ProviderFailure("gemini", "quota_exceeded", "Provider quota or billing limit was reached."),
        ):
            with self.subTest(code=failure.code), patch(
                "app.ai_providers.generate_chat",
                side_effect=failure,
            ) as generate:
                with self.assertRaises(ai_providers.ProviderFailure) as raised:
                    ai_providers.provider_response(
                        self.user_id,
                        [{"role": "user", "content": "Explain this topic"}],
                    )
                self.assertEqual(raised.exception.code, failure.code)
                self.assertEqual(generate.call_count, 1)

    def test_quota_classification_and_provider_timeout(self) -> None:
        quota = ai_providers._provider_error("gemini", 429, "RESOURCE_EXHAUSTED")
        rate_limit = ai_providers._provider_error("gemini", 429, "rate_limit_exceeded")
        unavailable_model = ai_providers._provider_error("openai", 404, "model_not_found")
        self.assertEqual(quota.code, "quota_exceeded")
        self.assertFalse(quota.retryable)
        self.assertEqual(rate_limit.code, "rate_limited")
        self.assertTrue(rate_limit.retryable)
        self.assertEqual(unavailable_model.code, "model_unavailable")

        with patch.dict(os.environ, {"GEMINI_API_KEY": "test-key"}), patch(
            "app.ai_providers.urlopen",
            side_effect=TimeoutError(),
        ):
            with self.assertRaises(ai_providers.ProviderFailure) as raised:
                ai_providers.list_models("gemini")
        self.assertEqual(raised.exception.code, "timeout")

    def test_invalid_provider_key_response_is_sanitized(self) -> None:
        failure = HTTPError(
            "https://generativelanguage.googleapis.com/v1beta/models",
            401,
            "Unauthorized",
            {},
            BytesIO(b'{"error":{"code":"invalid_api_key","message":"secret detail"}}'),
        )
        with patch("app.ai_providers.urlopen", side_effect=failure):
            with self.assertRaises(ai_providers.ProviderFailure) as raised:
                ai_providers.list_models("gemini")
        self.assertEqual(raised.exception.code, "invalid_credentials")
        self.assertNotIn("secret detail", raised.exception.message)

    def test_gemini_model_error_is_reported_as_unavailable(self) -> None:
        failure = HTTPError(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-missing:generateContent",
            404,
            "Not Found",
            {},
            BytesIO(
                b'{"error":{"code":404,"status":"NOT_FOUND","message":"models/gemini-missing not found"}}'
            ),
        )

        with patch("app.ai_providers.urlopen", side_effect=failure):
            with self.assertRaises(ai_providers.ProviderFailure) as raised:
                ai_providers.generate_chat("gemini", "models/gemini-missing", [{"role": "user", "content": "Hi"}])

        self.assertEqual(raised.exception.code, "model_unavailable")
        self.assertNotIn("gemini-missing", raised.exception.message)

    def test_model_discovery_uses_provider_models_endpoint(self) -> None:
        gemini_body = json.dumps(
            {
                "models": [
                    {"name": "models/gemini-b", "supportedGenerationMethods": ["generateContent"]},
                    {"name": "models/gemini-a", "supportedGenerationMethods": ["generateContent"]},
                    {"name": "models/embedding", "supportedGenerationMethods": ["embedContent"]},
                ]
            }
        ).encode()
        with patch("app.ai_providers.urlopen", return_value=BytesIO(gemini_body)) as request:
            models = ai_providers.list_models("gemini")
        self.assertEqual(models, ["models/gemini-a", "models/gemini-b"])
        self.assertEqual(
            request.call_args.args[0].full_url,
            "https://generativelanguage.googleapis.com/v1beta/models",
        )
        self.assertEqual(request.call_args.args[0].get_header("X-goog-api-key"), "test-gemini-secret")
        self.assertIsNone(request.call_args.args[0].get_header("Authorization"))
        self.assertEqual(request.call_args.kwargs["timeout"], 20.0)

        openai_body = json.dumps({"data": [{"id": "chat-b"}, {"id": "chat-a"}, {"owned_by": "ignored"}]}).encode()
        with patch(
            "app.ai_providers.urlopen",
            return_value=BytesIO(openai_body),
        ) as request:
            models = ai_providers.list_models("openai")
        self.assertEqual(models, ["chat-a", "chat-b"])
        self.assertEqual(request.call_args.args[0].full_url, "https://api.openai.com/v1/models")
        self.assertEqual(request.call_args.kwargs["timeout"], 20.0)

        cohere_body = json.dumps(
            {
                "models": [
                    {"name": "embed-only", "endpoints": ["embed"]},
                    {"name": "command-chat", "endpoints": ["chat"]},
                ]
            }
        ).encode()
        with patch("app.ai_providers.urlopen", return_value=BytesIO(cohere_body)) as request:
            models = ai_providers.list_models("cohere")
        self.assertEqual(models, ["command-chat"])
        self.assertEqual(
            request.call_args.args[0].full_url,
            "https://api.cohere.com/v1/models?endpoint=chat&page_size=1000",
        )
        self.assertIsNotNone(request.call_args.args[0].get_header("Authorization"))

    def test_sambanova_chat_uses_openai_compatible_endpoint(self) -> None:
        body = json.dumps(
            {"choices": [{"message": {"content": "Suggested career paths."}}]}
        ).encode()
        messages = [{"role": "user", "content": "Recommend careers."}]
        with patch("app.ai_providers.urlopen", return_value=BytesIO(body)) as request:
            result = ai_providers.generate_chat("sambanova", "sambanova-chat-test", messages)

        self.assertEqual(result, "Suggested career paths.")
        sent = request.call_args.args[0]
        self.assertEqual(sent.full_url, "https://api.sambanova.ai/v1/chat/completions")
        self.assertIsNotNone(sent.get_header("Authorization"))
        self.assertEqual(
            json.loads(sent.data),
            {
                "model": "sambanova-chat-test",
                "messages": messages,
                "max_tokens": 900,
            },
        )

    def test_cohere_chat_parses_v2_content_blocks(self) -> None:
        body = json.dumps(
            {
                "message": {
                    "content": [
                        {"type": "text", "text": '{"recommendations":'},
                        {"type": "text", "text": '[]}'},
                    ]
                }
            }
        ).encode()
        messages = [{"role": "user", "content": "Recommend careers."}]
        with patch("app.ai_providers.urlopen", return_value=BytesIO(body)) as request:
            result = ai_providers.generate_chat("cohere", "cohere-chat-test", messages)

        self.assertEqual(result, '{"recommendations":[]}')
        sent = request.call_args.args[0]
        self.assertEqual(sent.full_url, "https://api.cohere.com/v2/chat")
        self.assertIsNotNone(sent.get_header("Authorization"))
        self.assertEqual(
            json.loads(sent.data),
            {"model": "cohere-chat-test", "messages": messages, "stream": False},
        )

    def test_gemini_chat_uses_native_generate_content_payload(self) -> None:
        body = json.dumps(
            {
                "candidates": [
                    {"content": {"parts": [{"text": "Hello "}, {"text": "student."}]}}
                ]
            }
        ).encode()
        messages = [
            {"role": "system", "content": "Be helpful."},
            {"role": "user", "content": "Hello"},
            {"role": "assistant", "content": "Hi"},
        ]
        with patch("app.ai_providers.urlopen", return_value=BytesIO(body)) as request:
            result = ai_providers.generate_chat("gemini", "models/gemini-test", messages)

        self.assertEqual(result, "Hello student.")
        sent = request.call_args.args[0]
        self.assertEqual(
            sent.full_url,
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-test:generateContent",
        )
        self.assertEqual(sent.get_header("X-goog-api-key"), "test-gemini-secret")
        self.assertEqual(
            json.loads(sent.data),
            {
                "contents": [
                    {"role": "user", "parts": [{"text": "Hello"}]},
                    {"role": "model", "parts": [{"text": "Hi"}]},
                ],
                "generationConfig": {"maxOutputTokens": 900},
                "systemInstruction": {"parts": [{"text": "Be helpful."}]},
            },
        )

    def test_admin_provider_settings_are_protected_and_never_return_credentials(self) -> None:
        self.assertEqual(self.client.get("/api/admin/ai/settings", headers=self.headers).status_code, 403)
        self.promote_admin()
        settings_response = self.client.get("/api/admin/ai/settings", headers=self.headers)
        self.assertEqual(settings_response.status_code, 200, settings_response.text)
        settings = settings_response.json()
        self.assertEqual(settings["primary_provider"], "gemini")
        self.assertEqual(settings["fallback_provider"], "openai")
        self.assertEqual(
            {provider["masked_credential"] for provider in settings["providers"]},
            {"********"},
        )
        self.assertEqual(
            {provider["id"] for provider in settings["providers"]},
            {"gemini", "openai", "sambanova", "cohere"},
        )
        self.assertNotIn("test-gemini-secret", settings_response.text)
        self.assertNotIn("test-openai-secret", settings_response.text)

    def test_admin_can_discover_models_and_save_provider_selection(self) -> None:
        self.promote_admin()
        with patch("app.main.list_models", return_value=["discovered-chat-model"]):
            tested = self.client.post("/api/admin/ai/providers/openai/test", headers=self.headers)
        self.assertEqual(tested.status_code, 200, tested.text)
        self.assertEqual(tested.json()["models"], ["discovered-chat-model"])

        saved = self.client.put(
            "/api/admin/ai/settings",
            headers=self.headers,
            json={
                "primary_provider": "openai",
                "fallback_provider": "gemini",
                "providers": [
                    {"provider": "gemini", "enabled": True, "model": "gemini-chat-test"},
                    {"provider": "openai", "enabled": True, "model": "discovered-chat-model"},
                    {"provider": "sambanova", "enabled": True, "model": "sambanova-chat-test"},
                    {"provider": "cohere", "enabled": True, "model": "cohere-chat-test"},
                ],
            },
        )
        self.assertEqual(saved.status_code, 200, saved.text)
        settings = self.client.get("/api/admin/ai/settings", headers=self.headers).json()
        self.assertEqual(settings["primary_provider"], "openai")
        openai = next(provider for provider in settings["providers"] if provider["id"] == "openai")
        self.assertEqual(openai["model"], "discovered-chat-model")
        disabled = self.client.put(
            "/api/admin/ai/settings",
            headers=self.headers,
            json={
                "primary_provider": "openai",
                "fallback_provider": "gemini",
                "providers": [
                    {"provider": "gemini", "enabled": False, "model": "gemini-chat-test"},
                    {"provider": "openai", "enabled": True, "model": "discovered-chat-model"},
                    {"provider": "sambanova", "enabled": True, "model": "sambanova-chat-test"},
                    {"provider": "cohere", "enabled": True, "model": "cohere-chat-test"},
                ],
            },
        )
        self.assertEqual(disabled.status_code, 200, disabled.text)

    def test_chat_supports_english_hindi_and_persists_owned_context(self) -> None:
        results = [
            ("Photosynthesis converts light into chemical energy.", "gemini", "gemini-chat-test"),
            ("प्रकाश संश्लेषण में पौधे प्रकाश ऊर्जा को रासायनिक ऊर्जा में बदलते हैं।", "gemini", "gemini-chat-test"),
        ]
        with patch("app.main.provider_response", side_effect=results) as generate:
            english = self.client.post(
                "/api/agent/chat",
                headers=self.headers,
                json={"prompt": "Explain photosynthesis in English"},
            )
            hindi = self.client.post(
                "/api/agent/chat",
                headers=self.headers,
                json={
                    "prompt": "प्रकाश संश्लेषण समझाइए",
                    "conversation_id": english.json()["conversation_id"],
                },
            )
        self.assertEqual(english.status_code, 200, english.text)
        self.assertIn("Photosynthesis", english.json()["text"])
        self.assertEqual(hindi.status_code, 200, hindi.text)
        self.assertIn("प्रकाश संश्लेषण", hindi.json()["text"])
        messages = generate.call_args_list[1].args[1]
        self.assertTrue(any("Saved student profile records" in item["content"] for item in messages if item["role"] == "system"))
        self.assertTrue(any(item.get("content") == "Explain photosynthesis in English" for item in messages))

        foreign_conversation = self.client.post(
            "/api/auth/register",
            json={
                "email": "other-ai@example.com",
                "password": "SecureTest!2026",
                "full_name": "Other Student",
            },
        )
        foreign_headers = {"Authorization": f"Bearer {foreign_conversation.json()['access_token']}"}
        denied = self.client.post(
            "/api/agent/chat",
            headers=foreign_headers,
            json={"prompt": "Continue", "conversation_id": english.json()["conversation_id"]},
        )
        self.assertEqual(denied.status_code, 404)

    def test_summarize_uses_configured_provider_and_requested_language(self) -> None:
        with patch(
            "app.main.provider_response",
            return_value=("अनुच्छेद का संक्षिप्त सार।", "openai", "openai-chat-test"),
        ) as generate:
            response = self.client.post(
                "/api/ai/summarize",
                headers=self.headers,
                json={"text": "शिक्षा से अवसर बढ़ते हैं।", "language": "Hindi"},
            )
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json()["provider"], "openai")
        self.assertIn("Hindi", generate.call_args.args[1][0]["content"])

    def test_local_document_summary_and_ai_answers_are_owner_scoped(self) -> None:
        with patch(
            "app.main.summarize_study_material",
            return_value="Photosynthesis converts sunlight into stored chemical energy.",
        ) as upload_summarize:
            uploaded = self.client.post(
                "/api/documents/upload",
                headers=self.headers,
                files={"file": ("notes.txt", b"Photosynthesis converts sunlight into stored chemical energy.", "text/plain")},
            )
        self.assertEqual(uploaded.status_code, 200, uploaded.text)
        upload_summarize.assert_called_once()
        document_id = uploaded.json()["id"]
        with patch(
            "app.main.provider_response",
            return_value=("It is the process plants use to store light energy.", "openai", "openai-chat-test"),
        ) as generate, patch(
            "app.main.summarize_study_material",
            return_value="Photosynthesis converts sunlight into stored chemical energy.",
        ) as summarize:
            summary = self.client.post(
                f"/api/documents/{document_id}/summarize",
                headers=self.headers,
            )
            answer = self.client.post(
                f"/api/documents/{document_id}/ask-ai",
                headers=self.headers,
                json={"question": "What does photosynthesis do?"},
            )
        self.assertEqual(summary.status_code, 200, summary.text)
        self.assertEqual(summary.json()["summary"], "Photosynthesis converts sunlight into stored chemical energy.")
        self.assertEqual(summary.json()["provider"], "local")
        self.assertEqual(summary.json()["model"], "Trained extractive summarizer")
        self.assertEqual(answer.status_code, 200, answer.text)
        self.assertEqual(answer.json()["provider"], "openai")
        self.assertEqual(generate.call_count, 1)
        self.assertIn("Photosynthesis", generate.call_args.args[1][1]["content"])
        summarize.assert_called_once()

        other = self.client.post(
            "/api/auth/register",
            json={
                "email": "document-owner@example.com",
                "password": "SecureTest!2026",
                "full_name": "Other Student",
            },
        )
        denied = self.client.post(
            f"/api/documents/{document_id}/summarize",
            headers={"Authorization": f"Bearer {other.json()['access_token']}"},
        )
        self.assertEqual(denied.status_code, 404)

    def test_resume_ai_suggestions_require_explicit_upload_and_do_not_replace_local_analysis(self) -> None:
        with patch(
            "app.main.provider_response",
            return_value=("Add evidence for each achievement.", "gemini", "gemini-chat-test"),
        ) as generate:
            suggestions = self.client.post(
                "/api/resume/ai-suggestions",
                headers=self.headers,
                files={"file": ("resume.txt", b"Python project experience with SQL.", "text/plain")},
            )
        self.assertEqual(suggestions.status_code, 200, suggestions.text)
        self.assertEqual(suggestions.json()["provider"], "gemini")
        self.assertIn("Python project experience", generate.call_args.args[1][1]["content"])

        local_result = self.client.post(
            "/api/resume/analyze",
            headers=self.headers,
            files={"file": ("resume.txt", b"Python project experience with SQL.", "text/plain")},
        )
        self.assertEqual(local_result.status_code, 200, local_result.text)
        self.assertIn("python", local_result.json()["detected_skills"])

    def test_quiz_explanation_uses_submitted_answers_and_stored_answer_key(self) -> None:
        generated = self.client.post(
            "/api/quiz/generate",
            headers=self.headers,
            json={"topic": "algebra", "difficulty": "Medium", "question_count": 2},
        )
        self.assertEqual(generated.status_code, 200, generated.text)
        question = generated.json()["questions"][0]
        submitted = self.client.post(
            "/api/quiz/submit",
            headers=self.headers,
            json={"quiz_id": generated.json()["quiz_id"], "answers": {question["id"]: 0}},
        )
        self.assertEqual(submitted.status_code, 200, submitted.text)

        with patch(
            "app.main.provider_response",
            return_value=("This option applies the relevant algebraic rule.", "gemini", "gemini-chat-test"),
        ) as generate:
            response = self.client.post(
                f"/api/quiz/{generated.json()['quiz_id']}/questions/{question['id']}/explain",
                headers=self.headers,
            )
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json()["provider"], "gemini")
        self.assertIn(question["question"], generate.call_args.args[1][1]["content"])
        self.assertIn("Correct answer:", generate.call_args.args[1][1]["content"])

    def test_missing_keys_keep_login_and_local_prediction_available(self) -> None:
        with patch.dict(
            os.environ,
            {
                "GEMINI_API_KEY": "YOUR_NEW_GEMINI_KEY",
                "SECOND_AI_API_KEY": "YOUR_NEW_SECOND_PROVIDER_KEY",
            },
        ), patch(
            "app.main.predict_student_performance",
            return_value={
                "name": "Student Performance Random Forest Regressor",
                "predicted_final_marks": 78.5,
            },
        ):
            response = self.client.post(
                "/api/agent/chat",
                headers=self.headers,
                json={"prompt": "Create a study plan"},
            )
            login = self.client.post(
                "/api/auth/login",
                json={"email": "ai-student@example.com", "password": "SecureTest!2026"},
            )
            prediction = self.client.post(
                "/api/performance/predict",
                headers=self.headers,
                json={
                    "study_hours": 4,
                    "attendance": 90,
                    "assignments": 90,
                    "internal_marks": 80,
                    "test_score": 80,
                },
            )
        self.assertEqual(response.status_code, 503)
        self.assertIn("credentials are not configured", response.json()["detail"])
        self.assertEqual(login.status_code, 200)
        self.assertEqual(prediction.status_code, 200, prediction.text)

    def test_rate_limit_applies_to_authenticated_ai_requests(self) -> None:
        with patch.dict(os.environ, {"AI_RATE_LIMIT_PER_MINUTE": "1"}), patch(
            "app.main.provider_response",
            return_value=("A study plan.", "gemini", "gemini-chat-test"),
        ):
            first = self.client.post("/api/agent/chat", headers=self.headers, json={"prompt": "Plan my study"})
            second = self.client.post("/api/agent/chat", headers=self.headers, json={"prompt": "Explain a topic"})
        self.assertEqual(first.status_code, 200, first.text)
        self.assertEqual(second.status_code, 429)
        self.assertEqual(second.headers["retry-after"], "60")

    def test_ai_career_recommendations_require_consent_and_validate_provider_output(self) -> None:
        request = {
            "education_level": "Undergraduate",
            "specialization": "Computer Science",
            "skills": ["Python", "SQL"],
            "certifications": [],
            "cgpa_percentage": 85,
        }
        with patch("app.main.provider_response") as generate:
            denied = self.client.post("/api/career/recommend", headers=self.headers, json=request)
        self.assertEqual(denied.status_code, 200, denied.text)
        self.assertEqual(denied.json()["method"], "Local catalog match")
        self.assertIsNone(denied.json()["provider"])
        generate.assert_not_called()

        request["consent_to_ai_processing"] = True
        response_json = json.dumps(
            {
                "recommendations": [
                    {
                        "career_title": "Data Analyst",
                        "category": "Data",
                        "fit_score": 82,
                        "fit_reason": "Your listed skills align with entry-level analysis tasks.",
                        "key_prerequisites": ["Statistics"],
                        "skills_to_build": ["Data visualization"],
                        "roadmap_summary": "Build a portfolio with data projects.",
                    }
                ]
            }
        )
        with patch(
            "app.main.provider_response",
            return_value=(response_json, "cohere", "cohere-chat-test"),
        ) as generate:
            response = self.client.post("/api/career/recommend", headers=self.headers, json=request)

        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json()["provider"], "cohere")
        self.assertEqual(response.json()["top_recommendations"][0]["recommendation_score"], 82)
        self.assertEqual(response.json()["top_recommendations"][0]["market_demand"], "Not verified")
        self.assertIn("academic_percentage", generate.call_args.args[1][1]["content"])

    def test_ai_job_role_suggestions_require_consent_and_never_claim_live_listings(self) -> None:
        request = {"query": "software internships"}
        with patch("app.main.provider_response") as generate:
            denied = self.client.post("/api/jobs/recommend", headers=self.headers, json=request)
        self.assertEqual(denied.status_code, 422)
        generate.assert_not_called()

        response_json = json.dumps(
            {
                "roles": [
                    {
                        "title": "Junior Python Developer",
                        "fit_reason": "This role uses Python and offers an entry-level path.",
                        "skills_to_build": ["Testing"],
                        "search_query": "junior python developer internships",
                    }
                ]
            }
        )
        with patch(
            "app.main.provider_response",
            return_value=(response_json, "sambanova", "sambanova-chat-test"),
        ) as generate:
            response = self.client.post(
                "/api/jobs/recommend",
                headers=self.headers,
                json={**request, "consent_to_ai_processing": True},
            )
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json()["roles"][0]["title"], "Junior Python Developer")
        self.assertIn("not verified or live job openings", response.json()["disclaimer"])
        self.assertIn("software internships", generate.call_args.args[1][1]["content"])

    def test_missing_primary_credentials_falls_back_to_configured_provider(self) -> None:
        with patch.dict(
            os.environ,
            {
                "AI_PRIMARY_PROVIDER": "sambanova",
                "AI_FALLBACK_PROVIDER": "cohere",
                "SAMBANOVA_API_KEY": "",
                "COHERE_API_KEY": "test-cohere-secret",
            },
        ):
            with database.connect() as connection:
                connection.execute(
                    "UPDATE ai_runtime_settings SET primary_provider = 'sambanova', fallback_provider = 'cohere' WHERE id = 1"
                )
                connection.execute(
                    "UPDATE ai_provider_settings SET model = 'cohere-chat-test' WHERE provider = 'cohere'"
                )
            with patch(
                "app.ai_providers.generate_chat",
                return_value="Fallback response.",
            ) as generate:
                result = ai_providers.provider_response(
                    self.user_id,
                    [{"role": "user", "content": "Hello"}],
                )
        self.assertEqual(result, ("Fallback response.", "cohere", "cohere-chat-test"))
        generate.assert_called_once_with("cohere", "cohere-chat-test", [{"role": "user", "content": "Hello"}])


class AIProviderMigrationTests(unittest.TestCase):
    def test_v4_groq_settings_migrate_to_all_providers_without_losing_usage(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            path = Path(temp_dir) / "migration.db"
            environment = {
                "AI_PRIMARY_PROVIDER": "groq",
                "AI_FALLBACK_PROVIDER": "openai",
                "GROQ_MODEL": "old-groq-model",
                "GEMINI_MODEL": "",
                "OPENAI_MODEL": "",
                "SAMBANOVA_MODEL": "",
                "COHERE_MODEL": "",
            }
            with (
                patch.object(database, "DATABASE_PATH", path),
                patch.object(database, "SCHEMA_VERSION", 4),
                patch.dict(os.environ, environment),
            ):
                database.initialize_database()
                with database.connect() as connection:
                    connection.execute(
                        """
                        INSERT INTO users (id, email, password_hash, full_name, created_at)
                        VALUES ('migration-user', 'migration@example.com', 'hash', 'Migration User', 'now')
                        """
                    )
                    connection.execute(
                        "UPDATE ai_provider_settings SET model = ? WHERE provider = 'groq'",
                        ("old-groq-model",),
                    )
                    connection.execute(
                        """
                        INSERT INTO ai_provider_usage (
                            user_id, provider, model, status, response_time_ms, created_at
                        ) VALUES ('migration-user', 'groq', 'old-groq-model', 'success', 12, 'now')
                        """
                    )

                with patch.object(database, "SCHEMA_VERSION", 6):
                    database.initialize_database()

                with database.connect() as connection:
                    runtime = connection.execute(
                        "SELECT primary_provider, fallback_provider FROM ai_runtime_settings WHERE id = 1"
                    ).fetchone()
                    providers = connection.execute(
                        "SELECT provider, model, last_status FROM ai_provider_settings ORDER BY provider"
                    ).fetchall()
                    usage = connection.execute(
                        "SELECT provider, model FROM ai_provider_usage"
                    ).fetchone()

            self.assertEqual(tuple(runtime), ("sambanova", "openai"))
            self.assertEqual(
                [(row["provider"], row["model"]) for row in providers],
                [("cohere", None), ("gemini", None), ("openai", None), ("sambanova", None)],
            )
            self.assertTrue(all(row["last_status"] == "not_checked" for row in providers))
            self.assertEqual(tuple(usage), ("groq", "old-groq-model"))


if __name__ == "__main__":
    unittest.main()
