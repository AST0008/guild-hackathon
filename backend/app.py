from fastapi import FastAPI, BackgroundTasks, HTTPException, Depends, Request, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Dict, Any
import uvicorn
from datetime import datetime

from database import get_db, init_db
from models import Customer, Lead, MessageJob, Interaction, Task, Conversation, Message
from adapters import get_adapter
from processors import process_inbound_interaction, process_conversation_message, generate_conversation_summary, start_outbound_conversation, handle_inbound_message, generate_conversation_foresights
from llm_grok import call_grok
from prompts import get_agent_prompt, format_prompt_with_context

# Initialize FastAPI app
app = FastAPI(title="Follow-up Automation API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_db()

# Pydantic models for request/response
class MessageRequest(BaseModel):
    lead_id: int
    customer_id: int
    channel: str
    template_id: Optional[str] = None
    to_number: Optional[str] = None  # Required for SMS
    message_body: Optional[str] = None  # Custom message content

class WebhookRequest(BaseModel):
    lead_id: Optional[int] = None
    customer_id: Optional[int] = None
    channel: str
    transcript: str
    language: str = "en"
    provider_raw: Optional[Dict[str, Any]] = None

class SimulateReplyRequest(BaseModel):
    interaction_id: Optional[int] = None
    lead_id: int
    customer_id: int
    channel: str
    transcript: str
    language: str = "en"

class SeedDemoRequest(BaseModel):
    customer_name: str = "Demo Customer"
    customer_phone: str = "+1234567890"
    lead_policy_id: str = "POL-001"
    lead_expected_value: float = 1000.0

class ConversationRequest(BaseModel):
    lead_id: Optional[int] = None
    customer_id: int
    agent_type: str  # renewal, policy_info, crosssell
    channel: str = "sms"
    language: str = "en"
    initial_message: Optional[str] = None

class MessageRequest(BaseModel):
    conversation_id: int
    content: str
    language: str = "en"

class StartConversationRequest(BaseModel):
    lead_id: str
    customer_id: str
    customer_phone: str
    policy_id: str
    agent_type: str  # renewal, policy_info, crosssell
    initial_context: Optional[Dict[str, Any]] = None

class SimulateReplyRequest(BaseModel):
    conversation_id: str
    from_number: str
    text: str
    language: str = "en"

# Initialize messaging adapter
try:
    messaging_adapter = get_adapter()
    print(f"✅ Initialized {messaging_adapter.name}")
except Exception as e:
    print(f"⚠️  Failed to initialize messaging adapter: {e}")
    print("   Falling back to MockAdapter for demo purposes")
    from adapters import MockAdapter
    messaging_adapter = MockAdapter()

@app.post("/api/messages")
async def create_message_job(request: MessageRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Create a message job and send it via messaging adapter"""
    try:
        # Get customer phone number if not provided
        if not request.to_number and request.channel == "sms":
            customer = db.query(Customer).filter(Customer.id == request.customer_id).first()
            if customer:
                request.to_number = customer.phone
            else:
                raise HTTPException(status_code=400, detail="Customer phone number required for SMS")
        
        # Create MessageJob record
        message_job = MessageJob(
            lead_id=request.lead_id,
            customer_id=request.customer_id,
            channel=request.channel,
            template_id=request.template_id,
            status="queued",
            scheduled_at=datetime.utcnow()
        )
        db.add(message_job)
        db.commit()
        db.refresh(message_job)
        
        # Prepare job data for adapter
        job_dict = {
            "id": message_job.id,
            "lead_id": message_job.lead_id,
            "customer_id": message_job.customer_id,
            "channel": message_job.channel,
            "template_id": message_job.template_id,
            "to_number": request.to_number,
            "message_body": request.message_body
        }
        
        # Send via messaging adapter in background
        background_tasks.add_task(messaging_adapter.send, job_dict)
        
        return {
            "job_id": message_job.id,
            "status": message_job.status,
            "message": f"Message job created and queued for sending via {messaging_adapter.name}",
            "adapter": messaging_adapter.name
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create message job: {str(e)}")

@app.post("/api/messages/webhook")
async def webhook_handler(request: Request, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Handle incoming webhook from messaging provider (Twilio SMS)"""
    try:
        # Parse form data from Twilio webhook
        form_data = await request.form()
        
        # Extract Twilio webhook data
        from_number = form_data.get("From")
        to_number = form_data.get("To")
        message_body = form_data.get("Body", "")
        message_sid = form_data.get("MessageSid")
        
        # Store raw webhook data
        provider_raw = {
            "twilio_webhook": True,
            "message_sid": message_sid,
            "from_number": from_number,
            "to_number": to_number,
            "raw_form_data": dict(form_data)
        }
        
        # Try to find customer by phone number
        customer = db.query(Customer).filter(Customer.phone == from_number).first()
        customer_id = customer.id if customer else None
        lead_id = None
        
        if customer:
            # Find the most recent lead for this customer
            lead = db.query(Lead).filter(Lead.customer_id == customer_id).order_by(Lead.due_date.desc()).first()
            lead_id = lead.id if lead else None
        
        # Create Interaction record
        interaction = Interaction(
            lead_id=lead_id,
            customer_id=customer_id,
            channel="sms",
            transcript=message_body,
            language="en",  # Default to English, could be detected
            provider_raw=provider_raw,
            status="processing",
            created_at=datetime.utcnow()
        )
        db.add(interaction)
        db.commit()
        db.refresh(interaction)
        
        # Process interaction in background
        background_tasks.add_task(process_inbound_interaction, interaction.id)
        
        return {
            "interaction_id": interaction.id,
            "status": "processing",
            "message": "Twilio webhook received and processing started",
            "customer_found": customer_id is not None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process webhook: {str(e)}")

@app.post("/api/messages/webhook/json")
async def webhook_handler_json(request: WebhookRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Handle incoming webhook from messaging provider (JSON format)"""
    try:
        # Create Interaction record
        interaction = Interaction(
            lead_id=request.lead_id,
            customer_id=request.customer_id,
            channel=request.channel,
            transcript=request.transcript,
            language=request.language,
            provider_raw=request.provider_raw,
            status="processing",
            created_at=datetime.utcnow()
        )
        db.add(interaction)
        db.commit()
        db.refresh(interaction)
        
        # Process interaction in background
        background_tasks.add_task(process_inbound_interaction, interaction.id)
        
        return {
            "interaction_id": interaction.id,
            "status": "processing",
            "message": "Webhook received and processing started"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process webhook: {str(e)}")

@app.post("/admin/simulate_reply")
async def simulate_reply(request: SimulateReplyRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Admin endpoint to simulate a customer reply for testing"""
    try:
        # Create Interaction record
        interaction = Interaction(
            lead_id=request.lead_id,
            customer_id=request.customer_id,
            channel=request.channel,
            transcript=request.transcript,
            language=request.language,
            provider_raw={"simulated": True, "admin_test": True},
            status="processing",
            created_at=datetime.utcnow()
        )
        db.add(interaction)
        db.commit()
        db.refresh(interaction)
        
        # Process interaction in background
        background_tasks.add_task(process_inbound_interaction, interaction.id)
        
        return {
            "interaction_id": interaction.id,
            "status": "processing",
            "message": "Simulated reply created and processing started"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to simulate reply: {str(e)}")

@app.post("/admin/seed_demo")
async def seed_demo_data(request: SeedDemoRequest, db: Session = Depends(get_db)):
    """Seed demo customer and lead data"""
    try:
        # Create demo customer
        customer = Customer(
            name=request.customer_name,
            phone=request.customer_phone,
            preferred_language="en",
            consent_given_at=datetime.utcnow(),
            do_not_contact=False
        )
        db.add(customer)
        db.commit()
        db.refresh(customer)
        
        # Create demo lead
        lead = Lead(
            customer_id=customer.id,
            policy_id=request.lead_policy_id,
            expected_value=request.lead_expected_value,
            due_date=datetime.utcnow()
        )
        db.add(lead)
        db.commit()
        db.refresh(lead)
        
        return {
            "customer_id": customer.id,
            "lead_id": lead.id,
            "message": "Demo data seeded successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to seed demo data: {str(e)}")

@app.get("/api/interactions/{interaction_id}")
async def get_interaction(interaction_id: int, db: Session = Depends(get_db)):
    """Get interaction details including transcript, mood, summary, and outcome"""
    try:
        interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
        if not interaction:
            raise HTTPException(status_code=404, detail="Interaction not found")
        
        return {
            "id": interaction.id,
            "lead_id": interaction.lead_id,
            "customer_id": interaction.customer_id,
            "channel": interaction.channel,
            "transcript": interaction.transcript,
            "language": interaction.language,
            "mood_label": interaction.mood_label,
            "mood_confidence": interaction.mood_confidence,
            "summary": interaction.summary,
            "outcome_label": interaction.outcome_label,
            "outcome_confidence": interaction.outcome_confidence,
            "escalated": interaction.escalated,
            "provider_raw": interaction.provider_raw,
            "created_at": interaction.created_at,
            "processed_at": interaction.processed_at
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get interaction: {str(e)}")

@app.post("/api/conversations")
async def create_conversation(request: ConversationRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Create a new conversation with an agent"""
    try:
        # Check customer consent and DNC
        customer = db.query(Customer).filter(Customer.id == request.customer_id).first()
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        if customer.do_not_contact or not customer.consent_given_at:
            raise HTTPException(status_code=400, detail="Customer has not consented or is DNC")
        
        # Validate agent type
        valid_agents = ["renewal", "policy_info", "crosssell"]
        if request.agent_type not in valid_agents:
            raise HTTPException(status_code=400, detail=f"Invalid agent type. Must be one of: {valid_agents}")
        
        # Create conversation
        conversation = Conversation(
            lead_id=request.lead_id,
            customer_id=request.customer_id,
            agent_type=request.agent_type,
            channel=request.channel,
            language=request.language,
            status="active"
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
        
        # Generate initial message if provided
        if request.initial_message:
            # Add user message
            user_msg = Message(
                conversation_id=conversation.id,
                sender="user",
                content=request.initial_message,
                created_at=datetime.utcnow()
            )
            db.add(user_msg)
            db.commit()
            
            # Process the message
            background_tasks.add_task(process_conversation_message, conversation.id, request.initial_message, request.language)
        else:
            # Generate initial assistant message
            context = {
                "customer_name": customer.name,
                "policy_id": conversation.lead.policy_id if conversation.lead else "N/A",
                "due_date": conversation.lead.due_date.isoformat() if conversation.lead and conversation.lead.due_date else "N/A",
                "outstanding_amount": conversation.lead.expected_value if conversation.lead else 0,
                "policy_type": "Insurance Policy",
                "policy_value": conversation.lead.expected_value if conversation.lead else 0
            }
            
            system_prompt = get_agent_prompt(request.agent_type)
            formatted_prompt = format_prompt_with_context(system_prompt, context)
            
            grok_messages = [
                {"role": "system", "content": formatted_prompt},
                {"role": "user", "content": "Start the conversation with a greeting and introduction."}
            ]
            
            grok_response = call_grok(grok_messages, request.agent_type, request.language)
            
            # Save assistant message
            assistant_msg = Message(
                conversation_id=conversation.id,
                sender="assistant",
                content=grok_response["assistant_text"],
                llm_raw=grok_response,
                mood=grok_response["mood"],
                action=grok_response["action"],
                outcome_hint=grok_response["outcome_hint"],
                created_at=datetime.utcnow()
            )
            db.add(assistant_msg)
            
            # Send via adapter
            job_dict = {
                "to_number": customer.phone,
                "message_body": grok_response["assistant_text"],
                "conversation_id": conversation.id
            }
            
            send_result = messaging_adapter.send(job_dict)
            if send_result.get("success"):
                assistant_msg.provider_message_id = send_result.get("message_id")
                assistant_msg.provider_raw = send_result
            
            db.commit()
        
        return {
            "conversation_id": conversation.id,
            "agent_type": conversation.agent_type,
            "status": conversation.status,
            "message": "Conversation created successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create conversation: {str(e)}")

@app.post("/api/conversations/{conversation_id}/messages")
async def send_message(conversation_id: int, request: MessageRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Send a message in a conversation"""
    try:
        # Verify conversation exists
        conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        # Process the message
        background_tasks.add_task(process_conversation_message, conversation_id, request.content, request.language)
        
        return {
            "conversation_id": conversation_id,
            "status": "processing",
            "message": "Message queued for processing"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send message: {str(e)}")

@app.get("/api/conversations/{conversation_id}")
async def get_conversation(conversation_id: int, db: Session = Depends(get_db)):
    """Get conversation details and messages"""
    try:
        conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        messages = db.query(Message).filter(
            Message.conversation_id == conversation_id
        ).order_by(Message.created_at).all()
        
        return {
            "id": conversation.id,
            "lead_id": conversation.lead_id,
            "customer_id": conversation.customer_id,
            "agent_type": conversation.agent_type,
            "channel": conversation.channel,
            "language": conversation.language,
            "status": conversation.status,
            "summary": conversation.summary,
            "created_at": conversation.created_at,
            "updated_at": conversation.updated_at,
            "messages": [
                {
                    "id": msg.id,
                    "sender": msg.sender,
                    "content": msg.content,
                    "message_type": msg.message_type,
                    "mood": msg.mood,
                    "action": msg.action,
                    "outcome_hint": msg.outcome_hint,
                    "created_at": msg.created_at
                }
                for msg in messages
            ]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get conversation: {str(e)}")

@app.post("/api/conversations/{conversation_id}/summary")
async def generate_summary(conversation_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Generate a summary for a conversation"""
    try:
        conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        # Generate summary in background
        background_tasks.add_task(generate_conversation_summary, conversation_id)
        
        return {
            "conversation_id": conversation_id,
            "status": "generating",
            "message": "Summary generation queued"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate summary: {str(e)}")

@app.post("/api/start_conversation")
async def start_conversation(request: StartConversationRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Frontend endpoint to start an outbound conversation.
    
    Example request:
    {
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
    }
    
    Example response:
    {
        "conversation_id": "1001",
        "job_id": "2001", 
        "status": "started"
    }
    """
    try:
        # Validate agent type
        valid_agents = ["renewal", "policy_info", "crosssell"]
        if request.agent_type not in valid_agents:
            raise HTTPException(status_code=400, detail=f"Invalid agent type. Must be one of: {valid_agents}")
        
        # Check customer consent and DNC
        customer = db.query(Customer).filter(Customer.id == int(request.customer_id)).first()
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        if customer.do_not_contact or not customer.consent_given_at:
            raise HTTPException(status_code=403, detail="Customer has not consented or is DNC")
        
        # Update customer phone if different
        if customer.phone != request.customer_phone:
            customer.phone = request.customer_phone
            db.commit()
        
        # Find or create lead
        lead = db.query(Lead).filter(Lead.id == int(request.lead_id)).first()
        if not lead:
            # Create lead if it doesn't exist
            lead = Lead(
                id=int(request.lead_id),
                customer_id=int(request.customer_id),
                policy_id=request.policy_id,
                expected_value=request.initial_context.get("outstanding_amount", 1000) if request.initial_context else 1000,
                due_date=datetime.fromisoformat(request.initial_context.get("due_date", "2024-02-15")) if request.initial_context else datetime.utcnow()
            )
            db.add(lead)
            db.commit()
        
        # Create conversation
        conversation = Conversation(
            lead_id=int(request.lead_id),
            customer_id=int(request.customer_id),
            agent_type=request.agent_type,
            channel="sms",
            language=request.initial_context.get("language", "en") if request.initial_context else "en",
            status="active"
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
        
        # Create message job
        message_job = MessageJob(
            lead_id=int(request.lead_id),
            customer_id=int(request.customer_id),
            channel="sms",
            status="queued",
            scheduled_at=datetime.utcnow()
        )
        db.add(message_job)
        db.commit()
        db.refresh(message_job)
        
        # Prepare job data for background processing
        job_dict = {
            "conversation_id": conversation.id,
            "job_id": message_job.id,
            "customer_id": int(request.customer_id),
            "customer_phone": request.customer_phone,
            "agent_type": request.agent_type,
            "policy_id": request.policy_id,
            "initial_context": request.initial_context or {}
        }
        
        # Process conversation start in background
        background_tasks.add_task(start_outbound_conversation, job_dict)
        
        return {
            "conversation_id": str(conversation.id),
            "job_id": str(message_job.id),
            "status": "started"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start conversation: {str(e)}")

@app.post("/api/messages/webhook")
async def webhook_handler(request: Request, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Handle incoming Twilio webhooks for SMS messages.
    
    Accepts Twilio webhook payload and processes inbound messages.
    Returns 200 quickly to Twilio.
    """
    try:
        # Parse form data from Twilio webhook
        form_data = await request.form()
        
        # Extract Twilio webhook data
        from_number = form_data.get("From")
        to_number = form_data.get("To")
        message_body = form_data.get("Body", "")
        message_sid = form_data.get("MessageSid")
        
        # Find conversation by customer phone
        customer = db.query(Customer).filter(Customer.phone == from_number).first()
        if not customer:
            # Return 200 to Twilio but don't process
            return {"status": "ignored", "reason": "customer_not_found"}
        
        # Find active conversation for this customer
        conversation = db.query(Conversation).filter(
            Conversation.customer_id == customer.id,
            Conversation.status == "active"
        ).order_by(Conversation.created_at.desc()).first()
        
        if not conversation:
            return {"status": "ignored", "reason": "no_active_conversation"}
        
        # Create user message
        user_msg = Message(
            conversation_id=conversation.id,
            sender="user",
            content=message_body,
            provider_raw={
                "twilio_webhook": True,
                "message_sid": message_sid,
                "from_number": from_number,
                "to_number": to_number,
                "raw_form_data": dict(form_data)
            },
            created_at=datetime.utcnow()
        )
        db.add(user_msg)
        db.commit()
        db.refresh(user_msg)
        
        # Process inbound message in background
        background_tasks.add_task(handle_inbound_message, conversation.id, user_msg.id)
        
        return {"status": "received", "message_id": user_msg.id}
        
    except Exception as e:
        print(f"Webhook error: {str(e)}")
        return {"status": "error", "message": str(e)}

@app.post("/admin/simulate_reply")
async def simulate_reply(request: SimulateReplyRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Admin endpoint to simulate a customer reply for demo purposes.
    
    Example request:
    {
        "conversation_id": "1001",
        "from_number": "+1-415-555-0199", 
        "text": "Yes, I'd like to renew my policy",
        "language": "en"
    }
    
    Example response:
    {
        "message_id": "msg_123",
        "action": "request_payment",
        "mood": {"label": "receptive", "confidence": 0.8},
        "outcome": {"label": "Payment Promised", "confidence": 0.7}
    }
    """
    try:
        # Verify conversation exists
        conversation = db.query(Conversation).filter(Conversation.id == int(request.conversation_id)).first()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        # Create user message
        user_msg = Message(
            conversation_id=conversation.id,
            sender="user",
            content=request.text,
            provider_raw={
                "simulated": True,
                "from_number": request.from_number,
                "language": request.language
            },
            created_at=datetime.utcnow()
        )
        db.add(user_msg)
        db.commit()
        db.refresh(user_msg)
        
        # Process message immediately (not background for demo)
        result = handle_inbound_message(conversation.id, user_msg.id)
        
        return {
            "message_id": str(user_msg.id),
            "action": result.get("action"),
            "mood": result.get("mood"),
            "outcome": result.get("outcome")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to simulate reply: {str(e)}")

@app.get("/api/conversations/{conversation_id}")
async def get_conversation_details(conversation_id: int, db: Session = Depends(get_db)):
    """
    Get full conversation details including history, summary, mood timeline, and tasks.
    
    Example response:
    {
        "conversation_id": 1001,
        "metadata": {...},
        "messages": [...],
        "summary": "...",
        "mood_timeline": [...],
        "tasks": [...]
    }
    """
    try:
        conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        # Get all messages
        messages = db.query(Message).filter(
            Message.conversation_id == conversation_id
        ).order_by(Message.created_at).all()
        
        # Build mood timeline
        mood_timeline = []
        for msg in messages:
            if msg.mood and msg.sender == "assistant":
                mood_timeline.append({
                    "timestamp": msg.created_at.isoformat(),
                    "mood": msg.mood.get("label"),
                    "confidence": msg.mood.get("confidence")
                })
        
        # Get tasks
        tasks = db.query(Task).filter(Task.lead_id == conversation.lead_id).all()
        
        return {
            "conversation_id": conversation.id,
            "metadata": {
                "lead_id": conversation.lead_id,
                "customer_id": conversation.customer_id,
                "agent_type": conversation.agent_type,
                "channel": conversation.channel,
                "language": conversation.language,
                "status": conversation.status,
                "created_at": conversation.created_at.isoformat(),
                "updated_at": conversation.updated_at.isoformat()
            },
            "messages": [
                {
                    "id": msg.id,
                    "sender": msg.sender,
                    "content": msg.content,
                    "timestamp": msg.created_at.isoformat(),
                    "mood": msg.mood,
                    "action": msg.action,
                    "outcome_hint": msg.outcome_hint
                }
                for msg in messages
            ],
            "summary": conversation.summary,
            "mood_timeline": mood_timeline,
            "tasks": [
                {
                    "id": task.id,
                    "type": task.type,
                    "status": task.status,
                    "notes": task.notes,
                    "created_at": task.created_at.isoformat()
                }
                for task in tasks
            ]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get conversation: {str(e)}")

@app.post("/api/conversations/{conversation_id}/foresights")
async def generate_foresights(conversation_id: int, force_refresh: bool = False, background_tasks: BackgroundTasks = None, db: Session = Depends(get_db)):
    """
    Generate and store foresights for a conversation.
    
    Example response:
    {
        "foresights": [
            {
                "label": "High Renewal Probability",
                "confidence": 0.92,
                "explain": "Customer showed strong engagement and completed payment quickly"
            }
        ],
        "stored": true
    }
    """
    try:
        conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        # Generate foresights
        foresights = generate_conversation_foresights(conversation_id)
        
        # Store foresights in conversation summary (could be separate table in production)
        if conversation.summary:
            # Append foresights to existing summary
            foresights_text = "\n\nForesights:\n" + "\n".join([
                f"• {f['label']} ({f['confidence']:.0%}): {f['explain']}"
                for f in foresights
            ])
            conversation.summary += foresights_text
        else:
            # Create new summary with foresights
            conversation.summary = "Foresights:\n" + "\n".join([
                f"• {f['label']} ({f['confidence']:.0%}): {f['explain']}"
                for f in foresights
            ])
        
        db.commit()
        
        return {
            "foresights": foresights,
            "stored": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate foresights: {str(e)}")

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "Follow-up Automation API is running", "status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
