#!/usr/bin/env python3
"""Locución de la escena 4 (voz de chica, español) -> assets/audio/vo-1.wav y vo-2.wav

Las tomas crudas (assets/audio/raw/vo-*-raw.wav) salen del TTS local de HyperFrames (Kokoro-82M, voz ef_dora = chica, español):
    pip install kokoro-onnx soundfile        # en un venv; apuntar HYPERFRAMES_PYTHON a ese python
    npx hyperframes tts "Descubre dónde salir," --voice ef_dora --output assets/audio/raw/vo-1-raw.wav
    npx hyperframes tts "y compra tu entrada"   --voice ef_dora --output assets/audio/raw/vo-2-raw.wav
Este script (determinista, solo numpy + ffmpeg) las limpia, las iguala y les da un poco de sala:
resample 48 kHz -> EQ (quita barro, presencia, suaviza sibilantes) -> compresión suave -> reverb de placa corta (≈ 12 % húmedo) ->
stereo, pico a -3 dBFS, fundidos cortos. Los tiempos de colocación (en index.html) son:
    vo-1  start 10.40 s  ("Descubre dónde salir," — la palabra aparece en pantalla a 10.4 s)
    vo-2  start 12.33 s  ("y compra tu entrada"  — la línea 2 entra a 12.35 s, "entrada" se ilumina a 12.85 s)
"""
import subprocess, wave, numpy as np
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "assets/audio/raw"
OUT = ROOT / "assets/audio"
SR = 48000
PEAK = 10 ** (-3.0 / 20)  # -3 dBFS

CHAIN = ",".join([
    "aresample=48000:resampler=soxr",
    "highpass=f=85:poles=2",
    "equalizer=f=230:t=q:w=1.0:g=-2.5",      # barro
    "equalizer=f=3000:t=q:w=0.9:g=2.8",      # presencia / claridad
    "equalizer=f=6800:t=q:w=1.6:g=-2.2",     # sibilantes
    "acompressor=threshold=-24dB:ratio=3:attack=6:release=90:makeup=3",
    "alimiter=limit=0.9:attack=2:release=40",
])


def load(path):
    out = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-af", CHAIN, "-ac", "1", "-f", "f32le", "-ar", str(SR), "-"],
                         check=True, capture_output=True).stdout
    return np.frombuffer(out, dtype="<f4").astype(np.float64)


def plate_ir(seed, rt60=0.85, length=1.1):
    rng = np.random.default_rng(seed)
    n = int(SR * length)
    t = np.arange(n) / SR
    ir = rng.standard_normal(n) * np.exp(-6.9 * t / rt60)
    spec = np.fft.rfft(ir)
    f = np.fft.rfftfreq(n, 1 / SR)
    spec *= 1 / (1 + (f / 5200.0) ** 2)      # oscuro
    spec *= (f / 180.0) ** 2 / (1 + (f / 180.0) ** 2)  # sin graves
    ir = np.fft.irfft(spec, n)
    ir[: int(0.020 * SR)] = 0                 # predelay 20 ms
    return ir / np.sqrt(np.sum(ir ** 2))


def convolve(x, ir):
    n = len(x) + len(ir) - 1
    nfft = 1 << (n - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, nfft) * np.fft.rfft(ir, nfft), nfft)[:n]


def process(name):
    dry = load(RAW / f"{name}-raw.wav")
    tail = int(SR * 1.0)
    dry = np.concatenate([dry, np.zeros(tail)])
    wet_l = convolve(dry, plate_ir(11))[: len(dry)]
    wet_r = convolve(dry, plate_ir(23))[: len(dry)]
    wet_gain = 10 ** (-17 / 20) * np.sqrt(np.mean(dry ** 2) / (np.mean(wet_l ** 2) + 1e-12)) * 3.5
    L = dry + wet_gain * wet_l
    R = dry + wet_gain * wet_r
    y = np.stack([L, R], axis=1)
    fi, fo = int(0.008 * SR), int(0.35 * SR)
    y[:fi] *= np.linspace(0, 1, fi)[:, None]
    y[-fo:] *= np.linspace(1, 0, fo)[:, None]
    y *= PEAK / np.abs(y).max()
    pcm = np.clip(y * 32767, -32768, 32767).astype("<i2")
    with wave.open(str(OUT / f"{name}.wav"), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
    print(name, round(len(y) / SR, 3), "s")


if __name__ == "__main__":
    for n in ("vo-1", "vo-2"):
        process(n)
