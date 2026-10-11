"""Boundary tests use a fake Bedrock client; they never invoke AWS."""
import base64
import io
import json
from unittest.mock import MagicMock

import pytest
from PIL import Image
from botocore.exceptions import ClientError, ReadTimeoutError, NoCredentialsError
from fastapi.testclient import TestClient

from app.main import app
from app.services.ai_triage import ai_triage_service, AITriageService

client = TestClient(app)

@pytest.fixture(autouse=True)
def authenticated_client():
    from app.platform.auth import local_login
    client.headers["Authorization"] = "Bearer " + local_login("collector_demo", "scrapsetu-local")["access_token"]


def photo(image_format="PNG", size=(8, 8)):
    output = io.BytesIO()
    Image.new("RGB", size, "red").save(output, format=image_format)
    return base64.b64encode(output.getvalue()).decode()


def valid_result(**updates):
    result = {
        "item_title": "Metal container", "category": "recyclable", "overall_confidence": 0.9,
        "materials_detected": [{"name": "Metal", "material_type": "Metal", "recyclable": True}],
        "contamination_risk": "Unknown", "recycling_potential": "Provisional",
        "biodegradability_rating": "Non-biodegradable", "recommended_pathway": "Recycler inspection",
        "is_hazardous": False, "battery_damage": False, "chemical_leak": False,
        "pressurized_canister": False, "exposed_wiring": False, "sharp_edges": False,
        "hazard_description": None,
    }
    result.update(updates)
    return result


def response(data=None, text=None, stop="end_turn"):
    return {
        "output": {"message": {"content": [{"text": text if text is not None else json.dumps(data or valid_result())}]}},
        "stopReason": stop, "ResponseMetadata": {"RequestId": "test-request-1"},
    }


@pytest.fixture
def bedrock(monkeypatch):
    mock = MagicMock()
    mock.converse.return_value = response()
    monkeypatch.setattr(ai_triage_service, "bedrock_client", mock)
    return mock


def analyze(**extra):
    return client.post("/api/v1/triage/analyze", json={"image_base64": photo(), **extra})


def test_live_image_uses_actual_format_and_exposes_provenance(bedrock):
    res = analyze()
    assert res.status_code == 200
    data = res.json()
    assert data["analysis_source"] == "bedrock"
    assert data["request_id"] == "test-request-1"
    assert data["latency_ms"] >= 0
    assert data["materials_detected"][0]["purity_grade"] == "Unverified from image"
    args = bedrock.converse.call_args.kwargs
    assert args["messages"][0]["content"][0]["image"]["format"] == "png"
    assert isinstance(args["messages"][0]["content"][0]["image"]["source"]["bytes"], bytes)
    bedrock.invoke_model.assert_not_called()


@pytest.mark.parametrize("error", [
    NoCredentialsError(), ReadTimeoutError(endpoint_url="https://example.invalid"),
    ClientError({"Error": {"Code": "AccessDeniedException", "Message": "PRIVATE_PROVIDER_DETAIL"}}, "Converse"),
    ClientError({"Error": {"Code": "ThrottlingException", "Message": "rate exceeded"}}, "Converse"),
])
def test_provider_failure_never_returns_demo_or_reinvokes(bedrock, error):
    bedrock.converse.side_effect = error
    res = analyze()
    assert res.status_code == 503
    assert "PRIVATE_PROVIDER_DETAIL" not in res.text
    assert "Induction Motor" not in res.text
    bedrock.converse.assert_called_once()
    bedrock.invoke_model.assert_not_called()


@pytest.mark.parametrize("payload", [{}, {"image_url": "https://example.invalid/image.png"},
                                      {"sample_item_id": "electric_motor", "image_base64": "bad"},
                                      {"sample_item_id": "does-not-exist"}])
def test_invalid_source_is_rejected_without_aws(bedrock, payload):
    assert client.post("/api/v1/triage/analyze", json=payload).status_code == 422
    bedrock.converse.assert_not_called()


@pytest.mark.parametrize("image", ["not-base64", base64.b64encode(b"not an image").decode(),
                                  "data:image/svg+xml;base64,PHN2Zz4=", photo(size=(8001, 1)),
                                  base64.b64encode(b"x" * 3_750_001).decode()])
def test_invalid_images_are_rejected_before_inference(bedrock, image):
    assert analyze(image_base64=image).status_code == 422
    bedrock.converse.assert_not_called()


def test_animated_image_rejected(bedrock):
    output = io.BytesIO()
    Image.new("RGB", (8, 8), "red").save(output, format="GIF", save_all=True,
                                           append_images=[Image.new("RGB", (8, 8), "blue")])
    assert analyze(image_base64=base64.b64encode(output.getvalue()).decode()).status_code == 422
    bedrock.converse.assert_not_called()


@pytest.mark.parametrize("patch", [{"is_hazardous": "false"}, {"overall_confidence": 1.2},
                                  {"overall_confidence": float("nan")}, {"category": "invented"},
                                  {"materials_detected": None}, {"battery_damage": None}])
def test_invalid_model_fields_fail_closed(bedrock, patch):
    bedrock.converse.return_value = response(valid_result(**patch))
    assert analyze().status_code == 502
    bedrock.invoke_model.assert_not_called()


@pytest.mark.parametrize("field", ["overall_confidence", "battery_damage", "sharp_edges", "materials_detected"])
def test_required_model_fields_have_no_assumed_defaults(bedrock, field):
    data = valid_result()
    del data[field]
    bedrock.converse.return_value = response(data)
    assert analyze().status_code == 502


@pytest.mark.parametrize("text", ["not json", "[]", "null", "{", '{"category":"recyclable"}'])
def test_malformed_or_incomplete_model_json_returns_502(bedrock, text):
    bedrock.converse.return_value = response(text=text)
    assert analyze().status_code == 502


@pytest.mark.parametrize("stop", ["max_tokens", "guardrail_intervened", "content_filtered", "tool_use", None])
def test_incomplete_or_blocked_response_returns_502(bedrock, stop):
    bedrock.converse.return_value = response(stop=stop)
    assert analyze().status_code == 502


def test_extracts_text_after_nontext_block(bedrock):
    res = response(text="```json\n" + json.dumps(valid_result()) + "\n```")
    res["output"]["message"]["content"].insert(0, {"reasoningContent": {}})
    bedrock.converse.return_value = res
    assert analyze().status_code == 200


@pytest.mark.parametrize("patch", [{"category": "hazardous"}, {"battery_damage": True},
                                  {"chemical_leak": True}, {"pressurized_canister": True},
                                  {"exposed_wiring": True}, {"sharp_edges": True}])
def test_any_hazard_overrides_benign_category_and_storage(bedrock, patch):
    bedrock.converse.return_value = response(valid_result(**patch))
    data = analyze().json()
    assert data["category"] == "hazardous"
    assert data["hazard_analysis"]["is_hazardous"] is True
    assert data["requires_manual_inspection"] is True
    assert data["segregation_guidance"]["compatible_materials"] == []
    assert "inspection" in data["recommended_pathway"].lower()
    assert "sand" not in data["safe_handling_guidance"]


@pytest.mark.parametrize("patch", [{"category": "unknown"}, {"category": "mixed"},
                                  {"overall_confidence": 0.75}, {"materials_detected": []}])
def test_unknown_and_medium_results_require_review_without_copper_prompt(bedrock, patch):
    bedrock.converse.return_value = response(valid_result(**patch))
    data = analyze().json()
    assert data["requires_manual_inspection"] is True
    assert data["clarification_prompt"] is None


def test_collector_hazard_cannot_be_cleared_by_model(bedrock):
    data = analyze(reported_hazards={"chemical_leak": True}).json()
    assert data["hazard_analysis"]["chemical_leak"] is True
    assert data["category"] == "hazardous"
    assert "neutralize" in data["safe_handling_guidance"]


def test_demos_are_explicit_and_do_not_invoke_aws_or_mutate_presets(bedrock):
    first = client.post("/api/v1/triage/analyze", json={
        "sample_item_id": "electric_motor", "reported_hazards": {"battery_damage": True}}).json()
    second = client.post("/api/v1/triage/analyze", json={"sample_item_id": "electric_motor"}).json()
    assert first["requires_manual_inspection"] is True
    assert second["hazard_analysis"]["is_hazardous"] is False
    assert second["analysis_source"] == "demo"
    bedrock.converse.assert_not_called()


def test_arbitrary_clarification_cannot_clear_live_hazards(bedrock):
    res = client.post("/api/v1/triage/clarify", json={
        "item_name": "Unknown hazardous object", "selected_option_id": "pure_copper", "category": "hazardous"})
    assert res.status_code == 422


def test_aws_initialization_is_lazy(monkeypatch):
    factory = MagicMock()
    monkeypatch.setattr("app.services.ai_triage.boto3.client", factory)
    AITriageService()
    factory.assert_not_called()


def test_validation_errors_do_not_echo_uploaded_content(bedrock):
    res = client.post("/api/v1/triage/analyze", json={
        "sample_item_id": "electric_motor", "image_base64": "PRIVATE_IMAGE_CONTENT"})
    assert res.status_code == 422
    assert "PRIVATE_IMAGE_CONTENT" not in res.text


def test_initialization_failure_is_a_service_error(monkeypatch, bedrock):
    monkeypatch.setattr(ai_triage_service, "bedrock_client", None)
    monkeypatch.setattr("app.services.ai_triage.boto3.client", MagicMock(side_effect=NoCredentialsError()))
    assert analyze().status_code == 503


def test_client_has_bounded_sdk_retries_and_timeouts(monkeypatch):
    factory = MagicMock()
    monkeypatch.setattr("app.services.ai_triage.boto3.client", factory)
    service = AITriageService()
    service._client()
    config = factory.call_args.kwargs["config"]
    assert config.retries["total_max_attempts"] == 1
    assert config.connect_timeout == 3
    assert config.read_timeout == 20
