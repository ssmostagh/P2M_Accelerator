from typing import Dict, Any, Optional
from google.genai import types
from services.base_service import get_client, data_url_to_part, process_api_response, IMAGE_EDITING_MODEL

async def apply_tech_pack_pattern(flat_image_data_url: str, swatch_image_data_url: str, feedback: Optional[str] = None) -> Dict[str, Any]:
    """Apply a pattern swatch to a technical flat illustration."""
    model = IMAGE_EDITING_MODEL
    client = get_client(model)
    
    flat_part = data_url_to_part(flat_image_data_url)
    swatch_part = data_url_to_part(swatch_image_data_url)
    
    prompt = """You are an expert fashion designer and technical CAD textile specialist.
Your task is to take the provided technical flat illustration (first image) and seamlessly apply the uploaded fabric pattern swatch (second image) across the garment panels.

CRITICAL REQUIREMENTS:
1. Maintain the exact line art, seams, stitching, and structural details of the original technical flat.
2. Apply the uploaded pattern swatch realistically to the garment pieces. Scale the pattern appropriately so it looks like a realistic textile applied to the flat garment.
3. Keep the background clean white. Do not distort the garment shape or proportions."""

    if feedback:
        prompt += f"\n\nIMPORTANT USER FEEDBACK / ADJUSTMENTS:\n{feedback}\n\nPlease apply this feedback precisely while maintaining all other pattern application standards."

    response = await client.aio.models.generate_content(
        model=model,
        contents=[flat_part, swatch_part, types.Part.from_text(text=prompt)],
        config=types.GenerateContentConfig(
            response_modalities=["IMAGE", "TEXT"],
            temperature=0.2
        )
    )
    
    return {
        "patternedImage": process_api_response(response)
    }
