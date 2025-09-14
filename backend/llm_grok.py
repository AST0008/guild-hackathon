import os
import json
import time
import logging
from typing import Dict, Any, List, Optional
import requests
from datetime import datetime, timedelta

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GrokAPI:
    """
    Grok LLM API integration for multilingual, multi-turn conversations.
    Handles structured JSON output, caching, retries, and fallbacks.
    """
    
    def __init__(self):
        self.api_key = os.getenv("GROK_API_KEY")
        self.api_base = os.getenv("GROK_API_BASE", "https://api.x.ai/v1")
        self.model = os.getenv("GROK_MODEL", "grok-beta")
        self.cache = {}  # Simple in-memory cache
        self.cache_duration = 30  # seconds
        
        if not self.api_key:
            logger.warning("GROK_API_KEY not found - Grok integration disabled")
    
    def _get_cache_key(self, messages: List[Dict], agent_type: str) -> str:
        """Generate cache key for identical requests"""
        content = json.dumps(messages, sort_keys=True) + agent_type
        return str(hash(content))
    
    def _is_cache_valid(self, cache_key: str) -> bool:
        """Check if cached response is still valid"""
        if cache_key not in self.cache:
            return False
        
        cached_time = self.cache[cache_key]["timestamp"]
        return datetime.now() - cached_time < timedelta(seconds=self.cache_duration)
    
    def _call_grok_api(self, messages: List[Dict], agent_type: str) -> Dict[str, Any]:
        """
        Make API call to Grok with retry logic.
        
        Args:
            messages: List of conversation messages
            agent_type: Type of agent (renewal, policy_info, crosssell)
        
        Returns:
            Grok API response
        """
        if not self.api_key:
            raise ValueError("Grok API key not configured")
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 1000,
            "response_format": {"type": "json_object"}
        }
        
        for attempt in range(3):  # Max 3 attempts
            try:
                response = requests.post(
                    f"{self.api_base}/chat/completions",
                    headers=headers,
                    json=payload,
                    timeout=30
                )
                
                if response.status_code == 200:
                    return response.json()
                elif response.status_code >= 500:
                    # Server error - retry
                    logger.warning(f"Grok API server error (attempt {attempt + 1}): {response.status_code}")
                    if attempt < 2:
                        time.sleep(2 ** attempt)  # Exponential backoff
                        continue
                else:
                    # Client error - don't retry
                    logger.error(f"Grok API client error: {response.status_code} - {response.text}")
                    break
                    
            except requests.exceptions.Timeout:
                logger.warning(f"Grok API timeout (attempt {attempt + 1})")
                if attempt < 2:
                    time.sleep(2 ** attempt)
                    continue
            except requests.exceptions.RequestException as e:
                logger.error(f"Grok API request error: {str(e)}")
                break
        
        raise Exception("Grok API failed after all retries")
    
    def _validate_json_response(self, response_text: str) -> Optional[Dict[str, Any]]:
        """
        Validate and parse Grok JSON response.
        
        Args:
            response_text: Raw response text from Grok
        
        Returns:
            Parsed JSON dict or None if invalid
        """
        try:
            data = json.loads(response_text)
            
            # Validate required fields
            required_fields = ["assistant_text", "mood", "summary", "action", "outcome_hint"]
            for field in required_fields:
                if field not in data:
                    logger.error(f"Missing required field: {field}")
                    return None
            
            # Validate mood structure
            if not isinstance(data["mood"], dict) or "label" not in data["mood"] or "confidence" not in data["mood"]:
                logger.error("Invalid mood structure")
                return None
            
            # Validate mood labels
            valid_moods = ["receptive", "neutral", "negative"]
            if data["mood"]["label"] not in valid_moods:
                logger.error(f"Invalid mood label: {data['mood']['label']}")
                return None
            
            # Validate action
            valid_actions = ["reply", "escalate", "schedule_followup", "request_payment"]
            if data["action"] not in valid_actions:
                logger.error(f"Invalid action: {data['action']}")
                return None
            
            # Validate outcome_hint structure
            if not isinstance(data["outcome_hint"], dict) or "label" not in data["outcome_hint"] or "confidence" not in data["outcome_hint"]:
                logger.error("Invalid outcome_hint structure")
                return None
            
            # Validate outcome labels
            valid_outcomes = ["Resolved", "Payment Promised", "Needs Follow-up", "Escalate"]
            if data["outcome_hint"]["label"] not in valid_outcomes:
                logger.error(f"Invalid outcome label: {data['outcome_hint']['label']}")
                return None
            
            return data
            
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON from Grok: {str(e)}")
            return None
    
    def call_grok(self, messages: List[Dict], agent_type: str, language: str = "en") -> Dict[str, Any]:
        """
        Call Grok API with conversation messages and return structured response.
        
        Args:
            messages: List of conversation messages with role and content
            agent_type: Type of agent (renewal, policy_info, crosssell)
            language: Language hint for Grok
        
        Returns:
            Structured response dict with assistant_text, mood, summary, action, outcome_hint
        """
        if not self.api_key:
            logger.warning("Grok API key not configured - returning fallback response")
            return self._get_fallback_response(messages, agent_type)
        
        # Check cache first
        cache_key = self._get_cache_key(messages, agent_type)
        if self._is_cache_valid(cache_key):
            logger.info("Returning cached Grok response")
            return self.cache[cache_key]["response"]
        
        try:
            # Add language instruction to system message
            system_message = messages[0] if messages and messages[0]["role"] == "system" else None
            if system_message:
                system_message["content"] += f"\n\nIMPORTANT: Reply in {language} language. Return JSON only with the exact schema specified."
            else:
                # Add system message if not present
                messages.insert(0, {
                    "role": "system",
                    "content": f"Reply in {language} language. Return JSON only with the exact schema specified."
                })
            
            # Make API call
            response = self._call_grok_api(messages, agent_type)
            
            if "choices" not in response or not response["choices"]:
                raise Exception("No choices in Grok response")
            
            response_text = response["choices"][0]["message"]["content"]
            
            # Validate JSON response
            parsed_response = self._validate_json_response(response_text)
            
            if parsed_response is None:
                # Try again with explicit JSON instruction
                logger.warning("Invalid JSON from Grok, retrying with explicit instruction")
                messages[0]["content"] += "\n\nCRITICAL: You must return valid JSON only. No other text."
                
                response = self._call_grok_api(messages, agent_type)
                response_text = response["choices"][0]["message"]["content"]
                parsed_response = self._validate_json_response(response_text)
            
            if parsed_response is None:
                logger.error("Grok returned invalid JSON after retries - using fallback")
                return self._get_fallback_response(messages, agent_type)
            
            # Cache successful response
            self.cache[cache_key] = {
                "response": parsed_response,
                "timestamp": datetime.now()
            }
            
            logger.info(f"Grok API call successful for agent: {agent_type}")
            return parsed_response
            
        except Exception as e:
            logger.error(f"Grok API call failed: {str(e)}")
            return self._get_fallback_response(messages, agent_type)
    
    def _get_fallback_response(self, messages: List[Dict], agent_type: str) -> Dict[str, Any]:
        """
        Generate fallback response when Grok fails.
        
        Args:
            messages: List of conversation messages
            agent_type: Type of agent
        
        Returns:
            Fallback response dict
        """
        # Get the last user message
        last_user_message = ""
        for msg in reversed(messages):
            if msg["role"] == "user":
                last_user_message = msg["content"]
                break
        
        # Simple rule-based fallback
        if any(word in last_user_message.lower() for word in ["cancel", "refund", "angry", "terrible", "hate"]):
            mood = {"label": "negative", "confidence": 0.8}
            action = "escalate"
            outcome_hint = {"label": "Escalate", "confidence": 0.8}
            assistant_text = "I understand you're not satisfied. Let me connect you with a specialist who can help resolve this issue."
        elif any(word in last_user_message.lower() for word in ["yes", "sure", "agree", "pay", "payment"]):
            mood = {"label": "receptive", "confidence": 0.7}
            action = "request_payment"
            outcome_hint = {"label": "Payment Promised", "confidence": 0.7}
            assistant_text = "Great! I'll help you with that. Let me process your request."
        else:
            mood = {"label": "neutral", "confidence": 0.6}
            action = "reply"
            outcome_hint = {"label": "Needs Follow-up", "confidence": 0.6}
            assistant_text = "Thank you for your message. I'm here to help with your insurance needs."
        
        return {
            "assistant_text": assistant_text,
            "mood": mood,
            "summary": [last_user_message[:100] + "..." if len(last_user_message) > 100 else last_user_message],
            "action": action,
            "outcome_hint": outcome_hint
        }

# Global instance
grok_api = GrokAPI()

def call_grok(messages: List[Dict], agent_type: str, language: str = "en") -> Dict[str, Any]:
    """
    Convenience function to call Grok API.
    
    Args:
        messages: List of conversation messages
        agent_type: Type of agent (renewal, policy_info, crosssell)
        language: Language hint for Grok
    
    Returns:
        Structured response dict
    """
    return grok_api.call_grok(messages, agent_type, language)
