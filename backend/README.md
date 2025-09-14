# Follow-up Automation API with Grok LLM

A FastAPI-based backend for automated customer follow-up and interaction processing with Grok LLM integration. Features multilingual, multi-turn conversations with specialized agents for renewal, policy info, and cross-selling.

## Quick Start

### Prerequisites
- Python 3.10+
- pip
- Twilio account (for SMS functionality)
- Grok API access (for AI conversations)

### Installation & Running

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set up Twilio (Required for SMS):**
   - Create a free Twilio account at https://www.twilio.com/try-twilio
   - Get your Account SID and Auth Token from the Twilio Console
   - Purchase a phone number for sending SMS

3. **Set up Grok API (Required for AI conversations):**
   - Get Grok API access from https://x.ai/
   - Obtain your API key from the Grok console
   - Create a `.env` file with your credentials:
     ```bash
     cp env.example .env
     # Edit .env with your Twilio and Grok credentials
     ```

4. **Run the application:**
   ```bash
   uvicorn app:app --reload
   ```
   
   Or directly:
   ```bash
   python app.py
   ```

4. **Access the API:**
   - API: http://localhost:8000
   - Interactive docs: http://localhost:8000/docs
   - Health check: http://localhost:8000/

## Grok LLM Setup Guide

### Step 1: Get Grok API Access
1. Visit https://x.ai/ and sign up for Grok API access
2. Complete the application process (may require approval)
3. Once approved, access the Grok API console

### Step 2: Get API Credentials
1. In the Grok console, navigate to API Keys
2. Create a new API key
3. Copy the API key (keep it secure!)

### Step 3: Configure Environment
Add to your `.env` file:
```env
GROK_API_KEY=your_grok_api_key_here
GROK_API_BASE=https://api.x.ai/v1
GROK_MODEL=grok-beta
```

### Step 4: Test Grok Integration
The system will automatically fall back to rule-based processing if Grok is unavailable.

## Twilio Setup Guide

### Step 1: Create Twilio Account
1. Go to https://www.twilio.com/try-twilio
2. Sign up for a free account (includes $15 credit)
3. Verify your phone number

### Step 2: Get Credentials
1. Go to the Twilio Console Dashboard
2. Copy your **Account SID** and **Auth Token**
3. Note: Keep these credentials secure!

### Step 3: Purchase a Phone Number
1. In Twilio Console, go to Phone Numbers → Manage → Buy a number
2. Choose a number with SMS capabilities
3. Copy the phone number (format: +1234567890)

### Step 4: Configure Webhook
1. In Twilio Console, go to Phone Numbers → Manage → Active numbers
2. Click on your purchased number
3. Set the webhook URL to: `https://your-domain.com/api/messages/webhook`
4. Set HTTP method to: `POST`
5. Save the configuration

### Step 5: Environment Configuration
Create a `.env` file in your project root:
```env
MESSAGING_ADAPTER=twilio
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_FROM_NUMBER=+1234567890
```

## API Endpoints

### Conversation Endpoints (Grok LLM)
- `POST /api/conversations` - Create a new conversation with an agent
- `POST /api/conversations/{id}/messages` - Send a message in a conversation
- `GET /api/conversations/{id}` - Get conversation details and messages
- `POST /api/conversations/{id}/summary` - Generate conversation summary

### Legacy Endpoints
- `POST /api/messages` - Create and send a message job
- `POST /api/messages/webhook` - Handle incoming Twilio SMS webhook
- `POST /api/messages/webhook/json` - Handle JSON webhook (for testing)
- `GET /api/interactions/{id}` - Get interaction details with mood analysis

### Admin Endpoints
- `POST /admin/simulate_reply` - Simulate a customer reply for testing
- `POST /admin/seed_demo` - Seed demo customer and lead data

## Frontend Integration Demo Flow

### Complete End-to-End Demo
Follow these steps to demonstrate the full frontend integration:

1. **Start the application:**
   ```bash
   uvicorn app:app --reload
   ```

2. **Seed demo data:**
   ```bash
   curl -X POST "http://localhost:8000/admin/seed_demo"
   ```

3. **Start a conversation:**
   ```bash
   curl -X POST "http://localhost:8000/api/start_conversation" \
     -H "Content-Type: application/json" \
     -d '{
       "lead_id": "501",
       "customer_id": "1",
       "customer_phone": "+1-415-555-0199",
       "policy_id": "POL-INS-2024-001",
       "agent_type": "renewal",
       "initial_context": {
         "outstanding_amount": 1500,
         "due_date": "2024-02-15",
         "language": "en"
       }
     }'
   ```

4. **Simulate customer replies using demo data:**
   ```bash
   # Positive response
   curl -X POST "http://localhost:8000/admin/simulate_reply" \
     -H "Content-Type: application/json" \
     -d '{
       "conversation_id": "1",
       "from_number": "+1-415-555-0199",
       "text": "Yes, I would like to renew my policy. How much will it cost?",
       "language": "en"
     }'
   ```

5. **Get conversation details:**
   ```bash
   curl "http://localhost:8000/api/conversations/1"
   ```

6. **Generate foresights:**
   ```bash
   curl -X POST "http://localhost:8000/api/conversations/1/foresights"
   ```

## Demo Checklist

Follow these steps to test the complete pipeline:

### 1. Start the Application
```bash
uvicorn app:app --reload
```

### 2. Seed Demo Data
```bash
curl -X POST "http://localhost:8000/admin/seed_demo" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Demo Customer",
    "customer_phone": "+1234567890",
    "lead_policy_id": "POL-001",
    "lead_expected_value": 1000.0
  }'
```

Expected response:
```json
{
  "customer_id": 1,
  "lead_id": 1,
  "message": "Demo data seeded successfully"
}
```

### 3. Create a Message Job (SMS via Twilio)
```bash
curl -X POST "http://localhost:8000/api/messages" \
  -H "Content-Type: application/json" \
  -d '{
    "lead_id": 1,
    "customer_id": 1,
    "channel": "sms",
    "template_id": "welcome_template",
    "message_body": "Hello! This is a follow-up regarding your policy. Please reply with your feedback."
  }'
```

Expected response:
```json
{
  "job_id": 1,
  "status": "queued",
  "message": "Message job created and queued for sending via TwilioAdapter",
  "adapter": "TwilioAdapter"
}
```

**Note:** This will send a real SMS to the customer's phone number via Twilio!

### 4. Test Grok Conversation Agents

#### Create Renewal Agent Conversation
```bash
curl -X POST "http://localhost:8000/api/conversations" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": 1,
    "agent_type": "renewal",
    "channel": "sms",
    "language": "en"
  }'
```

#### Create Policy Info Agent Conversation
```bash
curl -X POST "http://localhost:8000/api/conversations" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": 1,
    "agent_type": "policy_info",
    "channel": "sms",
    "language": "en"
  }'
```

#### Create Cross-sell Agent Conversation
```bash
curl -X POST "http://localhost:8000/api/conversations" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": 1,
    "agent_type": "crosssell",
    "channel": "sms",
    "language": "en"
  }'
```

### 5. Test Frontend-Friendly Endpoints

#### Start a Conversation
```bash
curl -X POST "http://localhost:8000/api/start_conversation" \
  -H "Content-Type: application/json" \
  -d '{
    "lead_id": "501",
    "customer_id": "201",
    "customer_phone": "+1-415-555-0199",
    "policy_id": "POL-INS-2024-001",
    "agent_type": "renewal",
    "initial_context": {
      "outstanding_amount": 1500,
      "due_date": "2024-02-15",
      "language": "en"
    }
  }'
```

Expected response:
```json
{
  "conversation_id": "1001",
  "job_id": "2001",
  "status": "started"
}
```

#### Simulate Customer Reply
```bash
curl -X POST "http://localhost:8000/admin/simulate_reply" \
  -H "Content-Type: application/json" \
  -d '{
    "conversation_id": "1001",
    "from_number": "+1-415-555-0199",
    "text": "Yes, I would like to renew my policy. How much will it cost?",
    "language": "en"
  }'
```

Expected response:
```json
{
  "message_id": "msg_123",
  "action": "request_payment",
  "mood": {"label": "receptive", "confidence": 0.8},
  "outcome": {"label": "Payment Promised", "confidence": 0.7}
}
```

#### Get Conversation Details
```bash
curl "http://localhost:8000/api/conversations/1001"
```

Expected response:
```json
{
  "conversation_id": 1001,
  "metadata": {
    "lead_id": 501,
    "customer_id": 201,
    "agent_type": "renewal",
    "channel": "sms",
    "language": "en",
    "status": "active",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:45:00Z"
  },
  "messages": [
    {
      "id": 1,
      "sender": "assistant",
      "content": "Hi Sarah! This is Alex from Premier Insurance...",
      "timestamp": "2024-01-15T10:30:00Z",
      "mood": {"label": "neutral", "confidence": 0.6},
      "action": "reply",
      "outcome_hint": {"label": "Needs Follow-up", "confidence": 0.7}
    }
  ],
  "summary": "Customer interested in renewal...",
  "mood_timeline": [
    {"timestamp": "2024-01-15T10:30:00Z", "mood": "neutral", "confidence": 0.6}
  ],
  "tasks": []
}
```

#### Generate Foresights
```bash
curl -X POST "http://localhost:8000/api/conversations/1001/foresights"
```

Expected response:
```json
{
  "foresights": [
    {
      "label": "High Renewal Probability",
      "confidence": 0.92,
      "explain": "Customer showed 3 positive indicators vs 0 negative"
    },
    {
      "label": "High Engagement",
      "confidence": 0.8,
      "explain": "Customer provided detailed responses (45 total words)"
    }
  ],
  "stored": true
}
```

### 6. Test Different Reply Scenarios

#### Positive Reply (Payment Promised)
```bash
curl -X POST "http://localhost:8000/admin/simulate_reply" \
  -H "Content-Type: application/json" \
  -d '{
    "lead_id": 1,
    "customer_id": 1,
    "channel": "sms",
    "transcript": "Yes, I would like to renew my policy. When can I make the payment?",
    "language": "en"
  }'
```

#### Neutral Reply (Needs Follow-up)
```bash
curl -X POST "http://localhost:8000/admin/simulate_reply" \
  -H "Content-Type: application/json" \
  -d '{
    "lead_id": 1,
    "customer_id": 1,
    "channel": "sms",
    "transcript": "I need to think about it. Can you call me back tomorrow?",
    "language": "en"
  }'
```

#### Negative Reply (Escalate)
```bash
curl -X POST "http://localhost:8000/admin/simulate_reply" \
  -H "Content-Type: application/json" \
  -d '{
    "lead_id": 1,
    "customer_id": 1,
    "channel": "sms",
    "transcript": "This is terrible service! I want to cancel and get a refund. I am very angry about this mistake!",
    "language": "en"
  }'
```

### 5. Check Interaction Results
```bash
curl "http://localhost:8000/api/interactions/1"
```

Expected response for negative interaction:
```json
{
  "id": 1,
  "lead_id": 1,
  "customer_id": 1,
  "channel": "sms",
  "transcript": "This is terrible service! I want to cancel and get a refund...",
  "language": "en",
  "mood_label": "negative",
  "mood_confidence": 0.85,
  "summary": "This is terrible service!|I want to cancel and get a refund.|I am very angry about this mistake!",
  "outcome_label": "Escalate",
  "outcome_confidence": 0.9,
  "escalated": true,
  "provider_raw": {"simulated": true, "admin_test": true},
  "created_at": "2024-01-01T12:00:00",
  "processed_at": "2024-01-01T12:00:01"
}
```

## Sample Data

The `/demo_data/` directory contains sample transcripts with expected outputs:

### Positive Transcript (`positive.json`)
```json
{
  "transcript": "Yes, I would like to renew my policy. The coverage has been great and I'm happy with the service. When can I make the payment?",
  "expected_mood": {
    "label": "positive",
    "confidence": 0.8
  },
  "expected_outcome": {
    "label": "Payment Promised",
    "confidence": 0.7
  }
}
```

### Neutral Transcript (`neutral.json`)
```json
{
  "transcript": "I need to think about it. Can you call me back tomorrow? I have some questions about the coverage.",
  "expected_mood": {
    "label": "neutral",
    "confidence": 0.6
  },
  "expected_outcome": {
    "label": "Needs Follow-up",
    "confidence": 0.6
  }
}
```

### Negative Transcript (`negative.json`)
```json
{
  "transcript": "This is terrible service! I want to cancel and get a refund. I am very angry about this mistake and want to speak to a manager!",
  "expected_mood": {
    "label": "negative",
    "confidence": 0.9
  },
  "expected_outcome": {
    "label": "Escalate",
    "confidence": 0.9
  }
}
```

## Architecture

### Tech Stack
- **Language**: Python 3.10+
- **Web Framework**: FastAPI + uvicorn
- **Database**: SQLite (MVP) via SQLAlchemy ORM
- **Background Jobs**: FastAPI BackgroundTasks
- **Messaging**: MockAdapter (demo), TwilioAdapter (TODO)

### Data Models
- **Customer**: Customer information and preferences
- **Lead**: Insurance leads with expected values
- **MessageJob**: Outbound message jobs
- **Interaction**: Customer interactions with mood analysis
- **Task**: Escalation and follow-up tasks

### Processing Pipeline
1. Message job created → MockAdapter sends message
2. Customer reply received → Webhook creates interaction
3. Background processing → Mood detection + summarization
4. Escalation check → Task created if needed

## TODO (Post-Hack)

### Production Integrations
- [ ] Replace MockAdapter with TwilioAdapter
- [ ] Add SQS for background job processing
- [ ] Integrate AWS Transcribe for voice-to-text
- [ ] Add AWS Polly for text-to-speech
- [ ] Move to RDS PostgreSQL database
- [ ] Add S3 for file storage

### ML/AI Enhancements
- [ ] Replace rule-based mood detection with Hugging Face model
- [ ] Integrate LLM (GPT/Claude) for advanced summarization
- [ ] Add sentiment analysis for better mood detection
- [ ] Implement conversation context tracking

### Scalability
- [ ] Add Redis for caching
- [ ] Implement proper worker processes
- [ ] Add monitoring and logging
- [ ] Deploy with Docker containers

## Development

### Database
The SQLite database (`demo.db`) is created automatically on first run. To reset:
```bash
rm demo.db
uvicorn app:app --reload
```

### Environment Variables
Copy `env.example` to `.env` and configure as needed:
```bash
cp env.example .env
```

### Testing
The API includes comprehensive error handling and logging. Check the console output for processing details.

## License

This is a hackathon project for demonstration purposes.
