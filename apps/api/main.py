"""
eLoop AI Device Diagnostics API
FastAPI backend for device assessment using multimodal vision models.
"""

import os
import base64
import logging
from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import httpx

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration from environment
VISION_API_URL = os.getenv("VISION_API_URL", "https://api.openai.com/v1/chat/completions")
VISION_API_KEY = os.getenv("VISION_API_KEY", "")
VISION_MODEL = os.getenv("VISION_MODEL", "gpt-4o-mini")
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8000"))

# In-memory sample data (matches frontend samples.ts)
SAMPLES = {
    "iphone": {
        "key": "iphone",
        "name": "iPhone 13 Pro",
        "device": "iPhone 13 Pro (A2636)",
        "condition": "Display shattered",
        "score": 68,
        "reason": "The display is broken, but the logic board still works.",
        "findings": [
            {"name": "Display", "value": "Shattered"},
            {"name": "Logic board", "value": "Functional"},
            {"name": "Battery health", "value": "82%"},
        ],
        "parts": [
            "A15 Bionic Logic Board",
            "12MP Camera System",
            "MagSafe Coil",
            "Taptic Engine",
            "Speakers",
        ],
        "mass": "204 g",
        "massKg": 0.204,
        "co2Kg": 55,
        "materials": [
            {"name": "Steel and aluminium", "share": 38, "fate": "Recover"},
            {"name": "Glass", "share": 24, "fate": "Recover"},
            {"name": "Battery cells", "share": 20, "fate": "Treat"},
            {"name": "Circuit board", "share": 11, "fate": "Recover"},
            {"name": "Copper", "share": 5, "fate": "Recover"},
            {"name": "Rare and precious metals", "share": 2, "fate": "Recover"},
        ],
        "impact": [
            {"label": "Kept out of landfill", "value": "204 g"},
            {"label": "CO2e avoided", "value": "55 kg"},
            {"label": "Device life added", "value": "2 yrs"},
        ],
    },
    "motherboard": {
        "key": "motherboard",
        "name": "ASUS PRIME Z370-A",
        "device": "ASUS PRIME Z370-A (LGA1151)",
        "condition": "2 bad DDR4 slots",
        "score": 55,
        "reason": "It still boots, and many of its parts have life left.",
        "findings": [
            {"name": "POST", "value": "Successful"},
            {"name": "DDR4 slots", "value": "2 bad"},
            {"name": "PCIe x16", "value": "Functional"},
        ],
        "parts": [
            "Intel Z370 Chipset",
            "PCIe 3.0 x16 Slot",
            "M.2 NVMe Slot",
            "Audio CODEC",
            "LAN Controller",
            "USB 3.1 Controller",
        ],
        "mass": "1.1 kg",
        "massKg": 1.1,
        "co2Kg": 28,
        "materials": [
            {"name": "Board laminate", "share": 46, "fate": "Treat"},
            {"name": "Steel", "share": 22, "fate": "Recover"},
            {"name": "Copper", "share": 16, "fate": "Recover"},
            {"name": "Aluminium", "share": 10, "fate": "Recover"},
            {"name": "Plastics", "share": 5, "fate": "Treat"},
            {"name": "Precious metals", "share": 1, "fate": "Recover"},
        ],
        "impact": [
            {"label": "Kept out of landfill", "value": "1.1 kg"},
            {"label": "CO2e avoided", "value": "28 kg"},
            {"label": "Parts back in use", "value": "6"},
        ],
    },
    "battery": {
        "key": "battery",
        "name": 'MacBook Pro 16" Battery',
        "device": 'MacBook Pro 16" (2021) Battery',
        "condition": "68% capacity",
        "score": 42,
        "reason": "This battery is worn, so its materials are best recovered safely.",
        "findings": [
            {"name": "Max capacity", "value": "68%"},
            {"name": "Charge cycles", "value": "847"},
            {"name": "Status", "value": "Service recommended"},
        ],
        "parts": [
            "Battery Cells (recyclable)",
            "BMS Board",
            "Temperature Sensors",
            "Connector Flex",
        ],
        "mass": "420 g",
        "massKg": 0.42,
        "co2Kg": 6,
        "materials": [
            {"name": "Lithium, cobalt and nickel", "share": 34, "fate": "Recover"},
            {"name": "Graphite", "share": 20, "fate": "Recover"},
            {"name": "Aluminium", "share": 14, "fate": "Recover"},
            {"name": "Copper", "share": 12, "fate": "Recover"},
            {"name": "Electrolyte", "share": 12, "fate": "Treat"},
            {"name": "Casing", "share": 8, "fate": "Treat"},
        ],
        "impact": [
            {"label": "Kept out of landfill", "value": "420 g"},
            {"label": "CO2e avoided", "value": "6 kg"},
            {"label": "Materials recovered", "value": "80%"},
        ],
    },
}


def route_for_score(score: int) -> str:
    """Determine the recommended route based on score."""
    if score >= 60:
        return "Repair"
    if score >= 45:
        return "Reuse"
    return "Recycle"


class DiagnoseRequest(BaseModel):
    """Request model for device diagnosis."""
    sample_key: str | None = Field(default=None, description="Pre-defined sample key for testing")
    # For future: photo upload would be handled via multipart/form-data


class DiagnoseResponse(BaseModel):
    """Response model for device diagnosis."""
    key: str
    name: str
    device: str
    condition: str
    score: int
    reason: str
    findings: list[dict[str, str]]
    parts: list[str]
    mass: str
    massKg: float
    co2Kg: int
    materials: list[dict[str, object]]
    impact: list[dict[str, str]]
    route: str
    sample_data: bool = True


class HealthResponse(BaseModel):
    """Health check response."""
    status: str = "ok"
    version: str = "0.1.0"
    vision_configured: bool = False


async def analyze_with_vision(image_base64: str) -> dict:
    """
    Analyze device image using multimodal vision API.
    
    This is a placeholder for the actual vision API integration.
    When VISION_API_KEY is configured, this will call the real API.
    """
    if not VISION_API_KEY:
        logger.warning("VISION_API_KEY not configured, returning sample data")
        return {"error": "Vision API not configured", "fallback": True}

    prompt = """
    You are an expert device repair technician. Analyze this photo of an electronic device and provide:
    1. Device identification (type, model if visible)
    2. Visible damage or wear assessment
    3. Repairability score (0-100)
    4. Recommended route: Repair (60+), Reuse (45-59), Recycle (<45)
    5. Key findings (component: status)
    6. Salvageable parts list
    7. Estimated material composition and mass
    
    Respond in JSON format matching this schema:
    {
        "device": "string",
        "condition": "string", 
        "score": integer,
        "reason": "string",
        "findings": [{"name": "string", "value": "string"}],
        "parts": ["string"],
        "mass": "string",
        "massKg": number,
        "co2Kg": integer,
        "materials": [{"name": "string", "share": number, "fate": "Recover|Treat"}],
        "impact": [{"label": "string", "value": "string"}]
    }
    """

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                VISION_API_URL,
                headers={
                    "Authorization": f"Bearer {VISION_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": VISION_MODEL,
                    "messages": [
                        {"role": "system", "content": prompt},
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": "Analyze this device photo for repair/reuse/recycle assessment."},
                                {
                                    "type": "image_url",
                                    "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"},
                                },
                            ],
                        },
                    ],
                    "max_tokens": 1500,
                    "temperature": 0.2,
                    "response_format": {"type": "json_object"},
                },
            )
            response.raise_for_status()
            data = response.json()
            content = data["choices"][0]["message"]["content"]
            import json
            return json.loads(content)
    except Exception as e:
        logger.error(f"Vision API error: {e}")
        return {"error": str(e), "fallback": True}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    logger.info("Starting eLoop Diagnostics API")
    yield
    logger.info("Shutting down eLoop Diagnostics API")


app = FastAPI(
    title="eLoop Diagnostics API",
    description="AI-powered device triage for repair, reuse, and recycle decisions",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(
        status="ok",
        version="0.1.0",
        vision_configured=bool(VISION_API_KEY),
    )


@app.get("/api/samples")
async def list_samples():
    """List available sample devices for testing."""
    return {
        "samples": [
            {
                "key": key,
                "name": sample["name"],
                "device": sample["device"],
                "condition": sample["condition"],
                "score": sample["score"],
            }
            for key, sample in SAMPLES.items()
        ]
    }


@app.get("/api/samples/{sample_key}")
async def get_sample(sample_key: str):
    """Get a specific sample device by key."""
    if sample_key not in SAMPLES:
        raise HTTPException(status_code=404, detail="Sample not found")
    sample = SAMPLES[sample_key]
    return DiagnoseResponse(**sample, route=route_for_score(sample["score"]))


@app.post("/api/diagnose", response_model=DiagnoseResponse)
async def diagnose_device(
    sample_key: Annotated[str | None, Form()] = None,
    photo: Annotated[UploadFile | None, File()] = None,
):
    """
    Diagnose a device from either a sample key or uploaded photo.
    
    - **sample_key**: Pre-defined sample (iphone, motherboard, battery) for testing
    - **photo**: Upload a device photo for AI analysis (requires VISION_API_KEY)
    """
    # Handle sample key (for testing/development)
    if sample_key:
        if sample_key not in SAMPLES:
            raise HTTPException(status_code=400, detail=f"Unknown sample: {sample_key}")
        sample = SAMPLES[sample_key]
        return DiagnoseResponse(**sample, route=route_for_score(sample["score"]))

    # Handle photo upload (for production AI analysis)
    if photo:
        if not photo.content_type or not photo.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")

        # Read and encode image
        image_bytes = await photo.read()
        if len(image_bytes) > 10 * 1024 * 1024:  # 10 MB limit
            raise HTTPException(status_code=400, detail="Image must be under 10 MB")

        image_base64 = base64.b64encode(image_bytes).decode("utf-8")

        # Analyze with vision API
        result = await analyze_with_vision(image_base64)

        if result.get("fallback") or result.get("error"):
            # Fall back to a random sample if vision fails
            import random
            fallback_key = random.choice(list(SAMPLES.keys()))
            sample = SAMPLES[fallback_key]
            logger.info(f"Falling back to sample: {fallback_key}")
            return DiagnoseResponse(**sample, route=route_for_score(sample["score"]))

        # Use AI analysis result
        return DiagnoseResponse(**result, route=route_for_score(result["score"]), sample_data=False)

    raise HTTPException(status_code=400, detail="Either sample_key or photo must be provided")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=API_HOST, port=API_PORT)