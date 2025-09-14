# grok_rules.md — Grok + Twilio integration spec (MUST follow)

## Purpose
This file contains the authoritative, detailed instructions Cursor must follow to add Grok LLM integration and agentized behavior to the backend. The short prompt given to Cursor references this file.

---

## Tech stack & files to produce
- Language: Python 3.10+
- Framework: FastAPI + uvicorn
- DB: SQLite (MVP) via SQLAlchemy
- Transport: Twilio (SMS/WhatsApp/Voice) + MockAdapter (for demo)
- LLM: Grok via HTTP API (`llm_grok.py`)
- Files Cursor must create/update:  
  `app.py`, `models.py`, `database.py`, `adapters.py`, `processors.py`, `llm_grok.py`, `prompts.py`, `requirements.txt`, `.env.example`, `README.md`, `demo_data/positive.json`, `demo_data/neutral.json`, `demo_data/negative.json`

---

## Agents (3)
- `renewal` — remind about upcoming renewals, request payment, explain steps.
- `policy_info` — answer policy FAQs (coverage, premium, claims).
- `crosssell` — confirm existing policy context then suggest upgrades/add-ons only if receptive.

Agent selection: job payload includes `agent_type` field. Use it to pick system prompt from `prompts.py`.

---

## Structured LLM output (MANDATORY)
Ask Grok to return JSON only, exactly this schema:
```json
{
  "assistant_text": "string",                // text to send to customer (in same language)
  "mood": {"label":"receptive|neutral|negative", "confidence":0.0},
  "summary": ["bullet1","bullet2","bullet3"],
  "action": "reply|escalate|schedule_followup|request_payment",
  "outcome_hint": {"label":"Resolved|Payment Promised|Needs Follow-up|Escalate","confidence":0.0}
}
```
Cursor must validate this JSON; on parse failure retry up to 2 times with "Return JSON only" prompt. If still invalid -> fallback to rule-based.

---

## Conversation & multilingual rules
- Include last 8 messages in Grok `messages` input (role=user/assistant).
- Pass `language` hint in the call. Grok must reply in that language. If language unknown, detect with `langdetect`.
- Replies must be natural, multi-sentence, human-like (not terse one-line).
- For voice flows, TTS is outside scope for now — Twilio voice should play agent_text audio if implemented later (TODO hooks).

---

## Processing logic (flow)
1. `POST /api/messages` with `{agent_type, lead_id, customer_id, ...}`:
   - Create Conversation + MessageJob.
   - Render context (customer name, policy id, due_date, outstanding_amount) and call `llm_grok.call_grok()` with agent system prompt + initial context to generate first assistant_text.
   - Send assistant_text via adapter (Mock/Twilio) and save message.

2. Inbound (Twilio webhook or `/admin/simulate_reply`):
   - Normalize inbound into Message (sender=user).
   - Append to conversation.
   - Call `call_grok()` with full recent messages and agent system prompt.
   - Validate JSON. If `action == escalate` or `mood.label == negative` with confidence >= 0.7, create Task and do NOT auto-respond.
   - Else send assistant_text back and save agent message.

3. Summaries:
   - Use Grok to produce a 3-bullet summary periodically or on-demand (endpoint `GET /api/conversations/{id}` returns summary).

---

## Fallbacks & errors
- If Grok fails (timeout, 5xx), run local rule-based `detect_mood()` and `summarize()` and reply with a polite fallback message. Create Task if needed.
- Cache identical Grok calls for 30s to avoid duplicate requests.
- Retry Grok at most 2 times on transient errors.

---

## Security & compliance
- Do not call Grok or Twilio for a customer if `customer.do_not_contact` or `consent_given_at` missing. Ask for consent first.
- Log `provider_raw` and `llm_raw` in DB for audit.

---

## Env variables (.env.example)
- GROK_API_KEY, GROK_API_BASE, GROK_MODEL
- TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM
- ADAPTER=mock|twilio
- OTHER: DATABASE_URL (optional)

---

## Prompts — short versions (store in prompts.py)
- Renewal system prompt: instruct Grok to remind, request payment, and output structured JSON; reply in user's language.
- Policy_info prompt: answer concisely; escalate if beyond scope.
- Crosssell prompt: start by summarizing current policy, then suggest upgrades if receptive.

(Exact prompt templates should be put in `prompts.py`; Cursor should create that file.)

---

## Acceptance criteria
- Running in demo mode (`ADAPTER=mock`) the app:
  - can start an outbound conversation for each agent and produce a natural assistant message,
  - accepts simulated inbound replies, calls Grok, stores validated JSON, and either auto-replies or escalates according to `action`/`mood`,
  - creates Task records for escalations,
  - stores provider_raw & llm_raw,
  - README explains how to run demo and switch to Twilio+Grok.

---

## Demo data
Cursor must add `demo_data/positive.json`, `neutral.json`, `negative.json` with sample user messages and expected Grok JSON outputs so demo runs deterministically with MockAdapter.

---

## TODO markers
Cursor should add inline TODO comments where future production items belong: SQS, RDS, Whisper (STT), S3 (audio), rate-limiting, and webhook signature verification.

End of grok_rules.md
