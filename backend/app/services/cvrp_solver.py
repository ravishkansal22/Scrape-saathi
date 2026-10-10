import math
from typing import List
try:
    import numpy as np
    from scipy.spatial.distance import cdist
except ImportError:
    np = None
    cdist = None

from app.schemas.fleet import SmartBin, CVRPRouteResponse, CVRPRouteWaypoint

def haversine_dist(coord1, coord2):
    """Calculates haversine distance in kilometers between two [lat, lng] points."""
    R = 6371.0
    lat1, lon1 = math.radians(coord1[0]), math.radians(coord1[1])
    lat2, lon2 = math.radians(coord2[0]), math.radians(coord2[1])
    dlat, dlon = lat2 - lat1, lon2 - lon1
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

class CVRPSolverService:
    def solve_route(
        self,
        depot_lat: float,
        depot_lng: float,
        breached_bins: List[SmartBin],
        vehicle_capacity_kg: float = 350.0
    ) -> CVRPRouteResponse:
        """
        Solves Capacitated Vehicle Routing Problem (CVRP) for threshold-breached bins.
        Uses nearest-neighbor greedy heuristic with vehicle capacity constraints.
        Returns ordered route waypoints and polyline coordinates.
        """
        if not breached_bins:
            return CVRPRouteResponse(
                vehicle_id="TRUCK-CVRP-01",
                vehicle_capacity_kg=vehicle_capacity_kg,
                total_bins_visited=0,
                total_weight_collected_kg=0.0,
                total_distance_km=0.0,
                estimated_duration_minutes=0.0,
                waypoints=[],
                route_polyline_coords=[[depot_lat, depot_lng]],
            )

        current_loc = [depot_lat, depot_lng]
        unvisited = list(breached_bins)
        waypoints = []
        route_coords = [[depot_lat, depot_lng]]
        
        step = 1
        cum_weight = 0.0
        total_dist = 0.0

        while unvisited:
            # Find nearest bin that fits in remaining vehicle capacity
            best_idx = None
            best_dist = float("inf")

            for i, bin_obj in enumerate(unvisited):
                if cum_weight + bin_obj.current_weight_kg <= vehicle_capacity_kg:
                    d = haversine_dist(current_loc, [bin_obj.latitude, bin_obj.longitude])
                    if d < best_dist:
                        best_dist = d
                        best_idx = i

            # If no remaining bin fits capacity, finish route (or launch next truck)
            if best_idx is None:
                break

            target_bin = unvisited.pop(best_idx)
            cum_weight += target_bin.current_weight_kg
            total_dist += best_dist

            current_loc = [target_bin.latitude, target_bin.longitude]
            route_coords.append(current_loc)

            waypoints.append(
                CVRPRouteWaypoint(
                    step_number=step,
                    bin_id=target_bin.bin_id,
                    bin_name=target_bin.name,
                    latitude=target_bin.latitude,
                    longitude=target_bin.longitude,
                    fill_percentage=target_bin.current_fill_percentage,
                    weight_to_collect_kg=target_bin.current_weight_kg,
                    cumulative_vehicle_load_kg=round(cum_weight, 1),
                    distance_from_prev_km=round(best_dist, 2),
                )
            )
            step += 1

        # Return to depot
        return_dist = haversine_dist(current_loc, [depot_lat, depot_lng])
        total_dist += return_dist
        route_coords.append([depot_lat, depot_lng])

        est_duration = (total_dist / 25.0) * 60.0 + (len(waypoints) * 8)  # 25 km/h avg speed + 8 min handling per bin

        return CVRPRouteResponse(
            vehicle_id="TRUCK-EV-01",
            vehicle_capacity_kg=vehicle_capacity_kg,
            total_bins_visited=len(waypoints),
            total_weight_collected_kg=round(cum_weight, 1),
            total_distance_km=round(total_dist, 2),
            estimated_duration_minutes=round(est_duration, 1),
            waypoints=waypoints,
            route_polyline_coords=route_coords,
        )

cvrp_solver_service = CVRPSolverService()
