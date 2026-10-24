"""Fetch layer for Songsterr: turn a song URL/ID into raw note data.
Reverse engineered from Songsterr's API and player CDN.
"""
from __future__ import annotations

import gzip
import json
import re
import urllib.request
import urllib.error

META = "https://www.songsterr.com/api/meta/{song_id}"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"

STAGE_HOST = "d3d3l6a6rcgkaf"
NORMAL_HOSTS = ["dqsljvtekg760", "d34shlm8p2ums2", "d3cqchs6g3b5ew"]
LEGACY_HOSTS = ["d3rrfvx08uyjp1", "dodkcbujl0ebx", "dj1usja78sinh"]


def part_url(image, song_id, revision_id, part_id, attempt=0):
    if image and image.endswith("-stage"):
        host = STAGE_HOST
    elif image:
        host = NORMAL_HOSTS[attempt % len(NORMAL_HOSTS)]
    else:
        host = LEGACY_HOSTS[attempt % len(LEGACY_HOSTS)]
        return f"https://{host}.cloudfront.net/part/{revision_id}/{part_id}"
    return f"https://{host}.cloudfront.net/{song_id}/{revision_id}/{image}/{part_id}.json"


def extract_song_id(url_or_id: str) -> int:
    s = str(url_or_id).strip()
    if s.isdigit():
        return int(s)
    m = re.search(r"-s(\d+)\b", s)
    if m:
        return int(m.group(1))
    m = re.search(r"(\d{3,})", s)
    if m:
        return int(m.group(1))
    raise ValueError(f"No se pudo encontrar el ID de la cancion en: {url_or_id!r}")


def _get(url: str) -> bytes:
    req = urllib.request.Request(
        url, headers={"User-Agent": UA, "Accept": "*/*", "Accept-Encoding": "gzip"}
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = resp.read()
    if data[:2] == b"\x1f\x8b":
        data = gzip.decompress(data)
    return data


def get_meta(song_id: int) -> dict:
    return json.loads(_get(META.format(song_id=song_id)))


def fetch_part(song_id: int, revision_id: int, image: str, part_id: int) -> dict:
    last = None
    for attempt in range(3):
        url = part_url(image, song_id, revision_id, part_id, attempt)
        try:
            return json.loads(_get(url))
        except urllib.error.HTTPError as e:
            last = e
            if e.code not in (403, 404, 500, 502, 503):
                raise
    raise last


def fetch_song(url_or_id: str):
    song_id = extract_song_id(url_or_id)
    meta = get_meta(song_id)
    revision_id = meta["revisionId"]
    image = meta["image"]
    tracks = meta.get("tracks", [])
    parts = []
    for i in range(len(tracks)):
        try:
            parts.append(fetch_part(song_id, revision_id, image, i))
        except urllib.error.HTTPError as e:
            parts.append(None)
    return meta, parts
