# eLoop Diagnostics API

FastAPI backend for AI-powered device triage. Analyzes device photos to recommend Repair, Reuse, or Recycle routes.

## Quick Start

```bash
cd apps/api

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -e ".[dev]"

# Copy environment template and configure
cp .env.example .env
# Edit .env and add your VISION_API_KEY

# Run development server
uvicorn main:app --reload --port 8000
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/samples` | List test samples |
| GET | `/api/samples/{key}` | Get sample by key |
| POST | `/api/diagnose` | Diagnose device (sample or photo) |

## Diagnose Endpoint

### Using a Sample (for testing)
```bash
curl -X POST "http://localhost:8000/api/diagnose" \
  -H "Content-Type: multipart/form-data" \
  -F "sample_key=iphone"
```

### Using a Photo (requires VISION_API_KEY)
```bash
curl -X POST "http://localhost:8000/api/diagnose" \
  -H "Content-Type: multipart/form-data" \
  -F "photo=@device.jpg"
```

## Response Format

```json
{
  "key": "iphone",
  "name": "iPhone 13 Pro",
  "device": "iPhone 13 Pro (A2636)",
  "condition": "Display shattered",
  "score": 68,
  "reason": "The display is broken, but the logic board still works.",
  "findings": [
    {"name": "Display", "value": "Shattered"},
    {"name": "Logic board", "value": "Functional"}
  ],
  "parts": ["A15 Bionic Logic Board", "12MP Camera System"],
  "mass": "204 g",
  "massKg": 0.204,
  "co2Kg": 55,
  "materials": [
    {"name": "Steel and aluminium", "share": 38, "fate": "Recover"}
  ],
  "impact": [
    {"label": "Kept out of landfill", "value": "204 g"}
  ],
  "route": "Repair",
  "sample_data": true
}
```

## Routing Logic

- **Repair** (score ≥ 60): Device is worth fixing
- **Reuse** (score 45-59): Device works but has issues; parts have value
- **Recycle** (score < 45): Best to recover materials

## Vision API Integration

The API supports any OpenAI-compatible vision endpoint:

- **OpenAI GPT-4o-mini** (recommended, free tier available)
- **Ollama** with LLaVA (local, free)
- **Other compatible APIs** (Anthropic, Google, etc.)

Set `VISION_API_URL`, `VISION_API_KEY`, and `VISION_MODEL` in `.env`.

## Development

```bash
# Run tests
pytest

# Lint
ruff check .

# Format
ruff format .

# Type check
mypy .
```