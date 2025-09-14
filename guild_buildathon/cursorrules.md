## PIPELINE & TECHSTACK (ADD THIS - MUST READ)

### Tech stack (MUST)
- Language: Python 3.10+
- Web framework: FastAPI + uvicorn
- DB (MVP): SQLite (./demo.db) via SQLAlchemy ORM
- Background jobs (MVP): FastAPI BackgroundTasks (single-process) — later replaceable with SQS + worker
- Messaging adapter: MockAdapter (must), TwilioAdapter (TODO)
- Mood detection: simple rule-based function detect_mood(); placeholder to swap in HF model
- Summarizer/outcome: summarize() function (rule-based heuristics), placeholder for LLM
- Audio/STT/TTS: NOT required for MVP; leave TODO hooks (generate_tts(), run_stt())
- Deployment: single EC2 process (systemd) — no Docker/Redis for MVP

### Pipeline (exact flow Cursor must implement)
1. `POST /api/messages`:
   - Validate input, insert MessageJob (status=queued) into DB.
   - Immediately call MockAdapter.send() via BackgroundTasks to mark job as sent and update status -> sent_at.
   - Return `{ job_id, status }`.

2. `POST /api/messages/webhook`:
   - Accept provider raw payload, normalize minimal fields (`lead_id`, `customer_id`, `channel`, `transcript`, `language`), persist provider_raw, create an Interaction record with status=processing, and trigger BackgroundTasks to call `process_inbound_interaction(interaction_id)`.

3. `POST /admin/simulate_reply`:
   - Admin-only deterministic endpoint: accept `interaction_id, lead_id, customer_id, channel, transcript, language` and call `process_inbound_interaction()`.

4. `process_inbound_interaction(interaction_id)` (Background task):
   - Load interaction transcript.
   - Call `detect_mood(transcript)` -> `{label, confidence, reasons}`.
   - Call `summarize(transcript, context)` -> `{summary:[3 bullets], outcome:{label,confidence}}`.
   - Update Interaction DB row with mood + summary + outcome.
   - If `mood.label == "negative" and confidence >= 0.7` or `outcome.label == "Escalate"` then create Task (escalation) linked to the lead and set `interaction.escalated = true`.
   - Always store `provider_raw` and timestamps for audit.

5. `GET /api/interactions/{id}`:
   - Return the full Interaction record including `transcript, mood, summary, outcome, provider_raw, escalated_flag`.

### Concrete files & functions Cursor must produce
- `app.py` (FastAPI app, endpoints above)
- `models.py` (SQLAlchemy ORM models for Customer, Lead, MessageJob, Interaction, Task)
- `adapters.py` (MockAdapter.send(job_dict) and a TwilioAdapter stub with TODO)
- `processors.py` (process_inbound_interaction; detect_mood(); summarize(); TODO hooks: generate_tts(), run_stt())
- `database.py` (DB session and helper functions)
- `requirements.txt` (minimal libs)
- `.env.example` (env vars placeholders)
- `README.md` with run & demo steps and the demo checklist from cursorrules

### Acceptance & test data (MUST be commit-ready)
- Include `/admin/seed_demo` endpoint to create at least 1 customer & 1 lead.
- Include 3 sample transcripts (positive, neutral, negative) as JSON files under `/demo_data/` and expected outputs in README.
- Add TODO comments in code where production integrations (Twilio, SQS, Whisper, S3, RDS) should be inserted.

End of PIPELINE & TECHSTACK block.
# Cursor Rules — Follow-up Automation (MVP)

## Purpose (one line)
This file is the authoritative MUST-follow instruction set for any AI assistant working on the hackathon backend: minimal, AWS-hosted, deterministic demo, no Docker/Redis.

---

## MUST (non-negotiable)
- Host the MVP on **AWS EC2** (no Docker required).  
- **NO Redis** and **NO Docker** for the hackathon MVP. Use SQLite or single-process services.  
- No frontend code in this task — backend only; frontend team will integrate later.  
- Provide deterministic demo fallbacks: a **MockAdapter** and an `/admin/simulate_reply` endpoint.  
- Keep external integrations behind adapter interfaces (so they can be swapped later).  
- Add clear `TODO` comments where production integrations (Twilio, Whisper, SQS, S3, RDS) would be inserted.

---

## SHOULD (high-priority)
- Use **FastAPI** (Python) for the backend.
- Implement endpoints:
  - `POST /api/messages` — create message job
  - `POST /api/messages/webhook` — ingest provider replies
  - `POST /admin/simulate_reply` — admin simulate reply (deterministic)
  - `GET /api/interactions/{id}` — view transcript + mood + summary + outcome
  - `POST /admin/seed_demo` — seed a demo customer & lead
- Use **SQLite** (`./demo.db`) for MVP persistence. (If multiple processes are used, prefer Postgres/RDS.)
- Implement simple `detect_mood()` and `summarize()` functions in a single file so they are trivially replaceable later.
- Store provider raw payloads in `interactions.provider_raw` for audit.

---

## OPTIONAL (if time permits)
- Add `requirements.txt` and `.env.example`.
- Add simple logging and a small README with deployment/run steps.
- Add small unit tests for detect_mood() and summarize().

---

## Minimal pipeline (single-process/demo friendly)
1. `POST /api/messages` -> save MessageJob (status queued) -> MockAdapter send -> mark job sent.  
2. Admin calls `POST /admin/simulate_reply` to post a canned inbound reply (transcript).  
3. Backend processes transcript: `detect_mood()` -> `summarize()` -> save Interaction.  
4. If mood is `negative` (and confidence >= threshold) or outcome == `Escalate` -> create Task (escalation).

---

## Minimal data model (fields to include)
- **Customer**: `id, name, phone, preferred_language, consent_given_at, do_not_contact`
- **Lead**: `id, customer_id, policy_id, expected_value, due_date`
- **MessageJob**: `id, lead_id, customer_id, channel, template_id, scheduled_at, status`
- **Interaction**: `id, lead_id, customer_id, channel, transcript, language, mood_label, mood_conf, summary (pipe-separated), outcome_label, outcome_conf, provider_raw, created_at`
- **Task**: `id, lead_id, type, assignee_id, status, notes, created_at`

---

## Mood & Summary guidance (for implementers)
- **Mood detection**: start with rule-based keywords (`cancel`, `refund`, `scam`, `sue`, `not happy`, `complain`, `angry`) -> return `negative` quick wins. Positive keywords (`paid`, `yes`, `renew`) -> `receptive`. Else `neutral`. Return a confidence score.
- **Summarizer/outcome (fallback)**: return up to 3 short bullets (first meaningful sentences). Outcome heuristic: map keywords to `Payment Promised`, `Escalate`, `Needs Follow-up`, else `Needs Follow-up`.
- Keep these as single-file functions so they can be swapped later with HF/LLM calls.

---

## LLM prompt stubs (for future replacement)
- **Summarizer prompt (LLM)**:
  ```
  System: "You are concise. Given a customer transcript and short context, return JSON only:
  { "summary": ["...","...","..."], "outcome": {"label":"Resolved|Payment Promised|Needs Follow-up|Escalate", "confidence":0.0} }"
  ```

---

## Acceptance Criteria (for PR / demo)
- POST `/api/messages` marks a MessageJob as sent (via MockAdapter).
- POST `/admin/simulate_reply` with a transcript creates an Interaction with transcript, mood, summary, and outcome stored.
- At least one simulated negative transcript produces `mood: negative` and creates a Task (escalation).
- GET `/api/interactions/{id}` returns the stored data including `provider_raw`.
- README includes steps to run locally and a demo checklist.

---

## Demo checklist (short, include in README)
1. Start app (python app.py or uvicorn).  
2. POST `/admin/seed_demo`.  
3. POST `/api/messages` for the seeded lead.  
4. POST `/admin/simulate_reply` with:
   - positive transcript -> expect `Payment Promised` or `Resolved`.
   - neutral transcript -> expect `Needs Follow-up`.
   - negative transcript -> expect `Escalate` + Task created.  
5. Call GET `/api/interactions/{id}` to verify stored mood/summary/outcome.

---

## TODO (post-hack)
- Replace MockAdapter with TwilioAdapter behind adapter interface.
- Add SQS and a proper worker for scale.
- Add STT (Whisper) for voice; LLM summarizer for higher-quality summaries.
- Move DB to RDS and storage to S3.

---

## JSON quick-config (machine-parsable)
```json
{
  "MUST": ["AWS EC2", "No Docker", "No Redis", "MockAdapter", "/admin/simulate_reply"],
  "ENDPOINTS": ["/api/messages","/api/messages/webhook","/admin/simulate_reply","/api/interactions/{id}"],
  "DB": "sqlite:///./demo.db",
  "LANG": "python3.10",
  "PRIORITY": "MVP"
}
```
