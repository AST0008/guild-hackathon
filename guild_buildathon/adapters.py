from typing import Dict, Any
import logging
from datetime import datetime
import os
from twilio.rest import Client
from twilio.base.exceptions import TwilioException

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MockAdapter:
    """
    Mock messaging adapter for demo purposes.
    Simulates sending messages without requiring external API keys.
    """
    
    def __init__(self):
        self.name = "MockAdapter"
        logger.info("MockAdapter initialized - no external API keys required")
    
    def send(self, job_dict: Dict[str, Any]) -> Dict[str, Any]:
        """
        Mock send method that simulates message sending.
        
        Args:
            job_dict: Dictionary containing job details
                - id: MessageJob ID
                - lead_id: Lead ID
                - customer_id: Customer ID
                - channel: Communication channel (sms, email, etc.)
                - template_id: Optional template ID
        
        Returns:
            Dictionary with send result
        """
        try:
            # Simulate processing delay
            import time
            time.sleep(0.1)  # Small delay to simulate API call
            
            # Log the mock send
            logger.info(f"MockAdapter: Sending message for job {job_dict['id']} "
                       f"to customer {job_dict['customer_id']} via {job_dict['channel']}")
            
            # Return mock success response
            return {
                "success": True,
                "message_id": f"mock_{job_dict['id']}_{datetime.utcnow().timestamp()}",
                "status": "sent",
                "sent_at": datetime.utcnow().isoformat(),
                "provider": "mock"
            }
            
        except Exception as e:
            logger.error(f"MockAdapter send failed: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "status": "failed"
            }

class TwilioAdapter:
    """
    Twilio messaging adapter for production SMS sending.
    """
    
    def __init__(self, account_sid: str = None, auth_token: str = None, from_number: str = None):
        self.account_sid = account_sid or os.getenv("TWILIO_ACCOUNT_SID")
        self.auth_token = auth_token or os.getenv("TWILIO_AUTH_TOKEN")
        self.from_number = from_number or os.getenv("TWILIO_FROM_NUMBER")
        self.name = "TwilioAdapter"
        
        if not self.account_sid or not self.auth_token:
            raise ValueError("Twilio credentials not provided. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables.")
        
        if not self.from_number:
            raise ValueError("Twilio from number not provided. Set TWILIO_FROM_NUMBER environment variable.")
        
        try:
            self.client = Client(self.account_sid, self.auth_token)
            # Test credentials by getting account info
            account = self.client.api.accounts(self.account_sid).fetch()
            logger.info(f"TwilioAdapter initialized successfully for account: {account.friendly_name}")
        except TwilioException as e:
            logger.error(f"Failed to initialize TwilioAdapter: {str(e)}")
            raise
    
    def send(self, job_dict: Dict[str, Any]) -> Dict[str, Any]:
        """
        Send SMS message via Twilio API.
        
        Args:
            job_dict: Dictionary containing job details
                - id: MessageJob ID
                - lead_id: Lead ID
                - customer_id: Customer ID
                - channel: Communication channel (should be 'sms')
                - template_id: Optional template ID
                - to_number: Customer phone number (required)
                - message_body: Message content (required)
        
        Returns:
            Dictionary with send result
        """
        try:
            # Validate required fields
            to_number = job_dict.get('to_number')
            message_body = job_dict.get('message_body', '')
            
            if not to_number:
                raise ValueError("to_number is required for SMS sending")
            
            if not message_body:
                # Use default message if none provided
                message_body = f"Hello! This is a follow-up regarding your policy. Please reply with your feedback."
            
            # Send SMS via Twilio
            message = self.client.messages.create(
                body=message_body,
                from_=self.from_number,
                to=to_number
            )
            
            logger.info(f"TwilioAdapter: SMS sent successfully. SID: {message.sid}")
            
            return {
                "success": True,
                "message_id": message.sid,
                "status": message.status,
                "sent_at": datetime.utcnow().isoformat(),
                "provider": "twilio",
                "to_number": to_number,
                "from_number": self.from_number
            }
            
        except TwilioException as e:
            logger.error(f"TwilioAdapter send failed: {str(e)}")
            return {
                "success": False,
                "error": f"Twilio error: {str(e)}",
                "status": "failed"
            }
        except Exception as e:
            logger.error(f"TwilioAdapter send failed: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "status": "failed"
            }
    
    def get_message_status(self, message_sid: str) -> Dict[str, Any]:
        """
        Get the status of a sent message.
        
        Args:
            message_sid: Twilio message SID
        
        Returns:
            Dictionary with message status
        """
        try:
            message = self.client.messages(message_sid).fetch()
            return {
                "success": True,
                "message_id": message.sid,
                "status": message.status,
                "to_number": message.to,
                "from_number": message.from_,
                "body": message.body,
                "date_created": message.date_created.isoformat() if message.date_created else None,
                "date_sent": message.date_sent.isoformat() if message.date_sent else None,
                "error_code": message.error_code,
                "error_message": message.error_message
            }
        except TwilioException as e:
            logger.error(f"Failed to get message status: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }

# TODO: Add other adapters as needed
# - EmailAdapter (for email campaigns)
# - VoiceAdapter (for voice calls)
# - WhatsAppAdapter (for WhatsApp Business API)
# - SlackAdapter (for internal notifications)

def get_adapter(adapter_type: str = None, **kwargs) -> Any:
    """
    Factory function to get the appropriate adapter.
    
    Args:
        adapter_type: Type of adapter ("mock", "twilio", etc.). If None, uses environment variable MESSAGING_ADAPTER
        **kwargs: Additional configuration for the adapter
    
    Returns:
        Adapter instance
    """
    if adapter_type is None:
        adapter_type = os.getenv("MESSAGING_ADAPTER", "twilio")
    
    if adapter_type.lower() == "mock":
        return MockAdapter()
    elif adapter_type.lower() == "twilio":
        return TwilioAdapter(**kwargs)
    else:
        raise ValueError(f"Unknown adapter type: {adapter_type}")
