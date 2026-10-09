#!/usr/bin/env python3
"""Prepara las tomas crudas de la voz «Chatterbox» (original, sintética) para el vídeo.

Las cinco tomas (p1..p5) salen de Chatterbox Multilingual (MIT) con una voz de referencia SINTÉTICA propia (una toma de su voz por defecto, sin
nada de ninguna persona real), español en p1–p4 y language_id='en' para «Wave.» (p5) con la misma voz. Este paso, previo a make-voice.py:
  · p1: ajuste de duración con rubberband (tempo 0.958) para que ocupe su hueco (solo candidato "cb-b").
  · p3: sube el final (entonación de frase que continúa) con Praat/Manipulation: +2.5 semitonos sobre la última sílaba (solo "cb-b").
  · p5: opcionalmente refuerza la /v/ final de «Wave» (--lift-p5 DB; por defecto NO: con +5 dB sonaba a «Waves» bajo la música).
Uso: python prep-voice-raw.py <carpeta con p1..p5.wav> <carpeta de salida (assets/audio/raw-xx)> [--rise-p3] [--stretch-p1 0.958] [--lift-p5 DB]
(necesita numpy, praat-parselmouth, ffmpeg)
"""
import sys, subprocess, wave
import numpy as np
import parselmouth
from parselmouth.praat import call

def read(path):
    w = wave.open(path); sr = w.getframerate()
    x = np.frombuffer(w.readframes(w.getnframes()), dtype="<i2").astype(np.float64) / 32768.0
    if w.getnchannels() > 1: x = x.reshape(-1, w.getnchannels()).mean(1)
    return x, sr

def write(path, x, sr):
    with wave.open(path, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
        w.writeframes(np.clip(x * 32767, -32768, 32767).astype("<i2").tobytes())

def stretch(x, sr, tempo):
    out = subprocess.run(["ffmpeg", "-v", "error", "-f", "f32le", "-ar", str(sr), "-ac", "1", "-i", "-", "-af", f"rubberband=tempo={tempo}:pitchq=quality",
                          "-f", "f32le", "-ar", str(sr), "-ac", "1", "-"], input=x.astype("<f4").tobytes(), check=True, capture_output=True).stdout
    return np.frombuffer(out, dtype="<f4").astype(np.float64)

def tail_rise(x, sr, rise_st=2.5, tail_len=0.16, ramp=0.10, min_run=0.08):
    snd = parselmouth.Sound(x, sr)
    man = call(snd, "To Manipulation", 0.01, 75, 450)
    pt = call(man, "Extract pitch tier")
    times = np.array([call(pt, "Get time from index", i) for i in range(1, call(pt, "Get number of points") + 1)])
    runs = [[times[0], times[0]]]
    for t in times[1:]:
        if t - runs[-1][1] <= 0.035: runs[-1][1] = t
        else: runs.append([t, t])
    r0, r1 = [r for r in runs if r[1] - r[0] >= min_run][-1]
    t0 = max(r0, r1 - tail_len)
    f0 = call(pt, "Get value at time", t0)
    for i in range(call(pt, "Get number of points"), 0, -1):
        if call(pt, "Get time from index", i) > t0: call(pt, "Remove point", i)
    for t in np.arange(t0 + 0.01, r1 + 0.0001, 0.01):
        u = min(1, (t - t0) / ramp); s = u * u * (3 - 2 * u)
        call(pt, "Add point", float(t), float(f0 * 2 ** (rise_st * s / 12)))
    call([pt, man], "Replace pitch tier")
    return call(man, "Get resynthesis (overlap-add)").values[0].astype(np.float64)

def lift_tail(x, sr, db=5.0, dur=0.11):
    n = int(dur * sr); g = np.ones(len(x)); g[-n:] = 10 ** (db * np.linspace(0, 1, n) ** 1.5 / 20)
    y = x * g
    pk = np.abs(y).max()
    return y / pk * min(pk, 0.97)

if __name__ == "__main__":
    src, dst = sys.argv[1], sys.argv[2]
    rise = "--rise-p3" in sys.argv
    lift = float(sys.argv[sys.argv.index("--lift-p5") + 1]) if "--lift-p5" in sys.argv else 0.0
    tempo = float(sys.argv[sys.argv.index("--stretch-p1") + 1]) if "--stretch-p1" in sys.argv else None
    import os; os.makedirs(dst, exist_ok=True)
    for i in range(1, 6):
        x, sr = read(f"{src}/p{i}.wav")
        if i == 1 and tempo: x = stretch(x, sr, tempo)
        if i == 3 and rise: x = tail_rise(x, sr)
        if i == 5 and lift: x = lift_tail(x, sr, db=lift)
        write(f"{dst}/vo-{i}-raw.wav", x, sr)
        print(f"vo-{i}", round(len(x) / sr, 3), "s", sr, "Hz")
