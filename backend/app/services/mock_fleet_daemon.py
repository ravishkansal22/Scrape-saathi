import random
from datetime import datetime
from typing import List, Dict
from app.schemas.fleet import SmartBin

# Initialize 20 virtual smart aggregation bins across Delhi-NCR coordinates
INITIAL_VIRTUAL_BINS_DATA = [
    {"bin_id": "BIN-001", "name": "Connaught Place Block-A Hub", "lat": 28.6315, "lng": 77.2167, "fill": 84.5, "weight": 82.0},
    {"bin_id": "BIN-002", "name": "Karol Bagh Electronics Market", "lat": 28.6517, "lng": 77.1906, "fill": 91.2, "weight": 94.0},
    {"bin_id": "BIN-003", "name": "Nehru Place IT Hardware Hub", "lat": 28.5494, "lng": 77.2519, "fill": 88.0, "weight": 86.5},
    {"bin_id": "BIN-004", "name": "Lajpat Nagar Central Market", "lat": 28.5677, "lng": 77.2433, "fill": 62.0, "weight": 58.0},
    {"bin_id": "BIN-005", "name": "Okhla Industrial Area Ph-III", "lat": 28.5355, "lng": 77.2711, "fill": 81.0, "weight": 79.5},
    {"bin_id": "BIN-006", "name": "Noida Sector 18 Commercial Belt", "lat": 28.5708, "lng": 77.3261, "fill": 74.0, "weight": 71.0},
    {"bin_id": "BIN-007", "name": "Gurugram Cyber City Phase 2", "lat": 28.4950, "lng": 77.0895, "fill": 85.0, "weight": 83.0},
    {"bin_id": "BIN-008", "name": "Dwarka Sector 10 Metro Corridor", "lat": 28.5810, "lng": 77.0580, "fill": 45.0, "weight": 42.0},
    {"bin_id": "BIN-009", "name": "Rohini Sector 7 Metal Depot", "lat": 28.7041, "lng": 77.1265, "fill": 89.5, "weight": 90.0},
    {"bin_id": "BIN-010", "name": "Chandni Chowk Scrap Yard", "lat": 28.6506, "lng": 77.2303, "fill": 96.0, "weight": 98.0},
    {"bin_id": "BIN-011", "name": "ITO Press Enclave Station", "lat": 28.6271, "lng": 77.2384, "fill": 55.0, "weight": 52.0},
    {"bin_id": "BIN-012", "name": "Pitampura TV Tower Circle", "lat": 28.6987, "lng": 77.1415, "fill": 38.0, "weight": 34.0},
    {"bin_id": "BIN-013", "name": "Saket District Centre", "lat": 28.5284, "lng": 77.2194, "fill": 78.5, "weight": 75.0},
    {"bin_id": "BIN-014", "name": "Janakpuri West Community Center", "lat": 28.6297, "lng": 77.0782, "fill": 82.0, "weight": 80.0},
    {"bin_id": "BIN-015", "name": "Mayur Vihar Phase 1 Market", "lat": 28.6080, "lng": 77.2965, "fill": 50.0, "weight": 47.0},
    {"bin_id": "BIN-016", "name": "Shahdara Grand Trunk Road", "lat": 28.6727, "lng": 77.2882, "fill": 87.0, "weight": 85.0},
    {"bin_id": "BIN-017", "name": "Hauz Khas Village Green Hub", "lat": 28.5494, "lng": 77.2001, "fill": 41.0, "weight": 39.0},
    {"bin_id": "BIN-018", "name": "Aerocity Hospitality District", "lat": 28.5562, "lng": 77.1200, "fill": 69.0, "weight": 65.0},
    {"bin_id": "BIN-019", "name": "Vasant Kunj Auto Scrap Corridor", "lat": 28.5293, "lng": 77.1557, "fill": 83.0, "weight": 81.0},
    {"bin_id": "BIN-020", "name": "Rajouri Garden Ring Road Bin", "lat": 28.6473, "lng": 77.1213, "fill": 58.0, "weight": 54.0},
]

class SmartBinFleetSimulator:
    def __init__(self):
        self.bins: Dict[str, SmartBin] = {}
        self._init_bins()

    def _init_bins(self):
        now = datetime.utcnow()
        for item in INITIAL_VIRTUAL_BINS_DATA:
            b = SmartBin(
                bin_id=item["bin_id"],
                name=item["name"],
                latitude=item["lat"],
                longitude=item["lng"],
                capacity_kg=100.0,
                current_fill_percentage=item["fill"],
                current_weight_kg=item["weight"],
                is_threshold_breached=(item["fill"] >= 80.0),
                last_telemetry_time=now,
                battery_level_pct=round(random.uniform(88.0, 99.0), 1),
                primary_waste_type="E-Waste / Metal Assemblies" if item["fill"] > 70 else "Mixed Recyclables",
            )
            self.bins[b.bin_id] = b

    def get_all_bins(self) -> List[SmartBin]:
        return list(self.bins.values())

    def simulate_telemetry_tick(self) -> List[SmartBin]:
        """
        Simulates sensor drift, garbage deposition events, weight accumulation,
        fill progression, and updates threshold breach status (>= 80%).
        """
        now = datetime.utcnow()
        for b in self.bins.values():
            # Random fill increment (0% to 5%)
            inc = round(random.uniform(0.5, 4.5), 1)
            b.current_fill_percentage = min(100.0, round(b.current_fill_percentage + inc, 1))
            b.current_weight_kg = min(100.0, round(b.current_fill_percentage * 0.95, 1))
            b.is_threshold_breached = (b.current_fill_percentage >= 80.0)
            b.last_telemetry_time = now
            b.battery_level_pct = max(10.0, round(b.battery_level_pct - 0.1, 1))
        return self.get_all_bins()

    def get_breached_bins(self) -> List[SmartBin]:
        return [b for b in self.bins.values() if b.is_threshold_breached]

fleet_simulator = SmartBinFleetSimulator()
