from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Any
from services import studio_service

router = APIRouter()

class GeneratePromptRequest(BaseModel):
    garment_image: Any

class TryOnRequest(BaseModel):
    model_image: Any
    garment_image: Any
    prompt: str

class TryOnVariationsRequest(BaseModel):
    model_image: Any
    garment_image: Any
    prompt: str
    count: int = 4

class EditImageRequest(BaseModel):
    base_image: Any
    prompt: str

class EditVariationsRequest(BaseModel):
    base_image: Any
    prompt: str
    count: int = 3

class VideoVariationsRequest(BaseModel):
    front_image: Any
    count: int = 3

class SelectBestImageRequest(BaseModel):
    images: List[str]
    criteria: str

@router.post("/generate-prompt")
async def generate_prompt(request: GeneratePromptRequest):
    """Analyze a garment image and generate a description prompt."""
    try:
        return await studio_service.generate_prompt(request.garment_image)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/try-on")
async def try_on(request: TryOnRequest):
    """Generate virtual try-on image of garment on a model."""
    try:
        return await studio_service.generate_initial_image(
            request.model_image,
            request.garment_image,
            request.prompt
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/try-on-variations")
async def try_on_variations(request: TryOnVariationsRequest):
    """Generate multiple virtual try-on variations in parallel."""
    try:
        return await studio_service.generate_initial_image_variations(
            request.model_image,
            request.garment_image,
            request.prompt,
            request.count
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/edit")
async def edit_image(request: EditImageRequest):
    """Edit an image using a natural language edit prompt."""
    try:
        return await studio_service.edit_image(request.base_image, request.prompt)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/edit-variations")
async def edit_variations(request: EditVariationsRequest):
    """Generate multiple image edit variations in parallel."""
    try:
        return await studio_service.generate_edit_variations(
            request.base_image,
            request.prompt,
            request.count
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/video-variations")
async def video_variations(request: VideoVariationsRequest):
    """Initiate catwalk-style video generation."""
    try:
        return await studio_service.generate_video_variations(
            request.front_image,
            request.count
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/select-best")
async def select_best(request: SelectBestImageRequest):
    """Automatically evaluate and select the best variation based on design criteria."""
    try:
        return await studio_service.select_best_image(request.images, request.criteria)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
