import os
import base64
import json
import asyncio
from typing import List, Dict, Any, Optional
import httpx
import google.auth
import google.auth.transport.requests
from google import genai
from google.genai import types
from concurrent.futures import ThreadPoolExecutor

from constants.fabrics import FABRICS
from constants.pantone_colors import PANTONE_COLORS, get_complementary_pantone_colors

# Model Constants
IMAGE_EDITING_MODEL = 'gemini-3.1-flash-image-preview'
TEXT_VISION_MODEL = 'gemini-3.1-pro-preview'
VIDEO_MODEL = 'veo-3.1-fast-generate-001'

MODEL_REGIONS = {
    'gemini-3.1-flash-preview': 'global',
    'gemini-3.1-flash-image-preview': 'global',
    'veo-3.1-fast-generate-001': 'us-central1',
}

def get_region_for_model(model_name: str) -> str:
    """Determine the region for a given model."""
    if model_name in MODEL_REGIONS:
        return MODEL_REGIONS[model_name]
    if '3.1' in model_name or 'preview' in model_name:
        return 'global'
    return os.environ.get('GOOGLE_CLOUD_LOCATION', 'us-central1')

# Client Cache
client_cache = {}

def get_client(model_name: str) -> genai.Client:
    """Get or create a genai.Client for the model's region."""
    region = get_region_for_model(model_name)
    if region not in client_cache:
        project_id = os.environ.get('GOOGLE_CLOUD_PROJECT')
        is_vertex = region != 'global'
        client_cache[region] = genai.Client(
            vertexai=is_vertex,
            project=project_id if is_vertex else None,
            location=region
        )
    return client_cache[region]

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

def get_virtual_try_on_prompt(garment_description: str, model_name: str) -> str:
    """Generate prompt for virtual try-on."""
    if model_name == 'gemini-3.1-flash-image-preview':
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

async def analyze_tech_pack_sketch(sketch_image_data: str) -> str:
    """Analyze tech pack sketch."""
    client = get_client(TEXT_VISION_MODEL)
    sketch_image_part = data_url_to_part(sketch_image_data)
    prompt = """Analyze this fashion design sketch and provide a detailed technical description of THE GARMENT ONLY.

CRITICAL INSTRUCTION - GARMENT vs ACCESSORIES:
First, identify what is the actual GARMENT (the clothing item itself) versus STYLING ACCESSORIES (items worn with the garment for styling purposes only).

GARMENT = The clothing item being designed (dress, top, jacket, pants, skirt, etc.)
ACCESSORIES TO EXCLUDE = gloves, jewelry, bags, shoes, hats, scarves, separate belts (unless integral to garment construction), watches, sunglasses, other styling props

YOUR TASK: Provide a technical description of ONLY THE GARMENT. Do not describe or mention any styling accessories.

[Sub-headings tracked: TYPE, PROPORTIONS & MEASUREMENTS, SILHOUETTE, CONSTRUCTION DETAILS, DESIGN ELEMENTS]"""

    response = await client.aio.models.generate_content(
        model=TEXT_VISION_MODEL,
        contents=[types.Part.from_text(text=prompt), sketch_image_part],
    )
    return response.text


async def generate_initial_image(model_image_data: str, garment_image_data: str, text_prompt: str) -> str:
    """Generate initial try-on image."""
    model_image_part = data_url_to_part(model_image_data)
    garment_image_part = data_url_to_part(garment_image_data)
    
    garment_description = await generate_prompt(garment_image_data)
    prompt_text = get_virtual_try_on_prompt(garment_description, IMAGE_EDITING_MODEL)
    
    client = get_client(IMAGE_EDITING_MODEL)
    config = types.GenerateContentConfig(
        response_modalities=["IMAGE", "TEXT"],
        temperature=1.0 if IMAGE_EDITING_MODEL == 'gemini-3.1-flash-image-preview' else None
    )
    
    response = await client.aio.models.generate_content(
        model=IMAGE_EDITING_MODEL,
        contents=[model_image_part, garment_image_part, types.Part.from_text(text=prompt_text)],
        config=config
    )
    return process_api_response(response)

def _generate_single_image_sync(model_image_data: str, garment_image_data: str, prompt_text: str, temperature: Optional[float] = None) -> str:
    """Synchronous helper for ProcessPoolExecutor to generate a single image."""
    fresh_client = genai.Client(
        vertexai=False,
        location='global'
    )
    
    model_part = data_url_to_part(model_image_data)
    garment_part = data_url_to_part(garment_image_data)
    
    config = types.GenerateContentConfig(
        response_modalities=["IMAGE", "TEXT"],
        temperature=temperature
    )
    
    response = fresh_client.models.generate_content(
        model='gemini-3.1-flash-image-preview',
        contents=[model_part, garment_part, types.Part.from_text(text=prompt_text)],
        config=config
    )
    return process_api_response(response)

async def generate_initial_image_variations(model_image_data: str, garment_image_data: str, text_prompt: str, count: int = 4) -> List[str]:
    """Generate multiple initial image variations in parallel using ProcessPoolExecutor."""
    garment_description = await generate_prompt(garment_image_data)
    prompt_text = get_virtual_try_on_prompt(garment_description, IMAGE_EDITING_MODEL)
    
    temperature = 1.0 if IMAGE_EDITING_MODEL == 'gemini-3.1-flash-image-preview' else None

    # Run in ThreadPoolExecutor to force true parallel network dispatches safely
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
    fresh_client = genai.Client(
        vertexai=False,
        location='global'
    )
    image_part = data_url_to_part(base_image_data)
    response = fresh_client.models.generate_content(
        model='gemini-3.1-flash-image-preview',
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

async def generate_color_palette(title: str, keywords: str) -> Dict[str, List[Dict[str, str]]]:
    """Generate color palette from real Pantone colors."""
    colors = get_complementary_pantone_colors(keywords, 8)
    
    if len(colors) < 8:
        needed = 8 - len(colors)
        random_colors = get_random_pantone_colors(needed + 10)
        existing_codes = {c['code'] for c in colors}
        
        for color in random_colors:
            if color['code'] not in existing_codes and len(colors) < 8:
                colors.append(color)
                existing_codes.add(color['code'])
                
    return {"colors": colors[:8]}

async def generate_moodboard_image(prompt: str, aspect_ratio: str) -> str:
    """Generate moodboard image."""
    model = 'gemini-3.1-flash-image-preview'
    client = get_client(model)
    
    valid_ratios = ['1:1', '3:4', '4:3', '9:16', '16:9']
    if aspect_ratio not in valid_ratios:
        aspect_ratio = '1:1'
        
    config = types.GenerateContentConfig(
        response_modalities=["IMAGE"],
        temperature=1.0,
    )
    
    response = await client.aio.models.generate_content(
        model=model,
        contents=[prompt],
        config=config
    )
    return process_api_response(response)

async def regenerate_color(current_color_name: str, theme_prompt: str, direction: Optional[str] = None) -> Dict[str, str]:
    """Regenerate a color based on direction or theme."""
    current_color = next((c for c in PANTONE_COLORS if c['name'] == current_color_name), None)
    available_colors = [c for c in PANTONE_COLORS if c['name'] != current_color_name]
    
    if direction and current_color:
        curr_hex = current_color['code'].lower()
        curr_r, curr_g, curr_b = int(curr_hex[1:3], 16), int(curr_hex[3:5], 16), int(curr_hex[5:7], 16)
        curr_brightness = (curr_r * 299 + curr_g * 587 + curr_b * 114) / 1000
        
        filtered = []
        for color in available_colors:
            hex_code = color['code'].lower()
            r, g, b = int(hex_code[1:3], 16), int(hex_code[3:5], 16), int(hex_code[5:7], 16)
            brightness = (r * 299 + g * 587 + b * 114) / 1000
            
            if direction == 'lighter' and brightness > curr_brightness + 20:
                filtered.append(color)
            elif direction == 'darker' and brightness < curr_brightness - 20:
                filtered.append(color)
            elif direction == 'warmer' and (r - b) > (curr_r - curr_b) + 15:
                filtered.append(color)
            elif direction == 'cooler' and (b - r) > (curr_b - curr_r) + 15:
                filtered.append(color)
                
        if filtered:
            available_colors = filtered

    new_color = None
    
    if theme_prompt and len(theme_prompt) > 10 and available_colors:
        import re
        kw_match = re.search(r'keywords[:\s]+[\'"](.*?)[\'"]', theme_prompt, re.I)
        theme_match = re.search(r'theme[:\s]+[\'"](.*?)[\'"]', theme_prompt, re.I)
        keywords = kw_match.group(1) if kw_match else (theme_match.group(1) if theme_match else None)
        
        if keywords:
            comp_colors = get_complementary_pantone_colors(keywords, 20)
            avail_codes = {c['code'] for c in available_colors}
            valid_comp = [c for c in comp_colors if c['name'] != current_color_name and c['code'] in avail_codes]
            if valid_comp:
                import random
                new_color = random.choice(valid_comp)

    if not new_color and available_colors:
        import random
        new_color = random.choice(available_colors)
        
    if not new_color:
        fallback = [c for c in PANTONE_COLORS if c['name'] != current_color_name]
        import random
        new_color = random.choice(fallback)
        
    return new_color

async def rewrite_prompt(original_prompt: str) -> str:
    """Rewrite prompt for better image generation."""
    meta_prompt = f"You are a creative assistant for a fashion designer. Rewrite and enhance the following image prompt to generate a more visually compelling and detailed photograph for a fashion moodboard. Return only the new prompt text."
    
    client = get_client('gemini-3.1-flash-lite-preview')
    
    response = await client.aio.models.generate_content(
        model='gemini-3.1-flash-lite-preview',
        contents=[meta_prompt],
        config=types.GenerateContentConfig(system_instruction=f"Original Prompt: {original_prompt}")
    )
    return response.text.strip()

# Tech Illustrations Assistant Functions

async def generate_tech_pack_flat(front_image_data_url: str, back_image_data_url: Optional[str] = None, front_includes_back: bool = False, front_description: Optional[str] = None, back_description: Optional[str] = None) -> Dict[str, Any]:
    """Generate technical flat showing front and back views side by side."""
    model = IMAGE_EDITING_MODEL
    client = get_client(model)
    
    front_part = data_url_to_part(front_image_data_url)
    back_part = data_url_to_part(back_image_data_url) if back_image_data_url else None
    image_part_for_prompts = back_part if back_part else front_part

    flat_prompt = """Generate ONE technical flat showing BOTH front AND back views side by side. Front on LEFT, back on RIGHT, small gap. Both same size, aligned. 

[ABSOLUTE REQUIREMENTS Suffix]:
1) ONLY thin black lines/outlines on pure white background - NO GREY TONES WHATSOEVER 
2) ZERO fills, ZERO colors, ZERO shading, ZERO textures, ZERO gradients 
3) Show seam lines, stitching, topstitching, and all construction details ONLY as thin black outlines 
4) The garment should be laid completely flat as if viewed from directly above on a table 
5) NO SOLID BLACK AREAS 
6) ABSOLUTELY NO HUMAN BODY, NO MANNEQUIN, NO MODEL 
7) EXCLUDE ALL STYLING ACCESSORIES
8) ABSOLUTELY NO TEXT, NO LABELS, NO ANNOTATIONS, NO MEASUREMENT LINES, NO DIMENSION ARROWS unless they are part of a graphic/logo on the original sketch. The output must be a clean line drawing of the garment only.
"""
    if front_description:
         flat_prompt += f"\nFront Description: {front_description}"
    if back_description:
         flat_prompt += f"\nBack Description: {back_description}"

    config = types.GenerateContentConfig(response_modalities=["IMAGE", "TEXT"])

    response = await client.aio.models.generate_content(
        model=model,
        contents=[image_part_for_prompts, types.Part.from_text(text=flat_prompt)],
        config=config
    )
    return {"flatCombined": process_api_response(response)}

async def generate_tech_pack_rendering(front_image_data_url: str, back_image_data_url: Optional[str] = None, front_includes_back: bool = False, front_description: Optional[str] = None, back_description: Optional[str] = None) -> Dict[str, Any]:
    """Generate photorealistic rendering showing front and back views side by side."""
    model = IMAGE_EDITING_MODEL
    client = get_client(model)
    
    front_part = data_url_to_part(front_image_data_url)
    back_part = data_url_to_part(back_image_data_url) if back_image_data_url else None
    image_part_for_prompts = back_part if back_part else front_part

    rendering_prompt = """Generate ONE image showing BOTH front AND back photorealistic renderings side by side. Front view on LEFT, back view on RIGHT. 
CRITICAL SPACING: Leave significant white space between the two views - the gap should be AT LEAST 20% of the garment width to ensure they are clearly separated and do NOT overlap or touch. 
Both views must be the same size and perfectly aligned vertically. 

[Suffix Requirements]:
Create a photorealistic 3D rendering of the garment displayed on a neutral, ghost mannequin against a clean, light gray studio background. The rendering must look like a high-quality product photograph with realistic fabric texture, accurate drape physics, and professional studio lighting. Use ray-traced rendering techniques for authentic material properties and lighting. Do not include any text or watermarks.

[Consistency Suffix]:
CRITICAL CONSISTENCY REQUIREMENTS: The front and back views MUST represent the SAME garment and maintain perfect consistency in length, silhouette, sleeves, etc."""
    if front_description:
         rendering_prompt += f"\nFront Description: {front_description}"
    if back_description:
         rendering_prompt += f"\nBack Description: {back_description}"

    config = types.GenerateContentConfig(response_modalities=["IMAGE", "TEXT"])

    response = await client.aio.models.generate_content(
        model=model,
        contents=[image_part_for_prompts, types.Part.from_text(text=rendering_prompt)],
        config=config
    )
    return {"renderingCombined": process_api_response(response)}

async def generate_tech_pack_annotations(image_part: types.Part) -> str:
    """Identify key technical features for annotations."""
    model = TEXT_VISION_MODEL
    client = get_client(model)
    prompt = """Identify the key technical components of this garment that require callouts in a manufacturing tech pack.
Return a simple list of 5-8 specific items (e.g., "Ribbed Collar", "Sleeve Hem", "Side Seam Zipper", "Kangaroo Pocket").
Focus on construction details, trims, and fasteners. Do not create full sentences."""
    
    response = await client.aio.models.generate_content(
        model=model,
        contents=[prompt, image_part]
    )
    return response.text

async def generate_annotated_tech_pack(flat_image_data_url: str, back_image_data_url: Optional[str] = None, front_includes_back: bool = False, feedback: Optional[str] = None) -> Dict[str, Any]:
    """Generate annotated tech pack image."""
    model = IMAGE_EDITING_MODEL
    client = get_client(model)
    
    flat_part = data_url_to_part(flat_image_data_url)
    annotations = await generate_tech_pack_annotations(flat_part)
    
    prompt = f"""You are an expert Technical Fashion Illustrator specializing in CAD overlays. Your task is to take a provided technical flat illustration and overlay specific red text and arrows onto it.

**CRITICAL MANDATE:** OVERLAY ONLY: Your output must be the exact original image with ONLY red text and red arrows added on top. DO NOT REDRAW.

**STEP-BY-STEP PLACEMENT LOGIC:**
- Rule A (Inside Rule): neck items go on FRONT view (Left).
- Rule B (Back Rule): explicit back-exterior terms go on BACK view (Right).
- Rule C (Default): All elsewhere.

Execution: Draw verbatim RED TEXT in nearest empty whitespace with a thin RED LINE pointing to the feature edge spot.

Features to annotate:
{annotations}"""
    
    if feedback:
        prompt += f"\nUser Feedback: {feedback}"

    response = await client.aio.models.generate_content(
        model=model,
        contents=[flat_part, prompt],
        config=types.GenerateContentConfig(
            response_modalities=["IMAGE", "TEXT"],
            temperature=0.0
        )
    )
    
    return {
        "annotatedImage": process_api_response(response),
        "annotations": annotations
    }

# Simpler versions of regenerate methods for brevity
async def regenerate_tech_pack_rendering(front_image_data_url: str, back_image_data_url: Optional[str] = None, feedback: Optional[str] = None) -> Dict[str, str]:
    client = get_client(IMAGE_EDITING_MODEL)
    part = data_url_to_part(back_image_data_url if back_image_data_url else front_image_data_url)
    prompt = f"Regenerate photorealistic rendering. Side by side front/back. feedback: {feedback}"
    res = await client.aio.models.generate_content(
        model=IMAGE_EDITING_MODEL,
        contents=[part, types.Part.from_text(prompt)],
        config=types.GenerateContentConfig(response_modalities=["IMAGE", "TEXT"])
    )
    return {"renderingCombined": process_api_response(res)}

async def regenerate_tech_pack_flat(front_image_data_url: str, back_image_data_url: Optional[str] = None, feedback: Optional[str] = None) -> Dict[str, str]:
    client = get_client(IMAGE_EDITING_MODEL)
    part = data_url_to_part(back_image_data_url if back_image_data_url else front_image_data_url)
    prompt = f"Regenerate technical flat. Thin black lines on white. feedback: {feedback}"
    res = await client.aio.models.generate_content(
        model=IMAGE_EDITING_MODEL,
        contents=[part, types.Part.from_text(prompt)],
        config=types.GenerateContentConfig(response_modalities=["IMAGE", "TEXT"])
    )
    return {"flatCombined": process_api_response(res)}

