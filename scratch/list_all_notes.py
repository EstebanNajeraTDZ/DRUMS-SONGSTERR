import urllib.request, json, gzip, sys
sys.stdout.reconfigure(encoding='utf-8')

raw = urllib.request.urlopen(urllib.request.Request('https://dqsljvtekg760.cloudfront.net/2664276/3512126/v4-6-3-5Kb0w84likLht501/1.json', headers={'User-Agent': 'Mozilla/5.0'}), timeout=10).read()
data = json.loads(gzip.decompress(raw) if raw[:2] == b'\x1f\x8b' else raw)

idx = 1
for m_idx, m in enumerate(data.get('measures', [])):
    for v in m.get('voices', []):
        for b in v.get('beats', []):
            for n in b.get('notes', []):
                f = n.get('fret')
                s = n.get('string')
                print(f"#{idx:02d} M{m_idx+1}: fret={f}, string={s}")
                idx += 1
