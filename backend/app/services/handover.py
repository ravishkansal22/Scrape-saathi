import base64
import hmac
import hashlib
import json
import io
import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional
try:
    import qrcode
except ImportError:
    qrcode = None

from app.config import settings
from app.schemas.triage import WasteCategory, HazardMarkers
from app.schemas.handover import (
    LotStatus,
    UserRole,
    CustodyEvent,
    DigitalWasteLot,
    DigitalWasteLotCreate,
    HandoverQRGenerateResponse,
    QRVerificationResult,
)

# In-memory persistent database of Digital Waste Lots
LOTS_DATABASE: Dict[str, DigitalWasteLot] = {}

def _init_sample_lots():
    if LOTS_DATABASE:
        return
    now = datetime.now(timezone.utc)
    sample_1 = DigitalWasteLot(
        lot_id="LOT-7A9B1C2D",
        creator_id="kabadi_ramesh_01",
        creator_name="Ramesh Kumar (Kabadiwala)",
        creator_role=UserRole.KABADIWALA,
        current_custodian_id="kabadi_ramesh_01",
        current_custodian_name="Ramesh Kumar (Kabadiwala)",
        current_custodian_role=UserRole.KABADIWALA,
        item_title="Dismantled Induction Motors & Copper Stators",
        category=WasteCategory.RECYCLABLE,
        measured_weight_kg=14.5,
        item_count=3,
        condition="Segregated / Clean",
        estimated_reference_value=9850.0,
        hazard_status=HazardMarkers(is_hazardous=False),
        status=LotStatus.CREATED,
        origin_location="Seelampur Scrap Market, New Delhi",
        latitude=28.6692,
        longitude=77.2713,
        photos=["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400"],
        custody_history=[
            CustodyEvent(
                event_id="EVT-001",
                timestamp=now - timedelta(hours=3),
                from_user_id="generator_household_99",
                from_user_role=UserRole.GENERATOR,
                to_user_id="kabadi_ramesh_01",
                to_user_role=UserRole.KABADIWALA,
                action="INITIAL_COLLECTION",
                measured_weight_kg=14.5,
                notes="Collected door-to-door, weighed on digital hanging scale.",
                verification_hash=hashlib.sha256(b"EVT-001-COLLECTION").hexdigest()[:16]
            )
        ],
        created_at=now - timedelta(hours=3),
        updated_at=now - timedelta(hours=3),
    )
    LOTS_DATABASE[sample_1.lot_id] = sample_1

    sample_2 = DigitalWasteLot(
        lot_id="LOT-4E8F2A10",
        creator_id="kabadi_suresh_02",
        creator_name="Suresh Pal (Collector)",
        creator_role=UserRole.KABADIWALA,
        current_custodian_id="vendor_apex_metals_01",
        current_custodian_name="Apex Scrap Traders (Vendor)",
        current_custodian_role=UserRole.VENDOR,
        item_title="Baled PET Plastic Bottles & Polypropylene Cans",
        category=WasteCategory.RECYCLABLE,
        measured_weight_kg=85.0,
        item_count=None,
        condition="Compacted Bales / Dry",
        estimated_reference_value=2890.0,
        hazard_status=HazardMarkers(is_hazardous=False),
        status=LotStatus.RECEIVED,
        origin_location="Noida Sector 63",
        latitude=28.6180,
        longitude=77.3820,
        photos=["https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?w=400"],
        custody_history=[
            CustodyEvent(
                event_id="EVT-002",
                timestamp=now - timedelta(days=1),
                from_user_id="kabadi_suresh_02",
                from_user_role=UserRole.KABADIWALA,
                to_user_id="vendor_apex_metals_01",
                to_user_role=UserRole.VENDOR,
                action="VENDOR_TRANSFER",
                measured_weight_kg=85.0,
                notes="Delivered to Apex warehouse, platform scale verification matched.",
                verification_hash=hashlib.sha256(b"EVT-002-TRANSFER").hexdigest()[:16]
            )
        ],
        created_at=now - timedelta(days=1),
        updated_at=now - timedelta(hours=2),
    )
    LOTS_DATABASE[sample_2.lot_id] = sample_2

_init_sample_lots()

class HandoverService:
    def create_lot(self, req: DigitalWasteLotCreate) -> DigitalWasteLot:
        lot_id = f"LOT-{uuid.uuid4().hex[:8].upper()}"
        now = datetime.now(timezone.utc)

        lot = DigitalWasteLot(
            lot_id=lot_id,
            creator_id=req.creator_id,
            creator_name=req.creator_name,
            creator_role=req.creator_role,
            current_custodian_id=req.creator_id,
            current_custodian_name=req.creator_name,
            current_custodian_role=req.creator_role,
            item_title=req.item_title,
            category=req.category,
            measured_weight_kg=req.measured_weight_kg,
            item_count=req.item_count,
            condition=req.condition,
            estimated_reference_value=0.0,
            hazard_status=req.hazard_status or HazardMarkers(is_hazardous=False),
            status=LotStatus.CREATED,
            origin_location=req.origin_location,
            latitude=req.latitude,
            longitude=req.longitude,
            photos=req.photos,
            custody_history=[
                CustodyEvent(
                    event_id=f"EVT-{uuid.uuid4().hex[:6].upper()}",
                    timestamp=now,
                    from_user_id="origin_generator",
                    from_user_role=UserRole.GENERATOR,
                    to_user_id=req.creator_id,
                    to_user_role=req.creator_role,
                    action="LOT_CREATION",
                    measured_weight_kg=req.measured_weight_kg,
                    notes=req.notes or "Lot created with physical scale measurement.",
                    verification_hash=hashlib.sha256(f"{lot_id}:{now.isoformat()}".encode()).hexdigest()[:16]
                )
            ],
            created_at=now,
            updated_at=now,
        )

        LOTS_DATABASE[lot_id] = lot
        return lot

    def get_all_lots(self) -> List[DigitalWasteLot]:
        return list(LOTS_DATABASE.values())

    def get_lot_by_id(self, lot_id: str) -> Optional[DigitalWasteLot]:
        return LOTS_DATABASE.get(lot_id)

    def generate_handover_qr(self, lot_id: str, sender_id: str, sender_role: UserRole) -> HandoverQRGenerateResponse:
        lot = LOTS_DATABASE.get(lot_id)
        if not lot:
            raise ValueError(f"Lot {lot_id} not found.")

        now = datetime.now(timezone.utc)
        expires_dt = now + timedelta(hours=2)
        nonce = uuid.uuid4().hex[:8]

        payload = {
            "lot_id": lot_id,
            "sender_id": sender_id,
            "sender_role": sender_role.value,
            "category": lot.category.value,
            "weight_kg": lot.measured_weight_kg,
            "exp": expires_dt.isoformat(),
            "nonce": nonce,
        }

        payload_str = json.dumps(payload, sort_keys=True)
        signature = hmac.new(
            settings.SECRET_KEY.encode(), payload_str.encode(), hashlib.sha256
        ).hexdigest()

        token_data = {"p": payload, "s": signature}
        qr_token = base64.b64encode(json.dumps(token_data).encode()).decode()

        # Render QR base64 PNG
        qr_b64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
        if qrcode is not None:
            try:
                qr = qrcode.QRCode(version=1, box_size=8, border=2)
                qr.add_data(qr_token)
                qr.make(fit=True)
                img = qr.make_image(fill_color="#0D9488", back_color="#FFFFFF")
                buf = io.BytesIO()
                img.save(buf, format="PNG")
                qr_b64 = f"data:image/png;base64,{base64.b64encode(buf.getvalue()).decode()}"
            except Exception:
                pass

        verification_url = f"https://scrapsetu.org/verify-lot/{lot_id}?token={qr_token[:16]}"

        return HandoverQRGenerateResponse(
            lot_id=lot_id,
            qr_token=qr_token,
            qr_image_base64=qr_b64,
            verification_url=verification_url,
            expires_at=expires_dt.isoformat(),
        )

    def verify_qr_token(self, qr_token: str) -> QRVerificationResult:
        try:
            raw_bytes = base64.b64decode(qr_token)
            token_data = json.loads(raw_bytes.decode())
            payload = token_data["p"]
            signature = token_data["s"]

            # Verify HMAC signature
            payload_str = json.dumps(payload, sort_keys=True)
            expected_sig = hmac.new(
                settings.SECRET_KEY.encode(), payload_str.encode(), hashlib.sha256
            ).hexdigest()

            if not hmac.compare_digest(signature, expected_sig):
                raise ValueError("Cryptographic QR signature mismatch.")

            exp_time = datetime.fromisoformat(payload["exp"])
            if datetime.now(timezone.utc) > exp_time:
                raise ValueError("QR token has expired (exceeded 2-hour window).")

            lot_id = payload["lot_id"]
            lot = LOTS_DATABASE.get(lot_id)
            if not lot:
                raise ValueError(f"Lot {lot_id} does not exist in ledger.")

            return QRVerificationResult(
                is_valid=True,
                lot_id=lot_id,
                sender_id=payload["sender_id"],
                sender_name=lot.current_custodian_name,
                sender_role=UserRole(payload["sender_role"]),
                item_title=lot.item_title,
                category=lot.category,
                measured_weight_kg=lot.measured_weight_kg,
                item_count=lot.item_count,
                lot_status=lot.status,
                hazard_status=lot.hazard_status,
                verification_time=datetime.now(timezone.utc),
                message="Cryptographic signature verified successfully against ScrapSetu immutable registry.",
            )
        except Exception as e:
            raise ValueError(f"QR Verification Failed: {str(e)}")

handover_service = HandoverService()
