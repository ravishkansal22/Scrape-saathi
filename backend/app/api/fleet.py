from typing import List
from fastapi import APIRouter
from app.schemas.fleet import SmartBin, CVRPRouteResponse
from app.services.mock_fleet_daemon import fleet_simulator
from app.services.cvrp_solver import cvrp_solver_service

router = APIRouter(prefix="/api/v1/fleet", tags=["Smart Bin Fleet & Route Optimization"])

@router.get("/bins", response_model=List[SmartBin])
def get_all_smart_bins():
    """Retrieves current telemetry state for all 20 virtual smart aggregation bins."""
    return fleet_simulator.get_all_bins()

@router.post("/simulate-tick", response_model=List[SmartBin])
def simulate_fleet_telemetry_tick():
    """Triggers simulated deposition events, weight accumulation, and threshold breach checks."""
    return fleet_simulator.simulate_telemetry_tick()

@router.post("/optimize-route", response_model=CVRPRouteResponse)
def solve_cvrp_collection_route(
    depot_lat: float = 28.6139,
    depot_lng: float = 77.2090,
    vehicle_capacity_kg: float = 350.0
):
    """
    Executes Capacitated Vehicle Routing Problem (CVRP) solver for all threshold-breached (>= 80% fill) bins.
    Outputs turn-by-turn waypoint polyline and collection metrics.
    """
    breached = fleet_simulator.get_breached_bins()
    return cvrp_solver_service.solve_route(depot_lat, depot_lng, breached, vehicle_capacity_kg)
