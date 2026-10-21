# EduAI backend

FastAPI backend for the `EduAI/frontend` application. It provides the `/api/*`
routes used by the frontend, persists student accounts and learning data in a
local SQLite database, and exposes `/health` for a quick service check.

## Run locally on Windows

From this directory in PowerShell:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Set a private `EDUAI_SECRET_KEY` in the backend process environment before
using the service outside local development. The default secret is only for
local development and is rejected when `ENVIRONMENT=production`.

In `EduAI/frontend/.env.local`, set:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

Restart the frontend after changing environment variables. The backend allows
the default local frontend origins `http://localhost:3000` and
`http://127.0.0.1:3000`; set `EDUAI_CORS_ORIGINS` to a comma-separated list if
the frontend runs elsewhere.

The built-in study, career, and assistant responses are local heuristics, not
predictions from a trained model or a hosted AI provider. Job search returns no
listings until a trusted jobs provider is configured. Uploaded text, PDF, and
DOCX documents are limited to 10 MB and stored in the local SQLite database.
