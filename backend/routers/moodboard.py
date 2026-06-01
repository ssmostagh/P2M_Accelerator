from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from services import moodboard_service

router = APIRouter()

class ColorPaletteRequest(BaseModel):
    title: str
    keywords: str

class MoodboardImageRequest(BaseModel):
    prompt: str
    aspect_ratio: str = "1:1"

class RegenerateColorRequest(BaseModel):
    current_color_name: str
    theme_prompt: str
    direction: Optional[str] = None

class RewritePromptRequest(BaseModel):
    original_prompt: str

@router.post("/color-palette")
async def generate_color_palette(request: ColorPaletteRequest):
    """Generate a matching Pantone color palette for a given theme and keywords."""
    try:
        return await moodboard_service.generate_color_palette(request.title, request.keywords)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/moodboard-image")
async def generate_moodboard_image(request: MoodboardImageRequest):
    """Generate an inspirational high-quality image for the moodboard."""
    try:
        return await moodboard_service.generate_moodboard_image(request.prompt, request.aspect_ratio)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/regenerate-color")
async def regenerate_color(request: RegenerateColorRequest):
    """Regenerate a single color card in a specific shade direction or theme context."""
    try:
        return await moodboard_service.regenerate_color(
            request.current_color_name,
            request.theme_prompt,
            request.direction
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/rewrite-prompt")
async def rewrite_prompt(request: RewritePromptRequest):
    """Rewrite a prompt to enhance quality and aesthetic detail for GenAI."""
    try:
        return await moodboard_service.rewrite_prompt(request.original_prompt)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
