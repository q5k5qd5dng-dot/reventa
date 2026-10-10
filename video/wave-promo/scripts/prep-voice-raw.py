#!/usr/bin/env python3
"""Prepara las tomas crudas de la voz «Chatterbox» (original, sintética) para el vídeo.

Las cinco tomas (p1..p5) salen de Chatterbox Multilingual (MIT) con una voz de referencia SINTÉTICA propia (una toma de su voz por defecto, sin
nada de ninguna persona real), español en p1–p4 y language_id='en' para «Wave.» (p5) con la misma voz. Este paso, previo a make-voice.py:
  · p1: ajuste de duración con rubberband (tempo 0.958) para que ocupe su hueco (solo candidato "cb-b").
  · p3: sube el final (entonación de frase que continúa) con Praat/Manipulation: +2.5 semitonos sobre la última sílaba (solo "cb-b").
  · p5: opcionalmente refuerza la /v/ final de «Wave» (--lift-p5 DB; por defecto NO: con +5 dB sonaba a «Waves» bajo la música).
  · --trim: recorta silencios (cabeza 40 ms, cola 50 ms; «Wave.» 60 ms) y normaliza el RMS de la parte hablada a −20 dBFS SIN ecualizar
    (las tomas «cb-c» llegan crudas de Chatterbox; el único tratamiento de tono/ecualización es el de make-voice.py).
  · --clean DB: limpieza armónica (por defecto −6 dB): en los tramos con voz, atenúa DB dB lo que hay ENTRE los armónicos (máscara en peine siguiendo la F0
    de Praat, hasta 5.5 kHz); sube la relación armónicos/ruido ≈ +1.5 dB (menos «soplo») sin tocar las consonantes sordas ni la F0.
  · --rise-p1 ST: igual que p3 pero sobre la última sílaba de p1 (frase que continúa).
  · --tempo-p5 X: cambia la duración de «Wave.» con rubberband (X<1 = más lenta).
Uso: python prep-voice-raw.py <carpeta con p1..p5.wav> <carpeta de salida (assets/audio/raw-xx)> [--clean [DB]] [--trim] [--rise-p1 ST] [--rise-p3] [--stretch-p1 0.958] [--tempo-p5 X] [--lift-p5 DB]
(necesita numpy, scipy, praat-parselmouth, ffmpeg)
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

def comb_clean(x, sr, floor_db=-6.0, fmax=5500.0, rel_w=0.22, n_fft=2048):
    """Máscara en peine: en fotogramas con F0 mantiene ±22 % de F0 alrededor de cada armónico y atenúa floor_db el resto (hasta fmax)."""
    import scipy.signal as sg
    hop = n_fft // 4
    pitch = parselmouth.Sound(x, sr).to_pitch_ac(time_step=hop / sr, pitch_floor=120, pitch_ceiling=420, voicing_threshold=0.45)
    f0s, ts = pitch.selected_array["frequency"], pitch.xs()
    freqs, t_, Z = sg.stft(x, sr, nperseg=n_fft, noverlap=n_fft - hop, window="hann")
    f0i = np.interp(t_, ts, f0s, left=0, right=0)
    floor = 10 ** (floor_db / 20)
    out = Z.copy()
    for i in range(Z.shape[1]):
        f0 = f0i[i]
        if f0 < 100: continue
        g = np.full(len(freqs), floor)
        w = max(rel_w * f0, 28.0)
        for h in range(1, int(fmax / f0) + 2):
            c = h * f0
            idx = np.abs(freqs - c) < w
            g[idx] = np.maximum(g[idx], floor + (1 - floor) * 0.5 * (1 + np.cos(np.pi * np.abs(freqs[idx] - c) / w)))
        hi = freqs > fmax * 0.8
        g[hi] = np.maximum(g[hi], np.clip((freqs[hi] - fmax * 0.8) / (fmax * 0.2), 0, 1))
        out[:, i] = Z[:, i] * g
    _, y = sg.istft(out, sr, nperseg=n_fft, noverlap=n_fft - hop, window="hann")
    return y[:len(x)]

def trim_norm(x, sr, tail_ms=50, head_ms=40, target_db=-20.0, thr_db=-42.0, gap_ms=120):
    """Recorta cabeza/cola de silencio y lleva el RMS de los fotogramas con voz a target_db (dBFS). Sin EQ ni compresión."""
    h = int(sr * 0.01); n = len(x) // h
    r = 20 * np.log10(np.array([np.sqrt(np.mean(x[i * h:(i + 1) * h] ** 2)) for i in range(n)]) + 1e-6)
    st = int(np.argmax(r > -35)); end = n; run = 0
    for i in range(st + 30, n):
        run = run + 1 if r[i] < thr_db else 0
        if run >= gap_ms // 10: end = i - run + 1; break
    while end > st and r[end - 1] < -38: end -= 1
    a = max(0, st * h - int(sr * head_ms / 1000)); b = min(len(x), end * h + int(sr * tail_ms / 1000))
    y = x[a:b].copy()
    f = int(sr * 0.012); y[:f] *= np.linspace(0, 1, f); g = int(sr * 0.03); y[-g:] *= np.linspace(1, 0, g)
    fr = np.array([np.sqrt(np.mean(y[i * h:(i + 1) * h] ** 2)) for i in range(len(y) // h)])
    act = fr[fr > 0.1 * fr.max()]
    y *= 10 ** (target_db / 20) / np.sqrt(np.mean(act ** 2))
    pk = np.abs(y).max()
    return y * min(1.0, 0.89 / pk)

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
    tempo5 = float(sys.argv[sys.argv.index("--tempo-p5") + 1]) if "--tempo-p5" in sys.argv else None
    do_trim = "--trim" in sys.argv
    rise1 = float(sys.argv[sys.argv.index("--rise-p1") + 1]) if "--rise-p1" in sys.argv else None
    clean = None
    if "--clean" in sys.argv:
        k = sys.argv.index("--clean") + 1
        clean = float(sys.argv[k]) if k < len(sys.argv) and not sys.argv[k].startswith("--") else -6.0
    import os; os.makedirs(dst, exist_ok=True)
    for i in range(1, 6):
        x, sr = read(f"{src}/p{i}.wav")
        if clean is not None and i != 5: x = comb_clean(x, sr, floor_db=clean)
        if do_trim: x = trim_norm(x, sr, tail_ms=60 if i == 5 else 50)
        if i == 1 and tempo: x = stretch(x, sr, tempo)
        if i == 5 and tempo5: x = stretch(x, sr, tempo5)
        if i == 1 and rise1: x = tail_rise(x, sr, rise_st=rise1)
        if i == 3 and rise: x = tail_rise(x, sr)
        if i == 5 and lift: x = lift_tail(x, sr, db=lift)
        write(f"{dst}/vo-{i}-raw.wav", x, sr)
        print(f"vo-{i}", round(len(x) / sr, 3), "s", sr, "Hz")
