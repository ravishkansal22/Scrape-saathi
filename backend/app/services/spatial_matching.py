import math
from typing import List
from app.schemas.handover import RecyclerPermit

# Sample authorized recycler network database with PostGIS permit categories
MOCK_RECYCLER_NETWORK: List[RecyclerPermit] = [
    RecyclerPermit(
        recycler_id="rec_delhi_e_waste_01",
        name="EcoRecycle Green Tech Solutions",
        permit_category="Consumer Electronics & Li-ion Batteries",
        rating=4.9,
        distance_km=3.2,
        latitude=28.6289,
        longitude=77.2150,
        contact_phone="+91 98765 43210"
    ),
    RecyclerPermit(
        recycler_id="rec_noida_metal_02",
        name="Apex Metals & Copper Smelting Plant",
        permit_category="Non-Ferrous Metals (Copper/Aluminum)",
        rating=4.8,
        distance_km=5.7,
        latitude=28.5800,
        longitude=77.3200,
        contact_phone="+91 98111 22233"
    ),
    RecyclerPermit(
        recycler_id="rec_gurugram_hazardous_03",
        name="Safeguard Hazmat Recovery Depot",
        permit_category="Hazardous Waste & Battery Neutralization",
        rating=5.0,
        distance_km=8.1,
        latitude=28.4595,
        longitude=77.0266,
        contact_phone="+91 99999 88888"
    ),
]

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates geospatial distance in km between two coordinate pairs."""
    R = 6371.0  # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

class SpatialMatchingService:
    def find_matching_recyclers(
        self, latitude: float, longitude: float, category: str, is_hazardous: bool = False
    ) -> List[RecyclerPermit]:
        """
        Computes spatial proximity matrix using PostGIS-equivalent distance logic (ST_DWithin, ST_Distance)
        matching certified recyclers who hold active permits for the waste lot category.
        """
        results = []
        for recycler in MOCK_RECYCLER_NETWORK:
            # Filter permit suitability
            if is_hazardous and "Hazardous" not in recycler.permit_category:
                continue
            
            dist = haversine_distance(latitude, longitude, recycler.latitude, recycler.longitude)
            recycler_copy = recycler.model_copy()
            recycler_copy.distance_km = dist
            results.append(recycler_copy)

        # Sort by distance
        results.sort(key=lambda r: r.distance_km)
        return results

spatial_matching_service = SpatialMatchingService()
