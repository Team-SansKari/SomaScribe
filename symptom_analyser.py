import dspy
import dotenv


api_key = dotenv.get_key(".env", "API_KEY")

# Configure DSPy with Gemini
lm = dspy.LM(model="gemini/gemini-2.5-flash", api_key=api_key)
dspy.configure(lm=lm)


# Define the signature
class SymptomChecker(dspy.Signature):
    """
    You are a medical symptom analyst. Given a doctor-patient conversation,
    determine which symptoms from the provided list are present.
    For each symptom, answer strictly 'yes' or 'no'.
    Return results as a Python dict mapping each symptom to 'yes' or 'no'.
    """

    conversation: str = dspy.InputField(
        desc="The doctor-patient conversation transcript"
    )
    symptoms: list[str] = dspy.InputField(desc="List of symptoms to check for")
    symptom_results: dict = dspy.OutputField(
        desc="Dict mapping each symptom string to 'yes' or 'no'"
    )
    present_count: int = dspy.OutputField(
        desc="Number of symptoms present (answered 'yes')"
    )


# Build the module
class SymptomAnalyzer(dspy.Module):
    def __init__(self):
        self.checker = dspy.Predict(SymptomChecker)

    def forward(self, conversation: str, symptoms: list[str]) -> dspy.Prediction:
        result = self.checker(conversation=conversation, symptoms=symptoms)

        # Normalize and recount to ensure consistency
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

        return dspy.Prediction(symptom_results=normalized, present_count=count)


# --- Usage ---

# Option 1: Use the transcribe function with an audio file
# conversation = transcribe_audio_with_speakers("path/to/your/audio.mp3")

# Option 2: Use the hardcoded conversation example
conversation = """
Doctor: Good morning. How have you been feeling lately?

Patient: Not great, honestly. I wake up every morning with a splitting headache
that just won't go away. My neck and shoulders are constantly stiff and sore.
I feel exhausted all day even when I haven't done anything at all.

Doctor: Any chest symptoms?

Patient: Yes — my chest feels really tight sometimes, like something is pressing
on it. And my heart has been pounding for no reason, which scares me. I also
feel dizzy quite often and sometimes the room starts spinning.

Doctor: Do you have any headaches?

Patient: I don't have regular headaches anymore actually, but the dizziness is
really bad.

Doctor: How about your digestive system?

Patient: My stomach has been bloated a lot. And I keep getting nauseous.
I also have this awful bitter taste in my mouth all the time.
I feel like there's a lump stuck in my throat when I try to swallow.

Doctor: Anything else?

Patient: My hands and feet often go numb or get pins and needles.
And my whole body just feels so heavy, like I'm carrying a huge weight.
I've been sweating a lot too, even when I'm not hot.
"""

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

analyzer = SymptomAnalyzer()
result = analyzer(conversation=conversation, symptoms=symptoms)

print(result.present_count)
