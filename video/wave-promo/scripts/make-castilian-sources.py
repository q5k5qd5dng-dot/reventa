#!/usr/bin/env python3
"""Fuentes con acento castellano (España) para la locución: Kokoro-82M, voz de serie «ef_dora», texto escrito en IPA.

Por qué IPA: Chatterbox habla español con seseo (ver make-voice.py); escribiendo los fonemas a mano (/θ/ para z/c, jota /x/, vocales puras, «app» = /ap/,
«online» = /onlaɪn/) se fija la pronunciación de España. Después scripts/convert-voice.py cambia el timbre (Chatterbox VC) conservando el acento.
Elegidas entre 16 variantes (velocidad 0.95/1.05, IPA con ɛ o e, 6 grafías de «Wave») por: ASR literal, /θ/ de «social» y /x/ de «junta» en la conversión,
H1−H2/HNR (firmeza), duración, curva de entonación y, en «Wave», la longitud del glide /w/ (F2 inicial < 900 Hz ≈ 100 ms) y la /v/ final.

Uso: python make-castilian-sources.py <carpeta de salida>      (necesita kokoro-onnx, soundfile; modelos de Kokoro en ~/.cache/hyperframes/tts)
Salida: p1.wav … p5.wav (24 kHz mono)
"""
import os, sys
import soundfile as sf
from kokoro_onnx import Kokoro

M = os.path.expanduser("~/.cache/hyperframes/tts/models/kokoro-v1.0.onnx")
V = os.path.expanduser("~/.cache/hyperframes/tts/voices/voices-v1.0.bin")

# pieza -> (IPA, velocidad)
PIECES = {
    "p1": ("la ˈap ke xˈunta βˈenta ðe entɾˈaðas onlˈaɪn", 1.05),             # «La app que junta venta de entradas online»
    "p2": ("kon rˈed soθjˈal pˌaɾa los ˌasistˈɛntes ðe las fjˈestas.", 0.95),  # «con red social para los asistentes de las fiestas.»
    "p3": ("deskˈuβɾe ðˈonde salˈiɾ,", 1.05),                                  # «Descubre dónde salir,»
    "p4": ("i kˈompɾa tu entɾˈaða.", 0.95),                                    # «y compra tu entrada.»
    "p5": ("wwˈeɪvv.", 0.95),                                                  # «Wave.» /weɪv/ con w larga y v final larga
}

if __name__ == "__main__":
    out = sys.argv[1]
    os.makedirs(out, exist_ok=True)
    k = Kokoro(M, V)
    for name, (ipa, speed) in PIECES.items():
        a, sr = k.create(ipa, k.voices["ef_dora"], speed=speed, is_phonemes=True, trim=True)
        sf.write(f"{out}/{name}.wav", a, sr, subtype="PCM_16")
        print(name, round(len(a) / sr, 2), "s")
