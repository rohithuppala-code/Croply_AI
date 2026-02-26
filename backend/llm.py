"""
Croply AI — LLM Integration Module
Handles all Groq Llama3 API interactions for disease info, chat, and care tips.
"""

import os
import json
import requests
from typing import Union
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.1-8b-instant"


def _call_groq(system_prompt: str, user_prompt: str, temperature: float = 0.3,
               max_tokens: int = 800, json_mode: bool = False,
               history: list = None) -> Union[dict, str]:
    """
    Internal helper — sends a chat completion request to the Groq API.
    Returns parsed JSON dict or raw string.
    Optionally accepts conversation history for context-aware chat.
    """
    if not GROQ_API_KEY:
        raise RuntimeError("GROQ_API_KEY not set in environment variables")

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    # Build messages list
    messages = [{"role": "system", "content": system_prompt}]
    if history:
        # Append past conversation turns (limit to last 20 for token safety)
        for msg in history[-20:]:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role in ("user", "assistant") and content:
                messages.append({"role": role, "content": content})
    messages.append({"role": "user", "content": user_prompt})

    payload = {
        "model": GROQ_MODEL,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }

    if json_mode:
        payload["response_format"] = {"type": "json_object"}

    response = requests.post(GROQ_API_URL, headers=headers, json=payload)
    response.raise_for_status()

    content = response.json()["choices"][0]["message"]["content"]

    if json_mode:
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            return {"raw_content": content}

    return content


def get_disease_info(disease_name: str, language: str = "English") -> dict:
    """
    Given a disease class name (e.g. 'Tomato___Late_blight'), return structured
    disease information including description, symptoms, causes, treatments, and prevention.
    """
    clean_name = disease_name.replace("___", " — ").replace("_", " ")

    system_prompt = (
        "You are a plant pathology expert. Provide structured, scientifically accurate "
        "information about plant diseases for agricultural professionals. "
        f"Respond entirely in {language}."
    )

    user_prompt = f"""Provide detailed information about the plant disease '{clean_name}' in JSON format:

{{
    "name": "Disease Name",
    "description": "Detailed scientific description of the disease",
    "symptoms": ["Symptom 1", "Symptom 2"],
    "causes": ["Cause 1", "Cause 2"],
    "treatment_options": [
        {{"method": "Treatment", "description": "Details", "effectiveness": "High/Medium/Low"}}
    ],
    "prevention": ["Prevention 1", "Prevention 2"]
}}

Focus on practical, scientifically accurate information."""

    return _call_groq(system_prompt, user_prompt, temperature=0.3, max_tokens=800, json_mode=True)


def chat_response(message: str, language: str = "English", history: list = None) -> str:
    """
    General-purpose AI chatbot with conversation memory.
    Handles plant health questions AND general knowledge.
    Accepts optional history list of {role, content} dicts for context.
    """
    system_prompt = (
        "You are Croply AI, a friendly and knowledgeable assistant. "
        "Your primary expertise is in plant pathology, agriculture, and plant care — "
        "but you can also answer general knowledge questions, help with everyday queries, "
        "and have casual conversations. "
        "When answering plant-related questions, be scientifically accurate and practical. "
        "For other topics, be helpful, concise, and informative. "
        "Use markdown formatting for structured answers. "
        f"Respond in {language}."
    )

    return _call_groq(system_prompt, message, temperature=0.4, max_tokens=1000, history=history)


def get_care_tips(plant_name: str, language: str = "English") -> str:
    """
    Generate a care routine for a given plant covering watering, sunlight,
    soil, pests, and seasonal tips.
    """
    system_prompt = "You are Croply AI, an expert plant care advisor. Provide practical, concise care routines."

    user_prompt = f"""Provide a concise daily/weekly care routine for {plant_name} plants, covering:
1. Watering schedule and amount
2. Sunlight requirements
3. Soil and fertilizer needs
4. Common pests to watch for
5. Seasonal care tips

Keep it practical and actionable for home gardeners. Respond in {language}."""

    return _call_groq(system_prompt, user_prompt, temperature=0.3, max_tokens=800)
