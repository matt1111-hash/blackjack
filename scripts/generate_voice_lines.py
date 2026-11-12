#!/usr/bin/env python3
"""Az osztó mondatainak hangfájl-generátora (100% self-authored).

Forrás: a gépen telepített espeak-ng szintetizátor (libespeak-ng.so.1, ctypes
elérés) — nincs hálózati hívás, nincs külső asset, a licensz tiszta.
A kimenet: public/sounds/voice/{key}.{lang}.ogg + .mp3

Újragenerálás: python3 scripts/generate_voice_lines.py
(feltétel: libespeak-ng1 + espeak-ng-data + ffmpeg)
"""
import ctypes
import os
import subprocess
import wave
from ctypes import CFUNCTYPE, POINTER, c_char_p, c_int, c_short, c_void_p

PROJECT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(PROJECT, "public", "sounds", "voice")
DATA_DIR = "/usr/lib/x86_64-linux-gnu"  # espeak-ng-data helye

# A mondatoknak a src/logic/dealerLines.ts szövegeivel kell egyezniük.
# (A dealerTotal kimarad: érték-template, a valódi játékmenetben sosem hangzik el.)
LINES = {
    "en": {
        "placeBets": "Place your bets",
        "noMoreBets": "No more bets",
        "insuranceOpen": "Insurance open, pays two to one",
        "blackjackPays": "Blackjack, pays three to two",
        "playerBust": "Too many, bust",
        "dealerBust": "Dealer busts",
        "playerWins": "Player wins",
        "houseWins": "House wins",
        "push": "Push, bet returned",
        "newShoe": "Shuffling a new shoe",
    },
    "hu": {
        "placeBets": "Tegyék meg tétjeiket",
        "noMoreBets": "Nincs több tét",
        "insuranceOpen": "Biztosítás nyitva, fizet két az egyhez",
        "blackjackPays": "Blackjack, fizet három a kettőhöz",
        "playerBust": "Több mint huszonegy, besokallt",
        "dealerBust": "Az osztó besokallt",
        "playerWins": "A játékos nyer",
        "houseWins": "Az osztó nyer",
        "push": "Döntetlen, a tét visszajár",
        "newShoe": "Új paklit keverok",
    },
}

ESPEAK_VOICES = {"en": b"en-us", "hu": b"hu"}

AUDIO_OUTPUT_SYNCHRONOUS = 2
ESPEAKCHARS_AUTO = 0
ESPEAK_RATE = 1
ESPEAK_PITCH = 3


def main() -> None:
    lib = ctypes.CDLL("libespeak-ng.so.1")
    samples: list[int] = []

    Callback = CFUNCTYPE(c_int, POINTER(c_short), c_int, c_void_p)

    @Callback
    def callback(wav, numsamples, _events):
        if wav and numsamples > 0:
            samples.extend(wav[i] for i in range(numsamples))
        return 0

    lib.espeak_Initialize.argtypes = [c_int, c_int, c_char_p, c_int]
    lib.espeak_Initialize.restype = c_int
    lib.espeak_SetSynthCallback.argtypes = [Callback]
    lib.espeak_SetVoiceByName.argtypes = [c_char_p]
    lib.espeak_SetVoiceByName.restype = c_int
    lib.espeak_SetParameter.argtypes = [c_int, c_int, c_int]
    lib.espeak_Synth.argtypes = [c_char_p, ctypes.c_size_t, c_int, c_int, c_int, c_int, c_void_p, c_void_p]
    lib.espeak_Synth.restype = c_int

    sample_rate = lib.espeak_Initialize(AUDIO_OUTPUT_SYNCHRONOUS, 0, DATA_DIR.encode(), 0)
    if sample_rate <= 0:
        raise SystemExit(f"espeak init hiba: {sample_rate} — hiányzik az espeak-ng-data?")
    lib.espeak_SetSynthCallback(callback)

    os.makedirs(OUT_DIR, exist_ok=True)
    written = 0

    for lang, entries in LINES.items():
        if lib.espeak_SetVoiceByName(ESPEAK_VOICES[lang]) != 0:
            print(f"WARN: '{lang}' hang nem található — kihagyva")
            continue
        lib.espeak_SetParameter(ESPEAK_RATE, 158, 0)
        lib.espeak_SetParameter(ESPEAK_PITCH, 44, 0)

        for key, text in entries.items():
            samples.clear()
            status = lib.espeak_Synth(
                text.encode("utf-8"), 0, 0, 0, 0, ESPEAKCHARS_AUTO, None, None
            )
            if status != 0 or not samples:
                print(f"WARN: szintézis sikertelen: {lang}/{key} (status={status}, mintak={len(samples)})")
                continue

            wav_path = f"/tmp/dealer-{key}-{lang}.wav"
            with wave.open(wav_path, "wb") as handle:
                handle.setnchannels(1)
                handle.setsampwidth(2)
                handle.setframerate(sample_rate)
                handle.writeframes((ctypes.c_short * len(samples))(*samples))

            for codec, ext, extra in [
                ("libvorbis", "ogg", ["-qscale:a", "4"]),
                ("libmp3lame", "mp3", ["-b:a", "96k"]),
            ]:
                subprocess.run(
                    ["ffmpeg", "-y", "-loglevel", "error", "-i", wav_path, "-codec:a", codec, *extra,
                     os.path.join(OUT_DIR, f"{key}.{lang}.{ext}")],
                    check=True,
                )
            written += 1

    print(f"OK: {written} mondat × 2 formátum -> {OUT_DIR}")


if __name__ == "__main__":
    main()
