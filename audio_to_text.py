import whisperx
import torch


def transcribe_audio_with_speakers(audio_file_path: str) -> str:
    """
    Transcribe audio file to text with speaker labels (doctor and patient).

    Args:
        audio_file_path: Path to the audio file

    Returns:
        Formatted conversation string with doctor and patient labels
    """
    # Load whisperX model
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model = whisperx.load_model("base", device=device, language="en")

    # Transcribe audio
    result = model.transcribe(audio_file_path)

    # Load diarization model
    diarize_model = whisperx.DiarizationPipeline(
        use_auth_token="hf_token", device=device
    )

    # Assign speaker labels
    result = diarize_model(result)

    # Format the output with speaker labels
    conversation = ""

    for segment in result["segments"]:
        speaker = segment.get("speaker", "Unknown")
        text = segment["text"].strip()

        # Map speaker numbers to doctor/patient labels
        # Assuming speaker 0 is doctor and speaker 1 is patient
        # Adjust this logic based on your needs
        if "SPEAKER_00" in speaker or speaker == 0:
            label = "Doctor"
        elif "SPEAKER_01" in speaker or speaker == 1:
            label = "Patient"
        else:
            label = "Doctor" if int(speaker.split("_")[-1]) == 0 else "Patient"

        conversation += f"\n{label}: {text}"

    return conversation.strip()



print(transcribe_audio_with_speakers("videoplayback.m4a"))