from songsterr import get_meta, fetch_part
from drum_engine import parse_songsterr_drum_track

meta = get_meta(9374)
part = fetch_part(9374, meta['revisionId'], meta['image'], 14)
parsed = parse_songsterr_drum_track(part, meta)

m4 = parsed['measures'][3] # Measure 4
print('=== MEASURE 4 PARSED NOTES ===')
for n in m4['notes']:
    t = n['tick']
    r = n['row']
    sub = n['sub_type']
    head = n['head_type']
    sym = n['symbol']
    stk = n['sticking']
    print(f"tick={t:4d} | row={r:7s} | sub_type={sub:10s} | head={head:12s} | sym={sym.encode('ascii', 'replace').decode()} | stick={stk}")
