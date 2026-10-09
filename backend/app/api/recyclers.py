from typing import List
from fastapi import APIRouter
from app.schemas.handover import RecyclerPermit
from app.services.spatial_matching import spatial_matching_service

router = APIRouter(prefix="/api/v1/recyclers", tags=["Authorized Recyclers & PostGIS"])

@router.get("/match", response_model=List[RecyclerPermit])
def match_authorized_recyclers(
    lat: float = 28.6139,
    lng: float = 77.2090,
    category: str = "E-Waste / Metals",
    is_hazardous: bool = False
):
    """
    Computes spatial proximity matrix (PostGIS ST_DWithin / ST_Distance)
    matching certified recyclers holding active regulatory permits.
    """
    return spatial_matching_service.find_matching_recyclers(lat, lng, category, is_hazardous)
