#!/usr/bin/env python3
"""Az osztó angol mondatai neurális hangon (Piper, offline).

Az espeak-ng géphang helyett emberszerű, nyugodt osztó-hang. Minden mondatból
több felvétel készül (take), enyhén eltérő tempóval és kiejtés-szórással, így az
ismétlődő mondatok (pl. „Place your bets”) nem ugyanúgy szólnak minden körben.

Hangmodell: en_US-joe-medium (rhasspy/piper-voices) — a tanítóadat licence CC0,
így a generált hangfájlok szabadon terjeszthetők. A modell NEM kerül a repóba.

Előfeltétel (egyszeri):
    python3 -m venv .venv-voice && .venv-voice/bin/pip install piper-tts
    curl -L -o en_US-joe-medium.onnx \\
      https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/joe/medium/en_US-joe-medium.onnx
    curl -L -o en_US-joe-medium.onnx.json \\
      https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/joe/medium/en_US-joe-medium.onnx.json

Futtatás:
    .venv-voice/bin/python scripts/generate_voice_lines_neural.py en_US-joe-medium.onnx

Kimenet: public/sounds/voice/{key}.en.{take}.ogg + .mp3 (take = 1..TAKES)
"""
from __future__ import annotations

import os
import subprocess
import sys
import tempfile
import wave
from dataclasses import dataclass

from piper import PiperVoice, SynthesisConfig

PROJECT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(PROJECT, "public", "sounds", "voice")

# A mondatoknak a src/logic/dealerLines.ts angol szövegeivel kell egyezniük;
# az írásjel itt a hanglejtést formálja (vessző = rövid szünet).
LINES: dict[str, str] = {
    "placeBets": "Place your bets, please.",
    "noMoreBets": "No more bets.",
    "insuranceOpen": "Insurance is open. Pays two to one.",
    "blackjackPays": "Blackjack! Pays three to two.",
    "playerBust": "Too many. Bust.",
    "dealerBust": "Dealer busts.",
    "playerWins": "Player wins.",
    "houseWins": "House wins.",
    "push": "Push. Bet returned.",
    "newShoe": "Shuffling a new shoe.",
}


@dataclass(frozen=True)
class Take:
    """Egy felvétel paraméterei: tempó (length_scale) és kiejtés-szórás."""

    length_scale: float
    noise_scale: float
    noise_w_scale: float


# Három felvétel: nyugodt, alap, kicsit élénkebb — a valós osztó sem robot.
TAKES: tuple[Take, ...] = (
    Take(length_scale=1.08, noise_scale=0.62, noise_w_scale=0.75),
    Take(length_scale=1.0, noise_scale=0.667, noise_w_scale=0.8),
    Take(length_scale=0.95, noise_scale=0.7, noise_w_scale=0.85),
)

# Halk zaj alatti mélyvágás, enyhe „asztal-mikrofon” EQ, egységes hangosság.
FFMPEG_FILTER = (
    "highpass=f=90,"
    "equalizer=f=3200:t=q:w=1.2:g=2.5,"
    "afade=t=in:d=0.02,"
    "loudnorm=I=-18:TP=-2:LRA=7"
)


def synthesize(voice: PiperVoice, text: str, take: Take, wav_path: str) -> None:
    """Egy mondat → WAV a megadott felvétel-paraméterekkel."""
    config = SynthesisConfig(
        length_scale=take.length_scale,
        noise_scale=take.noise_scale,
        noise_w_scale=take.noise_w_scale,
    )
    with wave.open(wav_path, "wb") as wav_file:
        voice.synthesize_wav(text, wav_file, syn_config=config)


def encode(wav_path: str, base: str) -> None:
    """WAV → ogg (Chromium/Firefox) + mp3 (Safari/iOS) ugyanazzal a láncot."""
    for ext, codec in (("ogg", ["-c:a", "libvorbis", "-q:a", "5"]), ("mp3", ["-c:a", "libmp3lame", "-b:a", "96k"])):
        subprocess.run(
            ["ffmpeg", "-loglevel", "error", "-y", "-i", wav_path, "-af", FFMPEG_FILTER, *codec, f"{base}.{ext}"],
            check=True,
        )


def main(model_path: str) -> int:
    """Az összes mondat összes felvételének legenerálása."""
    voice = PiperVoice.load(model_path)
    os.makedirs(OUT_DIR, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        for key, text in LINES.items():
            for index, take in enumerate(TAKES, start=1):
                wav_path = os.path.join(tmp, f"{key}.{index}.wav")
                synthesize(voice, text, take, wav_path)
                encode(wav_path, os.path.join(OUT_DIR, f"{key}.en.{index}"))
                print(f"ok  {key}.en.{index}")
    return 0


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("usage: generate_voice_lines_neural.py <path/to/voice.onnx>", file=sys.stderr)
        sys.exit(2)
    sys.exit(main(sys.argv[1]))
