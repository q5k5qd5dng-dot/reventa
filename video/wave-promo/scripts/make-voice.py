#!/usr/bin/env python3
"""Locución del vídeo (voz de chica, español + "Wave" en inglés) -> assets/audio/vo-1..5.wav
y bloque <audio> de index.html (con el ducking de la música y los efectos que sigue a la voz).

Texto y colocación (segundos globales):
    vo-1  4.05   "La app que junta venta de entradas online"        (se abre la app y entran las pantallas de entradas)
    vo-2  7.15   "con red social para los asistentes de las fiestas." (pantallas sociales y experiencias)
    vo-3  10.40  "Descubre dónde salir,"                              (escena de texto, línea 1)
    vo-4  12.33  "y compra tu entrada."                               (escena de texto, línea 2)
    vo-5  14.80  "Wave."                                              (cierre; pronunciación inglesa /weɪv/)

Las tomas crudas (assets/audio/raw/vo-N-raw.wav, 24 kHz mono) se generaron con Kokoro-82M (kokoro-onnx 0.6.1, kokoro-v1.0.onnx +
voices-v1.0.bin; el TTS local de `npx hyperframes tts`) mezclando los vectores de estilo de dos voces femeninas:
    voz = 0.45 · ef_dora + 0.55 · if_sara            (mezcla "brillante": joven, más aguda, F0 mediana ≈ 205 Hz)
con fonemas espeak-ng dados a mano (is_phonemes=True) para que las palabras salgan bien:
    vo-1  "la ˈap ke xˈunta βˈɛnta ðe entɾˈaðas onlˈaɪn"            velocidad 0.81
    vo-2  "kon rˈed soθjˈal pˌaɾa los ˌasistˈɛntes ðe las fjˈestas."  velocidad 0.95
    vo-3  "deskˈuβɾe ðˈonde salˈiɾ,"  (+ subida de la última sílaba, 2.5 semitonos, para que suene a frase que continúa)  velocidad 1.00
    vo-4  "y compra tu entrada." (fonemas espeak es)                   velocidad 1.03
    vo-5  "wˈeɪv."   → /weɪv/ inglés con LA MISMA mezcla de voz        velocidad 0.90
Cada toma se normalizó (−19 dBFS RMS), se recortó (20 ms al inicio, 35 ms al final) y se verificó (ASR faster-whisper: texto exacto;
reconocedores de fonemas: "Wave" termina en /v/). Todas las demás voces probadas (blends ef_dora+ff_siwis / af_aoede, Piper, Chatterbox)
quedaron en scratch; la alternativa recomendada es la mezcla 0.5 ef_dora + 0.5 ff_siwis ("clara").

Este script es determinista (numpy + ffmpeg): limpia cada toma (EQ, compresión suave), le da una sala corta (reverb de placa ≈ 12 % húmedo),
la pasa a estéreo 48 kHz, pico −3 dBFS, y calcula el ducking (carriles de volumen de #music y #sfx) a partir de la envolvente real de la voz.
"""
import json, os, re, subprocess, wave
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
# VOICE_RAW=raw (por defecto: mezcla "brillante") | raw-clara (alternativa: 0.5 ef_dora + 0.5 ff_siwis)
RAW = ROOT / "assets/audio" / os.environ.get("VOICE_RAW", "raw")
OUT = ROOT / "assets/audio"
SR = 48000
TOTAL = 15.9
PEAK = 10 ** (-3.0 / 20)  # -3 dBFS

# nombre -> (inicio global en s, cola de reverb en s)
PIECES = {
    "vo-1": (4.05, 1.0),
    "vo-2": (7.15, 1.0),
    "vo-3": (10.40, 1.0),
    "vo-4": (12.33, 1.0),
    "vo-5": (14.80, 0.45),  # termina antes del final del vídeo (15.9 s)
}

# ducking: la música y los SFX bajan mientras habla la voz (volumen lineal 0..1)
DUCK_MUSIC = 0.60
DUCK_SFX = 0.62
BRIDGE_S = 0.52      # huecos de voz más cortos que esto no suben el volumen (evita "bombeo")
ATTACK_S = 0.07
RELEASE_S = 0.32

CHAIN = ",".join([
    "aresample=48000:resampler=soxr",
    "highpass=f=85:poles=2",
    "equalizer=f=230:t=q:w=1.0:g=-2.5",      # barro
    "equalizer=f=3000:t=q:w=0.9:g=2.4",      # presencia / claridad
    "equalizer=f=6800:t=q:w=1.6:g=-2.2",     # sibilantes
    "acompressor=threshold=-24dB:ratio=3:attack=6:release=90:makeup=2",
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
    spec *= 1 / (1 + (f / 5200.0) ** 2)                # oscuro
    spec *= (f / 180.0) ** 2 / (1 + (f / 180.0) ** 2)  # sin graves
    ir = np.fft.irfft(spec, n)
    ir[: int(0.020 * SR)] = 0                           # predelay 20 ms
    return ir / np.sqrt(np.sum(ir ** 2))


def convolve(x, ir):
    n = len(x) + len(ir) - 1
    nfft = 1 << (n - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, nfft) * np.fft.rfft(ir, nfft), nfft)[:n]


def process(name, tail_s):
    dry = load(RAW / f"{name}-raw.wav")
    n_dry = len(dry)
    dry = np.concatenate([dry, np.zeros(int(SR * tail_s))])
    wet_l = convolve(dry, plate_ir(11))[: len(dry)]
    wet_r = convolve(dry, plate_ir(23))[: len(dry)]
    wet_gain = 10 ** (-17 / 20) * np.sqrt(np.mean(dry ** 2) / (np.mean(wet_l ** 2) + 1e-12)) * 3.5
    y = np.stack([dry + wet_gain * wet_l, dry + wet_gain * wet_r], axis=1)
    fi, fo = int(0.008 * SR), int(min(0.35, tail_s * 0.7) * SR)
    y[:fi] *= np.linspace(0, 1, fi)[:, None]
    y[-fo:] *= np.linspace(1, 0, fo)[:, None]
    y *= PEAK / np.abs(y).max()
    pcm = np.clip(y * 32767, -32768, 32767).astype("<i2")
    with wave.open(str(OUT / f"{name}.wav"), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
    return len(y) / SR, dry[:n_dry]


def duck_curve(dry_by_name):
    """Ganancia de ducking (1 = sin bajar, 0.6 = −4.4 dB) en una rejilla de 20 ms, a partir de dónde suena la voz seca."""
    hop = int(SR * 0.02)
    nfr = int(TOTAL / 0.02) + 1
    active = np.zeros(nfr, dtype=bool)
    for name, dry in dry_by_name.items():
        start = PIECES[name][0]
        win = int(SR * 0.04)
        env = np.array([np.sqrt(np.mean(dry[i:i + win] ** 2) + 1e-12) for i in range(0, max(1, len(dry) - win), hop)])
        thr = env.max() * 10 ** (-34 / 20)
        i0 = int(round(start / 0.02))
        for k, v in enumerate(env):
            if v > thr and i0 + k < nfr:
                active[i0 + k] = True
    # puentear huecos cortos y ensanchar un poco la voz (la reverb dura más que la palabra)
    gap = int(BRIDGE_S / 0.02)
    idx = np.nonzero(active)[0]
    for a, b in zip(idx[:-1], idx[1:]):
        if 1 < b - a <= gap:
            active[a:b] = True
    target = np.where(active, 1.0, 0.0)
    # suavizado con ataque y relajación
    g = np.zeros(nfr)
    a_att, a_rel = 0.02 / ATTACK_S, 0.02 / RELEASE_S
    cur = 0.0
    for i in range(nfr):
        k = a_att if target[i] > cur else a_rel
        cur += (target[i] - cur) * min(1.0, k)
        g[i] = cur
    return g


def rdp(points, eps):
    """Ramer-Douglas-Peucker sobre [(t, v), ...]."""
    if len(points) < 3:
        return points
    (t0, v0), (t1, v1) = points[0], points[-1]
    best, bi = 0.0, 0
    for i in range(1, len(points) - 1):
        t, v = points[i]
        vi = v0 + (v1 - v0) * (t - t0) / (t1 - t0)
        d = abs(v - vi)
        if d > best:
            best, bi = d, i
    if best <= eps:
        return [points[0], points[-1]]
    return rdp(points[: bi + 1], eps)[:-1] + rdp(points[bi:], eps)


def lane(g, depth):
    pts = [(round(i * 0.02, 3), round(1.0 - (1.0 - depth) * float(g[i]), 4)) for i in range(len(g))]
    pts = rdp(pts, 0.012)
    return {"version": 1, "lanes": [{"target": "volume", "points": [{"t": t, "v": v} for t, v in pts]}]}


def attr(obj):
    return json.dumps(obj, separators=(",", ":")).replace('"', "&quot;")


def audio_block(durations, g):
    lines = [
        "      <!-- AUDIO:begin (generado por scripts/make-voice.py; sonido sintetizado por scripts/make-audio.py) -->",
        "      <!-- Sonido (fades de entrada 0.15 s y salida 0.8 s ya horneados en los WAV). El volumen sigue a la voz (ducking). -->",
        f'      <audio id="music" src="assets/audio/music.wav" data-start="0" data-duration="{TOTAL}" data-track-index="10" data-volume="1" data-automation="{attr(lane(g, DUCK_MUSIC))}"></audio>',
        f'      <audio id="sfx" src="assets/audio/sfx.wav" data-start="0" data-duration="{TOTAL}" data-track-index="11" data-volume="1" data-automation="{attr(lane(g, DUCK_SFX))}"></audio>',
        "      <!-- Locución (voz de chica): 1-2 mientras se abre la app y se ven las pantallas, 3-4 lee la escena de texto, 5 dice «Wave» (inglés) en el cierre -->",
    ]
    for i, (name, (start, _)) in enumerate(PIECES.items()):
        dur = round(min(durations[name], TOTAL - start), 3)
        lines.append(f'      <audio id="{name}" src="assets/audio/{name}.wav" data-start="{start}" data-duration="{dur}" data-track-index="{12 + i}" data-volume="1"></audio>')
    lines.append("      <!-- AUDIO:end -->")
    return "\n".join(lines)


def main():
    durations, dry_by_name = {}, {}
    for name, (_, tail) in PIECES.items():
        durations[name], dry_by_name[name] = process(name, tail)
        print(name, round(durations[name], 3), "s")
    g = duck_curve(dry_by_name)
    html_path = ROOT / "index.html"
    html = html_path.read_text()
    new = re.sub(r"      <!-- AUDIO:begin.*?<!-- AUDIO:end -->", lambda m: audio_block(durations, g), html, flags=re.S)
    assert new != html or "AUDIO:begin" in html
    html_path.write_text(new)
    print("index.html actualizado")


if __name__ == "__main__":
    main()
