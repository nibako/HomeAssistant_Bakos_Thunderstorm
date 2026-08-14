#!/usr/bin/env python3
"""Generate deterministic CC0 replacement rain/thunder assets for the public build."""
from __future__ import annotations

import math
import subprocess
import tempfile
import wave
from pathlib import Path

import numpy as np

SR = 44100
OUT = Path('/app/audio')
OUT.mkdir(parents=True, exist_ok=True)


def write_wav(path: Path, audio: np.ndarray) -> None:
    audio = np.clip(audio, -1.0, 1.0)
    pcm = (audio * 32767.0).astype('<i2')
    with wave.open(str(path), 'wb') as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        wf.writeframes(pcm.tobytes())


def encode_m4a(wav_path: Path, out_path: Path) -> None:
    subprocess.run([
        'ffmpeg', '-hide_banner', '-loglevel', 'error', '-y',
        '-i', str(wav_path), '-c:a', 'aac', '-b:a', '192k', str(out_path)
    ], check=True)


def smooth(x: np.ndarray, size: int) -> np.ndarray:
    if size <= 1:
        return x
    kernel = np.ones(size, dtype=np.float32) / float(size)
    return np.convolve(x, kernel, mode='same').astype(np.float32)


def rain(seed: int = 1408, seconds: float = 75.0) -> np.ndarray:
    rng = np.random.default_rng(seed)
    n = int(SR * seconds)
    # Broad rain bed: bright noise + slower moving texture + sparse droplet ticks.
    white_l = rng.normal(0, 1, n).astype(np.float32)
    white_r = rng.normal(0, 1, n).astype(np.float32)
    low_l = smooth(rng.normal(0, 1, n).astype(np.float32), 180)
    low_r = smooth(rng.normal(0, 1, n).astype(np.float32), 220)
    bed_l = 0.19 * white_l + 0.42 * low_l
    bed_r = 0.19 * white_r + 0.42 * low_r

    # Gentle slow amplitude motion keeps a loop from sounding static.
    t = np.arange(n, dtype=np.float32) / SR
    motion = 0.82 + 0.10 * np.sin(2 * np.pi * 0.071 * t) + 0.05 * np.sin(2 * np.pi * 0.113 * t + 1.7)
    bed_l *= motion
    bed_r *= motion[::-1]

    # Sparse short droplets.
    for _ in range(int(seconds * 10)):
        pos = int(rng.integers(0, max(1, n - 900)))
        length = int(rng.integers(120, 700))
        env = np.exp(-np.linspace(0, 8, length, dtype=np.float32))
        freq = float(rng.uniform(1600, 5200))
        phase = np.linspace(0, 2 * np.pi * freq * length / SR, length, dtype=np.float32)
        tick = np.sin(phase) * env * float(rng.uniform(0.02, 0.09))
        if rng.random() < 0.5:
            bed_l[pos:pos+length] += tick
        else:
            bed_r[pos:pos+length] += tick

    stereo = np.column_stack((bed_l, bed_r))
    peak = max(1e-6, float(np.max(np.abs(stereo))))
    return (stereo / peak * 0.48).astype(np.float32)


def thunder(seed: int, seconds: float, close: bool) -> np.ndarray:
    rng = np.random.default_rng(seed)
    n = int(SR * seconds)
    t = np.arange(n, dtype=np.float32) / SR
    out_l = np.zeros(n, dtype=np.float32)
    out_r = np.zeros(n, dtype=np.float32)

    # Initial crack for close thunder, softer attack for mid-distance.
    if close:
        crack_len = min(n, int(SR * 0.18))
        crack = rng.normal(0, 1, crack_len).astype(np.float32)
        crack *= np.exp(-np.linspace(0, 15, crack_len, dtype=np.float32))
        out_l[:crack_len] += crack * 0.95
        out_r[:crack_len] += crack[::-1] * 0.85

    # Several rolling low-frequency bursts.
    burst_count = 7 if close else 5
    for i in range(burst_count):
        start_s = (0.05 if close else 0.12) + i * (seconds * 0.72 / burst_count) + float(rng.uniform(0, 0.22))
        start = int(start_s * SR)
        if start >= n:
            continue
        dur_s = min(seconds - start_s, float(rng.uniform(0.7, 2.3 if close else 1.8)))
        length = max(1, int(dur_s * SR))
        tt = np.arange(length, dtype=np.float32) / SR
        base = rng.normal(0, 1, length).astype(np.float32)
        rumble = smooth(base, int(rng.integers(90, 260)))
        f1 = float(rng.uniform(24, 48))
        f2 = float(rng.uniform(48, 88))
        tone = 0.55 * np.sin(2 * np.pi * f1 * tt + float(rng.uniform(0, 6.28)))
        tone += 0.23 * np.sin(2 * np.pi * f2 * tt + float(rng.uniform(0, 6.28)))
        env = np.exp(-tt / max(0.25, dur_s * float(rng.uniform(0.35, 0.75))))
        attack = np.clip(tt / 0.025, 0, 1)
        burst = (0.9 * rumble + tone) * env * attack
        gain = (0.70 if close else 0.50) * (1.0 - i / (burst_count * 1.8))
        pan = float(rng.uniform(-0.28, 0.28))
        end = min(n, start + length)
        sl = burst[:end-start] * gain
        out_l[start:end] += sl * (1.0 - max(0.0, pan))
        out_r[start:end] += sl * (1.0 + min(0.0, pan))

    # Long decaying atmospheric tail.
    noise = smooth(rng.normal(0, 1, n).astype(np.float32), 320)
    tail_env = np.exp(-t / max(1.2, seconds * 0.42))
    out_l += noise * tail_env * (0.28 if close else 0.22)
    out_r += np.roll(noise, 131) * tail_env * (0.25 if close else 0.20)

    stereo = np.column_stack((out_l, out_r))
    peak = max(1e-6, float(np.max(np.abs(stereo))))
    target = 0.94 if close else 0.72
    return (stereo / peak * target).astype(np.float32)


def build(name: str, audio: np.ndarray) -> None:
    with tempfile.TemporaryDirectory() as td:
        wav_path = Path(td) / 'source.wav'
        write_wav(wav_path, audio)
        encode_m4a(wav_path, OUT / name)
    print(f'generated {name}')


build('rain-heavy.m4a', rain())
build('thunder-mid-1.m4a', thunder(101, 3.2, False))
build('thunder-mid-2.m4a', thunder(202, 6.1, False))
build('thunder-close-1.m4a', thunder(303, 12.8, True))
build('thunder-close-2.m4a', thunder(404, 7.6, True))
