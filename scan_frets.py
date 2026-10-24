from songsterr import fetch_part, get_meta

for sid in [20, 79, 258]:
    try:
        meta = get_meta(sid)
        for i, t in enumerate(meta.get('tracks', [])):
            name = (t.get('name') or '').lower()
            instr = (t.get('instrument') or '').lower()
            if t.get('instrumentId') == 1024 or 'drum' in name or 'drum' in instr:
                part = fetch_part(sid, meta['revisionId'], meta['image'], i)
                frets = {}
                for m in part.get('measures', []):
                    for v in m.get('voices', []):
                        for b in v.get('beats', []):
                            for n in b.get('notes', []):
                                if not n.get('rest'):
                                    f = n.get('fret')
                                    s = n.get('string')
                                    frets.setdefault(f, set()).add(s)
                print(f"Song {sid} ({meta.get('title')}):")
                for f in sorted(frets.keys()):
                    print(f"  Fret {f}: {frets[f]}")
                break
    except Exception as e:
        print(f"Error {sid}: {e}")
