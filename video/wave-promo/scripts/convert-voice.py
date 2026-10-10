#!/usr/bin/env python3
"""Cambia el TIMBRE de las fuentes castellanas con la conversión de voz de Chatterbox (S3Gen, MIT), conservando fonemas y acento.

El tokenizador de voz de Chatterbox (25 Hz) guarda el contenido fonético (incluida la /θ/ de «social» y la jota), así que la conversión mantiene el castellano;
solo cambian timbre y calidad de voz, que copian la referencia (assets/audio/ref/ref-sintetica-kokoro.wav: ~8 s generados con Kokoro, sin audio de ninguna persona real).
No carga el T3 (ni el modelo de 2 GB): solo s3gen.pt de la caché de Hugging Face (ResembleAI/chatterbox).

Uso: python convert-voice.py <referencia.wav> <carpeta de salida> <fuente1.wav> [fuente2.wav …]     (necesita chatterbox-tts, torch, torchaudio)
"""
import glob, os, sys
import torch, torchaudio as ta
from chatterbox.models.s3gen import S3Gen
from chatterbox.vc import ChatterboxVC

torch.set_num_threads(4)
torch.manual_seed(0)   # el ruido inicial del flujo (CFM) también es aleatorio
SNAP = glob.glob(os.path.expanduser("~/.cache/huggingface/hub/models--ResembleAI--chatterbox/snapshots/*"))[0]

if __name__ == "__main__":
    ref, outdir, sources = sys.argv[1], sys.argv[2], sys.argv[3:]
    os.makedirs(outdir, exist_ok=True)
    s3 = S3Gen()
    s3.load_state_dict(torch.load(SNAP + "/s3gen.pt", map_location="cpu", weights_only=True))
    s3.eval()
    vc = ChatterboxVC(s3, "cpu")
    vc.set_target_voice(ref)
    for src in sources:
        wav = vc.generate(src)
        out = f"{outdir}/{os.path.basename(src)}"
        ta.save(out, wav, vc.sr)
        print("ok", out, round(wav.shape[-1] / vc.sr, 2), "s")
