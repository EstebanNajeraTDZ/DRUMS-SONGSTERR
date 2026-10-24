import urllib.request, json, gzip, sys, os
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.abspath('.'))
from songsterr import get_meta

from drum_engine import parse_songsterr_drum_track

meta = get_meta(2664276)
raw = urllib.request.urlopen(urllib.request.Request('https://dqsljvtekg760.cloudfront.net/2664276/3512126/v4-6-3-5Kb0w84likLht501/1.json', headers={'User-Agent': 'Mozilla/5.0'}), timeout=10).read()
part = json.loads(gzip.decompress(raw) if raw[:2] == b'\x1f\x8b' else raw)

parsed = parse_songsterr_drum_track(part, meta, 'right')
print('Measures:', len(parsed['measures']))
for m in parsed['measures']:
    print(f"=== Measure {m['measure_number']} ({len(m['notes'])} notes) ===")
    for n in m['notes']:
        print(f"  f={n['fret']} | row={n['row']:<8} | sub={n['sub_type']:<14} | head={n['head_type']:<11} | stick={n['sticking']} | name={n['name']}")
