from typing import Dict, Any, List
import re
import json
from datetime import datetime
from sqlalchemy.orm import Session

from database import get_db
from models import Interaction, Task, Conversation, Message, Customer, Lead
from llm_grok import call_grok
from prompts import get_agent_prompt, format_prompt_with_context

def process_inbound_interaction(interaction_id: int):
    """
    Process an inbound interaction by analyzing mood, generating summary, and determining outcome.
    This function runs as a background task.
    
    Args:
        interaction_id: ID of the interaction to process
    """
    db = next(get_db())
    
    try:
        # Get the interaction
        interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
        if not interaction:
            print(f"Interaction {interaction_id} not found")
            return
        
        print(f"Processing interaction {interaction_id}: {interaction.transcript[:50]}...")
        
        # Step 1: Detect mood
        mood_result = detect_mood(interaction.transcript)
        interaction.mood_label = mood_result["label"]
        interaction.mood_confidence = mood_result["confidence"]
        interaction.mood_reasons = json.dumps(mood_result["reasons"])
        
        # Step 2: Generate summary and outcome
        context = {
            "lead_id": interaction.lead_id,
            "customer_id": interaction.customer_id,
            "channel": interaction.channel,
            "language": interaction.language
        }
        summary_result = summarize(interaction.transcript, context)
        interaction.summary = "|".join(summary_result["summary"])  # Pipe-separated bullets
        interaction.outcome_label = summary_result["outcome"]["label"]
        interaction.outcome_confidence = summary_result["outcome"]["confidence"]
        
        # Step 3: Check for escalation
        should_escalate = (
            (mood_result["label"] == "negative" and mood_result["confidence"] >= 0.7) or
            summary_result["outcome"]["label"] == "Escalate"
        )
        
        if should_escalate:
            interaction.escalated = True
            
            # Create escalation task
            task = Task(
                lead_id=interaction.lead_id,
                type="escalation",
                status="open",
                notes=f"Escalated due to negative mood (confidence: {mood_result['confidence']:.2f}) or outcome: {summary_result['outcome']['label']}"
            )
            db.add(task)
            print(f"Created escalation task for interaction {interaction_id}")
        
        # Update interaction status
        interaction.status = "completed"
        interaction.processed_at = datetime.utcnow()
        
        db.commit()
        print(f"Successfully processed interaction {interaction_id}")
        
    except Exception as e:
        print(f"Error processing interaction {interaction_id}: {str(e)}")
        # Mark interaction as failed
        interaction.status = "failed"
        db.commit()
    finally:
        db.close()

def detect_mood(transcript: str) -> Dict[str, Any]:
    """
    Detect mood from transcript using rule-based approach.
    TODO: Replace with ML model (e.g., Hugging Face sentiment analysis)
    
    Args:
        transcript: Customer transcript text
    
    Returns:
        Dictionary with mood analysis results
    """
    transcript_lower = transcript.lower()
    
    # Negative keywords and patterns
    negative_keywords = [
        "cancel", "refund", "scam", "sue", "not happy", "complain", "angry",
        "terrible", "awful", "hate", "disappointed", "frustrated", "upset",
        "wrong", "mistake", "error", "problem", "issue", "broken", "failed",
        "unacceptable", "ridiculous", "waste", "useless", "stupid"
    ]
    
    # Positive keywords and patterns
    positive_keywords = [
        "paid", "yes", "renew", "great", "excellent", "perfect", "love",
        "happy", "satisfied", "pleased", "thank", "good", "fine", "okay",
        "sure", "agree", "accept", "approve", "confirm", "continue"
    ]
    
    # Count keyword matches
    negative_count = sum(1 for keyword in negative_keywords if keyword in transcript_lower)
    positive_count = sum(1 for keyword in positive_keywords if keyword in transcript_lower)
    
    # Calculate confidence based on keyword density and context
    total_words = len(transcript.split())
    negative_ratio = negative_count / max(total_words, 1)
    positive_ratio = positive_count / max(total_words, 1)
    
    # Determine mood and confidence
    if negative_count > positive_count and negative_ratio > 0.05:
        mood = "negative"
        confidence = min(0.9, 0.5 + (negative_ratio * 10))
        reasons = [f"Found {negative_count} negative keywords", f"Negative ratio: {negative_ratio:.3f}"]
    elif positive_count > negative_count and positive_ratio > 0.05:
        mood = "positive"
        confidence = min(0.9, 0.5 + (positive_ratio * 10))
        reasons = [f"Found {positive_count} positive keywords", f"Positive ratio: {positive_ratio:.3f}"]
    else:
        mood = "neutral"
        confidence = 0.6
        reasons = ["No strong positive or negative indicators found"]
    
    return {
        "label": mood,
        "confidence": round(confidence, 3),
        "reasons": reasons
    }

def summarize(transcript: str, context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate summary and outcome from transcript using rule-based approach.
    TODO: Replace with LLM (e.g., OpenAI GPT, Anthropic Claude)
    
    Args:
        transcript: Customer transcript text
        context: Additional context (lead_id, customer_id, etc.)
    
    Returns:
        Dictionary with summary and outcome
    """
    # Extract key sentences (simple approach)
    sentences = [s.strip() for s in re.split(r'[.!?]+', transcript) if s.strip()]
    
    # Take first 3 meaningful sentences as summary
    summary_sentences = []
    for sentence in sentences[:5]:  # Look at first 5 sentences
        if len(sentence) > 10:  # Only meaningful sentences
            summary_sentences.append(sentence)
        if len(summary_sentences) >= 3:
            break
    
    # If we don't have enough sentences, use the full transcript
    if len(summary_sentences) < 3:
        summary_sentences = [transcript[:200] + "..." if len(transcript) > 200 else transcript]
    
    # Determine outcome based on keywords and patterns
    transcript_lower = transcript.lower()
    
    # Payment-related keywords
    payment_keywords = ["pay", "payment", "paid", "money", "cost", "price", "bill", "invoice"]
    payment_promised = any(keyword in transcript_lower for keyword in payment_keywords)
    
    # Resolution keywords
    resolution_keywords = ["resolved", "fixed", "solved", "done", "complete", "finished"]
    is_resolved = any(keyword in transcript_lower for keyword in resolution_keywords)
    
    # Escalation keywords
    escalation_keywords = ["manager", "supervisor", "escalate", "complaint", "formal", "legal"]
    needs_escalation = any(keyword in transcript_lower for keyword in escalation_keywords)
    
    # Follow-up keywords
    followup_keywords = ["call back", "follow up", "later", "tomorrow", "next week", "schedule"]
    needs_followup = any(keyword in transcript_lower for keyword in followup_keywords)
    
    # Determine outcome
    if is_resolved:
        outcome_label = "Resolved"
        outcome_confidence = 0.8
    elif payment_promised:
        outcome_label = "Payment Promised"
        outcome_confidence = 0.7
    elif needs_escalation:
        outcome_label = "Escalate"
        outcome_confidence = 0.9
    elif needs_followup:
        outcome_label = "Needs Follow-up"
        outcome_confidence = 0.6
    else:
        outcome_label = "Needs Follow-up"
        outcome_confidence = 0.5
    
    return {
        "summary": summary_sentences,
        "outcome": {
            "label": outcome_label,
            "confidence": round(outcome_confidence, 3)
        }
    }

# TODO: Add these functions for future audio/LLM integration
def generate_tts(text: str, voice: str = "default") -> str:
    """
    Generate text-to-speech audio file.
    TODO: Integrate with AWS Polly, Google TTS, or similar service.
    
    Args:
        text: Text to convert to speech
        voice: Voice type to use
    
    Returns:
        Path to generated audio file
    """
    # TODO: Implement TTS integration
    raise NotImplementedError("TTS integration not implemented")

def run_stt(audio_file_path: str, language: str = "en") -> str:
    """
    Run speech-to-text on audio file.
    TODO: Integrate with AWS Transcribe, Google Speech-to-Text, or Whisper.
    
    Args:
        audio_file_path: Path to audio file
        language: Language of the audio
    
    Returns:
        Transcribed text
    """
    # TODO: Implement STT integration
    raise NotImplementedError("STT integration not implemented")

def process_conversation_message(conversation_id: int, user_message: str, language: str = "en"):
    """
    Process a new user message in a conversation using Grok LLM.
    
    Args:
        conversation_id: ID of the conversation
        user_message: User's message content
        language: Language hint for Grok
    """
    db = next(get_db())
    
    try:
        # Get conversation
        conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if not conversation:
            print(f"Conversation {conversation_id} not found")
            return
        
        # Check consent and DNC
        customer = db.query(Customer).filter(Customer.id == conversation.customer_id).first()
        if not customer or customer.do_not_contact or not customer.consent_given_at:
            print(f"Customer {conversation.customer_id} has not consented or is DNC")
            return
        
        # Add user message to conversation
        user_msg = Message(
            conversation_id=conversation_id,
            sender="user",
            content=user_message,
            created_at=datetime.utcnow()
        )
        db.add(user_msg)
        db.commit()
        
        # Get last 8 messages for context
        recent_messages = db.query(Message).filter(
            Message.conversation_id == conversation_id
        ).order_by(Message.created_at.desc()).limit(8).all()
        
        # Reverse to get chronological order
        recent_messages.reverse()
        
        # Prepare messages for Grok
        grok_messages = []
        
        # Add system prompt
        context = {
            "customer_name": customer.name,
            "policy_id": conversation.lead.policy_id if conversation.lead else "N/A",
            "due_date": conversation.lead.due_date.isoformat() if conversation.lead and conversation.lead.due_date else "N/A",
            "outstanding_amount": conversation.lead.expected_value if conversation.lead else 0,
            "policy_type": "Insurance Policy",
            "policy_value": conversation.lead.expected_value if conversation.lead else 0
        }
        
        system_prompt = get_agent_prompt(conversation.agent_type)
        formatted_prompt = format_prompt_with_context(system_prompt, context)
        
        grok_messages.append({
            "role": "system",
            "content": formatted_prompt
        })
        
        # Add conversation history
        for msg in recent_messages:
            grok_messages.append({
                "role": "user" if msg.sender == "user" else "assistant",
                "content": msg.content
            })
        
        # Call Grok
        print(f"Calling Grok for conversation {conversation_id} with agent {conversation.agent_type}")
        grok_response = call_grok(grok_messages, conversation.agent_type, language)
        
        # Save assistant message
        assistant_msg = Message(
            conversation_id=conversation_id,
            sender="assistant",
            content=grok_response["assistant_text"],
            llm_raw=grok_response,
            mood=grok_response["mood"],
            action=grok_response["action"],
            outcome_hint=grok_response["outcome_hint"],
            created_at=datetime.utcnow()
        )
        db.add(assistant_msg)
        
        # Check if escalation is needed
        should_escalate = (
            grok_response["action"] == "escalate" or
            (grok_response["mood"]["label"] == "negative" and grok_response["mood"]["confidence"] >= 0.7)
        )
        
        if should_escalate:
            # Create escalation task
            task = Task(
                lead_id=conversation.lead_id,
                type="escalation",
                status="open",
                notes=f"Escalated due to {grok_response['action']} action or negative mood (confidence: {grok_response['mood']['confidence']:.2f})"
            )
            db.add(task)
            conversation.status = "escalated"
            print(f"Created escalation task for conversation {conversation_id}")
        else:
            # Send response via adapter
            from adapters import get_adapter
            adapter = get_adapter()
            
            # Prepare message for sending
            job_dict = {
                "to_number": customer.phone,
                "message_body": grok_response["assistant_text"],
                "conversation_id": conversation_id
            }
            
            send_result = adapter.send(job_dict)
            
            # Update message with provider info
            if send_result.get("success"):
                assistant_msg.provider_message_id = send_result.get("message_id")
                assistant_msg.provider_raw = send_result
                print(f"Sent assistant message via {adapter.name}")
            else:
                print(f"Failed to send message: {send_result.get('error')}")
        
        # Update conversation
        conversation.updated_at = datetime.utcnow()
        db.commit()
        
        print(f"Successfully processed conversation {conversation_id}")
        
    except Exception as e:
        print(f"Error processing conversation {conversation_id}: {str(e)}")
        db.rollback()
    finally:
        db.close()

def generate_conversation_summary(conversation_id: int) -> str:
    """
    Generate a 3-bullet summary of a conversation using Grok.
    
    Args:
        conversation_id: ID of the conversation
    
    Returns:
        Summary string
    """
    db = next(get_db())
    
    try:
        # Get conversation and all messages
        conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if not conversation:
            return "Conversation not found"
        
        messages = db.query(Message).filter(
            Message.conversation_id == conversation_id
        ).order_by(Message.created_at).all()
        
        if not messages:
            return "No messages in conversation"
        
        # Prepare conversation context for summarization
        conversation_text = "\n".join([
            f"{msg.sender}: {msg.content}" for msg in messages
        ])
        
        # Create summarization prompt
        summary_prompt = f"""Summarize this customer conversation in exactly 3 bullet points:

{conversation_text}

Return only the 3 bullet points, one per line, starting with "•"."""
        
        grok_messages = [
            {
                "role": "system",
                "content": "You are a conversation summarizer. Return exactly 3 bullet points summarizing the key points of the conversation."
            },
            {
                "role": "user",
                "content": summary_prompt
            }
        ]
        
        # Call Grok for summarization
        grok_response = call_grok(grok_messages, "policy_info", conversation.language)
        
        # Extract summary from response
        summary = grok_response.get("assistant_text", "Summary generation failed")
        
        # Update conversation with summary
        conversation.summary = summary
        db.commit()
        
        return summary
        
    except Exception as e:
        print(f"Error generating summary for conversation {conversation_id}: {str(e)}")
        return "Summary generation failed"
    finally:
        db.close()

def call_llm_summarizer(transcript: str, context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Call LLM for advanced summarization and outcome prediction.
    Now uses Grok integration.
    
    Args:
        transcript: Customer transcript
        context: Additional context
    
    Returns:
        LLM-generated summary and outcome
    """
    try:
        # Use Grok for summarization
        grok_messages = [
            {
                "role": "system",
                "content": "You are a conversation summarizer. Analyze the transcript and return structured JSON with summary and outcome."
            },
            {
                "role": "user",
                "content": f"Transcript: {transcript}\nContext: {json.dumps(context)}"
            }
        ]
        
        response = call_grok(grok_messages, "policy_info", context.get("language", "en"))
        
        return {
            "summary": response.get("summary", [transcript[:100] + "..."]),
            "outcome": response.get("outcome_hint", {"label": "Needs Follow-up", "confidence": 0.5})
        }
        
    except Exception as e:
        print(f"LLM summarizer failed: {str(e)}")
        # Fallback to rule-based
        return summarize(transcript, context)

def start_outbound_conversation(job_dict: Dict[str, Any]):
    """
    Start an outbound conversation by generating initial message and sending via adapter.
    
    Args:
        job_dict: Dictionary containing conversation and job details
    """
    db = next(get_db())
    
    try:
        conversation_id = job_dict["conversation_id"]
        customer_id = job_dict["customer_id"]
        customer_phone = job_dict["customer_phone"]
        agent_type = job_dict["agent_type"]
        policy_id = job_dict["policy_id"]
        initial_context = job_dict.get("initial_context", {})
        
        # Get conversation and customer
        conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        customer = db.query(Customer).filter(Customer.id == customer_id).first()
        
        if not conversation or not customer:
            print(f"Conversation {conversation_id} or customer {customer_id} not found")
            return
        
        # Prepare context for Grok
        context = {
            "customer_name": customer.name,
            "policy_id": policy_id,
            "due_date": initial_context.get("due_date", "N/A"),
            "outstanding_amount": initial_context.get("outstanding_amount", 0),
            "policy_type": "Insurance Policy",
            "policy_value": initial_context.get("outstanding_amount", 0)
        }
        
        # Get system prompt and format with context
        system_prompt = get_agent_prompt(agent_type)
        formatted_prompt = format_prompt_with_context(system_prompt, context)
        
        # Create initial Grok messages
        grok_messages = [
            {"role": "system", "content": formatted_prompt},
            {"role": "user", "content": "Start the conversation with a greeting and introduction."}
        ]
        
        # Call Grok to generate initial message
        language = initial_context.get("language", "en")
        grok_response = call_grok(grok_messages, agent_type, language)
        
        # Create assistant message
        assistant_msg = Message(
            conversation_id=conversation_id,
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
        from adapters import get_adapter
        adapter = get_adapter()
        
        job_data = {
            "to_number": customer_phone,
            "message_body": grok_response["assistant_text"],
            "conversation_id": conversation_id
        }
        
        send_result = adapter.send(job_data)
        
        # Update message with provider info
        if send_result.get("success"):
            assistant_msg.provider_message_id = send_result.get("message_id")
            assistant_msg.provider_raw = send_result
        
        db.commit()
        print(f"Started outbound conversation {conversation_id} via {adapter.name}")
        
    except Exception as e:
        print(f"Error starting outbound conversation: {str(e)}")
        db.rollback()
    finally:
        db.close()

def handle_inbound_message(conversation_id: int, message_id: int) -> Dict[str, Any]:
    """
    Handle an inbound message by processing with Grok and sending response.
    
    Args:
        conversation_id: ID of the conversation
        message_id: ID of the user message
    
    Returns:
        Dictionary with processing results
    """
    db = next(get_db())
    
    try:
        # Get conversation and user message
        conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        user_msg = db.query(Message).filter(Message.id == message_id).first()
        
        if not conversation or not user_msg:
            return {"error": "Conversation or message not found"}
        
        # Check consent and DNC
        customer = db.query(Customer).filter(Customer.id == conversation.customer_id).first()
        if not customer or customer.do_not_contact or not customer.consent_given_at:
            return {"error": "Customer has not consented or is DNC"}
        
        # Get last 8 messages for context
        recent_messages = db.query(Message).filter(
            Message.conversation_id == conversation_id
        ).order_by(Message.created_at.desc()).limit(8).all()
        
        # Reverse to get chronological order
        recent_messages.reverse()
        
        # Prepare messages for Grok
        grok_messages = []
        
        # Add system prompt
        context = {
            "customer_name": customer.name,
            "policy_id": conversation.lead.policy_id if conversation.lead else "N/A",
            "due_date": conversation.lead.due_date.isoformat() if conversation.lead and conversation.lead.due_date else "N/A",
            "outstanding_amount": conversation.lead.expected_value if conversation.lead else 0,
            "policy_type": "Insurance Policy",
            "policy_value": conversation.lead.expected_value if conversation.lead else 0
        }
        
        system_prompt = get_agent_prompt(conversation.agent_type)
        formatted_prompt = format_prompt_with_context(system_prompt, context)
        
        grok_messages.append({
            "role": "system",
            "content": formatted_prompt
        })
        
        # Add conversation history
        for msg in recent_messages:
            grok_messages.append({
                "role": "user" if msg.sender == "user" else "assistant",
                "content": msg.content
            })
        
        # Call Grok
        grok_response = call_grok(grok_messages, conversation.agent_type, conversation.language)
        
        # Save assistant message
        assistant_msg = Message(
            conversation_id=conversation_id,
            sender="assistant",
            content=grok_response["assistant_text"],
            llm_raw=grok_response,
            mood=grok_response["mood"],
            action=grok_response["action"],
            outcome_hint=grok_response["outcome_hint"],
            created_at=datetime.utcnow()
        )
        db.add(assistant_msg)
        
        # Check if escalation is needed
        should_escalate = (
            grok_response["action"] == "escalate" or
            (grok_response["mood"]["label"] == "negative" and grok_response["mood"]["confidence"] >= 0.7)
        )
        
        if should_escalate:
            # Create escalation task
            task = Task(
                lead_id=conversation.lead_id,
                type="escalation",
                status="open",
                notes=f"Escalated due to {grok_response['action']} action or negative mood (confidence: {grok_response['mood']['confidence']:.2f})"
            )
            db.add(task)
            conversation.status = "escalated"
            print(f"Created escalation task for conversation {conversation_id}")
        else:
            # Send response via adapter
            from adapters import get_adapter
            adapter = get_adapter()
            
            job_data = {
                "to_number": customer.phone,
                "message_body": grok_response["assistant_text"],
                "conversation_id": conversation_id
            }
            
            send_result = adapter.send(job_data)
            
            # Update message with provider info
            if send_result.get("success"):
                assistant_msg.provider_message_id = send_result.get("message_id")
                assistant_msg.provider_raw = send_result
                print(f"Sent assistant message via {adapter.name}")
            else:
                print(f"Failed to send message: {send_result.get('error')}")
        
        # Update conversation
        conversation.updated_at = datetime.utcnow()
        db.commit()
        
        return {
            "action": grok_response["action"],
            "mood": grok_response["mood"],
            "outcome": grok_response["outcome_hint"],
            "escalated": should_escalate
        }
        
    except Exception as e:
        print(f"Error handling inbound message: {str(e)}")
        db.rollback()
        return {"error": str(e)}
    finally:
        db.close()

def generate_conversation_foresights(conversation_id: int) -> List[Dict[str, Any]]:
    """
    Generate foresights for a conversation using simple heuristics.
    
    Args:
        conversation_id: ID of the conversation
    
    Returns:
        List of foresight dictionaries
    """
    db = next(get_db())
    
    try:
        # Get conversation and messages
        conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        messages = db.query(Message).filter(
            Message.conversation_id == conversation_id
        ).order_by(Message.created_at).all()
        
        if not conversation or not messages:
            return []
        
        # Analyze conversation patterns
        user_messages = [msg for msg in messages if msg.sender == "user"]
        assistant_messages = [msg for msg in messages if msg.sender == "assistant"]
        
        # Count positive indicators
        positive_words = ["yes", "sure", "agree", "pay", "payment", "thank", "great", "good", "excellent"]
        negative_words = ["no", "cancel", "refund", "angry", "terrible", "hate", "problem"]
        
        positive_count = sum(1 for msg in user_messages 
                           for word in positive_words 
                           if word in msg.content.lower())
        negative_count = sum(1 for msg in user_messages 
                           for word in negative_words 
                           if word in msg.content.lower())
        
        # Calculate engagement metrics
        total_user_words = sum(len(msg.content.split()) for msg in user_messages)
        avg_response_time = 2.0  # Simplified - would calculate from timestamps
        
        # Generate foresights based on patterns
        foresights = []
        
        # Renewal probability
        if positive_count > negative_count:
            renewal_prob = min(0.95, 0.6 + (positive_count * 0.1))
            foresights.append({
                "label": "High Renewal Probability",
                "confidence": renewal_prob,
                "explain": f"Customer showed {positive_count} positive indicators vs {negative_count} negative"
            })
        else:
            foresights.append({
                "label": "Low Renewal Probability", 
                "confidence": 0.3,
                "explain": f"Customer showed {negative_count} negative indicators vs {positive_count} positive"
            })
        
        # Engagement level
        if total_user_words > 50:
            foresights.append({
                "label": "High Engagement",
                "confidence": 0.8,
                "explain": f"Customer provided detailed responses ({total_user_words} total words)"
            })
        elif total_user_words < 20:
            foresights.append({
                "label": "Low Engagement",
                "confidence": 0.7,
                "explain": f"Customer provided brief responses ({total_user_words} total words)"
            })
        
        # Cross-sell opportunity
        if any("coverage" in msg.content.lower() or "policy" in msg.content.lower() for msg in user_messages):
            foresights.append({
                "label": "Cross-sell Opportunity",
                "confidence": 0.75,
                "explain": "Customer showed interest in coverage details"
            })
        
        # Price sensitivity
        if any("cost" in msg.content.lower() or "price" in msg.content.lower() or "discount" in msg.content.lower() for msg in user_messages):
            foresights.append({
                "label": "Price Sensitive",
                "confidence": 0.8,
                "explain": "Customer asked about pricing and discounts"
            })
        
        # Service quality impact
        if any("thank" in msg.content.lower() or "help" in msg.content.lower() or "easy" in msg.content.lower() for msg in user_messages):
            foresights.append({
                "label": "Service Quality Impact",
                "confidence": 0.85,
                "explain": "Customer expressed appreciation for service"
            })
        
        # Escalation risk
        if any(msg.action == "escalate" or (msg.mood and msg.mood.get("label") == "negative") for msg in assistant_messages):
            foresights.append({
                "label": "Escalation Risk",
                "confidence": 0.9,
                "explain": "Conversation required escalation or showed negative sentiment"
            })
        
        return foresights
        
    except Exception as e:
        print(f"Error generating foresights: {str(e)}")
        return []
    finally:
        db.close()
