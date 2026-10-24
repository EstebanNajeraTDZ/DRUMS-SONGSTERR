import json
from songsterr import fetch_part, get_meta

meta = get_meta(9374)
part = fetch_part(9374, meta['revisionId'], meta['image'], 14)

print('Inspecting measures 0 to 6 of Hoobastank - The Reason:')
for m_idx in range(7):
    m = part['measures'][m_idx]
    print(f'=== Measure {m_idx + 1} (idx {m_idx}) ===')
    for v_idx, v in enumerate(m.get('voices', [])):
        beats = v.get('beats', [])
        for b_idx, b in enumerate(beats):
            notes = b.get('notes', [])
            for n in notes:
                print(f'  v{v_idx} b{b_idx} dur={b.get("duration")}: fret={n.get("fret")} string={n.get("string")} rest={n.get("rest")} keys={list(n.keys())}')
