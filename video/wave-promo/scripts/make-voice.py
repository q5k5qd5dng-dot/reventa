#!/usr/bin/env python3
"""Locución del vídeo (voz de chica, español + "Wave" en inglés) -> assets/audio/vo-1..5.wav
y bloque <audio> de index.html (con el ducking de la música y los efectos que sigue a la voz).

Texto y colocación (segundos globales):
    vo-1  4.05   "La app que junta venta de entradas online"        (se abre la app y entran las pantallas de entradas)
    vo-2  7.15   "con red social para los asistentes de las fiestas." (pantallas sociales y experiencias)
    vo-3  10.40  "Descubre dónde salir,"                              (escena de texto, línea 1)
    vo-4  12.33  "y compra tu entrada."                               (escena de texto, línea 2)
    vo-5  14.80  "Wave."                                              (cierre; pronunciación inglesa /weɪv/)

Voz actual (v4, «notoria»): Chatterbox Multilingual (MIT) con una voz de referencia SINTÉTICA propia: ~8 s de Kokoro-82M (mezcla de voces de serie, sin
audio de ninguna persona real) -> assets/audio/ref/ref-sintetica-kokoro.wav. Esa referencia aporta una fonación firme (no «soplada»): las tomas anteriores
(referencia = la propia voz por defecto de Chatterbox, subida de tono) tenían el primer armónico muy dominante (H1−H2 ≈ 10–13 dB) y mucho ruido entre
armónicos (HNR ≈ 10–13 dB) y sonaban a susurro; las nuevas dan H1−H2 ≈ 2–4 dB y HNR ≈ 12–15 dB. Además las tomas antiguas pasaban DOS veces por EQ
(+1.5 dB @180 Hz y +1.5 dB de aire, dos veces); ahora las tomas «cb-c» llegan crudas (solo recorte) y el EQ se aplica una sola vez, aquí.
Estilo de lectura de anuncio: cercana, con sonrisa, ritmo sin prisa y entonación viva. Se imitó solo el ESTILO de una locución de ejemplo
(ritmo, pausas, forma de las frases), no la identidad de su locutora. «Wave.» se genera con language_id='en' y la misma voz (/weɪv/).
Tomas crudas en assets/audio/raw-cb-c/ (scripts/prep-voice-raw.py --trim --tempo-p5 0.88).
Tomas anteriores siguen en assets/audio/raw-cb-b/ (Chatterbox «susurrante», VOICE_FX=pro), raw/ y raw-clara/ (Kokoro; VOICE_RAW=raw, VOICE_FX=dry).

Modos de sonido de la voz (variable de entorno VOICE_FX):
    dry    (por defecto)  voz limpia con una sala corta
    space  voz "espacial": algo más grave y cercana, sala amplia (hall ≈ 1.9 s), eco ping-pong que florece en los huecos de la voz
    notoria (por defecto) voz presente y proyectada: menos «soplo» de la fundamental, cuerpo (380 Hz) y presencia (2.8 kHz), compresión 3:1, nivel +1.5 dB, apenas sala
    pro    locución de anuncio «cercana» de la ronda anterior (tomas cb-b): voz seca, cálida y con aire — sonaba a susurro
    ether  voz "espacial etérea": sala larga (≈ 3 s), eco más presente y un hilo de reverb "shimmer" (octava arriba)

Este script es determinista (numpy + ffmpeg): limpia cada toma (EQ, compresión suave), le da una sala corta (reverb de placa ≈ 12 % húmedo),
la pasa a estéreo 48 kHz, pico −3 dBFS, y calcula el ducking (carriles de volumen de #music y #sfx) a partir de la envolvente real de la voz.
"""
import json, os, re, subprocess, wave
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
# VOICE_RAW=raw-cb-c (por defecto: Chatterbox con referencia sintética firme) | raw-cb-b (Chatterbox «susurrante», con VOICE_FX=pro) | raw-cb-a (Chatterbox calmada) | raw (Kokoro «brillante») | raw-clara (Kokoro)
RAW = ROOT / "assets/audio" / os.environ.get("VOICE_RAW", "raw-cb-c")
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

FX = os.environ.get("VOICE_FX", "notoria")
# modo -> parámetros del tratamiento espacial
SPACE = {
    "dry":   dict(pitch_st=0.0,  tail=1.0, rt60=0.85, pre=0.020, wet_db=-17.0, lp=5200, delay_db=None, shimmer_db=None),
    "space": dict(pitch_st=-1.0, tail=2.0, rt60=1.9,  pre=0.030, wet_db=-11.0, lp=6500, delay_db=-15.0, shimmer_db=None),
    "pro":   dict(pitch_st=0.0,  tail=0.9, rt60=0.45, pre=0.010, wet_db=-21.0, lp=6500, delay_db=None, shimmer_db=None),
    "notoria": dict(pitch_st=0.0, tail=0.9, rt60=0.40, pre=0.008, wet_db=-23.0, lp=6500, delay_db=None, shimmer_db=None),
    "ether": dict(pitch_st=-1.0, tail=3.0, rt60=3.0,  pre=0.045, wet_db=-8.0,  lp=7500, delay_db=-11.0, shimmer_db=-20.0),
}[FX]

# la cola de reverb de la frase anterior no debe emborronar «Wave» (14.80 s)
MAX_END = {"vo-4": 14.75}

# ducking: la música y los SFX bajan mientras habla la voz (volumen lineal 0..1)
DUCK_MUSIC = 0.55
DUCK_SFX = 0.45 if FX == "notoria" else 0.55
SPEECH_RMS_DB = -13.5 if FX == "notoria" else -16.5   # nivel RMS de la parte hablada de cada pieza (dBFS)
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


CHAIN_PRO = ",".join([
    "aresample=48000:resampler=soxr",
    "highpass=f=75:poles=2",
    "equalizer=f=180:t=q:w=0.9:g=1.5",       # calidez
    "equalizer=f=330:t=q:w=1.1:g=-1.5",      # barro
    "equalizer=f=3500:t=q:w=0.8:g=2.2",      # presencia
    "deesser=i=0.4:m=0.5:f=0.5:s=o",
    "acompressor=threshold=-24dB:ratio=3:attack=8:release=90:makeup=3:knee=4",
    "acompressor=threshold=-14dB:ratio=2:attack=3:release=60:makeup=1",
    "highshelf=f=9000:g=1.5",                 # aire
    "alimiter=limit=0.9:attack=2:release=40",
])


# voz «notoria»: una sola pasada de EQ — fundamental -1.5 dB, cuerpo +2 dB @380, presencia +2.5 dB @2.8 kHz, sin realce de aire, compresión lenta (poca distorsión)
CHAIN_NOTORIA = ",".join([
    "aresample=48000:resampler=soxr",
    "highpass=f=85:poles=2",
    "equalizer=f=200:t=q:w=0.9:g=-1.5",
    "equalizer=f=380:t=q:w=1.0:g=2.0",
    "equalizer=f=2800:t=q:w=0.8:g=2.5",
    "deesser=i=0.4:m=0.5:f=0.5:s=o",
    "acompressor=threshold=-22dB:ratio=2:attack=20:release=200:makeup=2:knee=6",   # suave: menos modulación = menos ruido; los picos los doma soft_limit()
])


def soft_limit(x, knee=0.38, top=0.75):
    """Doma picos por encima de `knee` hacia `top` (tanh): baja el factor de cresta ≈ 3 dB y permite subir el nivel medio sin pasar de `top`."""
    a = np.abs(x)
    y = a.copy()
    over = a > knee
    y[over] = knee + (top - knee) * np.tanh((a[over] - knee) / (top - knee))
    return np.sign(x) * y


def load(path):
    chain = CHAIN_NOTORIA if FX == "notoria" else CHAIN_PRO if FX == "pro" else CHAIN
    if SPACE["pitch_st"]:
        chain = "rubberband=pitch=%.5f:formant=preserved:pitchq=quality," % (2 ** (SPACE["pitch_st"] / 12)) + chain
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
    # nivel homogéneo entre piezas: RMS de la parte hablada (frames con voz) a SPEECH_RMS_DB dBFS
    fr = dry[:n_dry]
    act = np.abs(fr) > 0.05 * np.abs(fr).max()
    dry *= 10 ** (SPEECH_RMS_DB / 20) / np.sqrt(np.mean(fr[act] ** 2))
    if FX == "notoria":
        dry = soft_limit(dry)
        dry *= 10 ** (SPEECH_RMS_DB / 20) / np.sqrt(np.mean(dry[:n_dry][act] ** 2))   # recupera el RMS que quitó el limitador
        dry = soft_limit(dry)
    rms = np.sqrt(np.mean(dry[:n_dry][act] ** 2))
    ir_l = hall_ir(11, SPACE["rt60"], SPACE["lp"], SPACE["pre"], SPACE["rt60"] * 1.3 + 0.2)
    ir_r = hall_ir(23, SPACE["rt60"], SPACE["lp"], SPACE["pre"], SPACE["rt60"] * 1.3 + 0.2)
    wet = np.stack([convolve(dry, ir_l)[: len(dry)], convolve(dry, ir_r)[: len(dry)]], axis=1)
    wet_db = SPACE["wet_db"] - (5.0 if name == "vo-5" else 0.0)   # la marca, más seca para que se entienda
    wet *= 10 ** (wet_db / 20) * rms / (np.sqrt(np.mean(wet[:n_dry] ** 2)) + 1e-12)  # sala a wet_db respecto a la voz
    y = np.stack([dry, dry], axis=1) + wet
    if SPACE["shimmer_db"] is not None and name != "vo-5":
        sh = rubberband(wet, 2.0)[: len(dry)]
        spec = np.fft.rfft(sh, axis=0)
        f = np.fft.rfftfreq(len(sh), 1 / SR)[:, None]
        sh = np.fft.irfft(spec / (1 + (f / 5500.0) ** 2), len(sh), axis=0)  # el shimmer, oscuro (sin siseo)
        y[: len(sh)] += sh * 10 ** (SPACE["shimmer_db"] / 20)
    if SPACE["delay_db"] is not None:
        env = smooth_env(dry[:n_dry], 0.02, 0.35)
        env = np.concatenate([env, np.zeros(len(dry) - n_dry)])
        y += pingpong(dry, SPACE["delay_db"] - (7.0 if name == "vo-5" else 0.0), env)
    # recorte a lo que cabe en el vídeo y fundidos
    y = y[: int((min(TOTAL, MAX_END.get(name, TOTAL)) - start) * SR)]
    fi, fo = int(0.008 * SR), int(min(0.6, tail_s * 0.6) * SR)
    y[:fi] *= np.linspace(0, 1, fi)[:, None]
    y[-fo:] *= np.linspace(1, 0, fo)[:, None]
    pk = np.abs(y).max()
    top = 0.75 if FX == "notoria" else 0.9   # con música y SFX debajo, la suma debe quedar bajo −1.5 dBFS
    if pk > top:
        y *= top / pk
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


BRAND_WINDOW = (14.70, 15.75)   # mientras se dice «Wave»: la locución manda sobre los efectos del logo
BRAND_DUCK = 0.36


def lane(g, depth):
    def d(i):
        t = i * 0.02
        return min(depth, BRAND_DUCK) if BRAND_WINDOW[0] <= t <= BRAND_WINDOW[1] else depth
    pts = [(round(i * 0.02, 3), round(1.0 - (1.0 - d(i)) * float(g[i]), 4)) for i in range(len(g))]
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
