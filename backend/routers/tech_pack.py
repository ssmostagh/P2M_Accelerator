from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Any
from services import tech_pack_service

router = APIRouter()

class AnalyzeSketchRequest(BaseModel):
    sketch_image: Any

class GenerateFlatRequest(BaseModel):
    front_image: Any
    back_image: Optional[Any] = None
    front_includes_back: bool = False
    front_description: Optional[str] = None
    back_description: Optional[str] = None

class GenerateRenderingRequest(BaseModel):
    front_image: Any
    back_image: Optional[Any] = None
    front_includes_back: bool = False
    front_description: Optional[str] = None
    back_description: Optional[str] = None

class GenerateAnnotatedRequest(BaseModel):
    flat_image: Any
    back_image: Optional[Any] = None
    front_includes_back: bool = False
    feedback: Optional[str] = None

class RegenerateRenderingRequest(BaseModel):
    front_image: Any
    back_image: Optional[Any] = None
    feedback: Optional[str] = None

class RegenerateFlatRequest(BaseModel):
    front_image: Any
    back_image: Optional[Any] = None
    feedback: Optional[str] = None

@router.post("/analyze-sketch")
async def analyze_sketch(request: AnalyzeSketchRequest):
    """Analyze a garment design sketch and produce a structured technical description."""
    try:
        return await tech_pack_service.analyze_tech_pack_sketch(request.sketch_image)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-flat")
async def generate_flat(request: GenerateFlatRequest):
    """Generate a side-by-side high-quality technical flat drawing showing front and back."""
    try:
        return await tech_pack_service.generate_tech_pack_flat(
            request.front_image,
            request.back_image,
            request.front_includes_back,
            request.front_description,
            request.back_description
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-rendering")
async def generate_rendering(request: GenerateRenderingRequest):
    """Generate a side-by-side photorealistic ghost mannequin 3D rendering of the garment."""
    try:
        return await tech_pack_service.generate_tech_pack_rendering(
            request.front_image,
            request.back_image,
            request.front_includes_back,
            request.front_description,
            request.back_description
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-annotated")
async def generate_annotated(request: GenerateAnnotatedRequest):
    """Generate manufacturing annotations overlay on top of the technical flat image."""
    try:
        return await tech_pack_service.generate_annotated_tech_pack(
            request.flat_image,
            request.back_image,
            request.front_includes_back,
            request.feedback
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/regenerate-rendering")
async def regenerate_rendering(request: RegenerateRenderingRequest):
    """Regenerate the photorealistic mannequin rendering applying custom feedback."""
    try:
        return await tech_pack_service.regenerate_tech_pack_rendering(
            request.front_image,
            request.back_image,
            request.feedback
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/regenerate-flat")
async def regenerate_flat(request: RegenerateFlatRequest):
    """Regenerate the technical flat drawing applying custom feedback."""
    try:
        return await tech_pack_service.regenerate_tech_pack_flat(
            request.front_image,
            request.back_image,
            request.feedback
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
