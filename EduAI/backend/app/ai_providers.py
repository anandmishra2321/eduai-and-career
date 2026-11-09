import json
import os
import socket
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

from .database import connect


PROVIDERS = {
    "gemini": {
        "name": "Gemini",
        "api_key_env": "GEMINI_API_KEY",
        "base_url": "https://generativelanguage.googleapis.com/v1beta",
        "model_env": "GEMINI_MODEL",
        "api_style": "gemini",
    },
    "openai": {
        "name": "OpenAI",
        "api_key_env": "SECOND_AI_API_KEY",
        "base_url": "https://api.openai.com/v1",
        "model_env": "OPENAI_MODEL",
        "api_style": "openai",
    },
    "sambanova": {
        "name": "SambaNova",
        "api_key_env": "SAMBANOVA_API_KEY",
        "base_url": "https://api.sambanova.ai/v1",
        "model_env": "SAMBANOVA_MODEL",
        "api_style": "openai",
    },
    "cohere": {
        "name": "Cohere",
        "api_key_env": "COHERE_API_KEY",
        "base_url": "https://api.cohere.com",
        "model_env": "COHERE_MODEL",
        "api_style": "cohere",
    },
}

_PLACEHOLDERS = {
    "your_new_gemini_key",
    "your_new_openai_key",
    "your_new_second_provider_key",
    "your_new_sambanova_key",
    "your_new_cohere_key",
    "replace-me",
    "changeme",
}


@dataclass(frozen=True)
class ProviderFailure(Exception):
    provider: str
    code: str
    message: str
    retryable: bool = False


def _credential(provider: str) -> str | None:
    value = os.getenv(PROVIDERS[provider]["api_key_env"], "").strip()
    if not value or value.lower() in _PLACEHOLDERS or value.startswith("YOUR_"):
        return None
    return value


def _timeout() -> float:
    try:
        return min(60.0, max(1.0, float(os.getenv("AI_REQUEST_TIMEOUT_SECONDS", "20"))))
    except ValueError:
        return 20.0


def _provider_url(provider: str, suffix: str) -> str:
    return f"{PROVIDERS[provider]['base_url']}/{suffix.lstrip('/')}"


def _provider_error(provider: str, status: int, code: str | None = None) -> ProviderFailure:
    normalized_code = (code or "").lower()
    if "model" in normalized_code and status in {400, 404}:
        return ProviderFailure(
            provider,
            "model_unavailable",
            "The selected model is unavailable for chat. Discover models again and choose a supported model.",
        )
    if status in {401, 403}:
        return ProviderFailure(provider, "invalid_credentials", "Provider credentials were rejected.")
    if status == 429:
        if any(term in normalized_code for term in ("quota", "billing", "insufficient", "resource_exhausted")):
            return ProviderFailure(provider, "quota_exceeded", "Provider quota or billing limit was reached.")
        return ProviderFailure(
            provider,
            "rate_limited",
            "Provider rate limit reached.",
            retryable=True,
        )
    if status in {408, 425} or status >= 500:
        return ProviderFailure(
            provider,
            "service_unavailable",
            "Provider is temporarily unavailable.",
            retryable=True,
        )
    if status == 404:
        return ProviderFailure(
            provider,
            "provider_endpoint_not_found",
            "The provider endpoint was not found. Check the backend provider configuration.",
        )
    return ProviderFailure(provider, "provider_request_failed", "Provider rejected the request.")


def _error_code(error: HTTPError) -> str | None:
    try:
        data = json.loads(error.read().decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError, OSError):
        return None
    if not isinstance(data, dict):
        return None
    detail = data.get("error", data)
    if isinstance(detail, dict):
        parts = [
            str(detail[key])
            for key in ("status", "code", "type", "message")
            if detail.get(key) is not None
        ]
        return " ".join(parts) or None
    return None


def _request_json(provider: str, suffix: str, method: str = "GET", payload: dict[str, Any] | None = None) -> dict[str, Any]:
    api_key = _credential(provider)
    if api_key is None:
        raise ProviderFailure(
            provider,
            "missing_credentials",
            f"{PROVIDERS[provider]['name']} credentials are not configured on the backend.",
        )
    body = json.dumps(payload).encode("utf-8") if payload is not None else None
    url = _provider_url(provider, suffix)
    request = Request(
        url,
        data=body,
        method=method,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
    )
    if PROVIDERS[provider]["api_style"] == "gemini":
        request.remove_header("Authorization")
        request.add_header("x-goog-api-key", api_key)
    try:
        with urlopen(request, timeout=_timeout()) as response:
            result = json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        raise _provider_error(provider, error.code, _error_code(error)) from None
    except (TimeoutError, socket.timeout):
        raise ProviderFailure(provider, "timeout", "Provider request timed out.", retryable=True) from None
    except URLError as error:
        reason = error.reason
        if isinstance(reason, (TimeoutError, socket.timeout)):
            raise ProviderFailure(provider, "timeout", "Provider request timed out.", retryable=True) from None
        raise ProviderFailure(provider, "connection_error", "Could not connect to the provider.", retryable=True) from None
    except OSError:
        raise ProviderFailure(provider, "connection_error", "Could not connect to the provider.", retryable=True) from None
    except (UnicodeDecodeError, json.JSONDecodeError):
        raise ProviderFailure(provider, "invalid_response", "Provider returned an unreadable response.") from None
    if not isinstance(result, dict):
        raise ProviderFailure(provider, "invalid_response", "Provider returned an unexpected response.")
    return result


def list_models(provider: str) -> list[str]:
    if provider not in PROVIDERS:
        raise ValueError("Unsupported AI provider.")
    suffix = "v1/models?endpoint=chat&page_size=1000" if provider == "cohere" else "models"
    response = _request_json(provider, suffix)
    if PROVIDERS[provider]["api_style"] == "gemini":
        models = response.get("models")
        if not isinstance(models, list):
            raise ProviderFailure(provider, "invalid_response", "Provider did not return a model list.")
        return sorted(
            {
                str(model["name"])
                for model in models
                if isinstance(model, dict)
                and isinstance(model.get("name"), str)
                and model["name"].strip()
                and isinstance(model.get("supportedGenerationMethods"), list)
                and "generateContent" in model.get("supportedGenerationMethods", [])
            }
        )
    if PROVIDERS[provider]["api_style"] == "cohere":
        models = response.get("models")
        if not isinstance(models, list):
            raise ProviderFailure(provider, "invalid_response", "Provider did not return a model list.")
        return sorted(
            {
                str(model["name"])
                for model in models
                if isinstance(model, dict)
                and isinstance(model.get("name"), str)
                and model["name"].strip()
                and (
                    not isinstance(model.get("endpoints"), list)
                    or "chat" in model["endpoints"]
                )
            }
        )
    models = response.get("data")
    if not isinstance(models, list):
        raise ProviderFailure(provider, "invalid_response", "Provider did not return a model list.")
    return sorted(
        {
            str(model["id"])
            for model in models
            if isinstance(model, dict) and isinstance(model.get("id"), str) and model["id"].strip()
        }
    )


def generate_chat(provider: str, model: str, messages: list[dict[str, str]]) -> str:
    if PROVIDERS[provider]["api_style"] == "gemini":
        system_instruction = next(
            (message["content"] for message in messages if message["role"] == "system"),
            None,
        )
        contents = [
            {
                "role": "model" if message["role"] == "assistant" else "user",
                "parts": [{"text": message["content"]}],
            }
            for message in messages
            if message["role"] in {"user", "assistant"}
        ]
        payload: dict[str, Any] = {
            "contents": contents,
            "generationConfig": {"maxOutputTokens": 900},
        }
        if system_instruction:
            payload["systemInstruction"] = {"parts": [{"text": system_instruction}]}
        model_path = model if model.startswith("models/") else f"models/{model}"
        response = _request_json(
            provider,
            f"{quote(model_path, safe='/')}:generateContent",
            method="POST",
            payload=payload,
        )
        try:
            parts = response["candidates"][0]["content"]["parts"]
        except (KeyError, IndexError, TypeError):
            raise ProviderFailure(provider, "invalid_response", "Provider did not return a chat response.") from None
        if not isinstance(parts, list):
            raise ProviderFailure(provider, "invalid_response", "Provider did not return a chat response.")
        text = "".join(
            part["text"]
            for part in parts
            if isinstance(part, dict) and isinstance(part.get("text"), str)
        )
        if not text.strip():
            raise ProviderFailure(provider, "empty_response", "Provider returned an empty chat response.")
        return text.strip()

    if PROVIDERS[provider]["api_style"] == "cohere":
        response = _request_json(
            provider,
            "v2/chat",
            method="POST",
            payload={"model": model, "messages": messages, "stream": False},
        )
        try:
            content = response["message"]["content"]
        except (KeyError, TypeError):
            raise ProviderFailure(provider, "invalid_response", "Provider did not return a chat response.") from None
        if not isinstance(content, list):
            raise ProviderFailure(provider, "invalid_response", "Provider did not return a chat response.")
        text = "".join(
            item["text"]
            for item in content
            if isinstance(item, dict) and item.get("type") == "text" and isinstance(item.get("text"), str)
        )
        if not text.strip():
            raise ProviderFailure(provider, "empty_response", "Provider returned an empty chat response.")
        return text.strip()

    completion_options = {"max_tokens": 900} if provider == "sambanova" else {"max_completion_tokens": 900}
    response = _request_json(
        provider,
        "chat/completions",
        method="POST",
        payload={"model": model, "messages": messages, **completion_options},
    )
    try:
        text = response["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError):
        raise ProviderFailure(provider, "invalid_response", "Provider did not return a chat response.") from None
    if not isinstance(text, str) or not text.strip():
        raise ProviderFailure(provider, "empty_response", "Provider returned an empty chat response.")
    return text.strip()


def provider_defaults() -> tuple[str, str]:
    primary = os.getenv("AI_PRIMARY_PROVIDER", "sambanova").strip().lower()
    fallback = os.getenv("AI_FALLBACK_PROVIDER", "cohere").strip().lower()
    if primary not in PROVIDERS:
        primary = "sambanova"
    if fallback not in PROVIDERS or fallback == primary:
        fallback = "cohere" if primary != "cohere" else "sambanova"
    return primary, fallback


def get_provider_settings() -> dict[str, Any]:
    primary_default, fallback_default = provider_defaults()
    with connect() as connection:
        runtime = connection.execute("SELECT * FROM ai_runtime_settings WHERE id = 1").fetchone()
        settings = connection.execute("SELECT * FROM ai_provider_settings ORDER BY provider").fetchall()
    if runtime is None:
        primary, fallback = primary_default, fallback_default
    else:
        primary, fallback = runtime["primary_provider"], runtime["fallback_provider"]
    providers = []
    for row in settings:
        provider = row["provider"]
        model = row["model"] or os.getenv(PROVIDERS[provider]["model_env"], "").strip()
        providers.append(
            {
                "id": provider,
                "name": PROVIDERS[provider]["name"],
                "enabled": bool(row["enabled"]),
                "configured": _credential(provider) is not None,
                "masked_credential": "********" if _credential(provider) is not None else "",
                "model": model,
                "status": row["last_status"],
                "last_checked_at": row["last_checked_at"],
                "last_error": row["last_error"],
            }
        )
    return {"primary_provider": primary, "fallback_provider": fallback, "providers": providers}


def save_provider_settings(
    primary_provider: str,
    fallback_provider: str,
    providers: list[dict[str, Any]],
) -> None:
    with connect() as connection:
        connection.execute(
            """
            UPDATE ai_runtime_settings
            SET primary_provider = ?, fallback_provider = ?
            WHERE id = 1
            """,
            (primary_provider, fallback_provider),
        )
        for item in providers:
            connection.execute(
                """
                UPDATE ai_provider_settings
                SET enabled = ?, model = ?
                WHERE provider = ?
                """,
                (int(item["enabled"]), item.get("model") or None, item["provider"]),
            )


def record_provider_status(provider: str, status: str, error: str | None = None) -> None:
    with connect() as connection:
        connection.execute(
            """
            UPDATE ai_provider_settings
            SET last_status = ?, last_checked_at = ?, last_error = ?
            WHERE provider = ?
            """,
            (status, datetime.now(timezone.utc).isoformat(), error, provider),
        )


def record_usage(
    user_id: str,
    provider: str,
    model: str | None,
    status: str,
    response_time_ms: int,
    error_code: str | None = None,
) -> None:
    with connect() as connection:
        connection.execute(
            """
            INSERT INTO ai_provider_usage (
                user_id, provider, model, status, response_time_ms, error_code, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                user_id,
                provider,
                model,
                status,
                max(0, response_time_ms),
                error_code,
                datetime.now(timezone.utc).isoformat(),
            ),
        )


def provider_response(
    user_id: str,
    messages: list[dict[str, str]],
) -> tuple[str, str, str]:
    settings = get_provider_settings()
    by_id = {item["id"]: item for item in settings["providers"]}
    primary = settings["primary_provider"]
    fallback = settings["fallback_provider"]
    if primary not in by_id or not by_id[primary]["enabled"]:
        raise ProviderFailure(primary, "provider_disabled", "The primary AI provider is disabled.")

    order = [primary]
    if fallback != primary and fallback in by_id and by_id[fallback]["enabled"]:
        order.append(fallback)

    failures: list[ProviderFailure] = []
    for index, provider in enumerate(order):
        provider_setting = by_id[provider]
        model = provider_setting["model"]
        if not provider_setting["configured"]:
            failure = ProviderFailure(
                provider,
                "missing_credentials",
                f"{provider_setting['name']} credentials are not configured on the backend.",
            )
            failures.append(failure)
            record_usage(user_id, provider, model or None, "error", 0, failure.code)
            if index == len(order) - 1:
                break
            continue
        if not model:
            started = time.monotonic()
            try:
                models = list_models(provider)
            except ProviderFailure as failure:
                elapsed = int((time.monotonic() - started) * 1000)
                failures.append(failure)
                record_usage(user_id, provider, None, "error", elapsed, failure.code)
                if not failure.retryable or index == len(order) - 1:
                    break
                continue
            if not models:
                failure = ProviderFailure(
                    provider,
                    "no_available_models",
                    f"No {provider_setting['name']} models supporting chat are available to this API key.",
                )
                failures.append(failure)
                elapsed = int((time.monotonic() - started) * 1000)
                record_usage(user_id, provider, None, "error", elapsed, failure.code)
                break

            model = models[0]
            provider_setting["model"] = model
            with connect() as connection:
                connection.execute(
                    "UPDATE ai_provider_settings SET model = ? WHERE provider = ?",
                    (model, provider),
                )
        started = time.monotonic()
        try:
            text = generate_chat(provider, model, messages)
            elapsed = int((time.monotonic() - started) * 1000)
            record_usage(user_id, provider, model, "success", elapsed)
            return text, provider, model
        except ProviderFailure as failure:
            elapsed = int((time.monotonic() - started) * 1000)
            failures.append(failure)
            record_usage(user_id, provider, model, "error", elapsed, failure.code)
            if not failure.retryable or index == len(order) - 1:
                break

    if len(failures) == 1:
        raise failures[0]
    detail = "; ".join(
        f"{PROVIDERS[failure.provider]['name']}: {failure.message}"
        for failure in failures
    )
    raise ProviderFailure(
        failures[-1].provider,
        "all_providers_failed",
        f"No configured AI provider is available. {detail}",
    )


def save_conversation(user_id: str, conversation_id: str, messages: list[dict[str, str]]) -> None:
    with connect() as connection:
        connection.execute(
            """
            INSERT INTO agent_conversations (id, user_id, messages, updated_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET messages = excluded.messages, updated_at = excluded.updated_at
            WHERE agent_conversations.user_id = excluded.user_id
            """,
            (
                conversation_id,
                user_id,
                json.dumps(messages, ensure_ascii=False),
                datetime.now(timezone.utc).isoformat(),
            ),
        )


def get_conversation(user_id: str, conversation_id: str) -> list[dict[str, str]] | None:
    with connect() as connection:
        row = connection.execute(
            "SELECT messages FROM agent_conversations WHERE id = ? AND user_id = ?",
            (conversation_id, user_id),
        ).fetchone()
    if row is None:
        return None
    try:
        messages = json.loads(row["messages"])
    except json.JSONDecodeError as error:
        raise RuntimeError("Stored AI conversation history is invalid.") from error
    return messages if isinstance(messages, list) else None
