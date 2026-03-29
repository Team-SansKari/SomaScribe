from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from typing import Literal
import json
import whisperx
from whisperx.diarize import DiarizationPipeline
import torch
import dspy
import subprocess
import tempfile

from utils.depression_checker import suggest_next_question
from utils.symptom_analyser import (
    SymptomAnalyzer,
    _format_conversation,
    possible_depression,
    symptoms,
)

load_dotenv()
API_KEY = os.getenv("API_KEY")
HF_TOKEN = os.getenv("HF_TOKEN")

if API_KEY:
    lm = dspy.LM(model="gemini/gemini-2.5-flash", api_key=API_KEY)
    dspy.configure(lm=lm)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
device = "cuda" if torch.cuda.is_available() else "cpu"
compute_type = "float16" if device == "cuda" else "int8"

model = whisperx.load_model("medium", device, compute_type=compute_type)
align_model, metadata = whisperx.load_align_model(language_code="en", device=device)
diarize_model = DiarizationPipeline(use_auth_token=HF_TOKEN, device=device)
print("Models ready.")


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}


def convert_to_wav(input_path: str, output_path: str):
    """Convert any audio format (webm, ogg, mp4) to wav using ffmpeg"""
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-i",
            input_path,
            "-ar",
            "16000",  # 16kHz — what Whisper expects
            "-ac",
            "1",  # mono
            "-f",
            "wav",
            output_path,
        ],
        check=True,
        capture_output=True,
    )


def build_transcript(result: dict) -> list[dict]:
    segments = result["segments"]

    # Find which speaker label appears first chronologically
    first_speaker = next(
        (seg.get("speaker") for seg in segments if seg.get("speaker")), None
    )

    conversation = []
    current_speaker = None
    buffer = []

    for seg in segments:
        speaker = seg.get("speaker", "UNKNOWN")
        text = seg["text"].strip()

        if speaker != current_speaker:
            if buffer and current_speaker:
                conversation.append(
                    {
                        "role": "doctor"
                        if current_speaker == first_speaker
                        else "patient",
                        "content": " ".join(buffer),
                    }
                )
            current_speaker = speaker
            buffer = [text]
        else:
            buffer.append(text)

    if buffer and current_speaker:
        conversation.append(
            {
                "role": "doctor" if current_speaker == first_speaker else "patient",
                "content": " ".join(buffer),
            }
        )

    return conversation


@app.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)):
    """
      Output Example : {
        "conversation": [
            {
            "role": "doctor",
            "content": "I don't know where the question, I don't know where the song is."
            },
            {
            "role": "patient",
            "content": "Can I ask you a question, the first one? Right, what is the worst thing about being young?"
            },
            {
            "role": "doctor",
            "content": "Well, you get lots of homework. It's also pretty, they're like in the middle, like in school, like in the middle of bad and good. No. What is the worst thing about being old?"
            },
            {
            "role": "patient",
            "content": "Not being able to do things that you could do when you were young."
            },
        ]
    }
    """

    # Validate file type
    if not audio.content_type.startswith("audio/"):
        raise HTTPException(400, "File must be audio")

    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            # Save uploaded file
            raw_path = os.path.join(
                tmpdir, f"recording{os.path.splitext(audio.filename or '.webm')[1]}"
            )
            wav_path = os.path.join(tmpdir, "audio.wav")

            with open(raw_path, "wb") as f:
                f.write(await audio.read())

            # Convert to wav
            convert_to_wav(raw_path, wav_path)

            # WhisperX pipeline
            audio_data = whisperx.load_audio(wav_path)

            result = model.transcribe(audio_data, batch_size=16)
            result = whisperx.align(
                result["segments"], align_model, metadata, audio_data, device
            )

            diarize_segments = diarize_model(wav_path, min_speakers=2, max_speakers=2)
            result = whisperx.assign_word_speakers(diarize_segments, result)

            conversation = build_transcript(result)

            return {"conversation": conversation}

    except subprocess.CalledProcessError:
        raise HTTPException(500, "Audio conversion failed — is ffmpeg installed?")
    except Exception as e:
        raise HTTPException(500, str(e))


class AnalyzeSymptomsRequest(BaseModel):
    conversation: (
        list  # List of {"role": "doctor"/"patient"/"system", "content": "..."})
    )


@app.post("/api/analyze-symptoms")
def analyze_symptoms(payload: AnalyzeSymptomsRequest):
    """
    Input Example : {
      "conversation": [
            {
                "role": "doctor",
                "content": "Have you had any thoughts of harming yourself or ending your life?"
            },
            {"role": "patient", "content": "No, never."},
            {
                "role": "doctor",
                "content": "Are you currently using alcohol or any other substances regularly?"
            },
            {"role": "patient", "content": "I have the occasional drink but nothing excessive."},
            {
                "role": "doctor",
                "content": "Have you experienced any hallucinations, severe anxiety, or significant memory problems?"
            },
            {"role": "patient", "content": "No, none of those."}
        ]
    }

    Output Example : {
    "result": {'possible_depression': True, 'symptom_phrases': ['splitting headache', 'My neck and shoulders are constantly stiff and sore.', 'my chest feels really tight', "I feel exhausted all day even when I haven't done anything at all.", "I've been sweating a lot", 'My stomach has been bloated a lot.', 'My hands and feet often go numb or get pins and needles.', 'my heart has been pounding', 'I keep getting nauseous.', "I feel like there's a lump stuck in my throat when I try to swallow.", 'I also feel dizzy quite often', 'sometimes the room starts spinning.', 'this awful bitter taste in my mouth all the time.', 'my whole body just feels so heavy'], 'symptoms': ['Severe headaches', 'Pain or tension in your neck and shoulders', 'Pain in the chest or heart', 'Lack of energy (weakness) much of the time', 'Sweating a lot', 'Pressure or tightness on your chest or heart', 'Ache or discomfort in the abdomen', 'Hands or feet having pins and needles or going numb', 'Awareness of palpitations (heart pounding)', 'Indigestion', 'Stomach felt swollen or bloated', 'Feeling tired, even when not working', 'Feeling sick in the stomach (nausea)', 'Difficulty in swallowing, as if there was a lump in your throat', 'Feeling giddy or dizzy', 'Bitter taste in your mouth', 'Whole body felt heavy'], 'clusters_with_symptoms': ['Head', 'Chest', 'Fatigue', 'Panic', 'Abdomen', 'Frequency', 'Globus']}
    }
    """

    try:
        conversation_text = _format_conversation(payload.conversation)
        analyzer = SymptomAnalyzer()
        result = analyzer(conversation=conversation_text, symptoms=symptoms)

        return {"result": possible_depression(result)}

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze symptoms: {exc}",
        ) from exc


class SuggestNextQuestionRequest(BaseModel):
    assessment_number: int | str
    conversation: (
        list  # List of {"role": "doctor"/"patient"/"system", "content": "..."}
    )


class GetProtocolRequest(BaseModel):
    protocol_name: Literal["PROTOCOL 1", "BIPOLAR PROTOCOL"]


@app.post("/api/suggest-next-question")
async def run_suggest_next_question(payload: SuggestNextQuestionRequest):
    """
    Input Example : {
      "assessment_number": 1 OR 2 OR 3,
      "conversation": [
            {
                "role": "doctor",
                "content": "Have you had any thoughts of harming yourself or ending your life?"
            },
            {"role": "patient", "content": "No, never."},
            {
                "role": "doctor",
                "content": "Are you currently using alcohol or any other substances regularly?"
            },
            {
                "role": "patient",
                "content": "I have the occasional drink but nothing excessive."
            },
            {
                "role": "doctor",
                "content": "Have you experienced any hallucinations, severe anxiety, or significant memory problems?"
            },
            {"role": "patient", "content": "No, none of those."}
        ]
    }

    Output Example : {
        "result": {
        "next_question": "Have you thought about how you might act on these thoughts, or if you have a plan?",
        "goto_next_assessment": false,
        "unlikely_depression": false,
        "conclusion": null
        }
    }

    """

    if not API_KEY:
        raise HTTPException(
            status_code=500,
            detail="Missing API_KEY in environment variables.",
        )

    try:
        result = suggest_next_question(
            assessment_number=payload.assessment_number,
            conversation=payload.conversation,
        )

        return {"result": result}

    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate next question: {exc}",
        ) from exc


@app.post("/api/get_protocol")
async def get_protocol(payload: GetProtocolRequest):
    """

    Input Example :
    {"protocol_name": "PROTOCOL 1" OR "BIPOLAR PROTOCOL"}

    Output Example : {
    "BIPOLAR PROTOCOL": [
        "Consult a specialist",
        "If a specialist is not immediately available, follow the treatment for depression (Protocol 1)",
        "NEVER prescribe antidepressants alone without a mood stabilizer (such as lithium, carbamazepine, or valproate) because antidepressants can lead to mania in people with bipolar disorder",
        "If symptoms of mania develop, tell the person and their carers to stop the antidepressant immediately and return for help"
    ]
    }

    """

    try:
        with open("utils/protocols.json", "r") as f:
            protocols = json.load(f)

        protocol_steps = protocols.get(payload.protocol_name)
        if not protocol_steps:
            raise ValueError(f"Protocol '{payload.protocol_name}' not found.")

        return {payload.protocol_name: protocol_steps}

    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve protocol: {exc}",
        ) from exc
