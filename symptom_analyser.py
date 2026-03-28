import dspy
import dotenv


api_key = dotenv.get_key(".env", "API_KEY")

# Configure DSPy with Gemini
lm = dspy.LM(model="gemini/gemini-2.5-flash", api_key=api_key)
dspy.configure(lm=lm)

symptom_categories = {
    "Severe headaches": "Head",
    "Fluttering or a feeling of something moving in your stomach": "Abdomen",
    "Pain or tension in your neck and shoulders": ["Chest", "Fatigue"],
    "Skin burning or itching all over": "Heat",
    "Feeling of constriction of your head, as if it was being gripped tightly from outside": "Head",
    "Pain in the chest or heart": "Chest",
    "Mouth or throat felt dry": ["Globus", "Panic"],
    "Darkness or mist in front of your eyes": ["Head", "Frequency"],
    "Burning sensation in your stomach": "Abdomen",
    "Lack of energy (weakness) much of the time": "Fatigue",
    "Head felt hot or burning": ["Head", "Heat"],
    "Sweating a lot": "Panic",
    "Pressure or tightness on your chest or heart": "Chest",
    "Ache or discomfort in the abdomen": "Abdomen",
    "Choking sensation in your throat": "Globus",
    "Hands or feet having pins and needles or going numb": ["Fatigue", "Panic"],
    "Aches or pains all over the body": "Fatigue",
    "Feeling of heat inside your body": "Heat",
    "Awareness of palpitations (heart pounding)": ["Chest", "Panic"],
    "Pain or burning in your eyes": "Head",
    "Indigestion": "Abdomen",
    "Trembling or shaking": "Panic",
    "Passing urine more frequently": "Frequency",
    "Low back trouble": "Fatigue",
    "Stomach felt swollen or bloated": "Abdomen",
    "Head felt heavy": "Head",
    "Feeling tired, even when not working": "Fatigue",
    "Pain in your legs": "Fatigue",
    "Feeling sick in the stomach (nausea)": ["Fatigue", "Frequency"],
    "Feeling of pressure inside your head, as if it was going to burst": "Head",
    "Difficulty in breathing, even when resting": ["Chest", "Globus"],
    "Tingling (pins and needles) all over the body": ["Chest", "Frequency", "Panic"],
    "Constipation": "Abdomen",
    "Wanting to open your bowels (go to the toilet) more often than usual": "Frequency",
    "Palms sweating a lot": ["Heat", "Panic"],
    "Difficulty in swallowing, as if there was a lump in your throat": "Globus",
    "Feeling giddy or dizzy": "Head",
    "Bitter taste in your mouth": "Panic",
    "Whole body felt heavy": ["Head", "Fatigue", "Frequency"],
    "Burning sensation when passing urine": "Frequency",
    "Hearing a buzzing noise in your ears or head": ["Head", "Heat"],
    "Heart felt weak or sinking": "Chest",
    "Excessive wind (gas) or belching": "Abdomen",
    "Hands or feet felt cold": "Panic",
    "Difficulty getting full erection": "Uncategorized",
    "Feeling that you have been passing semen in your urine": "Uncategorized",
}


# Define the signature
class SymptomChecker(dspy.Signature):
    """
    You are a medical symptom analyst. Given a doctor-patient conversation,
    determine which symptoms from the provided list are present.
    For each symptom, answer strictly 'yes' or 'no'.
    Also extract the exact phrases or words from the conversation that
    contributed to each 'yes' symptom.
    Return results as Python dicts mapping each symptom string to the appropriate value.
    """

    conversation: str = dspy.InputField(
        desc="The doctor-patient conversation transcript"
    )
    symptoms: list[str] = dspy.InputField(desc="List of symptoms to check for")
    symptom_results: dict = dspy.OutputField(
        desc="Dict mapping each symptom string to 'yes' or 'no'"
    )
    symptom_evidence: list = dspy.OutputField(
        desc="Flat deduplicated list of verbatim phrases from the conversation that support any 'yes' symptom."
    )
    present_count: int = dspy.OutputField(
        desc="Number of symptoms present (answered 'yes')"
    )


class SymptomAnalyzer(dspy.Module):
    def __init__(self):
        self.checker = dspy.Predict(SymptomChecker)

    def forward(self, conversation: str, symptoms: list[str]) -> dspy.Prediction:
        result = self.checker(conversation=conversation, symptoms=symptoms)

        # Normalize yes/no answers
        normalized = {
            symptom: (
                "yes"
                if str(result.symptom_results.get(symptom, "no")).lower().strip()
                == "yes"
                else "no"
            )
            for symptom in symptoms
        }
        count = sum(1 for v in normalized.values() if v == "yes")

        # Normalize evidence safely across possible model output shapes.
        # Preferred format is a flat list, but older prompts may return a symptom->phrases dict.
        raw_evidence = result.symptom_evidence or []
        all_phrases = []
        seen = set()
        if isinstance(raw_evidence, dict):
            for symptom in symptoms:
                if normalized[symptom] != "yes":
                    continue
                phrases = raw_evidence.get(symptom, [])
                if isinstance(phrases, str):
                    phrases = [phrases]
                if not isinstance(phrases, (list, tuple, set)):
                    continue
                for phrase in phrases:
                    phrase = str(phrase).strip()
                    if phrase and phrase not in seen:
                        seen.add(phrase)
                        all_phrases.append(phrase)
        else:
            if isinstance(raw_evidence, str):
                evidence_iter = [raw_evidence]
            elif isinstance(raw_evidence, (list, tuple, set)):
                evidence_iter = raw_evidence
            else:
                evidence_iter = []

            for phrase in evidence_iter:
                phrase = str(phrase).strip()
                if phrase and phrase not in seen:
                    seen.add(phrase)
                    all_phrases.append(phrase)

        return dspy.Prediction(
            symptom_results=normalized,
            symptom_evidence=all_phrases,  # now a flat deduplicated list
            present_count=count,
        )


def _format_conversation(conversation: list[dict]) -> str:
    """
    conversation: [{"role": "doctor"/"patient"/"system", "content": "..."}, ...]
    """
    return "\n".join(
        f"{turn['role'].capitalize()}: {turn['content']}" for turn in conversation
    )


def possible_depression(
    result,
    single_cluster_threshold=4,
    multi_cluster_min_symptoms=1,
    multi_cluster_threshold=2,
):
    category_counts = {}
    for symptom, answer in result.symptom_results.items():
        if answer == "yes":
            categories = symptom_categories[symptom]
            if isinstance(categories, str):
                categories = [categories]
            for category in categories:
                if category != "Uncategorized":
                    category_counts[category] = category_counts.get(category, 0) + 1

    high_single_cluster = any(
        count >= single_cluster_threshold for count in category_counts.values()
    )
    active_clusters = [
        cluster
        for cluster, count in category_counts.items()
        if count >= multi_cluster_min_symptoms
    ]
    high_multi_cluster = len(active_clusters) > multi_cluster_threshold

    return {
        "possible_depression": high_single_cluster or high_multi_cluster,
        "symptom_phrases": result.symptom_evidence,
        "symptoms": [s for s, a in result.symptom_results.items() if a == "yes"],
        "clusters_with_symptoms": active_clusters,
    }


# --- Usage ---

# Option 1: Use the transcribe function with an audio file
# conversation = transcribe_audio_with_speakers("path/to/your/audio.mp3")

# Option 2: Use the hardcoded conversation example
conversation = [
    {
        "role": "doctor",
        "content": "Good morning. How have you been feeling lately?",
    },
    {
        "role": "patient",
        "content": "Not great, honestly. I wake up every morning with a splitting headache that just won't go away. My neck and shoulders are constantly stiff and sore. I feel exhausted all day even when I haven't done anything at all.",
    },
    {
        "role": "doctor",
        "content": "Any chest symptoms?",
    },
    {
        "role": "patient",
        "content": "Yes — my chest feels really tight sometimes, like something is pressing on it. And my heart has been pounding for no reason, which scares me. I also feel dizzy quite often and sometimes the room starts spinning.",
    },
    {
        "role": "doctor",
        "content": "Do you have any headaches?",
    },
    {
        "role": "patient",
        "content": "I don't have regular headaches anymore actually, but the dizziness is really bad.",
    },
    {
        "role": "doctor",
        "content": "How about your digestive system?",
    },
    {
        "role": "patient",
        "content": "My stomach has been bloated a lot. And I keep getting nauseous. I also have this awful bitter taste in my mouth all the time. I feel like there's a lump stuck in my throat when I try to swallow.",
    },
    {
        "role": "doctor",
        "content": "Anything else?",
    },
    {
        "role": "patient",
        "content": "My hands and feet often go numb or get pins and needles. And my whole body just feels so heavy, like I'm carrying a huge weight. I've been sweating a lot too, even when I'm not hot.",
    },
]

symptoms = [
    "Severe headaches",
    "Fluttering or a feeling of something moving in your stomach",
    "Pain or tension in your neck and shoulders",
    "Skin burning or itching all over",
    "Feeling of constriction of your head, as if it was being gripped tightly from outside",
    "Pain in the chest or heart",
    "Mouth or throat felt dry",
    "Darkness or mist in front of your eyes",
    "Burning sensation in your stomach",
    "Lack of energy (weakness) much of the time",
    "Head felt hot or burning",
    "Sweating a lot",
    "Pressure or tightness on your chest or heart",
    "Ache or discomfort in the abdomen",
    "Choking sensation in your throat",
    "Hands or feet having pins and needles or going numb",
    "Aches or pains all over the body",
    "Feeling of heat inside your body",
    "Awareness of palpitations (heart pounding)",
    "Pain or burning in your eyes",
    "Indigestion",
    "Trembling or shaking",
    "Passing urine more frequently",
    "Low back trouble",
    "Stomach felt swollen or bloated",
    "Head felt heavy",
    "Feeling tired, even when not working",
    "Pain in your legs",
    "Feeling sick in the stomach (nausea)",
    "Feeling of pressure inside your head, as if it was going to burst",
    "Difficulty in breathing, even when resting",
    "Tingling (pins and needles) all over the body",
    "Constipation",
    "Wanting to open your bowels (go to the toilet) more often than usual",
    "Palms sweating a lot",
    "Difficulty in swallowing, as if there was a lump in your throat",
    "Feeling giddy or dizzy",
    "Bitter taste in your mouth",
    "Whole body felt heavy",
    "Burning sensation when passing urine",
    "Hearing a buzzing noise in your ears or head",
    "Heart felt weak or sinking",
    "Excessive wind (gas) or belching",
    "Hands or feet felt cold",
    "Difficulty getting full erection",
    "Feeling that you have been passing semen in your urine",
]


if __name__ == "__main__":
    conversation_text = _format_conversation(conversation)
    analyzer = SymptomAnalyzer()
    result = analyzer(conversation=conversation_text, symptoms=symptoms)

    print(possible_depression(result))
