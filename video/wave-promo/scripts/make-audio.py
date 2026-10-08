#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Wave promo (15.9 s) -- sintesis determinista del sonido.

    python3 scripts/make-audio.py            # escribe assets/audio/sfx.wav y assets/audio/music.wav
    python3 scripts/make-audio.py --cues     # ademas imprime la tabla de cues
    python3 scripts/make-audio.py --cues-json /ruta/cues.json

Solo numpy + stdlib. Todo el ruido sale de np.random.default_rng(<semilla fija>): dos ejecuciones dan
ficheros identicos byte a byte. Stereo, 48 kHz, 16 bit, exactamente 15.9 s (763 200 muestras).

====================================================================================================
TABLA DE CUES  (nombre | tiempo global s | fuente en los timelines)
tiempo global = data-start de la escena (index.html) + tiempo local del tween (GSAP de la escena).
Cada cue se ha contrastado con snapshots (hf snapshot --at ...) en el tiempo indicado.
Escena host starts: logo 0.0 | phone 1.2 | app 4.8 | text 10.3 | outro 13.7
logo-in-air                |   0.250 | scene-logo #lg-icon-layer fromTo 0.25 d0.75 (+ #lg-word-layer 0.36)
logo-settle-hit            |   1.000 | scene-logo set #lg-icon-layer filter:none @1.0 (icono asentado)
logo-word-chime            |   1.160 | scene-logo set #lg-word-layer filter:none @1.16 (palabra asentada)
phone-flyin-whoosh         |   1.200 | scene-phone #ph-phone fromTo z -6800 -> 0 @0 d1.05 (power2.out); Doppler/pan der->centro
logo-exit-whoosh           |   1.320 | scene-logo #lg-lockup fromTo scale .55 blur 18 @1.32 d0.65 (power2.in)
phone-land-body            |   2.150 | scene-phone #ph-phone llega a z=0 (≈ fin de la entrada 1.0)
notif-drop-swish           |   2.200 | scene-phone #ph-notif fromTo y -600 -> 0 @1.0 d0.62 (back.out 1.35)
notif-ding                 |   2.464 | scene-phone #ph-notif llega al reposo (1.0 + 0.62*(1-1.35/2.35))
lock-swipe-whoosh          |   2.600 | scene-phone #ph-lock to y -430 @1.4 d0.5 (power2.in); #ph-dim 1.4
home-widget-pop            |   2.660 | scene-phone #ph-widget fromTo scale .9 @1.46 d0.42
home-icons-sparkle         |   2.700 | scene-phone .ph-app fromTo @1.5 stagger .015 (iconos), #ph-dock @1.68
notif2-tick                |   2.720 | scene-phone #ph-notif2 fromTo y -26 @1.22 d0.3 (se asienta)
tap-touch                  |   3.170 | scene-phone #ph-tap fromTo opacity 0->1 @1.97 d0.14 (aparece el dedo)
tap-press                  |   3.340 | scene-phone #ph-waveicon scale 1->.92 @2.14 d0.1 (press) / #ph-tap scale .86
app-open-pop               |   3.500 | scene-phone #ph-open clip-path spring @2.3 d0.62 (back.out .8)
app-open-settle            |   3.844 | scene-phone #ph-open cruza el reposo (back.out 0.8: t = 1 - s/(s+1) de 0.62 s)
app-scroll-swish           |   4.120 | scene-phone #ph-scroll fromTo y 0 -> -72 @2.92 d0.7 (power2.out)
transition-riser           |   4.560 | scene-phone #ph-phone to scale 3.3 @3.42 d0.4 (power3.in) -> riser hasta el pico 3.70
glitch-jitter-1            |   4.660 | scene-phone tl.set #ph-cam x/skewX + drop-shadow RGB split @3.46
glitch-bar1-1              |   4.670 | scene-phone tl.set #ph-bar1 x/skewX/opacity @3.47
light-born-zing            |   4.680 | scene-phone #ph-b-lav/#ph-b-base grow @3.48-3.50; #ph-ring @3.50
glitch-jitter-2            |   4.690 | scene-phone tl.set #ph-cam x/skewX + drop-shadow RGB split @3.49
glitch-bar2-1              |   4.690 | scene-phone tl.set #ph-bar2 x/skewX/opacity @3.49
glitch-bar1-2              |   4.710 | scene-phone tl.set #ph-bar1 x/skewX/opacity @3.51
glitch-jitter-3            |   4.720 | scene-phone tl.set #ph-cam x/skewX + drop-shadow RGB split @3.52
glitch-bar3-1              |   4.720 | scene-phone tl.set #ph-bar3 x/skewX/opacity @3.52
glitch-bar2-2              |   4.740 | scene-phone tl.set #ph-bar2 x/skewX/opacity @3.54
glitch-jitter-4            |   4.750 | scene-phone tl.set #ph-cam x/skewX + drop-shadow RGB split @3.55
glitch-bar1-3              |   4.760 | scene-phone tl.set #ph-bar1 x/skewX/opacity @3.56
glitch-bar3-2              |   4.770 | scene-phone tl.set #ph-bar3 x/skewX/opacity @3.57
glitch-jitter-5            |   4.780 | scene-phone tl.set #ph-cam x/skewX + drop-shadow RGB split @3.58
streak-zip                 |   4.780 | scene-phone #ph-streak scaleX .05->1 @3.58 d0.14 (power3.out)
glitch-bar2-3              |   4.790 | scene-phone tl.set #ph-bar2 x/skewX/opacity @3.59
glitch-jitter-6            |   4.810 | scene-phone tl.set #ph-cam x/skewX + drop-shadow RGB split @3.61
glitch-bar3-3              |   4.820 | scene-phone tl.set #ph-bar3 x/skewX/opacity @3.62
transition-peak-impact     |   4.900 | scene-phone pico lavanda ~3.72 (snapshot 4.95 s: pantalla blanco-violeta); #ph-fx opacity->0 @3.72
transition-dissolve-whoosh |   4.920 | scene-phone #ph-fx opacity->0 + blur 16 @3.72 d0.28 (disuelve a transparente en 4.0)
pill-in-1                  |   5.080 | scene-app pillEls fromTo @0.2 stagger .07 (pill 1, +0.08 s: ya visible)
pill-in-2                  |   5.150 | scene-app pillEls fromTo @0.2 stagger .07 (pill 2, +0.08 s: ya visible)
pill-in-3                  |   5.220 | scene-app pillEls fromTo @0.2 stagger .07 (pill 3, +0.08 s: ya visible)
rowA-in-whoosh             |   5.250 | scene-app rowA fromTo rotationY -22, x 150 @0.45 d0.75 stagger .1 (power3.out)
pill-in-4                  |   5.290 | scene-app pillEls fromTo @0.2 stagger .07 (pill 4, +0.08 s: ya visible)
rowA-click-1               |   5.650 | scene-app #ap-a0 aterriza (inicio 0.45 + 0.40)
sel-todo-entradas          |   5.700 | scene-app slide(0.9, 124, 156) #ap-sel d0.5 (power3.inOut)
rowA-click-2               |   5.750 | scene-app #ap-a1 aterriza (inicio 0.55 + 0.40)
rowA-click-3               |   5.850 | scene-app #ap-a2 aterriza (inicio 0.65 + 0.40)
rowB-peek-air              |   6.000 | scene-app rowB fromTo opacity .55 blur 5 @1.2 d0.6 stagger .08
rowA-out-whoosh            |   6.650 | scene-app rowA to opacity 0, blur 16 @1.85 d0.32 stagger .03
scroll1-whoosh             |   6.700 | scene-app #ap-scroll fromTo y 0 -> -770 @1.9 d0.6 (power3.inOut)
rowB-in-whoosh             |   6.800 | scene-app rowB fromTo opacity .55->1 @2.0 d0.55 stagger .06 (power3.out)
sel-entradas-social        |   6.800 | scene-app slide(2.0, 292, 128) #ap-sel d0.5
rowB-click-1               |   7.200 | scene-app #ap-b0 aterriza (inicio 2.00 + 0.40)
rowB-click-2               |   7.260 | scene-app #ap-b1 aterriza (inicio 2.06 + 0.40)
rowB-click-3               |   7.320 | scene-app #ap-b2 aterriza (inicio 2.12 + 0.40)
rowC-in-whoosh             |   7.800 | scene-app #ap-c0/#ap-c1/#ap-c2 fromTo rotationY -22 @3.0/3.15/3.3 d0.75 (power3.out)
rowB-out-whoosh            |   7.950 | scene-app rowB to opacity 0, blur 16 @3.15 d0.32 stagger .03
scroll2-whoosh             |   8.000 | scene-app #ap-scroll to y -1540 @3.2 d0.6 (power3.inOut)
sel-social-experiencias    |   8.100 | scene-app slide(3.3, 432, 196) #ap-sel d0.5
rowC-click-1               |   8.200 | scene-app #ap-c0 aterriza (inicio 3.00 + 0.40)
rowC-click-2               |   8.350 | scene-app #ap-c1 aterriza (inicio 3.15 + 0.40)
rowC-click-3               |   8.500 | scene-app #ap-c2 aterriza (inicio 3.30 + 0.40)
app-exit-anticipation      |   9.250 | scene-app hold 4.45 -> 5.1 (board drifts, clips play) -> soft swell that leads into the exit at 5.1 (fills the 9.0-9.85 gap)
app-exit-recede            |   9.900 | scene-app exit: #ap-board to z -320 @5.1 d0.7 (power2.in); pills/cards blur 20 fade
text-descubre-in           |  10.400 | scene-text #tx-l1w1 fromTo blur 18->0, tracking 0.45em->-0.01em @0.10 d0.6
text-streak-in             |  10.760 | scene-text #tx-l1w2 x 220->0 @0.46 d0.62 / #tx-l1w3 @0.52 d0.64 (power3.out) + motion blur
text-line1-exit            |  12.000 | scene-text L1_WORDS: x collapse + blur 22 @1.7 d0.3 (power2.inOut), opacity->0 @1.74
text-line2-in              |  12.350 | scene-text L2_WORDS fromTo x +-91.5.. blur 20->0 @2.05 d0.5 (power3.out)
text-accent-light          |  12.850 | scene-text #tx-l2s4 color -> #9af7ff @2.45 d0.3 + scale pop 1.03 @2.45 d0.15
bg-gather-suction          |  13.500 | index.html chain(#bg-glow/#bg-core) t13.5 -> 14.4 (el glow se recoge a un orbe, power3.inOut)
text-line2-exit            |  13.750 | scene-text L2_WORDS exit collapse + blur 22 @3.45 d0.29, opacity->0 @3.52
orb-born                   |  13.760 | scene-outro #ou-orbwrap fromTo scale .3 blur 14 @0.06 d0.4 (power2.out)
orb-beat                   |  14.160 | scene-outro #ou-orbwrap to scale 1.2 @0.46 d0.118 (late) / 0.94 @0.58
orb-beat-echo              |  14.280 | scene-outro #ou-orbwrap to scale 0.94 @0.58 d0.1 (rebote)
icon-form-hit              |  14.380 | scene-outro #ou-orbwrap scale -> 229/110 @0.68 d0.58 (back.out 1.2) + #ou-flash opacity .85 @0.68
icon-glyph-iris            |  14.420 | scene-outro #ou-reveal --ra 0->200 @0.72 d0.42 (el glifo aparece con iris)
icon-ring                  |  14.680 | scene-outro #ou-ring opacity .8->0 scale 1->1.7 @0.98 d0.55
lockup-slide-whoosh        |  14.750 | scene-outro POS x 335->0 + #ou-wslide + #ou-wmask @1.05 d0.62 (power3.inOut)
url-line-zip               |  15.120 | scene-outro #ou-url fromTo y 14 -> 0 @1.42 d0.5 / #ou-line scaleX 0->1 @1.48 d0.55
lockup-settle              |  15.370 | scene-outro fin del deslizamiento del lockup (1.05 + 0.62) -> lockup final centrado
====================================================================================================
Revision (audio review): impactos sub -2.5 dB (IMP_GAIN .5) y barridos +2.3 dB (WH_GAIN 2.2) para que el sub no domine
y el limitador trabaje menos (max 5.5 dB de reduccion en vez de 6, y solo en 4.90 y 14.38 s); paso bajo suave a 12.5 kHz en el master SFX y a 8.5 kHz en
las rafagas glitch (sin agudos duros); cola de 12 ms en cada barrido (ninguno acaba con escalon); climax del vuelo del movil
adelantado a 0.7 s locales (llegada visual ~0.95 s).
Mezcla: SFX pico = -6 dBFS (limitador brickwall con lookahead), musica pico = -18 dBFS (12 dB por debajo),
fade-in 0.15 s y fade-out 0.8 s horneados en ambos ficheros (el <audio> va a data-volume 1, sin automation).
Musica: La menor / dorico: Am9 | Fmaj9 | Cmaj9 | Gadd9 | Fmaj7 | Dm9 | E7sus4 | Am9 (resuelve en 14.38 s con el
icono), 120 bpm, pad detuned -> paso bajo STFT con corte variable, sub suave, pulso muy discreto, sidechain
(ducking) bajo los impactos grandes.
"""
import json
import os
import sys
import wave

import numpy as np

SR = 48000
DUR = 15.9
N = int(round(DUR * SR))          # 763 200
HERE = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(os.path.dirname(HERE), "assets", "audio")
SFX_PEAK_DB = -6.0
WH_GAIN = 2.2
IMP_GAIN = 0.5
MUSIC_PEAK_DB = -16.0
FADE_IN = 0.15
FADE_OUT = 0.8

HOST = {"logo": 0.0, "phone": 1.2, "app": 4.8, "text": 10.3, "outro": 13.7}
CUES = []   # (nombre, t_global, fuente)


def G(scene, local):
    return round(HOST[scene] + local, 4)


def cue(name, scene, local, src, dt=0.0):
    t = round(G(scene, local) + dt, 4)
    CUES.append((name, t, src))
    return t


# ======================================================================================================
# utilidades DSP
# ======================================================================================================
def smooth(x):
    x = np.clip(x, 0.0, 1.0)
    return x * x * (3 - 2 * x)


def lin(t, t0, t1, v0, v1, ease=None, log=False):
    u = np.clip((np.asarray(t, float) - t0) / (t1 - t0), 0, 1)
    if ease is not None:
        u = ease(u)
    if log:
        return v0 * (v1 / v0) ** u
    return v0 + (v1 - v0) * u


def ienv(t, pts):
    """envolvente por tramos con interpolacion suave (pendiente 0 en cada nudo)."""
    ts = np.array([p[0] for p in pts], float)
    vs = np.array([p[1] for p in pts], float)
    t = np.asarray(t, float)
    idx = np.clip(np.searchsorted(ts, t, side="right") - 1, 0, len(ts) - 2)
    u = smooth((t - ts[idx]) / (ts[idx + 1] - ts[idx]))
    out = vs[idx] + (vs[idx + 1] - vs[idx]) * u
    out = np.where(t < ts[0], vs[0], out)
    out = np.where(t > ts[-1], vs[-1], out)
    return out


def pan_gains(p):
    p = np.clip(p, -1, 1)
    a = (p + 1) * np.pi / 4
    return np.cos(a), np.sin(a)


def stereo(x, p=0.0):
    gl, gr = pan_gains(p)
    return np.stack([x * gl, x * gr])


def rms(x):
    return float(np.sqrt(np.mean(np.square(x)) + 1e-18))


def stft_filter(x, mask_fn, W=1024, H=256):
    """filtrado STFT con mascara variable en el tiempo. mask_fn(t[frames,1], f[1,bins]) -> [frames,bins]."""
    n = len(x)
    xp = np.concatenate([np.zeros(W), x, np.zeros(W + H)])
    nf = (len(xp) - W) // H + 1
    idx = np.arange(W)[None, :] + H * np.arange(nf)[:, None]
    win = 0.5 - 0.5 * np.cos(2 * np.pi * np.arange(W) / W)
    S = np.fft.rfft(xp[idx] * win, axis=1)
    tc = (H * np.arange(nf) + W / 2 - W) / SR
    f = np.fft.rfftfreq(W, 1 / SR)
    f = np.maximum(f, 1.0)
    M = mask_fn(tc[:, None], f[None, :])
    Y = np.fft.irfft(S * M, n=W, axis=1) * win
    out = np.zeros(len(xp))
    for i in range(nf):
        out[i * H:i * H + W] += Y[i]
    out /= 1.5
    return out[W:W + n]


def bp_mask(f, fc, bw):
    return np.exp(-0.5 * (np.log2(f / np.maximum(fc, 20.0)) / bw) ** 2)


def lp_mask(f, fc, order=4):
    return 1.0 / np.sqrt(1.0 + (f / np.maximum(fc, 20.0)) ** order)


def hp_mask(f, fc, order=4):
    return 1.0 / np.sqrt(1.0 + (np.maximum(fc, 1.0) / f) ** order)


def fft_filter(x, mask):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    f[0] = 1e-3
    return np.fft.irfft(X * mask(f), n=len(x))


def noise(n, seed):
    return np.random.default_rng(seed).standard_normal(n)


def band_noise(n, seed, mask_fn, W=1024, H=256):
    y = stft_filter(noise(n, seed), mask_fn, W, H)
    return y / (rms(y) + 1e-12)


# ======================================================================================================
# buses: seco + envio a reverb
# ======================================================================================================
class Bus:
    def __init__(self):
        self.dry = np.zeros((2, N))
        self.send = np.zeros((2, N))

    def add(self, sig, t0, gain=1.0, send=0.0):
        sig = np.asarray(sig, float)
        if sig.ndim == 1:
            sig = np.stack([sig, sig])
        i0 = int(round(t0 * SR))
        i1 = min(N, i0 + sig.shape[1])
        if i0 >= N or i1 <= i0:
            return
        seg = sig[:, :i1 - i0] * gain
        self.dry[:, i0:i1] += seg
        if send:
            self.send[:, i0:i1] += seg * send


def make_ir(rt60, seed, predelay=0.014, damp_hz=5200.0):
    rng = np.random.default_rng(seed)
    n = int(rt60 * 1.25 * SR)
    t = np.arange(n) / SR
    out = []
    for ch in range(2):
        x = rng.standard_normal(n) * np.exp(-6.9078 * t / rt60)
        x *= 1 - np.exp(-t / 0.006)
        X = np.fft.rfft(x)
        f = np.fft.rfftfreq(n, 1 / SR)
        X *= np.exp(-f / damp_hz) * hp_mask(np.maximum(f, 1), 520.0, 4)   # velo: sin agudos duros ni barro
        x = np.fft.irfft(X, n=n)
        x[:int(predelay * SR)] = 0
        out.append(x)
    ir = np.stack(out)
    ir /= np.sqrt(np.sum(ir ** 2, axis=1, keepdims=True)) + 1e-12
    return ir


def convolve(sig, ir):
    n = sig.shape[1]
    nfft = 1 << int(np.ceil(np.log2(n + ir.shape[1])))
    out = np.zeros_like(sig)
    for ch in range(2):
        out[ch] = np.fft.irfft(np.fft.rfft(sig[ch], nfft) * np.fft.rfft(ir[ch], nfft), n=nfft)[:n]
    return out


def limiter(x, ceil, look=0.006, release=0.12):
    """brickwall con lookahead (enlazado en estereo). x [2, n]"""
    pk = np.max(np.abs(x), axis=0)
    g = np.minimum(1.0, ceil / np.maximum(pk, 1e-9))
    w = int(look * SR)
    gm = g.copy()
    for s in range(1, w + 1):
        gm[:-s] = np.minimum(gm[:-s], g[s:])
        gm[s:] = np.minimum(gm[s:], g[:-s])
    k = np.hanning(2 * w + 3)[1:-1]
    k /= k.sum()
    gs = np.convolve(np.pad(gm, (w + 1, w + 1), constant_values=1.0), k, mode="same")[w + 1:-(w + 1)]
    gs = np.minimum(gs, g)
    a = 1.0 - np.exp(-1.0 / (release * SR))
    r = np.empty_like(gs)
    prev = 1.0
    for i in range(len(gs)):
        v = prev + a * (1.0 - prev)
        if gs[i] < v:
            v = gs[i]
        r[i] = v
        prev = v
    return x * r, float(np.min(r))


def fades(x):
    n = x.shape[1]
    t = np.arange(n) / SR
    gi = np.sin(0.5 * np.pi * np.clip(t / FADE_IN, 0, 1)) ** 2
    u = np.clip((t - (DUR - FADE_OUT)) / FADE_OUT, 0, 1)
    go = np.cos(0.5 * np.pi * u) ** 2
    go[-1] = 0.0
    return x * (gi * go)


def dc_hp(x, f0=22.0):
    return np.stack([fft_filter(x[c], lambda f: hp_mask(f, f0, 4)) for c in range(2)])


def peak_db(x):
    return 20 * np.log10(np.max(np.abs(x)) + 1e-12)


# ======================================================================================================
# sonidos
# ======================================================================================================
def whoosh(dur, fc, bw, env, pan, level, seed, body=0.0, body_fc=260.0, air=0.0, width=0.4, W=1024):
    """barrido de ruido filtrado con movimiento estereo.  fc(t)->Hz, env(t)->0..1, pan(t)->-1..1"""
    n = int(dur * SR)
    t = np.arange(n) / SR
    mfn = lambda tc, f: bp_mask(f, fc(tc), bw)
    A = band_noise(n, seed, mfn, W)
    B = band_noise(n, seed + 1, mfn, W)
    C = band_noise(n, seed + 2, mfn, W)
    gl, gr = pan_gains(pan(t))
    e = env(t)
    L = (A * gl * (1 - width) + B * width * 0.7071) * e
    R = (A * gr * (1 - width) + C * width * 0.7071) * e
    out = np.stack([L, R])
    if body > 0:       # cuerpo grave que da peso (mono, centrado)
        bn = band_noise(n, seed + 3, lambda tc, f: lp_mask(f, body_fc * (0.8 + 0.5 * np.sin(np.pi * np.clip(tc / dur, 0, 1))), 4) * hp_mask(f, 110.0, 4), 2048, 512)
        out += stereo(bn * e ** 1.6 * body, 0.0)
    if air > 0:        # aire agudo
        an = band_noise(n, seed + 4, lambda tc, f: hp_mask(f, 5200.0, 4), 1024, 256)
        out += np.stack([an * e ** 1.2 * air * gl * 1.2, an * e ** 1.2 * air * gr * 1.2])
    tf = int(0.012 * SR)                        # cola sin escalon: ningun barrido termina con un corte
    out[:, -tf:] *= np.linspace(1, 0, tf)
    return out * level * WH_GAIN


def bell(f0, dur=1.5, decay=0.5, attack=0.0012, click=0.12, seed=1, brightness=1.0):
    parts = [(1.0, 1.0, 1.0), (2.0, 0.30, 0.58), (2.76, 0.17, 0.42), (4.07, 0.10 * brightness, 0.26),
             (5.40, 0.06 * brightness, 0.17), (7.1, 0.03 * brightness, 0.11)]
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for i, (r, a, dm) in enumerate(parts):
        f = f0 * r
        if f < 17000:
            x += a * np.sin(2 * np.pi * f * t + 0.9 * i) * np.exp(-t / (decay * dm))
    x *= 1 - np.exp(-t / attack)
    if click > 0:
        cn = band_noise(int(0.004 * SR), seed, lambda tc, f: hp_mask(f, 3000.0, 2))
        x[:len(cn)] += cn * click * np.hanning(len(cn))
    return x


def ding(f0, pan=0.1, level=1.0, decay=0.55, dur=1.6, seed=1):
    return stereo(bell(f0, dur, decay, seed=seed), pan) * level


def tick(f0, level=1.0, pan=0.0, decay=0.014, seed=2):
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * f0 * t) * np.exp(-t / decay)
    x += 0.32 * np.sin(2 * np.pi * f0 * 2.76 * t + 1.0) * np.exp(-t / (decay * 0.5))
    x *= 1 - np.exp(-t / 0.0004)
    cn = band_noise(int(0.0025 * SR), seed, lambda tc, f: hp_mask(f, 4000.0, 2))
    x[:len(cn)] += cn * 0.25 * np.hanning(len(cn))
    return stereo(x, pan) * level


def microclick(level=1.0, pan=0.0, seed=3, f=2600.0):
    n = int(0.03 * SR)
    t = np.arange(n) / SR
    cn = band_noise(n, seed, lambda tc, ff: bp_mask(ff, f, 0.8)) * np.exp(-t / 0.0035)
    body = np.sin(2 * np.pi * 760 * t) * np.exp(-t / 0.007) * 0.55
    x = (cn * 0.8 + body) * (1 - np.exp(-t / 0.0003))
    return stereo(x, pan) * level


def tap(level=1.0, seed=4):
    """toque seco de dedo en cristal: golpe corto 170->85 Hz + click medio."""
    n = int(0.14 * SR)
    t = np.arange(n) / SR
    f = 85 + 90 * np.exp(-t / 0.011)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t / 0.032)
    cn = band_noise(n, seed, lambda tc, ff: bp_mask(ff, 1900.0, 0.9)) * np.exp(-t / 0.004)
    x = (body * 0.9 + cn * 0.45) * (1 - np.exp(-t / 0.0005))
    return stereo(x, 0.0) * level


def pop(f_lo=330.0, f_hi=820.0, level=1.0, pan=0.0, dur=0.22, seed=5):
    """burbuja: seno que sube rapido + tick."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = f_hi - (f_hi - f_lo) * np.exp(-t / 0.018)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * np.exp(-t / 0.05) + 0.3 * np.sin(2 * ph) * np.exp(-t / 0.025)
    x *= 1 - np.exp(-t / 0.0007)
    cn = band_noise(int(0.004 * SR), seed, lambda tc, ff: hp_mask(ff, 2500.0, 2))
    x[:len(cn)] += cn * 0.3 * np.hanning(len(cn))
    return stereo(x, pan) * level


PENTA = [880.0, 1046.5, 1174.7, 1318.5, 1568.0, 1760.0, 2093.0, 2349.3, 2637.0, 3136.0, 3520.0]


def shimmer(freqs, stagger=0.035, attack=0.09, decay=1.1, dur=1.8, seed=10, tremolo=5.0, spread=0.6,
            sparkle=10, sparkle_span=0.5, sparkle_amp=0.18, level=1.0):
    """luz: parciales apilados con ataque lento, tremolo suave y destellos agudos."""
    rng = np.random.default_rng(seed)
    n = int(dur * SR)
    t = np.arange(n) / SR
    L = np.zeros(n)
    R = np.zeros(n)
    for i, f in enumerate(freqs):
        tt = t - i * stagger
        m = tt > 0
        env = np.zeros(n)
        env[m] = (1 - np.exp(-tt[m] / (attack / 3.0))) * np.exp(-tt[m] / decay)
        trem = 1 + 0.22 * np.sin(2 * np.pi * tremolo * (1 + 0.17 * i) * t + rng.uniform(0, 6.28))
        s = env * trem * (np.sin(2 * np.pi * f * t + rng.uniform(0, 6.28)) + 0.2 * np.sin(4 * np.pi * f * t + 1.3)) / (1 + 0.28 * i)
        gl, gr = pan_gains(rng.uniform(-spread, spread))
        L += s * gl
        R += s * gr
    for _ in range(sparkle):
        f = rng.choice(PENTA[5:]) * rng.choice([1.0, 2.0])
        t0 = rng.uniform(0.0, sparkle_span)
        a = rng.uniform(0.4, 1.0) * sparkle_amp
        tt = t - t0
        m = tt > 0
        s = np.zeros(n)
        s[m] = np.sin(2 * np.pi * f * tt[m]) * np.exp(-tt[m] / 0.07) * (1 - np.exp(-tt[m] / 0.0008))
        gl, gr = pan_gains(rng.uniform(-0.9, 0.9))
        L += s * a * gl
        R += s * a * gr
    return np.stack([L, R]) * level


def impact(dur, f_hi, f_lo, level=1.0, tau=0.045, decay=0.55, drive=2.2, thump=0.35, tail=0.25, seed=20, click=0.12):
    """golpe sub: seno con caida de tono, saturacion suave (armonicos audibles en altavoces pequenos) y cola de aire."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = f_lo + (f_hi - f_lo) * np.exp(-t / tau)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t / decay) * (1 - np.exp(-t / 0.0025))
    body = np.tanh(drive * body) / np.tanh(drive)
    tn = band_noise(n, seed, lambda tc, ff: lp_mask(ff, 320.0, 4), 2048, 512) * np.exp(-t / 0.07) * thump
    an = band_noise(n, seed + 1, lambda tc, ff: bp_mask(ff, 700.0 * np.exp(-tc * 1.4), 1.3), 1024, 256)
    an = an * np.exp(-t / (decay * 0.9)) * (1 - np.exp(-t / 0.012)) * tail
    cn = band_noise(int(0.006 * SR), seed + 2, lambda tc, ff: hp_mask(ff, 1200.0, 2))
    x = body + tn + an
    x[:len(cn)] += cn * click * np.hanning(len(cn))
    return stereo(x, 0.0) * level * IMP_GAIN


def glitch(dur, seed, hold=(3, 14), bits=(3, 5), seg=(0.003, 0.010), duty=0.7, tone_notes=None, level=1.0, pan=0.0,
           decay=None, tone_level=0.35):
    """rafaga digital: ruido con muestreo-retencion + reduccion de bits + puerta troceada + chirrido de onda cuadrada."""
    rng = np.random.default_rng(seed)
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.diff(rng.standard_normal(n + 1))
    out = np.zeros(n)
    i = 0
    prev = None
    while i < n:
        L = max(8, int(rng.uniform(*seg) * SR))
        h = int(rng.integers(hold[0], hold[1] + 1))
        s = x[i:i + L]
        s = np.repeat(s[::h], h)[:len(s)]
        b = int(rng.integers(bits[0], bits[1] + 1))
        q = 2 ** (b - 1)
        s = np.round(np.clip(s / 2.5, -1, 1) * q) / q
        if prev is not None and rng.random() < 0.3:      # tartamudeo: repite el trozo anterior
            s = np.resize(prev, len(s))
        prev = s.copy()
        if rng.random() < duty:
            out[i:i + len(s)] = s
        i += L
    env = 1 - np.exp(-t / 0.0008)
    env *= np.exp(-t / decay) if decay else np.ones(n)
    sig = out * env
    if tone_notes:
        step = max(1, int(0.0045 * SR))
        fr = np.repeat(np.array([tone_notes[int(rng.integers(0, len(tone_notes)))] for _ in range(n // step + 2)], float), step)[:n]
        ph = 2 * np.pi * np.cumsum(fr) / SR
        sq = np.sign(np.sin(ph))
        sq = np.round(sq * 3) / 3
        sig = sig + sq * env * tone_level
    # recorte de fin para que la rafaga no deje clic
    fo = int(0.002 * SR)
    sig[-fo:] *= np.linspace(1, 0, fo)
    sig = fft_filter(np.concatenate([sig, np.zeros(256)]), lambda f: lp_mask(f, 8500.0, 2))[:n]   # gritty, not painful
    return stereo(sig, pan) * level


def riser(dur, f0, f1, seed, level=1.0, tone=(196.0, 880.0), tone_level=0.5, power=2.2, end_fade=0.012):
    """subida de tension: ruido con filtro que sube + glissando de tono + (al final) corte limpio."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    u = t / dur
    fc = lambda tc: f0 * (f1 / f0) ** (np.clip(tc / dur, 0, 1) ** 1.4)
    mfn = lambda tc, f: bp_mask(f, fc(tc), 1.0)
    A = band_noise(n, seed, mfn)
    B = band_noise(n, seed + 1, mfn)
    env = u ** power
    env[-int(end_fade * SR):] *= np.linspace(1, 0, int(end_fade * SR))
    ftone = tone[0] * (tone[1] / tone[0]) ** (u ** 1.6)
    ph = 2 * np.pi * np.cumsum(ftone) / SR
    ton = sum(np.sin(k * ph) / k ** 1.4 for k in (1, 2, 3, 4, 5)) * 0.35
    ton = fft_filter(ton, lambda f: lp_mask(f, 5000.0, 4))
    L = A * env + ton * env ** 1.3 * tone_level * 0.8
    R = B * env + ton * env ** 1.3 * tone_level * 0.8
    return np.stack([L, R]) * level


# ======================================================================================================
# SFX
# ======================================================================================================
def build_sfx():
    bus = Bus()
    A_MIN = {"A5": 880.0, "C6": 1046.5, "E6": 1318.5, "A6": 1760.0, "C7": 2093.0, "E7": 2637.0, "G7": 3136.0, "A7": 3520.0}
    # ---------------------------------------------------------------- ESCENA 1 · logo (host 0.0)
    t = cue("logo-in-air", "logo", 0.25, "scene-logo #lg-icon-layer fromTo 0.25 d0.75 (+ #lg-word-layer 0.36)")
    bus.add(whoosh(1.0, lambda tc: lin(tc, 0, 0.9, 520, 3300, smooth, True), 1.0,
                   lambda x: ienv(x, [(0, 0), (0.55, 1), (1.0, 0)]), lambda x: 0 * x, 0.085, 100, air=0.35, width=0.6), t, send=0.30)
    t = cue("logo-settle-hit", "logo", 1.0, "scene-logo set #lg-icon-layer filter:none @1.0 (icono asentado)")
    bus.add(impact(0.9, 120, 55.0, level=0.42, decay=0.38, drive=1.8, thump=0.25, tail=0.18, seed=21), t, send=0.05)
    t = cue("logo-word-chime", "logo", 1.16, "scene-logo set #lg-word-layer filter:none @1.16 (palabra asentada)")
    bus.add(ding(A_MIN["E6"], 0.0, 0.18, decay=0.5, dur=1.3, seed=31), t, send=0.55)
    bus.add(ding(A_MIN["A6"], 0.0, 0.12, decay=0.5, dur=1.3, seed=32), t + 0.07, send=0.55)
    t = cue("logo-exit-whoosh", "logo", 1.32, "scene-logo #lg-lockup fromTo scale .55 blur 18 @1.32 d0.65 (power2.in)")
    bus.add(whoosh(0.75, lambda tc: lin(tc, 0, 0.7, 3200, 480, smooth, True), 0.9,
                   lambda x: ienv(x, [(0, 0), (0.42, 1), (0.75, 0)]), lambda x: lin(x, 0, 0.7, -0.15, 0.35), 0.09, 110, width=0.5), t, send=0.2)

    # ---------------------------------------------------------------- ESCENA 2 · móvil (host 1.2)
    t = cue("phone-flyin-whoosh", "phone", 0.0, "scene-phone #ph-phone fromTo z -6800 -> 0 @0 d1.05 (power2.out); Doppler/pan der->centro")
    bus.add(whoosh(1.25, lambda tc: np.where(tc < 0.68, lin(tc, 0, 0.68, 380, 3600, smooth, True), lin(tc, 0.68, 1.2, 3600, 700, smooth, True)), 0.95,
                   lambda x: ienv(x, [(0, 0), (0.12, 0.12), (0.7, 1), (1.25, 0)]), lambda x: lin(x, 0.05, 1.1, 0.85, 0.0, smooth), 0.24, 120,
                   body=0.5, body_fc=300.0, air=0.18, width=0.3), t, send=0.2)
    t = cue("phone-land-body", "phone", 0.95, "scene-phone #ph-phone llega a z=0 (≈ fin de la entrada 1.0)")
    bus.add(impact(0.6, 150, 78.0, level=0.22, decay=0.22, drive=1.4, thump=0.35, tail=0.1, seed=22), t, send=0.04)
    land = 1.0 + 0.62 * (1 - 1.35 / 2.35)        # back.out(1.35) cruza el reposo a t = 1 - s/(s+1)
    t = cue("notif-drop-swish", "phone", 1.0, "scene-phone #ph-notif fromTo y -600 -> 0 @1.0 d0.62 (back.out 1.35)")
    bus.add(whoosh(0.4, lambda tc: lin(tc, 0, 0.3, 3000, 1100, smooth, True), 0.9,
                   lambda x: ienv(x, [(0, 0), (0.1, 1), (0.4, 0)]), lambda x: 0 * x + 0.05, 0.05, 130, width=0.5), t, send=0.2)
    t = cue("notif-ding", "phone", land, "scene-phone #ph-notif llega al reposo (1.0 + 0.62*(1-1.35/2.35))")
    bus.add(ding(A_MIN["E6"], -0.1, 0.62, decay=0.6, dur=1.7, seed=33), t, send=0.5)
    bus.add(ding(A_MIN["A6"], 0.1, 0.55, decay=0.65, dur=1.7, seed=34), t + 0.105, send=0.5)
    t = cue("notif2-tick", "phone", 1.22 + 0.3, "scene-phone #ph-notif2 fromTo y -26 @1.22 d0.3 (se asienta)")
    bus.add(tick(A_MIN["C7"], 0.16, 0.2), t, send=0.25)
    t = cue("lock-swipe-whoosh", "phone", 1.4, "scene-phone #ph-lock to y -430 @1.4 d0.5 (power2.in); #ph-dim 1.4")
    bus.add(whoosh(0.55, lambda tc: lin(tc, 0, 0.45, 650, 3400, smooth, True), 0.95,
                   lambda x: ienv(x, [(0, 0), (0.2, 1), (0.55, 0)]), lambda x: lin(x, 0, 0.5, -0.1, 0.1), 0.14, 140, air=0.2, width=0.4), t, send=0.18)
    t = cue("home-widget-pop", "phone", 1.46, "scene-phone #ph-widget fromTo scale .9 @1.46 d0.42")
    bus.add(pop(300, 700, 0.30, 0.0), t + 0.04, send=0.3)
    t0 = cue("home-icons-sparkle", "phone", 1.5, "scene-phone .ph-app fromTo @1.5 stagger .015 (iconos), #ph-dock @1.68")
    notes = [A_MIN["A6"], A_MIN["C7"], A_MIN["E7"], A_MIN["G7"], A_MIN["E7"], A_MIN["A7"]]
    for i, f in enumerate(notes):
        bus.add(tick(f, 0.10 + 0.012 * i, -0.4 + 0.16 * i, seed=40 + i), t0 + 0.04 + i * 0.045, send=0.35)
    t = cue("tap-touch", "phone", 1.97, "scene-phone #ph-tap fromTo opacity 0->1 @1.97 d0.14 (aparece el dedo)")
    bus.add(microclick(0.35, -0.1, seed=50, f=1500.0), t + 0.05, send=0.1)
    t = cue("tap-press", "phone", 2.14, "scene-phone #ph-waveicon scale 1->.92 @2.14 d0.1 (press) / #ph-tap scale .86")
    bus.add(tap(0.95), t, send=0.12)
    t = cue("app-open-pop", "phone", 2.3, "scene-phone #ph-open clip-path spring @2.3 d0.62 (back.out .8)")
    bus.add(pop(260, 640, 0.62, 0.0, seed=51), t, send=0.3)
    bus.add(impact(0.5, 130, 70.0, level=0.34, decay=0.18, drive=1.5, thump=0.25, tail=0.1, seed=23), t, send=0.04)
    bus.add(whoosh(0.8, lambda tc: lin(tc, 0, 0.55, 480, 2900, smooth, True), 1.0,
                   lambda x: ienv(x, [(0, 0), (0.28, 1), (0.8, 0)]), lambda x: lin(x, 0, 0.8, -0.1, 0.1), 0.16, 150, body=0.3, air=0.15, width=0.5), t - 0.02, send=0.22)
    t = cue("app-open-settle", "phone", 2.3 + 0.62 * (1 - 0.8 / 1.8), "scene-phone #ph-open cruza el reposo (back.out 0.8: t = 1 - s/(s+1) de 0.62 s)")
    bus.add(shimmer([A_MIN["E6"], A_MIN["A6"], A_MIN["C7"]], 0.04, 0.05, 0.5, 1.0, seed=61, sparkle=3, sparkle_span=0.25, sparkle_amp=0.12, level=0.20), t, send=0.5)
    t = cue("app-scroll-swish", "phone", 2.92, "scene-phone #ph-scroll fromTo y 0 -> -72 @2.92 d0.7 (power2.out)")
    bus.add(whoosh(0.7, lambda tc: lin(tc, 0, 0.6, 2300, 800, smooth, True), 1.0,
                   lambda x: ienv(x, [(0, 0), (0.12, 1), (0.7, 0)]), lambda x: 0 * x - 0.05, 0.07, 160, width=0.4), t, send=0.15)

    # transición violeta (local 3.42 -> 4.0)
    t_riser0 = cue("transition-riser", "phone", 3.36, "scene-phone #ph-phone to scale 3.3 @3.42 d0.4 (power3.in) -> riser hasta el pico 3.70")
    t_peak = cue("transition-peak-impact", "phone", 3.70, "scene-phone pico lavanda ~3.72 (snapshot 4.95 s: pantalla blanco-violeta); #ph-fx opacity->0 @3.72")
    rd = t_peak - t_riser0
    bus.add(riser(rd, 350.0, 7500.0, 71, level=0.20, tone=(196.0, 988.0), tone_level=0.55, power=2.0), t_riser0, send=0.25)
    cue("light-born-zing", "phone", 3.48, "scene-phone #ph-b-lav/#ph-b-base grow @3.48-3.50; #ph-ring @3.50")
    bus.add(shimmer([A_MIN["A6"], A_MIN["E7"], A_MIN["A7"]], 0.02, 0.04, 0.35, 0.6, seed=62, sparkle=4, sparkle_span=0.2, sparkle_amp=0.12, level=0.14), G("phone", 3.49), send=0.35)
    # glitch: pasos sin interpolar de #ph-cam (jitter x/skewX + RGB split) y barras
    jit = [(3.46, +0.5), (3.49, -0.5), (3.52, +0.3), (3.55, 0.0), (3.58, -0.6), (3.61, 0.0)]
    notes_g = [392.0, 440.0, 523.3, 587.3, 659.3, 784.0, 880.0, 1046.5]
    for i, (lt, pn) in enumerate(jit):
        t = cue("glitch-jitter-%d" % (i + 1), "phone", lt, "scene-phone tl.set #ph-cam x/skewX + drop-shadow RGB split @%.2f" % lt)
        bus.add(glitch(0.05, 80 + i, tone_notes=notes_g, level=0.22 if i < 5 else 0.12, pan=pn, decay=0.03), t, send=0.12)
    bars = {"bar1": [3.47, 3.51, 3.56, 3.61], "bar2": [3.49, 3.54, 3.59, 3.64], "bar3": [3.52, 3.57, 3.62, 3.67]}
    for bi, (nm, lts) in enumerate(bars.items()):
        for j, lt in enumerate(lts[:-1]):
            t = cue("glitch-%s-%d" % (nm, j + 1), "phone", lt, "scene-phone tl.set #ph-%s x/skewX/opacity @%.2f" % (nm, lt))
            bus.add(glitch(0.028, 100 + bi * 10 + j, hold=(2, 8), bits=(2, 4), tone_notes=None, level=0.09, pan=(-0.7, 0.7, 0.0)[bi] * (1 if j % 2 == 0 else -1), decay=0.012), t, send=0.05)
    t = cue("streak-zip", "phone", 3.58, "scene-phone #ph-streak scaleX .05->1 @3.58 d0.14 (power3.out)")
    bus.add(whoosh(0.3, lambda tc: lin(tc, 0, 0.25, 1500, 9000, smooth, True), 0.8,
                   lambda x: ienv(x, [(0, 0), (0.08, 1), (0.3, 0)]), lambda x: 0 * x, 0.06, 170, width=0.9), t, send=0.2)
    t = t_peak
    bus.add(impact(2.2, 170, 65.4, level=1.0, tau=0.06, decay=0.75, drive=2.4, thump=0.45, tail=0.32, seed=24, click=0.2), t, send=0.07)
    bus.add(shimmer([A_MIN["E6"], A_MIN["A6"], A_MIN["C7"], A_MIN["E7"]], 0.03, 0.06, 1.0, 1.8, seed=63, sparkle=10, sparkle_span=0.6, sparkle_amp=0.12, level=0.20), t + 0.005, send=0.5)
    t = cue("transition-dissolve-whoosh", "phone", 3.72, "scene-phone #ph-fx opacity->0 + blur 16 @3.72 d0.28 (disuelve a transparente en 4.0)")
    bus.add(whoosh(0.8, lambda tc: lin(tc, 0, 0.7, 5200, 650, smooth, True), 1.1,
                   lambda x: ienv(x, [(0, 0.1), (0.08, 1), (0.8, 0)]), lambda x: lin(x, 0, 0.8, 0.0, 0.0), 0.15, 180, body=0.35, body_fc=420.0, air=0.25, width=0.8), t, send=0.3)

    # ---------------------------------------------------------------- ESCENA 3 · app (host 4.8)
    pills = [0.2, 0.27, 0.34, 0.41]
    pn = [A_MIN["A6"], A_MIN["C7"], A_MIN["E7"], A_MIN["G7"]]
    for i, lt in enumerate(pills):
        t = cue("pill-in-%d" % (i + 1), "app", lt + 0.08, "scene-app pillEls fromTo @0.2 stagger .07 (pill %d, +0.08 s: ya visible)" % (i + 1))
        bus.add(tick(pn[i], 0.22, -0.45 + 0.3 * i, seed=200 + i), t, send=0.35)
    # fila A
    t = cue("rowA-in-whoosh", "app", 0.45, "scene-app rowA fromTo rotationY -22, x 150 @0.45 d0.75 stagger .1 (power3.out)")
    bus.add(whoosh(0.85, lambda tc: lin(tc, 0, 0.7, 1000, 2600, smooth, True), 1.0,
                   lambda x: ienv(x, [(0, 0), (0.15, 1), (0.85, 0)]), lambda x: lin(x, 0, 0.6, 0.6, -0.05, smooth), 0.17, 210, body=0.25, air=0.2, width=0.5), t, send=0.2)
    for i in range(3):
        t = cue("rowA-click-%d" % (i + 1), "app", 0.45 + 0.1 * i + 0.40, "scene-app #ap-a%d aterriza (inicio %.2f + 0.40)" % (i, 0.45 + 0.1 * i))
        bus.add(microclick(0.42, (-0.5, 0.0, 0.5)[i], seed=220 + i), t, send=0.15)
    t = cue("sel-todo-entradas", "app", 0.9, "scene-app slide(0.9, 124, 156) #ap-sel d0.5 (power3.inOut)")
    bus.add(whoosh(0.4, lambda tc: lin(tc, 0, 0.35, 900, 2200, smooth, True), 0.8, lambda x: ienv(x, [(0, 0), (0.15, 1), (0.4, 0)]), lambda x: lin(x, 0, 0.4, -0.3, -0.2), 0.04, 230, width=0.3), t, send=0.1)
    bus.add(tick(A_MIN["E7"], 0.30, -0.2, seed=231), t + 0.36, send=0.35)
    # fila B asoma
    t = cue("rowB-peek-air", "app", 1.2, "scene-app rowB fromTo opacity .55 blur 5 @1.2 d0.6 stagger .08")
    bus.add(whoosh(0.8, lambda tc: lin(tc, 0, 0.7, 700, 1700, smooth, True), 1.1, lambda x: ienv(x, [(0, 0), (0.4, 1), (0.8, 0)]), lambda x: 0.25 + 0 * x, 0.06, 240, width=0.7), t, send=0.25)
    # salida de A + scroll 1
    t = cue("rowA-out-whoosh", "app", 1.85, "scene-app rowA to opacity 0, blur 16 @1.85 d0.32 stagger .03")
    bus.add(whoosh(0.45, lambda tc: lin(tc, 0, 0.4, 2400, 600, smooth, True), 0.9, lambda x: ienv(x, [(0, 0), (0.14, 1), (0.45, 0)]), lambda x: lin(x, 0, 0.4, 0.0, -0.4), 0.08, 250, width=0.5), t, send=0.18)
    t = cue("scroll1-whoosh", "app", 1.9, "scene-app #ap-scroll fromTo y 0 -> -770 @1.9 d0.6 (power3.inOut)")
    bus.add(whoosh(0.85, lambda tc: lin(tc, 0, 0.6, 380, 2700, smooth, True), 0.95,
                   lambda x: ienv(x, [(0, 0), (0.3, 1), (0.85, 0)]), lambda x: 0.12 * np.sin(2 * np.pi * x / 0.9), 0.20, 260, body=0.55, body_fc=330.0, air=0.18, width=0.6), t, send=0.2)
    t = cue("rowB-in-whoosh", "app", 2.0, "scene-app rowB fromTo opacity .55->1 @2.0 d0.55 stagger .06 (power3.out)")
    bus.add(whoosh(0.7, lambda tc: lin(tc, 0, 0.6, 1100, 2800, smooth, True), 1.0, lambda x: ienv(x, [(0, 0), (0.12, 1), (0.7, 0)]), lambda x: lin(x, 0, 0.6, -0.5, 0.2), 0.10, 270, air=0.2, width=0.5), t + 0.02, send=0.2)
    for i in range(3):
        t = cue("rowB-click-%d" % (i + 1), "app", 2.0 + 0.06 * i + 0.40, "scene-app #ap-b%d aterriza (inicio %.2f + 0.40)" % (i, 2.0 + 0.06 * i))
        bus.add(microclick(0.40, (-0.5, 0.0, 0.5)[i], seed=280 + i), t, send=0.15)
    t = cue("sel-entradas-social", "app", 2.0, "scene-app slide(2.0, 292, 128) #ap-sel d0.5")
    bus.add(tick(A_MIN["G7"], 0.28, 0.0, seed=291), t + 0.36, send=0.35)
    # salida de B + scroll 2 + fila C
    t = cue("rowC-in-whoosh", "app", 3.0, "scene-app #ap-c0/#ap-c1/#ap-c2 fromTo rotationY -22 @3.0/3.15/3.3 d0.75 (power3.out)")
    bus.add(whoosh(0.95, lambda tc: lin(tc, 0, 0.8, 900, 2500, smooth, True), 1.0, lambda x: ienv(x, [(0, 0), (0.18, 1), (0.95, 0)]), lambda x: lin(x, 0, 0.8, 0.5, -0.1, smooth), 0.12, 300, air=0.2, width=0.5), t, send=0.2)
    t = cue("rowB-out-whoosh", "app", 3.15, "scene-app rowB to opacity 0, blur 16 @3.15 d0.32 stagger .03")
    bus.add(whoosh(0.45, lambda tc: lin(tc, 0, 0.4, 2400, 600, smooth, True), 0.9, lambda x: ienv(x, [(0, 0), (0.14, 1), (0.45, 0)]), lambda x: lin(x, 0, 0.4, 0.0, -0.4), 0.07, 310, width=0.5), t, send=0.18)
    t = cue("scroll2-whoosh", "app", 3.2, "scene-app #ap-scroll to y -1540 @3.2 d0.6 (power3.inOut)")
    bus.add(whoosh(0.85, lambda tc: lin(tc, 0, 0.6, 420, 3000, smooth, True), 0.95,
                   lambda x: ienv(x, [(0, 0), (0.3, 1), (0.85, 0)]), lambda x: -0.12 * np.sin(2 * np.pi * x / 0.9), 0.20, 320, body=0.55, body_fc=340.0, air=0.18, width=0.6), t, send=0.2)
    for i in range(3):
        t = cue("rowC-click-%d" % (i + 1), "app", 3.0 + 0.15 * i + 0.40, "scene-app #ap-c%d aterriza (inicio %.2f + 0.40)" % (i, 3.0 + 0.15 * i))
        bus.add(microclick(0.40, (-0.5, 0.0, 0.5)[i], seed=330 + i), t, send=0.15)
    t = cue("sel-social-experiencias", "app", 3.3, "scene-app slide(3.3, 432, 196) #ap-sel d0.5")
    bus.add(tick(A_MIN["A7"], 0.28, 0.2, seed=341), t + 0.36, send=0.35)
    # salida de la escena 3
    t = cue("app-exit-anticipation", "app", 4.45, "scene-app hold (4.45 -> 5.1, board drifting, clips playing) -> swell that leads into the exit recede at 5.1")
    bus.add(whoosh(0.95, lambda tc: lin(tc, 0, 0.9, 420, 2400, smooth, True), 0.9,
                   lambda x: ienv(x, [(0, 0), (0.6, 0.5), (0.95, 0)]), lambda x: lin(x, 0, 0.9, -0.3, 0.3), 0.10, 355, body=0.2, body_fc=240.0, air=0.1, width=0.9), t, send=0.3)
    t = cue("app-exit-recede", "app", 5.1, "scene-app exit: #ap-board to z -320 @5.1 d0.7 (power2.in); pills/cards blur 20 fade")
    bus.add(whoosh(0.8, lambda tc: lin(tc, 0, 0.7, 3200, 420, smooth, True), 1.0,
                   lambda x: ienv(x, [(0, 0), (0.55, 1), (0.8, 0.1)]), lambda x: 0 * x, 0.15, 350, body=0.3, body_fc=300.0, air=0.1, width=0.7), t - 0.05, send=0.25)

    # ---------------------------------------------------------------- ESCENA 4 · texto (host 10.3)
    t = cue("text-descubre-in", "text", 0.1, "scene-text #tx-l1w1 fromTo blur 18->0, tracking 0.45em->-0.01em @0.10 d0.6")
    bus.add(whoosh(0.8, lambda tc: lin(tc, 0, 0.6, 2800, 1200, smooth, True), 0.7,
                   lambda x: ienv(x, [(0, 0), (0.28, 1), (0.8, 0)]), lambda x: 0 * x, 0.09, 400, air=0.25, width=0.8), t, send=0.3)
    t = cue("text-streak-in", "text", 0.46, "scene-text #tx-l1w2 x 220->0 @0.46 d0.62 / #tx-l1w3 @0.52 d0.64 (power3.out) + motion blur")
    bus.add(whoosh(0.9, lambda tc: lin(tc, 0, 0.7, 3600, 900, smooth, True), 0.9,
                   lambda x: ienv(x, [(0, 0), (0.1, 1), (0.9, 0)]), lambda x: lin(x, 0, 0.75, 0.85, -0.25, smooth), 0.22, 410, body=0.25, air=0.25, width=0.4), t - 0.02, send=0.25)
    t = cue("text-line1-exit", "text", 1.7, "scene-text L1_WORDS: x collapse + blur 22 @1.7 d0.3 (power2.inOut), opacity->0 @1.74")
    bus.add(whoosh(0.5, lambda tc: lin(tc, 0, 0.4, 3000, 650, smooth, True), 0.9, lambda x: ienv(x, [(0, 0), (0.15, 1), (0.5, 0)]), lambda x: 0 * x, 0.14, 420, body=0.2, air=0.12, width=0.7), t, send=0.25)
    t = cue("text-line2-in", "text", 2.05, "scene-text L2_WORDS fromTo x +-91.5.. blur 20->0 @2.05 d0.5 (power3.out)")
    bus.add(whoosh(0.7, lambda tc: lin(tc, 0, 0.55, 800, 2600, smooth, True), 0.9, lambda x: ienv(x, [(0, 0), (0.2, 1), (0.7, 0)]), lambda x: 0 * x, 0.13, 430, air=0.2, width=0.9), t, send=0.28)
    t = cue("text-accent-light", "text", 2.45 + 0.1, "scene-text #tx-l2s4 color -> #9af7ff @2.45 d0.3 + scale pop 1.03 @2.45 d0.15")
    bus.add(shimmer([A_MIN["A6"], A_MIN["C7"], A_MIN["E7"], A_MIN["A7"]], 0.04, 0.07, 0.9, 1.6, seed=64, sparkle=6, sparkle_span=0.5, sparkle_amp=0.12, level=0.30), t, send=0.5)
    t = cue("text-line2-exit", "text", 3.45, "scene-text L2_WORDS exit collapse + blur 22 @3.45 d0.29, opacity->0 @3.52")
    bus.add(whoosh(0.5, lambda tc: lin(tc, 0, 0.4, 3000, 650, smooth, True), 0.9, lambda x: ienv(x, [(0, 0), (0.15, 1), (0.5, 0)]), lambda x: 0 * x, 0.14, 440, body=0.2, air=0.12, width=0.7), t, send=0.25)

    # ---------------------------------------------------------------- ESCENA 5 · cierre (host 13.7)
    t = cue("bg-gather-suction", "outro", -0.2, "index.html chain(#bg-glow/#bg-core) t13.5 -> 14.4 (el glow se recoge a un orbe, power3.inOut)")
    bus.add(whoosh(0.9, lambda tc: lin(tc, 0, 0.8, 500, 5200, smooth, True), 0.8,
                   lambda x: ienv(x, [(0, 0), (0.7, 1), (0.9, 0.5)]), lambda x: 0 * x, 0.10, 450, body=0.3, body_fc=220.0, air=0.1, width=0.9), t, send=0.35)
    t = cue("orb-born", "outro", 0.06, "scene-outro #ou-orbwrap fromTo scale .3 blur 14 @0.06 d0.4 (power2.out)")
    bus.add(shimmer([A_MIN["A5"], A_MIN["E6"], A_MIN["A6"]], 0.05, 0.10, 0.9, 1.5, seed=65, sparkle=3, sparkle_span=0.3, sparkle_amp=0.10, level=0.24), t, send=0.55)
    t = cue("orb-beat", "outro", 0.46, "scene-outro #ou-orbwrap to scale 1.2 @0.46 d0.118 (late) / 0.94 @0.58")
    bus.add(impact(0.7, 125, 82.4, level=0.50, tau=0.05, decay=0.3, drive=2.0, thump=0.3, tail=0.12, seed=25), t, send=0.06)
    bus.add(tick(A_MIN["E6"], 0.12, 0.0, decay=0.03, seed=66), t, send=0.5)
    t = cue("orb-beat-echo", "outro", 0.58, "scene-outro #ou-orbwrap to scale 0.94 @0.58 d0.1 (rebote)")
    bus.add(impact(0.5, 110, 82.4, level=0.20, tau=0.05, decay=0.2, drive=1.6, thump=0.2, tail=0.05, seed=26), t, send=0.06)
    t = cue("icon-form-hit", "outro", 0.68, "scene-outro #ou-orbwrap scale -> 229/110 @0.68 d0.58 (back.out 1.2) + #ou-flash opacity .85 @0.68")
    bus.add(impact(2.4, 190, 55.0, level=0.92, tau=0.07, decay=0.85, drive=2.4, thump=0.4, tail=0.32, seed=27, click=0.18), t, send=0.07)
    bus.add(shimmer([A_MIN["A5"], A_MIN["C6"], A_MIN["E6"], A_MIN["A6"], A_MIN["C7"], A_MIN["E7"], A_MIN["A7"]], 0.038, 0.07, 1.7, 2.6, seed=67,
                    sparkle=14, sparkle_span=0.9, sparkle_amp=0.12, level=0.30), t + 0.005, send=0.6)
    t = cue("icon-glyph-iris", "outro", 0.72, "scene-outro #ou-reveal --ra 0->200 @0.72 d0.42 (el glifo aparece con iris)")
    bus.add(whoosh(0.55, lambda tc: lin(tc, 0, 0.45, 700, 4200, smooth, True), 0.8, lambda x: ienv(x, [(0, 0), (0.22, 1), (0.55, 0)]), lambda x: 0 * x, 0.09, 460, air=0.3, width=0.9), t, send=0.35)
    t = cue("icon-ring", "outro", 0.98, "scene-outro #ou-ring opacity .8->0 scale 1->1.7 @0.98 d0.55")
    bus.add(ding(A_MIN["E7"], 0.0, 0.10, decay=0.35, dur=1.0, seed=35), t, send=0.6)
    t = cue("lockup-slide-whoosh", "outro", 1.05, "scene-outro POS x 335->0 + #ou-wslide + #ou-wmask @1.05 d0.62 (power3.inOut)")
    bus.add(whoosh(0.85, lambda tc: lin(tc, 0, 0.62, 700, 2300, smooth, True), 0.95,
                   lambda x: ienv(x, [(0, 0), (0.34, 1), (0.85, 0)]), lambda x: lin(x, 0, 0.62, 0.45, -0.3, smooth), 0.13, 470, body=0.2, air=0.15, width=0.8), t, send=0.3)
    t = cue("url-line-zip", "outro", 1.42, "scene-outro #ou-url fromTo y 14 -> 0 @1.42 d0.5 / #ou-line scaleX 0->1 @1.48 d0.55")
    bus.add(whoosh(0.6, lambda tc: lin(tc, 0, 0.5, 1600, 5200, smooth, True), 0.9, lambda x: ienv(x, [(0, 0), (0.2, 1), (0.6, 0)]), lambda x: 0 * x, 0.06, 480, air=0.2, width=1.0), t + 0.04, send=0.3)
    bus.add(tick(A_MIN["A7"], 0.14, 0.0, decay=0.05, seed=36), t + 0.12, send=0.6)
    t = cue("lockup-settle", "outro", 1.67, "scene-outro fin del deslizamiento del lockup (1.05 + 0.62) -> lockup final centrado")
    bus.add(impact(1.0, 100, 55.0, level=0.34, tau=0.05, decay=0.5, drive=1.8, thump=0.25, tail=0.12, seed=28), t - 0.01, send=0.07)
    bus.add(ding(A_MIN["E6"], -0.1, 0.20, decay=0.55, dur=1.0, seed=37), t, send=0.6)
    bus.add(ding(A_MIN["A6"], 0.1, 0.16, decay=0.55, dur=1.0, seed=38), t + 0.07, send=0.6)

    # ---------------------------------------------------------------- reverb + master
    ir = make_ir(1.25, 7)
    wet = convolve(bus.send, ir)
    mix = bus.dry + wet * 0.55
    return mix


# ======================================================================================================
# MUSICA
# ======================================================================================================
def midi(m):
    return 440.0 * 2.0 ** ((np.asarray(m, float) - 69.0) / 12.0)


# (inicio, nombre, raiz sub (midi), notas pad (midi), nivel sub, nivel pad)
CHORDS = [
    (0.00, "Am9",    45, [52, 57, 60, 64, 71], 0.55, 1.00),
    (2.40, "Fmaj9",  41, [48, 57, 60, 64, 67], 0.60, 1.00),
    (4.90, "Cmaj9",  36, [55, 60, 64, 67, 74], 0.75, 1.05),    # entra con el impacto de la app
    (7.40, "Gadd9",  43, [50, 59, 62, 69, 74], 0.65, 1.05),
    (10.30, "Fmaj7", 41, [60, 64, 69, 72, 76], 0.00, 0.85),    # texto: sin sub, voces altas -> mas ligero
    (12.30, "Dm9",   38, [53, 57, 60, 64, 69], 0.35, 0.90),
    (13.50, "E7sus4", 40, [59, 64, 69, 74, 76], 0.40, 0.90),   # tension: el glow se recoge
    (14.38, "Am9",   33, [52, 57, 60, 64, 71, 81], 0.90, 1.10),  # resolucion con el icono
]
CH_END = [c[0] for c in CHORDS[1:]] + [DUR]
HIT_DUCKS = [   # (t, profundidad dB, release s): sidechain bajo impactos grandes
    (1.00, 3.0, 0.45), (2.14, 1.5, 0.3), (3.34, 1.5, 0.3), (4.90, 7.0, 0.95), (14.16, 3.0, 0.4), (14.38, 5.5, 0.9), (15.37, 2.0, 0.5),
]


def pad_voice(note_midi, t0, t1, a, r, seed, hmax=22):
    """un acorde-nota: 3 osciladores desafinados (+-7 cents) con vibrato lento, armonicos 1/k."""
    ts, te = t0 - a, t1 + r
    i0 = max(0, int(ts * SR))
    i1 = min(N, int(te * SR))
    t = np.arange(i0, i1) / SR
    env = smooth((t - (t0 - a * 0.5)) / a) * (1 - smooth((t - (t1 - r * 0.5)) / r))
    f0 = float(midi(note_midi))
    rng = np.random.default_rng(seed)
    L = np.zeros(len(t))
    R = np.zeros(len(t))
    for k, (cents, pan) in enumerate(((-7.0, -0.6), (0.0, 0.0), (7.0, 0.6))):
        f = f0 * 2 ** (cents / 1200)
        rate = 0.11 + 0.07 * k
        dep = 0.0016
        phi = 2 * np.pi * f * (t + (dep / (2 * np.pi * rate)) * np.sin(2 * np.pi * rate * t + rng.uniform(0, 6.28)))
        sig = np.zeros(len(t))
        kmax = int(min(hmax, 6000.0 / f))
        for h in range(1, kmax + 1):
            sig += np.sin(h * phi) / h ** 1.05
        gl, gr = pan_gains(pan)
        L += sig * gl
        R += sig * gr
    return i0, i1, L * env, R * env


def build_music():
    pad = np.zeros((2, N))
    sub = np.zeros(N)
    for ci, (t0, name, root, notes, sublvl, padlvl) in enumerate(CHORDS):
        t1 = CH_END[ci]
        a = 0.55 if ci not in (7,) else 0.18      # el acorde final entra casi de golpe con el icono
        r = 0.55
        if ci == 0:
            a = 0.2
        for j, nm in enumerate(notes):
            i0, i1, L, R = pad_voice(nm, t0, t1 if ci < len(CHORDS) - 1 else DUR + 0.5, a, r if ci < len(CHORDS) - 1 else 0.4, seed=1000 + ci * 10 + j)
            lvl = padlvl * (0.9 if j == len(notes) - 1 else 1.0) * (0.6 if nm >= 80 else 1.0)
            pad[0, i0:i1] += L * lvl
            pad[1, i0:i1] += R * lvl
        if sublvl > 0:
            ts, te = t0 - 0.4, t1 + 0.4
            i0, i1 = max(0, int(ts * SR)), min(N, int(te * SR))
            t = np.arange(i0, i1) / SR
            env = smooth((t - (t0 - 0.2)) / 0.4) * (1 - smooth((t - (t1 - 0.2)) / 0.4))
            f = float(midi(root))
            s = np.sin(2 * np.pi * f * t) + 0.16 * np.sin(4 * np.pi * f * t + 0.5)
            sub[i0:i1] += s * env * sublvl
    # normaliza el pad (que no dependa del numero de notas)
    pad /= (np.max(np.abs(pad)) + 1e-9)
    # paso bajo STFT con corte variable: oscuro al inicio, se abre con la app, se aligera en el texto, resuelve y se cierra
    fc_pts = [(0.0, 520), (1.6, 620), (2.4, 800), (3.4, 950), (4.7, 1100), (4.95, 2300), (6.5, 1800), (7.4, 2000), (9.6, 2100),
              (10.3, 1500), (12.0, 1700), (13.4, 1500), (14.0, 1000), (14.38, 2300), (15.0, 1500), (15.9, 700)]
    def fcf(tc):
        ts = np.array([p[0] for p in fc_pts]); vs = np.log([p[1] for p in fc_pts])
        return np.exp(np.interp(tc, ts, vs))
    padf = np.stack([stft_filter(pad[c], lambda tc, f: lp_mask(f, fcf(tc), 4), 2048, 512) for c in range(2)])
    # pulso muy discreto: bombo-seno suave cada negra (120 bpm) bajo y filtrado
    pulse = np.zeros(N)
    pl = ienv(np.arange(N) / SR, [(1.9, 0), (4.9, 0.45), (5.5, 0.8), (10.0, 0.8), (10.6, 0.35), (13.4, 0.28), (14.0, 0.0)])
    kn = int(0.32 * SR)
    kt = np.arange(kn) / SR
    kf = 52 + 90 * np.exp(-kt / 0.03)
    kick = np.sin(2 * np.pi * np.cumsum(kf) / SR) * np.exp(-kt / 0.085) * (1 - np.exp(-kt / 0.003))
    kick = np.tanh(1.6 * kick) / np.tanh(1.6)
    for bt in np.arange(2.0, 14.0, 0.5):
        i0 = int(round(bt * SR))
        g = pl[min(N - 1, i0)] * (1.0 if int(round(bt / 0.5)) % 2 == 0 else 0.62)   # tiempos fuertes / flojos
        if g > 0.01:
            pulse[i0:i0 + kn] += kick[:min(kn, N - i0)] * g
    # dinamica macro
    tt = np.arange(N) / SR
    macro = ienv(tt, [(0, 0.55), (1.0, 0.62), (2.2, 0.70), (4.5, 0.78), (4.95, 1.0), (10.0, 1.0), (10.6, 0.80), (12.3, 0.84), (13.9, 0.90),
                      (14.38, 1.0), (15.0, 0.95), (15.9, 0.8)])
    # sidechain
    duck = np.ones(N)
    for (ht, depth, rel) in HIT_DUCKS:
        gdb = -depth
        a = np.where(tt < ht - 0.02, 0.0, np.where(tt < ht + 0.005, (tt - (ht - 0.02)) / 0.025, np.exp(-(tt - (ht + 0.005)) / rel)))
        duck *= 10 ** (gdb * a / 20)
    music = np.zeros((2, N))
    music[0] = padf[0] * 0.80 + sub * 0.34 + pulse * 0.26
    music[1] = padf[1] * 0.80 + sub * 0.34 + pulse * 0.26
    music *= macro * duck
    # reverb de sala larga muy suave (el pad ya es denso)
    ir = make_ir(2.2, 11, damp_hz=3500.0)
    music = music + convolve(music, ir) * 0.28
    return music


# ======================================================================================================
def write_wav(path, x):
    x = np.clip(x, -1.0, 1.0)
    rng = np.random.default_rng(12345)
    d = (rng.random(x.shape) - rng.random(x.shape)) / 32768.0 * 0.6       # TPDF ~ 0.6 LSB
    q = np.round((x + d) * 32767.0).astype("<i2")
    q[:, -240:] = np.round(x[:, -240:] * 32767.0).astype("<i2")
    q[:, -1] = 0
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(q.T.copy().tobytes())


def master_sfx(mix):
    x = dc_hp(mix, 24.0)
    x = np.stack([fft_filter(np.concatenate([x[c], np.zeros(2048)]), lambda f: lp_mask(f, 12500.0, 2))[:x.shape[1]] for c in range(2)])
    ceil = 10 ** (SFX_PEAK_DB / 20)
    pk = np.max(np.abs(x))
    x = x * (ceil / pk) * 10 ** (SFX_DRIVE_DB / 20)
    x, gr = limiter(x, ceil)
    x = fades(x)
    return x, gr


SFX_DRIVE_DB = 5.5


def main():
    want_cues = "--cues" in sys.argv
    cj = None
    if "--cues-json" in sys.argv:
        cj = sys.argv[sys.argv.index("--cues-json") + 1]
    os.makedirs(OUT_DIR, exist_ok=True)
    sfx_raw = build_sfx()
    sfx, gr = master_sfx(sfx_raw)
    music = build_music()
    music = dc_hp(music, 28.0)
    music = music * (10 ** (MUSIC_PEAK_DB / 20) / np.max(np.abs(music)))
    music = fades(music)
    write_wav(os.path.join(OUT_DIR, "sfx.wav"), sfx)
    write_wav(os.path.join(OUT_DIR, "music.wav"), music)
    print("sfx   peak %.2f dBFS  limiter max GR %.2f dB" % (peak_db(sfx), -20 * np.log10(gr)))
    print("music peak %.2f dBFS" % peak_db(music))
    if want_cues:
        for n_, t_, s_ in sorted(CUES, key=lambda c: c[1]):
            print("%-28s %7.3f  %s" % (n_, t_, s_))
    if cj:
        with open(cj, "w") as f:
            json.dump(sorted([{"name": n_, "t": t_, "src": s_} for n_, t_, s_ in CUES], key=lambda c: c["t"]), f, indent=1)


if __name__ == "__main__":
    main()
