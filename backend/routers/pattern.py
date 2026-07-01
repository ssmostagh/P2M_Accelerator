from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Any
from services import pattern_service

router = APIRouter()

class ApplyPatternRequest(BaseModel):
    flat_image: Any
    swatch_image: Any
    feedback: Optional[str] = None

@router.post("/apply-pattern")
async def apply_pattern(request: ApplyPatternRequest):
    """Apply a fabric pattern swatch to a technical flat illustration."""
    try:
        return await pattern_service.apply_tech_pack_pattern(
            request.flat_image,
            request.swatch_image,
            request.feedback
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
