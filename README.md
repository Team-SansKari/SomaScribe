# SomaScribe Backend Guide

This fodler contanins backend services for:

- audio transcription + speaker diarization for doctor/patient conversations,
- somatic symptom analysis from conversation text,
- a structured depression assessment question pipeline,
- protocol retrieval for next-step management guidance.

The backend is implemented with FastAPI in `app.py`.

## 1) What Is Running Here

### Core backend flow

1. `POST /transcribe`
	 - Accepts an uploaded audio file.
	 - Converts it to 16kHz mono WAV with `ffmpeg`.
	 - Runs WhisperX transcription + alignment + diarization.
	 - Returns a role-labeled conversation list (doctor/patient).

2. `POST /api/analyze-symptoms`
	 - Accepts a doctor/patient conversation.
	 - Uses `SymptomAnalyzer` (DSPy, currently configured to Gemini API: `gemini/gemini-2.5-flash`) to detect somatic symptoms from the configured symptom list.
	 - Aggregates symptoms into clusters and returns a `possible_depression` heuristic.

3. `POST /api/suggest-next-question`
	 - Accepts an assessment number (`1`, `2`, or `3`) and conversation history.
	 - Uses DSPy signatures + branching logic in `depression_checker.py` (currently backed by Gemini API) to suggest the next interview question or an assessment conclusion.

4. `POST /api/get_protocol`
	 - Returns management steps from `protocols.json` for:
		 - `PROTOCOL 1`
		 - `BIPOLAR PROTOCOL`

5. `GET /api/health`
	 - Basic service health check.

## 2) Research/Clinical Basis

### Somatic symptom analyzer basis (Bradford Somatic Inventory)

The symptom layer in `symptom_analyser.py` is aligned with the Bradford Somatic Inventory (BSI) concept and item style.

- Primary reference:
	- Mumford DB, Bavington JT, Bhatnagar KS, Hussain Y, Mirza S, Naraghi MM.
	- "The Bradford Somatic Inventory. A multi-ethnic inventory of somatic symptoms reported by anxious and depressed patients in Britain and the Indo-Pakistan subcontinent."
	- Br J Psychiatry. 1991;158:379-386.
	- DOI: 10.1192/bjp.158.3.379
	- PubMed: https://pubmed.ncbi.nlm.nih.gov/2036538/

Key points from this paper relevant to this backend:

- BSI was developed as a multi-ethnic somatic symptom inventory linked to anxiety/depression presentations.
- Item development and validation were done across British and Indo-Pakistan contexts.
- The paper reports strong symptom coverage and cross-language/cross-cultural equivalence work.
- Factor-level structure (e.g., head, chest, abdomen, fatigue) is conceptually close to the clustering approach used in this project.

Important note:

- This backend uses BSI-inspired symptom extraction/flagging as decision support, not a formal diagnostic instrument replacement.

### Depression question pipeline basis (WHO mhGAP)

The depression assessment branching in `depression_checker.py` and `assessments.json` is designed around the WHO mhGAP approach for non-specialist settings.

- WHO programme page:
	- https://www.who.int/teams/mental-health-and-substance-use/treatment-care/mental-health-gap-action-programme
- mhGAP Intervention Guide Version 2.0 publication page:
	- https://www.who.int/publications/i/item/9789241549790
- mhGAP guideline (3rd edition, 2023) publication page:
	- https://www.who.int/publications/i/item/9789240084278

How it maps here:

- Assessment 1 checks core depressive features + duration + functional impact.
- Assessment 2 checks alternate explanations (physical conditions, bipolar/mania history, bereavement-related branching).
- Assessment 3 prioritizes concurrent MNS and safety risk exploration before protocol handoff.
- Protocol outputs (`PROTOCOL 1`, `BIPOLAR PROTOCOL`) provide structured next-step guidance.

Important note:

- This is a clinical decision-support workflow inspired by mhGAP structure; it does not replace clinical judgment or local policy/protocol governance.

## 3) Prerequisites

Install these before running:

1. Python 3.10+ (recommended 3.10 or 3.11).
2. `ffmpeg` available in PATH (required for `/transcribe`).
3. A Hugging Face token (for diarization model access).
4. Gemini API key used by DSPy (configured as `API_KEY` in `.env`).
5. Optional but recommended: CUDA-enabled GPU for faster WhisperX.

## 4) Environment Setup

From the project root:

```bash
python -m venv .venv
```

Activate venv:

- Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

- Windows CMD:

```bat
.venv\Scripts\activate.bat
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create `.env` in project root:

```env
API_KEY=your_llm_api_key
HF_TOKEN=your_huggingface_token
```

## 5) Run the Backend

Start FastAPI with Uvicorn:

```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

Health check:

```bash
curl http://localhost:8000/api/health
```

Expected response:

```json
{"status":"ok"}
```

## 6) API Summary

### `POST /transcribe`

- Input: multipart form with `audio` file.
- Output: `{ "conversation": [ { "role": "doctor|patient", "content": "..." } ] }`

### `POST /api/analyze-symptoms`

- Input:

```json
{
	"conversation": [
		{ "role": "doctor", "content": "..." },
		{ "role": "patient", "content": "..." }
	]
}
```

- Output includes:
	- `possible_depression`
	- `symptom_phrases`
	- `symptoms`
	- `clusters_with_symptoms`

### `POST /api/suggest-next-question`

- Input:

```json
{
	"assessment_number": 1,
	"conversation": [
		{ "role": "doctor", "content": "..." },
		{ "role": "patient", "content": "..." }
	]
}
```

- Output includes:
	- `next_question`
	- `goto_next_assessment`
	- `unlikely_depression`
	- `conclusion`

### `POST /api/get_protocol`

- Input:

```json
{
	"protocol_name": "PROTOCOL 1"
}
```

- Output: selected protocol steps from `protocols.json`.

## 7) Operational Notes / Things to Keep in Mind

- `API_KEY` is required for DSPy-powered endpoints (`/api/suggest-next-question`, and symptom analysis path that uses DSPy). DSPy is currently configured to call Gemini (`gemini/gemini-2.5-flash`).
- `HF_TOKEN` is required for diarization in `/transcribe`.
- WhisperX model loading is heavy and happens at startup; first boot can be slow.
- On CPU, transcription/diarization latency can be high.
- Ensure `ffmpeg` is installed and discoverable in PATH, otherwise audio conversion fails.
- CORS is currently open (`allow_origins=["*"]`) in `app.py`; tighten this for production.

## 8) Safety and Clinical Disclaimer

This backend is for structured screening support and workflow assistance. It is not a standalone diagnostic system, not an emergency triage substitute, and not a replacement for trained clinician assessment, local treatment protocols, or immediate safety procedures.
