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

Modos de sonido de la voz (variable de entorno VOICE_FX):
    dry    (por defecto)  voz limpia con una sala corta
    space  voz "espacial": algo más grave y cercana, sala amplia (hall ≈ 1.9 s), eco ping-pong que florece en los huecos de la voz
    ether  voz "espacial etérea": aún más grave, sala larga (≈ 3 s), eco más presente y reverb "shimmer" (octava arriba)

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

FX = os.environ.get("VOICE_FX", "dry")
# modo -> parámetros del tratamiento espacial
SPACE = {
    "dry":   dict(pitch_st=0.0,  tail=1.0, rt60=0.85, pre=0.020, wet_db=-17.0, lp=5200, delay_db=None, shimmer_db=None),
    "space": dict(pitch_st=-1.0, tail=2.0, rt60=1.9,  pre=0.030, wet_db=-11.0, lp=6500, delay_db=-15.0, shimmer_db=None),
    "ether": dict(pitch_st=-2.0, tail=3.0, rt60=3.0,  pre=0.045, wet_db=-8.0,  lp=7500, delay_db=-11.0, shimmer_db=-20.0),
}[FX]

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
    chain = CHAIN
    if SPACE["pitch_st"]:
        chain = "rubberband=pitch=%.5f:formant=preserved:pitchq=quality," % (2 ** (SPACE["pitch_st"] / 12)) + CHAIN
    out = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-af", chain, "-ac", "1", "-f", "f32le", "-ar", str(SR), "-"],
                         check=True, capture_output=True).stdout
    return np.frombuffer(out, dtype="<f4").astype(np.float64)


def rubberband(x, ratio):
    """Cambia el tono de un array (n,) o (n,2) sin cambiar la duración."""
    ch = 1 if x.ndim == 1 else x.shape[1]
    data = x.astype("<f4").tobytes()
    out = subprocess.run(["ffmpeg", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", str(ch), "-i", "-",
                          "-af", f"rubberband=pitch={ratio}:pitchq=quality", "-f", "f32le", "-ar", str(SR), "-ac", str(ch), "-"],
                         input=data, check=True, capture_output=True).stdout
    y = np.frombuffer(out, dtype="<f4").astype(np.float64)
    return y if ch == 1 else y.reshape(-1, ch)


def hall_ir(seed, rt60, lp, pre, length):
    """IR de sala: ruido con caída exponencial, cada vez más oscuro, sin graves, con predelay."""
    rng = np.random.default_rng(seed)
    n = int(SR * length)
    t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    # oscurece la cola progresivamente: mezcla de bandas con distinto RT
    spec = np.fft.rfft(noise)
    f = np.fft.rfftfreq(n, 1 / SR)
    bright = np.fft.irfft(spec / (1 + (f / lp) ** 2), n)
    dark = np.fft.irfft(spec / (1 + (f / (lp * 0.35)) ** 2), n)
    mix = np.clip(t / (rt60 * 0.8), 0, 1)
    ir = (bright * (1 - mix) + dark * mix) * np.exp(-6.9 * t / rt60)
    spec = np.fft.rfft(ir)
    spec *= (f / 220.0) ** 2 / (1 + (f / 220.0) ** 2)  # sin graves
    ir = np.fft.irfft(spec, n)
    ir[: int(pre * SR)] = 0
    # primeras reflexiones (pocas, para dar "tamaño")
    for dly, g in ((0.013, 0.5), (0.021, -0.4), (0.034, 0.33), (0.047, -0.25)):
        k = int((pre + dly) * SR)
        if k < n:
            ir[k] += g * np.abs(ir).max() * 0.6
    return ir / np.sqrt(np.sum(ir ** 2))


def convolve(x, ir):
    n = len(x) + len(ir) - 1
    nfft = 1 << (n - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, nfft) * np.fft.rfft(ir, nfft), nfft)[:n]


def smooth_env(x, attack=0.02, release=0.25):
    """Envolvente normalizada (0..1) de la voz seca, a SR."""
    hop = int(SR * 0.005)
    win = int(SR * 0.02)
    env = np.array([np.sqrt(np.mean(x[i:i + win] ** 2) + 1e-12) for i in range(0, max(1, len(x) - win), hop)])
    env = np.clip(env / (env.max() + 1e-12) * 2.0, 0, 1)
    out = np.zeros_like(env)
    a, r = hop / SR / attack, hop / SR / release
    cur = 0.0
    for i, v in enumerate(env):
        cur += (v - cur) * min(1.0, a if v > cur else r)
        out[i] = cur
    full = np.interp(np.arange(len(x)) / hop, np.arange(len(out)), out)
    return full


def pingpong(dry, db, env):
    """Eco ping-pong (negra con puntillo a 120 bpm = 375 ms), oscuro, que florece cuando la voz calla."""
    n = len(dry)
    spec = np.fft.rfft(dry)
    f = np.fft.rfftfreq(n, 1 / SR)
    d = np.fft.irfft(spec * (f / 350.0) ** 2 / (1 + (f / 350.0) ** 2) / (1 + (f / 3200.0) ** 2), n)
    d *= 1.0 - 0.85 * env           # más eco en los huecos
    step = int(0.375 * SR)
    L = np.zeros(n); R = np.zeros(n)
    g = 0.55
    for k in range(1, 8):
        sh = k * step
        if sh >= n:
            break
        tgt = L if k % 2 == 1 else R
        tgt[sh:] += g ** k * 1.3 * d[: n - sh]
    return np.stack([L, R], axis=1) * (10 ** (db / 20))


def process(name, tail_s):
    tail_s = SPACE["tail"] if name != "vo-5" else min(SPACE["tail"], TOTAL - PIECES[name][0] - 0.05)
    start = PIECES[name][0]
    dry = load(RAW / f"{name}-raw.wav")
    n_dry = len(dry)
    dry = np.concatenate([dry, np.zeros(int(SR * tail_s))])
    # nivel homogéneo entre piezas: RMS de la parte hablada (frames con voz) a −19.5 dBFS
    fr = dry[:n_dry]
    act = np.abs(fr) > 0.05 * np.abs(fr).max()
    dry *= 10 ** (-19.5 / 20) / np.sqrt(np.mean(fr[act] ** 2))
    rms = np.sqrt(np.mean(dry[:n_dry][act] ** 2))
    ir_l = hall_ir(11, SPACE["rt60"], SPACE["lp"], SPACE["pre"], SPACE["rt60"] * 1.3 + 0.2)
    ir_r = hall_ir(23, SPACE["rt60"], SPACE["lp"], SPACE["pre"], SPACE["rt60"] * 1.3 + 0.2)
    wet = np.stack([convolve(dry, ir_l)[: len(dry)], convolve(dry, ir_r)[: len(dry)]], axis=1)
    wet *= 10 ** (SPACE["wet_db"] / 20) * rms / (np.sqrt(np.mean(wet[:n_dry] ** 2)) + 1e-12)  # sala a wet_db respecto a la voz
    y = np.stack([dry, dry], axis=1) + wet
    if SPACE["shimmer_db"] is not None:
        sh = rubberband(wet, 2.0)[: len(dry)]
        spec = np.fft.rfft(sh, axis=0)
        f = np.fft.rfftfreq(len(sh), 1 / SR)[:, None]
        sh = np.fft.irfft(spec / (1 + (f / 5500.0) ** 2), len(sh), axis=0)  # el shimmer, oscuro (sin siseo)
        y[: len(sh)] += sh * 10 ** (SPACE["shimmer_db"] / 20)
    if SPACE["delay_db"] is not None:
        env = smooth_env(dry[:n_dry], 0.02, 0.35)
        env = np.concatenate([env, np.zeros(len(dry) - n_dry)])
        y += pingpong(dry, SPACE["delay_db"], env)
    # recorte a lo que cabe en el vídeo y fundidos
    y = y[: int((TOTAL - start) * SR)]
    fi, fo = int(0.008 * SR), int(min(0.6, tail_s * 0.6) * SR)
    y[:fi] *= np.linspace(0, 1, fi)[:, None]
    y[-fo:] *= np.linspace(1, 0, fo)[:, None]
    pk = np.abs(y).max()
    if pk > 0.9:
        y *= 0.9 / pk
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
