from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class SmartBin(BaseModel):
    bin_id: str
    name: str
    latitude: float
    longitude: float
    capacity_kg: float = 100.0
    current_fill_percentage: float = Field(..., ge=0.0, le=100.0)
    current_weight_kg: float
    is_threshold_breached: bool = False  # True if fill >= 80%
    last_telemetry_time: datetime
    battery_level_pct: float = 95.0
    primary_waste_type: str = "E-Waste / Metal Assemblies"

class CVRPRouteWaypoint(BaseModel):
    step_number: int
    bin_id: str
    bin_name: str
    latitude: float
    longitude: float
    fill_percentage: float
    weight_to_collect_kg: float
    cumulative_vehicle_load_kg: float
    distance_from_prev_km: float

class CVRPRouteResponse(BaseModel):
    vehicle_id: str
    vehicle_capacity_kg: float = 300.0
    total_bins_visited: int
    total_weight_collected_kg: float
    total_distance_km: float
    estimated_duration_minutes: float
    waypoints: List[CVRPRouteWaypoint]
    route_polyline_coords: List[List[float]]  # List of [lat, lng]
