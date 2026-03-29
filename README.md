# SomaScribe
<img src="frontend/public/somascribelogo.svg" alt="SomaScribe Logo" width="220" />

**AI-Assisted Somatic Depression Screener for South Asian Communities**

SomaScribe is an AI clinical co-pilot that closes a documented diagnostic gap in primary care: South Asian patients experiencing depression who present exclusively through physical complaints are routinely missed by every standard Western screening instrument ([PHQ-9](https://www.phqscreeners.com/select-screener)), because those tools were built on criteria that do not reflect South Asian presentations of psychological distress.

SomaScribe listens to GP–patient consultation transcripts, extracts somatic complaints using a [DSPy](https://dspy.ai/)-optimised language model pipeline, maps them against the validated four-cluster framework of the [Bradford Somatic Inventory (BSI)](https://pubmed.ncbi.nlm.nih.gov/2036538/), and flags cases where a multi-cluster somatic pattern is detected. When flagged, it surfaces culturally-sensitive follow-up questions derived from the [WHO mhGAP Intervention Guide](https://www.who.int/publications/i/item/9789241549790) to help the GP probe further.

**SomaScribe does not diagnose. It assists the clinician to ask better questions. Final clinical judgement rests entirely with the GP.**

---

## The Problem

A [2025 systematic scoping review in *The British Journal of Psychiatry*](https://www.cambridge.org/core/journals/the-british-journal-of-psychiatry) (NIHR [PAPER Study](https://www.surrey.ac.uk/news/new-study-aims-tackle-antidepressant-treatment-inequalities-south-asian-communities)) found that physical pain was reported in as many studies as anhedonia — one of the two cardinal symptoms clinicians are trained to look for — and that neither physical pain nor heart-related symptoms are captured by [ICD-11](https://icd.who.int/en) diagnostic criteria.

South Asian patients do not merely hide depression; they express it through a different vocabulary: the body. Phrases like *sinking heart*, *heat in the head*, and *burning in the stomach* sit between metaphor and physical sensation. A patient reporting these symptoms alongside daily fatigue and stomach discomfort will score zero on a [PHQ-9](https://www.phqscreeners.com/select-screener) and leave the clinic undetected.

Pakistani women in the UK consult GPs more frequently than White counterparts but are less likely to receive treatment for depression — a gap attributed directly to the limitations of tools built on criteria that do not reflect South Asian presentations.

---
## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ and npm (frontend)
- [Python](https://www.python.org/downloads/) 3.10 or 3.11 (backend)
- [ffmpeg](https://ffmpeg.org/download.html) available in PATH (required for audio transcription)
- A [Gemini API key](https://aistudio.google.com/app/apikey)
- A [Hugging Face token](https://huggingface.co/settings/tokens) (for speaker diarization)
- GPU with [CUDA](https://developer.nvidia.com/cuda-toolkit) recommended ([WhisperX](https://github.com/m-bain/whisperX) transcription is slow on CPU)

### 1. Clone the repository

```bash
git clone https://github.com/your-org/somascribe.git
cd somascribe
```

### 2. Set up the backend

```bash
cd backend
python -m venv .venv

# Activate (macOS/Linux)
source .venv/bin/activate

# Activate (Windows PowerShell)
.\.venv\Scripts\Activate.ps1

pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory:

```env
API_KEY=your_gemini_api_key
HF_TOKEN=your_huggingface_token
```

Start the backend with [Uvicorn](https://www.uvicorn.org/):

```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

Verify it's running:

```bash
curl http://localhost:8000/api/health
# Expected: {"status":"ok"}
```


### 3. Set up the frontend

```bash
cd frontend
npm install
npm run dev
```


---

## Clinical Framework

### Bradford Somatic Inventory (BSI)

SomaScribe uses the [BSI (Mumford et al., 1991)](https://pubmed.ncbi.nlm.nih.gov/2036538/) as its core detection schema — a 44-item instrument developed from psychiatric case notes of South Asian patients, constructed simultaneously in Urdu and English, and validated across clinical sites in the UK, Pakistan, India, and Nepal. Factor analysis yields four principal clusters: **Head, Chest, Abdomen, and Fatigue**, replicated across British, Pakistani, and Turkish populations (75% sensitivity, 75% specificity against [DSM III-R](https://www.psychiatry.org/psychiatrists/practice/dsm)).

Multi-cluster flagging is intentional: a single-system somatic complaint has a higher prior probability of physical aetiology. A diffuse, multi-system pattern across two or more BSI clusters is the clinical hallmark of somatised psychological distress.

### WHO mhGAP

When a multi-cluster pattern triggers an alert, SomaScribe surfaces follow-up questions derived from the [WHO Mental Health Gap Action Programme Intervention Guide (mhGAP-IG)](https://www.who.int/publications/i/item/9789241549790), specifically the **OTH** (Other Significant Emotional or Medically Unexplained Somatic Complaints) and **DEP** (Depression) modules — designed for non-specialist primary care settings and [deployed in over 90 countries](https://www.who.int/teams/mental-health-and-substance-use/treatment-care/mental-health-gap-action-programme).

---

## Technical Architecture

### System Overview

SomaScribe processes a patient consultation transcript through a **three-stage pipeline**: somatic extraction, BSI cluster mapping, and bridge question generation. The pipeline is built on **DSPy** — a declarative framework for *programming*, rather than *prompting*, language models.

```
┌─────────────────────────────────────────────────────────────────┐
│                     SomaScribe Frontend                         │
│                     (React + Vite SPA)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐   ┌───────────────────┐   ┌───────────────┐   │
│  │  Home Screen  │──▶│  Live Session    |──▶│ Post-Session │   │
│  │  (Setup)      │   │  Dashboard       │   │ Summary       │   │
│  └──────────────┘   └───────┬───────────┘   └───────────────┘   │
│                             │                                   │
│                   ┌─────────▼─────────┐                         │
│                   │  Clinical         │                         │
│                   │  Intelligence     │                         │
│                   │  Panel            │                         │
│                   └─────────┬─────────┘                         │
│                             │                                   │
└─────────────────────────────┼───────────────────────────────────┘
                              │ HTTP REST
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   SomaScribe Backend                            │
│                   (FastAPI + DSPy Pipeline)                     │
├─────────────────────────────────────────────────────────────────┤
│  POST /transcribe            – Audio → Text (WhisperX)          │
│  POST /api/analyze-symptoms  – BSI cluster analysis             │
│  POST /api/suggest-next-question – mhGAP bridge questions       │
│  POST /api/get_protocol      – Clinical protocol steps          │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                DSPy Three-Stage Pipeline                        │
├────────────────┬────────────────────┬───────────────────────────┤
│ Stage 1:       │ Stage 2:           │ Stage 3:                  │
│ Somatic        │ BSI Cluster        │ Alert + Bridge            │
│ Extraction     │ Mapping            │ Question Generation       │
│                │                    │                           │
│ transcript →   │ somatic_mention →  │ {clusters, verbatim,      │
│ list[mention]  │ {cluster,          │  mhgap_template} →        │
│                │  confidence,       │ list[bridge_question]     │
│                │  bsi_item_id}      │                           │
└────────────────┴────────────────────┴───────────────────────────┘
```

### DSPy Pipeline

Rather than retrieval-augmented generation (RAG), SomaScribe uses **DSPy** (Declarative Self-improving Python), a Stanford NLP framework that compiles natural-language module signatures into structured pipelines. For SomaScribe, this means:

- **Somatic extraction** is a DSPy Signature: `transcript_text → list[somatic_mention]`
- **BSI cluster mapping** is a second Signature: `somatic_mention → {cluster, confidence, bsi_item_id}`
- **Bridge question generation** is a third Signature: `{triggered_clusters, patient_verbatim, mhgap_template} → list[bridge_question]`

This produces a **transparent, auditable pipeline** — a clinician or regulator can inspect every module, its inputs, and its outputs. There are no black-box embeddings or opaque retrieval steps.

### The Three-Stage Pipeline

| Stage | Function | Details |
|---|---|---|
| **Stage 1: Somatic Extraction** | DSPy NER signature identifies physical complaint spans in free-form transcript text | Returns verbatim phrase and character index. No interpretation at this stage. |
| **Stage 2: BSI Cluster Mapping** | Each extracted mention is mapped to the nearest BSI item across four clusters | Returns cluster assignment (Head, Chest, Abdomen, Fatigue) plus BJPsych 2025 extended signals, with confidence score. |
| **Stage 3: Alert + Bridge Generation** | Cluster scores assessed against flagging rules (no LLM). If threshold met, mhGAP templates passed to DSPy module | Generates culturally-sensitive bridge questions using the patient's own vocabulary. |

### Alert Threshold Logic

The flagging logic is deliberately conservative and transparent:

- **Single-cluster, < 4 items:** No alert. Single-system complaints carry a higher prior probability of physical aetiology.
- **Single-cluster, ≥ 4 items:** Alert. High density in one cluster warrants further enquiry.
- **Multi-cluster (2+ BSI clusters, any count):** Alert. Diffuse multi-system somatic pattern detected — the primary signal SomaScribe is designed to detect.

The system produces a **single alert type** — there is no tiered colour severity. When the alert fires, the GP is shown the flag and bridge questions. **The GP may dismiss any alert at any point; the system never overrides clinical judgement.**

### Data Strategy and Synthetic Dataset

The ideal dataset — unredacted GP consultation transcripts from South Asian patients presenting with somatic symptoms — does not currently exist as a publicly available resource. For the hackathon demonstration, a hybrid data strategy is used:

- **BSI knowledge base:** The 44 BSI items reconstructed from open-access validation studies, encoded as a structured JSON dictionary with example utterances in English and transliterated Urdu/Punjabi.
- **Synthetic transcripts:** 30–50 transcripts generated using a constrained meta-prompt, reserved as a clean demo set.

> **Acknowledgement:** Synthetic data is a demonstration-grade solution, not a production-grade one. Production would require prospective data collection under clinical governance, with proper patient consent and ethical approval.

### Current Model and Self-Hosting

The current implementation uses the **Gemini API** as the underlying language model, accessed through the DSPy LM abstraction layer. For any real-world clinical deployment, all model inference would be **self-hosted** to ensure no patient-identifiable data leaves a controlled clinical environment. DSPy's model-agnostic architecture means the pipeline can be recompiled against a self-hosted **Gemma** or open-weight **Llama** variant without changes to the module logic.

---

## Repository Structure

```
somascribe/
├── frontend/       # React application — GP-facing interface
├── backend/        # FastAPI backend — transcription, analysis, assessment pipeline
└── README.md       
```


## Backend API Summary

Built with [FastAPI](https://fastapi.tiangolo.com/) and served via [Uvicorn](https://www.uvicorn.org/). LLM calls are handled through [DSPy](https://dspy.ai/) backed by the [Gemini API](https://ai.google.dev/).

| Endpoint | Method | Description |
|---|---|---|
| `/transcribe` | POST | Accepts an audio file, converts to 16kHz mono WAV via [ffmpeg](https://ffmpeg.org/), runs [WhisperX](https://github.com/m-bain/whisperX) transcription + alignment + speaker diarization, returns role-labelled conversation |
| `/api/analyze-symptoms` | POST | Accepts a doctor/patient conversation, runs [DSPy](https://dspy.ai/) SymptomAnalyzer to detect [BSI](https://pubmed.ncbi.nlm.nih.gov/2036538/) somatic symptoms, returns cluster aggregation and `possible_depression` heuristic |
| `/api/suggest-next-question` | POST | Accepts assessment number (1–3) and conversation history, uses [DSPy](https://dspy.ai/) + branching logic to suggest the next [mhGAP](https://www.who.int/publications/i/item/9789241549790)-structured question or assessment conclusion |
| `/api/get_protocol` | POST | Returns management steps from `protocols.json` for `PROTOCOL 1` or `BIPOLAR PROTOCOL` |
| `/api/health` | GET | Service health check |

---


## Ethical Boundaries

SomaScribe operates exclusively within the boundary of clinical decision support. It produces no diagnosis, no treatment recommendation, and no referral. The patient is never shown the alert. Alert language avoids psychiatric framing — describing a *multi-system somatic pattern* rather than *possible depression*. Bridge questions use the patient's own physical vocabulary; they do not introduce psychological framing.

For production use, all model inference must be self-hosted and data processing agreements must comply with relevant healthcare data governance frameworks ([NHS Data Security and Protection Toolkit](https://www.dsptoolkit.nhs.uk/), [HIPAA](https://www.hhs.gov/hipaa/index.html), or local equivalent).

---

## Key References

- Mumford et al. (1991). [The Bradford Somatic Inventory](https://pubmed.ncbi.nlm.nih.gov/2036538/). *British Journal of Psychiatry*, 158, 379–386.
- Rickford et al. (2025). [Understanding depression symptom heterogeneity in South Asian minority groups](https://www.cambridge.org/core/journals/the-british-journal-of-psychiatry). *The British Journal of Psychiatry.* NIHR PAPER Study.
- World Health Organization (2023). [mhGAP guideline, Third Edition](https://www.who.int/publications/i/item/9789240084278). Geneva: WHO. (Also: [mhGAP-IG Version 2.0, 2016](https://www.who.int/publications/i/item/9789241549790).)
- Khattab et al. (2024). [DSPy: Compiling Declarative Language Model Calls into Self-Improving Pipelines](https://arxiv.org/abs/2310.03714). *ICLR 2024.* Stanford NLP.
- Mandel et al. (2016). [SMART on FHIR: A standards-based, interoperable apps platform for electronic health records](https://academic.oup.com/jamia/article/23/5/899/2379701). *JAMIA*, 23(5), 899–908.
- Keynejad et al. (2018). [WHO mhGAP Intervention Guide: a systematic review of evidence from low and middle-income countries](https://pubmed.ncbi.nlm.nih.gov/30097460/). *Evidence-Based Mental Health.*

---

## Disclaimer

This system is for structured screening support and workflow assistance. It is not a standalone diagnostic system, not an emergency triage substitute, and not a replacement for trained clinician assessment, local treatment protocols, or immediate safety procedures.

---

## The Team

- Swastik Aryal
- Aashish Adhikari
- Rikesh Panta
