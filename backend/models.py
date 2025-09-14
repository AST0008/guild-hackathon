from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class Customer(Base):
    __tablename__ = "customers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=False, unique=True)
    preferred_language = Column(String(10), default="en")
    consent_given_at = Column(DateTime, nullable=False)
    do_not_contact = Column(Boolean, default=False)
    
    # Relationships
    leads = relationship("Lead", back_populates="customer")
    interactions = relationship("Interaction", back_populates="customer")

class Lead(Base):
    __tablename__ = "leads"
    
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    policy_id = Column(String(100), nullable=False)
    expected_value = Column(Float, nullable=False)
    due_date = Column(DateTime, nullable=False)
    
    # Relationships
    customer = relationship("Customer", back_populates="leads")
    message_jobs = relationship("MessageJob", back_populates="lead")
    interactions = relationship("Interaction", back_populates="lead")
    tasks = relationship("Task", back_populates="lead")

class MessageJob(Base):
    __tablename__ = "message_jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    channel = Column(String(50), nullable=False)  # sms, email, voice, etc.
    template_id = Column(String(100), nullable=True)
    scheduled_at = Column(DateTime, nullable=False)
    sent_at = Column(DateTime, nullable=True)
    status = Column(String(50), default="queued")  # queued, sent, failed
    
    # Relationships
    lead = relationship("Lead", back_populates="message_jobs")

class Interaction(Base):
    __tablename__ = "interactions"
    
    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    channel = Column(String(50), nullable=False)
    transcript = Column(Text, nullable=False)
    language = Column(String(10), default="en")
    
    # Mood analysis results
    mood_label = Column(String(50), nullable=True)  # positive, negative, neutral
    mood_confidence = Column(Float, nullable=True)
    mood_reasons = Column(Text, nullable=True)  # JSON string of reasons
    
    # Summary and outcome
    summary = Column(Text, nullable=True)  # pipe-separated bullet points
    outcome_label = Column(String(50), nullable=True)  # Resolved, Payment Promised, Needs Follow-up, Escalate
    outcome_confidence = Column(Float, nullable=True)
    
    # Escalation flag
    escalated = Column(Boolean, default=False)
    
    # Provider data
    provider_raw = Column(JSON, nullable=True)  # Store raw webhook payload
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)
    
    # Status
    status = Column(String(50), default="processing")  # processing, completed, failed
    
    # Relationships
    lead = relationship("Lead", back_populates="interactions")
    customer = relationship("Customer", back_populates="interactions")

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=False)
    type = Column(String(50), nullable=False)  # escalation, follow_up, payment_reminder, etc.
    assignee_id = Column(String(100), nullable=True)  # Could be user ID or team
    status = Column(String(50), default="open")  # open, in_progress, completed, cancelled
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    lead = relationship("Lead", back_populates="tasks")

class Conversation(Base):
    __tablename__ = "conversations"
    
    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    agent_type = Column(String(50), nullable=False)  # renewal, policy_info, crosssell
    channel = Column(String(50), nullable=False)  # sms, email, voice, etc.
    language = Column(String(10), default="en")
    status = Column(String(50), default="active")  # active, completed, escalated
    summary = Column(Text, nullable=True)  # 3-bullet summary
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    lead = relationship("Lead")
    customer = relationship("Customer")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")

class Message(Base):
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)
    sender = Column(String(20), nullable=False)  # user, assistant
    content = Column(Text, nullable=False)
    message_type = Column(String(20), default="text")  # text, audio, image
    provider_message_id = Column(String(100), nullable=True)  # Twilio SID, etc.
    provider_raw = Column(JSON, nullable=True)  # Raw provider data
    llm_raw = Column(JSON, nullable=True)  # Raw LLM response
    mood = Column(JSON, nullable=True)  # Mood analysis from LLM
    action = Column(String(50), nullable=True)  # Action from LLM
    outcome_hint = Column(JSON, nullable=True)  # Outcome hint from LLM
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    conversation = relationship("Conversation", back_populates="messages")
