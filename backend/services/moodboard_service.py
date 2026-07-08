from typing import List, Dict, Any, Optional
from google.genai import types
from services.base_service import get_client, process_api_response
from constants.pantone_colors import (
    PANTONE_COLORS, get_complementary_pantone_colors, get_random_pantone_colors
)

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
    model = 'gemini-3.1-flash-lite-image'
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
            brightness = (r * 299 + r * 587 + b * 114) / 1000
            
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
