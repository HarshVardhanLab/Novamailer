import os
import re
from google import genai
from typing import Optional, Dict
from app.core.config import settings

class AIService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        if self.api_key:
            self.client = genai.Client(api_key=self.api_key)
        else:
            self.client = None

    def _check_configured(self):
        if not self.client:
            raise ValueError("GEMINI_API_KEY is not configured in the environment variables.")

    async def generate_template(self, prompt: str) -> str:
        """
        Generates an HTML email template based on the provided prompt.
        """
        self._check_configured()
        
        system_instruction = (
            "You are an expert email template designer. "
            "Generate ONLY valid HTML code for an email template based on the user's prompt. "
            "The HTML should be responsive and use inline CSS. "
            "Do not include any explanation or markdown formatting like ```html. Just return the raw HTML code. "
            "Include placeholder variables like {{name}} or {{company}} if appropriate."
        )
        
        full_prompt = f"{system_instruction}\n\nUser Request: {prompt}"
        
        response = self.client.models.generate_content(
            model='gemini-2.5-flash', contents=full_prompt
        )
        content = response.text.strip()
        
        # Strip markdown syntax if the model included it despite instructions
        if content.startswith("```html"):
            content = content[7:]
        if content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]
            
        return content.strip()

    async def suggest_campaign(self, topic: str) -> Dict[str, str]:
        """
        Suggests an email subject line and HTML body based on a campaign topic.
        """
        self._check_configured()
        
        system_instruction = (
            "You are an expert email marketing copywriter and HTML designer. "
            "Based on the user's topic, you must generate a compelling email campaign subject line "
            "AND a responsive HTML email body with inline CSS. "
            "Format your response EXACTLY like this with no extra text or explanation:\n"
            "SUBJECT: <your compelling subject line here>\n"
            "BODY: <your raw HTML code here>"
        )
        
        full_prompt = f"{system_instruction}\n\nCampaign Topic: {topic}"
        
        response = self.client.models.generate_content(
            model='gemini-2.5-flash', contents=full_prompt
        )
        content = response.text.strip()
        
        # Parse the response
        subject_match = re.search(r"SUBJECT:\s*(.*?)\nBODY:\s*(.*)", content, re.DOTALL | re.IGNORECASE)
        
        if subject_match:
            subject = subject_match.group(1).strip()
            body = subject_match.group(2).strip()
            
            # Strip markdown syntax from the body if present
            if body.startswith("```html"):
                body = body[7:]
            if body.startswith("```"):
                body = body[3:]
            if body.endswith("```"):
                body = body[:-3]
                
            return {
                "subject": subject,
                "body": body.strip()
            }
        
        # Fallback if parsing fails
        raise ValueError("Failed to parse the AI response format.")

ai_service = AIService()
