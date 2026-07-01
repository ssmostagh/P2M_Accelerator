import os
import base64
from typing import Any
from google import genai
from google.genai import types

# Model Constants
IMAGE_EDITING_MODEL = 'gemini-3.1-flash-image-preview'
TEXT_VISION_MODEL = 'gemini-3.1-pro-preview'
VIDEO_MODEL = 'veo-3.1-fast-generate-001'

MODEL_REGIONS = {
    'gemini-3.1-flash-preview': 'global',
    'gemini-3.1-flash-image-preview': 'global',
    'veo-3.1-fast-generate-001': 'us-central1',
}

# Client Cache
client_cache = {}

def get_region_for_model(model_name: str) -> str:
    """Determine the region for a given model."""
    if model_name in MODEL_REGIONS:
        return MODEL_REGIONS[model_name]
    if '3.1' in model_name or 'preview' in model_name:
        return 'global'
    return os.environ.get('GOOGLE_CLOUD_LOCATION', 'us-central1')

import subprocess
from google.oauth2.credentials import Credentials

def get_smart_credentials():
    """Attempt to get credentials from active gcloud CLI auth or default ADC."""
    try:
        token = subprocess.check_output(['gcloud', 'auth', 'print-access-token'], stderr=subprocess.DEVNULL).decode('utf-8').strip()
        if token:
            return Credentials(token=token)
    except Exception:
        pass
    return None

def get_client(model_name: str) -> genai.Client:
    """Get or create a genai.Client for the model's region."""
    region = get_region_for_model(model_name)
    project_id = os.environ.get('GOOGLE_CLOUD_PROJECT')
    cache_key = (region, project_id)
    if cache_key not in client_cache:
        creds = get_smart_credentials()
        if creds:
            client_cache[cache_key] = genai.Client(
                vertexai=True,
                project=project_id,
                location=region,
                credentials=creds
            )
        else:
            client_cache[cache_key] = genai.Client(
                vertexai=True,
                project=project_id,
                location=region
            )
    return client_cache[cache_key]

def data_url_to_part(data_url: Any) -> types.Part:
    """Convert a Data URL to a types.Part for the SDK."""
    if not data_url:
        raise ValueError("Data URL is empty")
    
    if isinstance(data_url, dict):
        # Extract URL if frontend sends an object
        if 'inlineData' in data_url:
             inline = data_url['inlineData']
             # In Gemini API schema, inlineData has mimeType and data
             mime_type = inline.get('mimeType')
             data = inline.get('data')
             if mime_type and data:
                 return types.Part.from_bytes(
                     data=base64.b64decode(data),
                     mime_type=mime_type,
                 )
        
        temp = data_url.get('url') or data_url.get('image') or data_url.get('data')
        if not temp:
            raise ValueError(f"Expected dict with 'url', 'image', 'data', or 'inlineData', got keys: {list(data_url.keys())}")
        data_url = temp

    try:
        header, data = data_url.split(',', 1)
        mime_type = header.split(';')[0].split(':')[1]
    except (ValueError, IndexError) as e:
        raise ValueError(f"Invalid Data URL format: {data_url[:50]}...") from e

    return types.Part.from_bytes(
        data=base64.b64decode(data),
        mime_type=mime_type,
    )

def process_api_response(response) -> str:
    """Extract image data URL from response."""
    if not response.candidates:
        raise ValueError("No candidates found in response")

    candidate = response.candidates[0]
    if not candidate.content or not candidate.content.parts:
        raise ValueError("No content or parts found in response")

    for part in candidate.content.parts:
        if hasattr(part, 'inline_data') and part.inline_data:
             mime_type = part.inline_data.mime_type
             data = base64.b64encode(part.inline_data.data).decode('utf-8')
             return f"data:{mime_type};base64,{data}"

    text_content = response.text if hasattr(response, 'text') else ""
    if text_content:
         raise ValueError(f"Model returned text instead of image: {text_content[:200]}...")
         
    raise ValueError("No image found in API response")
