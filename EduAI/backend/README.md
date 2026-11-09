# EduAI backend

FastAPI backend for the `EduAI/frontend` application. It provides the `/api/*`
routes used by the frontend, persists student accounts and learning data in a
local SQLite database, and exposes `/health` for a quick service check.

## SQLite tables

The database is stored at `backend/data/eduai.db` by default. Set
`EDUAI_DATABASE_PATH` to place it elsewhere. Foreign-key enforcement, WAL mode,
and a 15-second busy timeout are enabled. Schema upgrades run transactionally
at startup and are recorded in `schema_migrations`; the current schema version
is 5.

| Table | Purpose | Relationship |
| --- | --- | --- |
| `users` | Login identity, password hash, and account role | Parent of each student's records |
| `profiles` | One-to-one education, progress, and preference details | `profiles.user_id` → `users.id` |
| `predictions` | Performance history returned by analytics | `predictions.user_id` → `users.id` |
| `skills` | Per-student skill levels | Primary key: `(user_id, skill_id)` |
| `goals` | Goal title, target date, and progress | `goals.user_id` → `users.id` |
| `goal_milestones` | Ordered, individually addressable goal tasks | `goal_milestones.goal_id` → `goals.id` |
| `habits` | Student habit and current streak | `habits.user_id` → `users.id` |
| `habit_completions` | One completion record per habit per date | Primary key: `(habit_id, completed_on)` |
| `documents` | Extracted, readable study-document text | `documents.user_id` → `users.id` |
| `quizzes` | Quiz owner and creation metadata | `quizzes.user_id` → `users.id` |
| `quiz_questions` | Ordered question, options, and private answer key | `quiz_questions.quiz_id` → `quizzes.id` |
| `quiz_attempts` | A submitted attempt and score | `quiz_attempts.quiz_id` and `user_id` |
| `quiz_attempt_answers` | The selected option for each question in an attempt | Foreign keys to attempt and question |
| `interviews` | Mock-interview session state | `interviews.user_id` → `users.id` |
| `interview_responses` | Ordered interview questions, answers, and feedback | `interview_responses.interview_id` → `interviews.id` |
| `schema_migrations` | Applied schema versions and timestamps | Database-level migration history |
| `ai_runtime_settings` | Selected primary and fallback AI providers | Singleton configuration |
| `ai_provider_settings` | Enabled state, selected model, and last connectivity status | One row per provider; no credentials |
| `ai_provider_usage` | Provider, model, status, response time, and safe error code | `user_id` → `users.id`; no prompt or credential data |
| `agent_conversations` | Recent assistant conversation turns | `user_id` → `users.id` |

The legacy `quizzes.questions` and `goals.milestones` JSON columns are retained
for compatibility with existing databases; schema migrations copy their
contents into `quiz_questions` and `goal_milestones`. New writes use the
relational tables.

## Run locally on Windows

From this directory in PowerShell:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Set a private `EDUAI_SECRET_KEY` in the backend process environment before
using the service outside local development. The default secret is only for
local development and is rejected when `ENVIRONMENT=production`.

In `EduAI/frontend/.env.local`, set:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

### Optional cloud AI providers

The backend supports Gemini, OpenAI, SambaNova, and Cohere. Gemini uses Google's
native `generateContent` API, OpenAI and SambaNova use chat completions, and
Cohere uses its v2 chat API. Copy the placeholders from
`.env.example` into `backend/.env`, then replace them with keys created in the
providers' dashboards. **Do not paste API keys into the frontend or commit
`backend/.env`.** The root `.gitignore` already excludes `.env` files.

Use `GEMINI_API_KEY`, `SECOND_AI_API_KEY`, `SAMBANOVA_API_KEY`, and
`COHERE_API_KEY` for the corresponding providers. Provider keys are read only
by the backend and never returned by its APIs. Set the primary and fallback
with `AI_PRIMARY_PROVIDER` and `AI_FALLBACK_PROVIDER`; the example defaults to
SambaNova and Cohere. Optional `GEMINI_MODEL`, `OPENAI_MODEL`,
`SAMBANOVA_MODEL`, and `COHERE_MODEL` values preselect a model. Otherwise, sign
in with an administrator, open **Project Settings → AI provider settings**, and
use **Check connectivity & models** to discover available models, select one,
and save. Gemini models are filtered to those that support `generateContent`.

Career recommendations and job-role ideas use the selected cloud provider only
after the student explicitly consents in the UI. The returned fit scores are
guidance estimates, not validated predictions. Job-role ideas are not live
vacancies; the interface links to an external search for current listings.

To grant a local account admin settings access, first register it normally and
then promote only that account in the local SQLite database:

```powershell
python -c "import sqlite3; c=sqlite3.connect('data/eduai.db'); c.execute('UPDATE users SET role = ? WHERE email = ?', ('admin', 'your-admin-email@example.com')); c.commit(); c.close()"
```

Restart the backend after adding or changing provider keys. Connectivity checks
and chat/summarization requests are rate limited. Provider failover applies to
timeouts, connection/service failures, and rate limits; invalid credentials,
quota/billing errors, disabled providers, and missing model/credential setup
are reported without retrying another provider. If no provider is configured,
local login, SQLite features, random question-bank quizzes, reports, and
existing prediction endpoints remain available; document-grounded AI quizzes
and other cloud AI routes return an explicit unavailable message.

AI chat history is retained per account in SQLite for conversational context.
It is restricted to that account and truncated to the most recent eight
exchanges. Provider usage telemetry stores only provider/model, status,
response time, and sanitized error codes—not prompts, completions, or keys.
Summarization sends the supplied text to the selected external provider.

### Local trained models

Academic performance analysis runs locally with
`C:\Users\dell\Downloads\student-performance\models\student_performance_model.pkl`;
it does not call Gemini or another external provider. Set `EDUAI_MODEL_DIR` to
override the model directory. Relative `EDUAI_MODEL_DIR` paths are resolved
from the repository root.
The model loads on the first prediction, not at backend startup. If the artifact
is missing or incompatible, `/api/performance/predict` returns an explicit 503.

The random-forest regressor requires attendance, daily study hours, assignment
marks, internal marks, and test score. It predicts final marks on a 0–100 scale;
the result is clipped to that range, matching the source analyzer's behavior.
No classifier labels or confidence values are inferred. Keep the 730 MB model
artifact at the configured path; it is loaded lazily and should not be committed
as a regular Git file.

Study-material summaries use the local extractive model at
`C:\Users\dell\Downloads\student-performance\models\text_summarization_model.pkl`.
Set `EDUAI_SUMMARIZATION_MODEL_PATH` to override it. The model stores word
frequencies and stop words; it ranks source sentences and returns the top three
in their original order. Upload summaries and the **Summarize locally** action
use this model without sending document text to a cloud provider. **Ask with AI**
and the separate general `/api/ai/summarize` endpoint still use the configured
cloud provider.

The career artifact's output classes do not match the saved career-label
metadata, so it is not used as a career predictor. Career guidance instead uses
the configured cloud AI provider after explicit consent, and is labeled as an
estimate rather than a validated prediction. Other large artifacts have feature
contracts not collected by the current UI. Do not assign meanings to their
numeric outputs without their original label encoders.

Quiz Intelligence offers random question-bank quizzes and document-grounded AI
quizzes. Random quizzes sample without replacement from the local workbook at
`C:\Users\dell\Downloads\student-performance\Placement_Interview_Quiz_Questions.csv.xlsx`;
set `EDUAI_QUIZ_BANK_PATH` to use another `.xlsx` file with `question`, `difficulty`,
`A`, `B`, `C`, `D`, and `answer` columns. The random quiz accepts 1–5,000 questions
and can filter by the workbook's `Easy`, `Medium`, or `Hard` values (or include
all difficulties). Questions with malformed fields or duplicate options are
skipped; duplicates and malformed rows are logged. The separate
`quiz_classifier_model.pkl` is a classifier, not a question generator; its
required text preprocessing and class mapping are not included, so it is not
used to generate or label these quizzes. Document-grounded quizzes send the
selected document text to the configured AI provider and accept 1–10 questions.
The existing topic quiz API routes remain available and unchanged.

Several artifacts in `train folder` exceed GitHub's regular 100 MB file limit.
Use Git LFS or versioned external model storage for those files rather than
committing them as ordinary Git objects.

Official API references:

- Gemini: <https://ai.google.dev/api/generate-content> and <https://ai.google.dev/api/models>
- OpenAI: <https://developers.openai.com/api/reference/resources/chat> and <https://developers.openai.com/api/reference/resources/models/methods/list>
- SambaNova: <https://docs.sambanova.ai/cloud/docs/get-started/sambanova-cloud>
- Cohere: <https://docs.cohere.com/v2/reference/chat> and <https://docs.cohere.com/v1/reference/list-models>

Restart the frontend after changing environment variables. The backend allows
the default local frontend origins `http://localhost:3000` and
`http://127.0.0.1:3000`; set `EDUAI_CORS_ORIGINS` to a comma-separated list if
the frontend runs elsewhere.

## Test

```powershell
python -m pip install -r requirements-dev.txt
python -m unittest discover -s tests -v
```

The `/api/jobs/search` endpoint still returns no live listings until a trusted
jobs provider is configured; AI-generated role suggestions use the separate
`/api/jobs/recommend` endpoint. Uploaded text, PDF, and DOCX documents are
limited to 10 MB and stored in the local SQLite database.
