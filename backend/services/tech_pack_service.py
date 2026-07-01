from typing import Dict, Any, Optional
from google.genai import types
from services.base_service import (
    get_client, data_url_to_part, process_api_response,
    IMAGE_EDITING_MODEL, TEXT_VISION_MODEL
)

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

async def generate_tech_pack_flat(front_image_data_url: str, back_image_data_url: Optional[str] = None, front_includes_back: bool = False, front_description: Optional[str] = None, back_description: Optional[str] = None) -> Dict[str, Any]:
    """Generate technical flat showing front and back views side by side."""
    model = IMAGE_EDITING_MODEL
    client = get_client(model)
    
    front_part = data_url_to_part(front_image_data_url)
    back_part = data_url_to_part(back_image_data_url) if back_image_data_url else None
    image_part_for_prompts = back_part if back_part else front_part

    flat_prompt = """Generate ONE technical flat showing BOTH front AND back views side by side. Front on LEFT, back on RIGHT, small gap. Both same size, aligned. 

CRITICAL: This must be a clean technical flat illustration suitable for factory production. ABSOLUTE REQUIREMENTS:
1) ONLY thin black lines/outlines on pure white background - NO GREY TONES WHATSOEVER.
2) ZERO fills, ZERO colors, ZERO shading, ZERO textures, ZERO gradients - everything must be pure white inside except for structural seam lines.
3) Show seam lines, stitching, topstitching, darts, pleats, pockets, and structural garment construction details ONLY as thin black outlines.
4) The garment should be laid completely flat as if viewed from directly above on a table.
5) CRITICAL MANDATE - ZERO FABRIC PATTERNS OR PRINTS: Do NOT transfer, trace, or draw any fabric patterns, prints, plaids, stripes, checks, florals, or surface textiles from the input sketch into the technical flat. The garment panels in the technical flat must be completely blank, clean, and unpatterned.
6) Think of this as a structural technical blueprint/line drawing for manufacturers - like a clean line art coloring book page.
7) NO SOLID BLACK AREAS - if a garment piece is dark in the sketch, show it with outline only.
8) ABSOLUTELY NO HUMAN BODY, NO MANNEQUIN, NO MODEL - show ONLY the garment itself as if it were laying flat on a table with nothing inside it.
9) EXCLUDE ALL STYLING ACCESSORIES: Do not include gloves, jewelry, bags, shoes, hats, scarves, separate belts, or any other accessories - show ONLY the garment being manufactured.
10) ABSOLUTELY NO TEXT, NO LABELS, NO ANNOTATIONS, NO MEASUREMENT LINES, NO DIMENSION ARROWS unless they are part of a graphic/logo on the original sketch. The output must be a clean line drawing of the garment only.
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

async def regenerate_tech_pack_rendering(
    front_image_data_url: str,
    back_image_data_url: Optional[str] = None,
    front_includes_back: bool = False,
    feedback: Optional[str] = None,
    front_description: Optional[str] = None,
    back_description: Optional[str] = None
) -> Dict[str, Any]:
    """Regenerate rendering with feedback."""
    model = IMAGE_EDITING_MODEL
    client = get_client(model)
    
    front_part = data_url_to_part(front_image_data_url)
    back_part = data_url_to_part(back_image_data_url) if back_image_data_url else None
    image_part_for_prompts = back_part if back_part else front_part

    common_rendering_suffix = "Create a photorealistic 3D rendering of the garment displayed on a neutral, ghost mannequin against a clean, light gray studio background. The rendering must look like a high-quality product photograph with realistic fabric texture, accurate drape physics, and professional studio lighting. Use ray-traced rendering techniques for authentic material properties and lighting. Do not include any text or watermarks."
    consistency_requirements = "\n\nCRITICAL CONSISTENCY REQUIREMENTS: The front and back views MUST represent the SAME garment and maintain perfect consistency in: 1) Overall garment length (shoulder to hem must match) 2) Width and silhouette proportions 3) Sleeve length, style, and width 4) Waistline placement and shape 5) Hemline shape and level 6) Design details like pleats, gathers, or ruffles 7) Fabric weight and drape characteristics 8) Construction method and seam placement. The front and back views should look like they could be sewn together to create one cohesive garment."
    feedback_section = f"\n\nIMPORTANT FEEDBACK/CHANGES REQUESTED: {feedback}\n\nPlease incorporate this feedback while maintaining all other aspects of the garment design." if feedback else ""

    combined_context = ""
    if front_description and back_description:
        combined_context = f"\n\nFRONT VIEW ANALYSIS:\n{front_description}\n\nBACK VIEW ANALYSIS:\n{back_description}"
    elif front_description:
        combined_context = f"\n\nGARMENT ANALYSIS:\n{front_description}"

    rendering_combined_prompt = f"Generate ONE image showing BOTH front AND back photorealistic renderings side by side. Front view on LEFT, back view on RIGHT, with small gap. Both same size, aligned. {common_rendering_suffix}{consistency_requirements}{combined_context}{feedback_section}"

    config = types.GenerateContentConfig(response_modalities=["IMAGE", "TEXT"])

    response = await client.aio.models.generate_content(
        model=model,
        contents=[image_part_for_prompts, types.Part.from_text(text=rendering_combined_prompt)],
        config=config
    )
    return {"renderingCombined": process_api_response(response)}

async def regenerate_tech_pack_flat(
    front_image_data_url: str,
    back_image_data_url: Optional[str] = None,
    front_includes_back: bool = False,
    feedback: Optional[str] = None
) -> Dict[str, Any]:
    """Regenerate flat with feedback."""
    model = IMAGE_EDITING_MODEL
    client = get_client(model)
    
    front_part = data_url_to_part(front_image_data_url)
    back_part = data_url_to_part(back_image_data_url) if back_image_data_url else None
    image_part_for_prompts = back_part if back_part else front_part

    common_flat_suffix = "CRITICAL: This must be a clean technical flat illustration suitable for factory production. ABSOLUTE REQUIREMENTS: 1) ONLY thin black lines/outlines on pure white background - NO GREY TONES WHATSOEVER 2) ZERO fills, ZERO colors, ZERO shading, ZERO textures, ZERO gradients - everything must be pure white inside except for structural seam lines 3) Show seam lines, stitching, topstitching, darts, pleats, pockets, and structural garment construction details ONLY as thin black outlines 4) The garment should be laid completely flat as if viewed from directly above on a table 5) CRITICAL MANDATE - ZERO FABRIC PATTERNS OR PRINTS: Do NOT transfer, trace, or draw any fabric patterns, prints, plaids, stripes, checks, florals, or surface textiles from the input sketch into the technical flat. The garment panels in the technical flat must be completely blank, clean, and unpatterned 6) Think of this as a structural technical blueprint/line drawing for manufacturers - like a clean line art coloring book page 7) NO SOLID BLACK AREAS - if a garment piece is dark in the sketch, show it with outline only 8) ABSOLUTELY NO HUMAN BODY, NO MANNEQUIN, NO MODEL - show ONLY the garment itself as if it were laying flat on a table with nothing inside it 9) EXCLUDE ALL STYLING ACCESSORIES: Do not include gloves, jewelry, bags, shoes, hats, scarves, separate belts, or any other accessories - show ONLY the garment being manufactured"
    consistency_requirements = "\n\nCRITICAL CONSISTENCY REQUIREMENTS: The front and back views MUST represent the SAME garment and maintain perfect consistency in: 1) Overall garment length (shoulder to hem must match) 2) Width and silhouette proportions 3) Sleeve length, style, and width 4) Waistline placement and shape 5) Hemline shape and level 6) Design details like pleats, gathers, or ruffles 7) Fabric weight and drape characteristics 8) Construction method and seam placement. The front and back views should look like they could be sewn together to create one cohesive garment."
    feedback_section = f"\n\nIMPORTANT FEEDBACK/CHANGES REQUESTED: {feedback}\n\nPlease incorporate this feedback while maintaining all other technical flat requirements and garment consistency." if feedback else ""

    flat_combined_prompt = f"Generate ONE technical flat showing BOTH front AND back views side by side. Front on LEFT, back on RIGHT. CRITICAL SPACING: Leave significant white space between the two views - the gap should be AT LEAST 20% of the garment width to ensure they are clearly separated and do NOT overlap or touch. Both views must be the same size and perfectly aligned vertically. {common_flat_suffix}{consistency_requirements}{feedback_section}"

    config = types.GenerateContentConfig(response_modalities=["IMAGE", "TEXT"])

    response = await client.aio.models.generate_content(
        model=model,
        contents=[image_part_for_prompts, types.Part.from_text(text=flat_combined_prompt)],
        config=config
    )
    return {"flatCombined": process_api_response(response)}

