import os
import asyncio
from typing import List, Dict, Any, Optional
from google.genai import types
from google import genai
from concurrent.futures import ThreadPoolExecutor

from services.base_service import (
    get_client, data_url_to_part, process_api_response,
    INITIAL_TRYON_MODEL, IMAGE_EDITING_MODEL, TEXT_VISION_MODEL, VIDEO_MODEL
)

def get_virtual_try_on_prompt(garment_description: str, model_name: str) -> str:
    """Generate prompt for virtual try-on."""
    if model_name == 'gemini-3.1-flash-image' or 'flash-image' in model_name:
        return f"""Generate a photorealistic image of the person from the first image wearing the garment from the second image.

GARMENT DESCRIPTION:
{garment_description}

REQUIREMENTS:
- Place the garment naturally on the person's body with correct fit and proportions
- Replicate exact colors, patterns, and textures from the garment image
- Match all lighting, shadows, and highlights from the model image
- Realistic fabric draping, wrinkles, and material behavior
- Preserve the person's exact pose, face, skin tone, hair, and body shape
- Keep background completely unchanged
- Make it look like a real photograph, not a digital composite

The garment should look naturally worn, not superimposed. Maintain photographic realism throughout."""
    else:
        return f"""Create a highly realistic, photo-quality virtual try-on image showing the person from the model image wearing the garment from the garment image.

GARMENT DETAILS:
{garment_description}

CRITICAL REQUIREMENTS:
- Naturally place and fit the garment on the person's body with proper sizing and proportions
- Ensure realistic draping, wrinkles, and fabric behavior based on the garment type and material
- Match lighting, shadows, and highlights to integrate the garment seamlessly with the model
- Preserve the exact colors, patterns, textures, and all design details of the garment
- Maintain the person's original pose, facial features, skin tone, and body proportions exactly
- Keep the background completely unchanged
- Ensure the garment looks like it's actually being worn, not superimposed
- Create natural shadows and depth where the garment interacts with the body
- Make the result indistinguishable from a real photograph"""

async def generate_prompt(garment_image_data: str) -> str:
    """Analyze garment image and create description."""
    client = get_client(TEXT_VISION_MODEL)
    garment_image_part = data_url_to_part(garment_image_data)
    prompt = """Analyze this garment image and provide a detailed description including:
- Type of garment (e.g., t-shirt, dress, jacket)
- Style and fit (e.g., casual, formal, slim-fit, oversized)
- Color(s) and color patterns
- Fabric texture and material appearance
- Key design features (e.g., collar type, sleeves, pockets, buttons, zippers)
- Any patterns, prints, or graphics
- Overall aesthetic and fashion category

Provide a comprehensive description that would help recreate this garment accurately in a virtual try-on."""
    
    response = await client.aio.models.generate_content(
        model=TEXT_VISION_MODEL,
        contents=[types.Part.from_text(text=prompt), garment_image_part],
    )
    return response.text

async def generate_initial_image(model_image_data: str, garment_image_data: str, text_prompt: str) -> str:
    """Generate initial try-on image."""
    model_image_part = data_url_to_part(model_image_data)
    garment_image_part = data_url_to_part(garment_image_data)
    
    garment_description = await generate_prompt(garment_image_data)
    prompt_text = get_virtual_try_on_prompt(garment_description, INITIAL_TRYON_MODEL)
    
    client = get_client(INITIAL_TRYON_MODEL)
    config = types.GenerateContentConfig(
        response_modalities=["IMAGE", "TEXT"],
        temperature=1.0 if '3.1' in INITIAL_TRYON_MODEL else None
    )
    
    response = await client.aio.models.generate_content(
        model=INITIAL_TRYON_MODEL,
        contents=[model_image_part, garment_image_part, types.Part.from_text(text=prompt_text)],
        config=config
    )
    return process_api_response(response)

def _generate_single_image_sync(model_image_data: str, garment_image_data: str, prompt_text: str, temperature: Optional[float] = None) -> str:
    """Synchronous helper for ProcessPoolExecutor to generate a single image."""
    project_id = os.environ.get('GOOGLE_CLOUD_PROJECT')
    fresh_client = genai.Client(
        vertexai=True,
        project=project_id,
        location='global'
    )
    
    model_part = data_url_to_part(model_image_data)
    garment_part = data_url_to_part(garment_image_data)
    
    config = types.GenerateContentConfig(
        response_modalities=["IMAGE", "TEXT"],
        temperature=temperature
    )
    
    response = fresh_client.models.generate_content(
        model=INITIAL_TRYON_MODEL,
        contents=[model_part, garment_part, types.Part.from_text(text=prompt_text)],
        config=config
    )
    return process_api_response(response)

async def generate_initial_image_variations(model_image_data: str, garment_image_data: str, text_prompt: str, count: int = 4) -> List[str]:
    """Generate multiple initial image variations in parallel using ThreadPoolExecutor."""
    garment_description = await generate_prompt(garment_image_data)
    prompt_text = get_virtual_try_on_prompt(garment_description, INITIAL_TRYON_MODEL)
    
    temperature = 1.0 if '3.1' in INITIAL_TRYON_MODEL else None

    with ThreadPoolExecutor(max_workers=count) as executor:
        loop = asyncio.get_running_loop()
        futures = []
        for _ in range(count):
             futures.append(loop.run_in_executor(executor, _generate_single_image_sync, model_image_data, garment_image_data, prompt_text, temperature))
        results = await asyncio.gather(*futures)
    return results

async def edit_image(base_image_data: str, prompt: str) -> str:
    """Edit an image with a text prompt."""
    image_part = data_url_to_part(base_image_data)
    client = get_client(IMAGE_EDITING_MODEL)
    
    response = await client.aio.models.generate_content(
        model=IMAGE_EDITING_MODEL,
        contents=[image_part, prompt],
        config=types.GenerateContentConfig(
            response_modalities=["IMAGE", "TEXT"]
        )
    )
    return process_api_response(response)

def _generate_single_edit_sync(base_image_data: str, prompt: str) -> str:
    """Synchronous helper for ProcessPoolExecutor to generate a single edit."""
    project_id = os.environ.get('GOOGLE_CLOUD_PROJECT')
    fresh_client = genai.Client(
        vertexai=True,
        project=project_id,
        location='global'
    )
    image_part = data_url_to_part(base_image_data)
    response = fresh_client.models.generate_content(
        model='gemini-3.1-flash-image',
        contents=[image_part, prompt],
        config=types.GenerateContentConfig(
            response_modalities=["IMAGE", "TEXT"]
        )
    )
    return process_api_response(response)

async def generate_edit_variations(base_image_data: str, prompt: str, count: int = 3) -> List[str]:
    """Generate multiple edit variations in parallel using ThreadPoolExecutor."""
    with ThreadPoolExecutor(max_workers=count) as executor:
        loop = asyncio.get_running_loop()
        futures = []
        for _ in range(count):
             futures.append(loop.run_in_executor(executor, _generate_single_edit_sync, base_image_data, prompt))
        results = await asyncio.gather(*futures)
    return results

async def generate_video_variations(front_image_data: str, count: int = 3) -> Dict[str, str]:
    """Generate video variations using google-genai SDK."""
    image_part = data_url_to_part(front_image_data)
    client = get_client(VIDEO_MODEL)
    
    try:
        operation = await client.aio.models.generate_videos(
            model=VIDEO_MODEL,
            source={
                "prompt": "Animate the person in the image turning around smoothly, as if on a catwalk, to show the back of their garment.",
                "image": {
                    "imageBytes": image_part.inline_data.data,
                    "mimeType": image_part.inline_data.mime_type
                }
            },
            config={
                "numberOfVideos": count,
                "durationSeconds": 6,
                "aspectRatio": "16:9",
                "resolution": "720p"
            }
        )
        
        operation_name = operation.name
        if not operation_name:
            raise ValueError("No operation name returned by SDK")
            
        return {"name": operation_name}
    except Exception as e:
        print(f"SDK Video Generation failed: {e}", flush=True)
        raise

async def select_best_image(images: List[str], criteria: str) -> int:
    """Auto-select the best image variation."""
    model = 'gemini-3.1-flash-lite-preview'
    client = get_client(model)
    
    image_parts = []
    for img in images:
        try:
             image_parts.append(data_url_to_part(img))
        except Exception:
             continue # Skip invalid images

    prompt = f"""You are a specialized Quality Assurance AI. Analyze these fashion illustrations. Criteria: {criteria}. Return ONLY the 0-based index of the best image. Output just the integer."""

    response = await client.aio.models.generate_content(
        model=model,
        contents=image_parts + [prompt],
        config=types.GenerateContentConfig(temperature=0.1)
    )
    
    try:
         return int(response.text.strip())
    except ValueError:
         return 0 # Default fallback
