from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict, Field

class Input(BaseModel):
    model_config = ConfigDict(extra='forbid', allow_inf_nan=False, str_strip_whitespace=True)

class Login(Input):
    user: str
    password: str

class LotCreate(Input):
    reported_hazards: dict[str, bool] = Field(default_factory=dict)
    title: str = Field(min_length=2, max_length=200)
    material_id: str
    weight_kg: float = Field(gt=0, le=100000)
    analysis_id: Optional[str] = None
    evidence_id: Optional[str] = None
    location: str = Field(default='Delhi', min_length=1, max_length=200)
    notes: str = Field(default='', max_length=1000)

class Version(Input):
    version: int = Field(ge=1)

class Offer(Version):
    receiver_id: str
    rate: float = Field(gt=0, le=1000000)
    fee: float = Field(default=0, ge=0, le=1000000)

class Receive(Input):
    token: str = Field(max_length=4000)
    measured_weight_kg: float = Field(gt=0, le=100000)
    deduction_kg: float = Field(default=0, ge=0, le=100000)
    notes: str = Field(default='', max_length=1000)

class Payment(Version):
    amount: float = Field(gt=0, le=1000000000)
    method: Literal['CASH', 'UPI', 'BANK']
    reference: str = Field(min_length=1, max_length=150)

class Dispute(Version):
    reason: str = Field(min_length=5, max_length=1000)

class Review(Version):
    approved: bool
    notes: str = Field(min_length=5, max_length=1000)

class Outcome(Version):
    recovered_kg: float = Field(gt=0, le=100000)
    residue_kg: float = Field(ge=0, le=100000)
    method: str = Field(min_length=3, max_length=500)
    evidence_id: str

class Allocation(Input):
    lot_id: str
    version: int = Field(ge=1)
    weight_kg: float = Field(gt=0)

class Merge(Input):
    title: str = Field(min_length=3, max_length=200)
    allocations: list[Allocation] = Field(min_length=1, max_length=10)

class Facility(Input):
    name: str = Field(min_length=3, max_length=200)
    accepted_materials: list[str] = Field(min_length=1, max_length=20)
    offered_rates: dict[str, float] = Field(default_factory=dict)
    minimum_kg: float = Field(default=0, ge=0)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    pickup_available: bool = False
    permit_number: str = Field(default='', max_length=100)
    permit_source: str = Field(default='', max_length=500)
    permit_expires: str = ''

class VerifyFacility(Input):
    verified: bool
    notes: str = Field(min_length=5, max_length=1000)

class Pickup(Input):
    lot_id: str
    buyer_id: str
    requested_window: str = Field(min_length=3, max_length=200)

class PickupUpdate(Input):
    status: Literal['ACCEPTED', 'COMPLETED', 'CANCELLED']

class Price(Input):
    rate: float = Field(gt=0, le=1000000)
    source: str = Field(min_length=5, max_length=500)
    observed_at: str

class EnergyFactor(Input):
    material_id: str
    virgin_kwh_per_kg: float = Field(ge=0, le=100000)
    secondary_kwh_per_kg: float = Field(ge=0, le=100000)
    source: str = Field(min_length=10, max_length=1000)
    geography: str = Field(min_length=2, max_length=100)
    year: int = Field(ge=1990, le=2100)
    boundary: str = Field(min_length=10, max_length=1000)
    uncertainty: str = Field(min_length=5, max_length=500)

class Telemetry(Input):
    bin_id: str = Field(pattern=r'^[A-Za-z0-9_-]{1,60}$')
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    capacity_kg: float = Field(gt=0, le=100000)
    weight_kg: float = Field(ge=0, le=100000)
    fill_pct: float = Field(ge=0, le=100)
    material_id: str
    timestamp: str
    simulated: bool = False

class Route(Input):
    capacity_kg: float = Field(gt=0, le=100000)
    depot_lat: float = Field(default=28.6139, ge=-90, le=90)
    depot_lng: float = Field(default=77.209, ge=-180, le=180)
    vehicle_kwh_per_km: float = Field(default=0.2, gt=0, le=10)
    material_id: str
