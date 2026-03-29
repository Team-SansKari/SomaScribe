import json
import dspy

# ── Load assessments from JSON ─────────────────────────────────────────────────
with open("utils/assessments.json", "r") as f:
    ASSESSMENTS: dict = json.load(f)


# ── Output schema (for documentation) ─────────────────────────────────────────
# {
#   "next_question"       : str | None   — natural-language question for doctor,
#                                          OR a sentinel string:
#                                            "[BIPOLAR PROTOCOL]"
#                                            "[PROTOCOL 1]"
#   "goto_next_assessment": bool         — True when this assessment is fully resolved
#   "unlikely_depression" : bool         — True when depression ruled out (Assess. 1)
#   "conclusion"          : str | None   — Terminal message when track ends
#                                          (e.g. "DEPRESSION is likely.",
#                                           "No treatment needed for depression.",
#                                           "Do not manage for depression.")
# }

SENTINELS = {"[BIPOLAR PROTOCOL]", "[PROTOCOL 1]"}


# ── Signatures ─────────────────────────────────────────────────────────────────


class Assessment1Signature(dspy.Signature):
    """
    You are a clinical decision-support assistant for a structured depression
    assessment interview.

    ASSESSMENT GUIDE:
    {assessment_guide}

    SEQUENTIAL RULES — follow strictly in order:
    1. Q1 must be resolved before Q2 is considered.
    2. Q2 must be resolved before Q3 is considered.
    3. If ANY question resolves NO → set unlikely_depression=true and stop.
    4. If ALL three questions resolve YES → set goto_next_assessment=true.
    5. If the current question cannot be resolved from the conversation → suggest
       a natural next_question for the doctor to ask.

    OUTPUT — valid JSON only, no prose, no markdown fences:
    {
      "next_question"       : "<doctor question>" | null,
      "goto_next_assessment": true | false,
      "unlikely_depression" : true | false,
      "conclusion"          : "<terminal message>" | null
    }

    Constraints:
    - next_question must be null when goto_next_assessment or unlikely_depression is true.
    - goto_next_assessment and unlikely_depression cannot both be true.
    - Phrase next_question as a doctor would say it — do NOT copy the guide verbatim.
    - conclusion is null unless the assessment terminates with a clinical finding.
    """

    assessment_guide: str = dspy.InputField(desc="Full Assessment 1 guide text.")
    conversation: str = dspy.InputField(desc="Doctor–patient conversation so far.")
    raw_output: str = dspy.OutputField(desc="JSON with the four output keys.")


class Assessment2Signature(dspy.Signature):
    """
    You are a clinical decision-support assistant for a structured depression
    assessment interview.

    ASSESSMENT GUIDE:
    {assessment_guide}

    COMPLEX BRANCHING RULES — follow exactly:

    Q4 (Physical condition):
      - If the conversation has NOT yet explored physical/medical causes →
        suggest the doctor ask about them.
      - If the conversation shows a physical condition WAS identified and the
        doctor has indicated treatment was given (infer from context) →
        ask whether depressive symptoms remain after treatment.
        • If symptoms resolved after treatment → conclusion="No treatment needed
          for depression." stop (goto_next_assessment=false, next_question=null).
        • If symptoms remain → move to Q5.
      - If no physical condition is identified → move to Q5.

    Q5 (History of mania):
      - If YES → set next_question="[BIPOLAR PROTOCOL]" and
        conclusion="DEPRESSIVE EPISODE IN BIPOLAR DISORDER is likely. Proceed to
        Bipolar Protocol." Do NOT proceed to Q6.
      - If NO → move to Q6.

    Q6 (Major loss within 6 months):
      - If NO → conclusion="DEPRESSION is likely." goto_next_assessment=true.
      - If YES → ask follow-up 1:
          "Are any of the following symptoms present? (Suicidal ideation,
           worthlessness, psychotic symptoms, psychomotor slowing)"
        • If YES to follow-up 1 → conclusion="DEPRESSION is likely."
          goto_next_assessment=true.
        • If NO to follow-up 1 → ask follow-up 2:
            "Does the person have a previous history of depression?"
          – If YES → conclusion="DEPRESSION is likely." goto_next_assessment=true.
          – If NO  → conclusion="Do not manage for depression." stop.

    SENTINEL VALUES for next_question (use exact string, all caps in brackets):
      "[BIPOLAR PROTOCOL]" — when Q5 resolves YES.

    OUTPUT — valid JSON only, no prose, no markdown fences:
    {
      "next_question"       : "<doctor question>" | "[BIPOLAR PROTOCOL]" | null,
      "goto_next_assessment": true | false,
      "unlikely_depression" : false,
      "conclusion"          : "<terminal message>" | null
    }

    Constraints:
    - next_question is null when goto_next_assessment=true or a terminal
      conclusion is reached (except for sentinel strings which are set alongside
      a conclusion).
    - unlikely_depression is always false in Assessment 2.
    - Phrase next_question naturally as a doctor would say it (except sentinels).
    - Do NOT skip questions — resolve each in order before moving to the next.
    """

    assessment_guide: str = dspy.InputField(desc="Full Assessment 2 guide text.")
    conversation: str = dspy.InputField(desc="Doctor–patient conversation so far.")
    raw_output: str = dspy.OutputField(desc="JSON with the four output keys.")


class Assessment3Signature(dspy.Signature):
    """
    You are a clinical decision-support assistant for a structured depression
    assessment interview.

    ASSESSMENT GUIDE:
    {assessment_guide}

    OPEN CLINICAL JUDGMENT RULES:

    This assessment has no simple yes/no questions. Your job is to help the
    doctor systematically check for concurrent priority MNS conditions by
    suggesting ONE sub-question at a time in this priority order:

      1. Imminent suicidal ideation (has the patient expressed thoughts of
         self-harm or suicide?)
      2. Specific plan or intent (if ideation confirmed — how concrete is it?)
      3. Substance use (regular alcohol/drug use, recent escalation?)
      4. Other MNS symptoms (hallucinations, severe anxiety, memory problems?)

    BRANCHING:
    - If at ANY point the conversation suggests IMMINENT risk of self-harm or
      suicide → immediately return:
        next_question = "[PROTOCOL 1]"
        conclusion    = "Imminent risk of self-harm identified. Assess and manage
                         suicide risk first before proceeding to Protocol 1."
        goto_next_assessment = false

    - If all four areas above have been adequately explored in the conversation
      AND no imminent risk identified → return:
        next_question        = null
        conclusion           = "No imminent priority MNS conditions identified.
                                Proceed to management Protocol 1 for Depression."
        goto_next_assessment = true

    - Otherwise → suggest the next un-asked sub-question from the priority list
      above (phrase it naturally as a doctor would).

    SENTINEL VALUES for next_question (use exact string):
      "[PROTOCOL 1]" — Any case if the question is already answered.

    OUTPUT — valid JSON only, no prose, no markdown fences:
    {
      "next_question"       : "<doctor question>" | "[PROTOCOL 1]" | null,
      "goto_next_assessment": true | false,
      "unlikely_depression" : false,
      "conclusion"          : "<terminal message>" | null
    }

    Constraints:
    - unlikely_depression is always false in Assessment 3.
    - Ask only ONE sub-question per call.
    - Phrase sub-questions naturally — do not quote the guide verbatim.
    """

    assessment_guide: str = dspy.InputField(desc="Full Assessment 3 guide text.")
    conversation: str = dspy.InputField(desc="Doctor–patient conversation so far.")
    raw_output: str = dspy.OutputField(desc="JSON with the four output keys.")


# ── Predictors (one per assessment) ───────────────────────────────────────────
_predictors = {
    "1": dspy.Predict(Assessment1Signature),
    "2": dspy.Predict(Assessment2Signature),
    "3": dspy.Predict(Assessment3Signature),
}


# ── Helper: build assessment guide string from JSON ───────────────────────────
def _build_assessment_guide(key: str) -> str:
    data = ASSESSMENTS[key]
    return json.dumps(data, indent=2)


# ── Helper: format conversation list → string ─────────────────────────────────
def _format_conversation(conversation: list[dict]) -> str:
    """
    conversation: [{"role": "doctor"/"patient"/"system", "content": "..."}, ...]
    """
    return "\n".join(
        f"{turn['role'].capitalize()}: {turn['content']}" for turn in conversation
    )


# ── Helper: parse and normalise LLM output ────────────────────────────────────
def _parse_output(raw: str) -> dict:
    raw = raw.strip()
    if raw.startswith("```"):
        parts = raw.split("```")
        raw = parts[1] if len(parts) > 1 else raw
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    parsed = json.loads(raw)

    nq = parsed.get("next_question") or None
    # Keep sentinel strings even if they're "truthy non-question" values
    if nq and nq not in SENTINELS and nq.strip() == "":
        nq = None

    return {
        "next_question": nq,
        "goto_next_assessment": bool(parsed.get("goto_next_assessment", False)),
        "unlikely_depression": bool(parsed.get("unlikely_depression", False)),
        "conclusion": parsed.get("conclusion") or None,
    }


# ── Main public function ───────────────────────────────────────────────────────
def suggest_next_question(
    assessment_number: int | str,
    conversation: list[dict],
) -> dict:
    """
    Parameters
    ----------
    assessment_number : int or str
        Which assessment to run (must be a key in assessments.json).
    conversation : list[dict]
        Full conversation so far.
        Each element: {"role": "doctor" | "patient" | "system", "content": "..."}
        Tip: use role="system" to inject treatment outcomes or clinical notes
        that the LLM should treat as established facts, e.g.:
          {"role": "system", "content": "Physical condition treated. Reassessing depressive symptoms."}

    Returns
    -------
    dict with keys:
        next_question        : str | None
            Natural-language question for the doctor to ask next.
            Special sentinel values signal protocol exits:
              "[BIPOLAR PROTOCOL]"  — Assessment 2, Q5 resolved YES
              "[PROTOCOL 1]"        — Assessment 3, imminent self-harm risk identified
        goto_next_assessment : bool
            True when this assessment is fully resolved and the next should begin.
        unlikely_depression  : bool
            True when depression is ruled out (Assessment 1 only).
        conclusion           : str | None
            Terminal clinical finding message when the track ends without
            proceeding to another assessment.
    """
    key = str(assessment_number)
    if key not in ASSESSMENTS:
        raise ValueError(
            f"Assessment '{key}' not found. Available: {list(ASSESSMENTS.keys())}"
        )
    if key not in _predictors:
        raise ValueError(f"No predictor defined for assessment '{key}'.")

    guide = _build_assessment_guide(key)
    convo = _format_conversation(conversation)
    result = _predictors[key](assessment_guide=guide, conversation=convo)

    return _parse_output(result.raw_output)


# ── Quick demo ─────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import dotenv

    api_key = dotenv.get_key(".env", "API_KEY")

    # Configure DSPy with Gemini
    lm = dspy.LM(model="gemini/gemini-2.5-flash", api_key=api_key)
    dspy.configure(lm=lm)

    print("=" * 60)
    print("DEMO: Assessment 2 — Q5 mania branch (should → [BIPOLAR PROTOCOL])")
    print("=" * 60)
    convo_2_bipolar = [
        {
            "role": "doctor",
            "content": "Are there any signs of a physical condition that might explain these symptoms, like thyroid issues or anaemia?",
        },
        {
            "role": "patient",
            "content": "No, my bloods all came back normal last month.",
        },
        {
            "role": "doctor",
            "content": "Have you ever had periods where you felt unusually elated or irritable, needed very little sleep, and were much more active or impulsive than usual?",
        },
        {
            "role": "patient",
            "content": "Yes, actually — a couple of years ago I had about two weeks where I barely slept, was spending money recklessly, and my boss said I was talking so fast nobody could follow me. I was hospitalised briefly.",
        },
    ]
    out = suggest_next_question(2, convo_2_bipolar)
    print(json.dumps(out, indent=2))

    print()
    print("=" * 60)
    print("DEMO: Assessment 2 — Q6 bereavement nested branch")
    print("=" * 60)
    convo_2_grief = [
        {
            "role": "doctor",
            "content": "Any physical conditions or medication side-effects that might explain the mood?",
        },
        {"role": "patient", "content": "No, nothing like that."},
        {
            "role": "doctor",
            "content": "Any history of very high or elevated moods, decreased need for sleep, impulsive behaviour?",
        },
        {"role": "patient", "content": "No, nothing like that either."},
        {
            "role": "doctor",
            "content": "Have you experienced any major losses, like a bereavement, in the last six months?",
        },
        {"role": "patient", "content": "Yes, my father passed away four months ago."},
    ]
    out = suggest_next_question(2, convo_2_grief)
    print(json.dumps(out, indent=2))

    print()
    print("=" * 60)
    print("DEMO: Assessment 3 — imminent self-harm risk (should → [PROTOCOL 1])")
    print("=" * 60)
    convo_3_risk = [
        {
            "role": "doctor",
            "content": "I want to ask you about some other things. Have you had any thoughts of harming yourself or ending your life?",
        },
        {
            "role": "patient",
            "content": "Yes, I think about it every day. I've been saving up my pills.",
        },
    ]
    out = suggest_next_question(3, convo_3_risk)
    print(json.dumps(out, indent=2))

    print()
    print("=" * 60)
    print("DEMO: Assessment 3 — all clear, proceed to Protocol 1")
    print("=" * 60)
    convo_3_clear = [
        {
            "role": "doctor",
            "content": "Have you had any thoughts of harming yourself or ending your life?",
        },
        {"role": "patient", "content": "No, never."},
        {
            "role": "doctor",
            "content": "Are you currently using alcohol or any other substances regularly?",
        },
        {
            "role": "patient",
            "content": "I have the occasional drink but nothing excessive.",
        },
        {
            "role": "doctor",
            "content": "Have you experienced any hallucinations, severe anxiety, or significant memory problems?",
        },
        {"role": "patient", "content": "No, none of those."},
    ]
    out = suggest_next_question(3, convo_3_clear)
    print(json.dumps(out, indent=2))
