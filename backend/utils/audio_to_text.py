device = "cuda" if torch.cuda.is_available() else "cpu"
compute_type = "float16" if device == "cuda" else "int8"

print(f"Loading models on {device}...")
model = whisperx.load_model("large-v3", device, compute_type=compute_type)
align_model, metadata = whisperx.load_align_model(language_code="en", device=device)
diarize_model = whisperx.DiarizationPipeline(
    use_auth_token=os.environ["HF_TOKEN"], device=device
)
print("Models ready.")


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
    transcript = []
    current_speaker = None
    buffer = []

    for seg in result["segments"]:
        speaker = seg.get("speaker", "UNKNOWN")
        text = seg["text"].strip()

        if speaker != current_speaker:
            if buffer and current_speaker:
                transcript.append(
                    {
                        "speaker": current_speaker,
                        "label": "Doctor"
                        if current_speaker == "SPEAKER_00"
                        else "Patient",
                        "text": " ".join(buffer),
                    }
                )
            current_speaker = speaker
            buffer = [text]
        else:
            buffer.append(text)

    if buffer and current_speaker:
        transcript.append(
            {
                "speaker": current_speaker,
                "label": "Doctor" if current_speaker == "SPEAKER_00" else "Patient",
                "text": " ".join(buffer),
            }
        )

    return transcript


@app.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)):
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

            transcript = build_transcript(result)

            return {"transcript": transcript, "status": "ok"}

    except subprocess.CalledProcessError:
        raise HTTPException(500, "Audio conversion failed — is ffmpeg installed?")
    except Exception as e:
        raise HTTPException(500, str(e))
