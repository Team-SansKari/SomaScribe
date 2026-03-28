from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from typing import Literal
import json

import dspy

from depression_checker import suggest_next_question

load_dotenv()
API_KEY = os.getenv("API_KEY")

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


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}


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
        with open("protocols.json", "r") as f:
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
