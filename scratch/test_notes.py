import urllib.request, json, sys
sys.stdout.reconfigure(encoding='utf-8')

res = urllib.request.urlopen('http://localhost:5000/api/song/2664276')
data = json.loads(res.read())
for m in data['measures']:
    notes = m['notes']
    print(f"Measure {m['measure_number']}: {len(notes)} notes")
    for n in notes:
        print(f"   fret={n['fret']}, str={n.get('string')}, row={n['row']}, sub_type={n['sub_type']}, head={n['head_type']}, sym={n['symbol']}, midi={n['midi']}, stick={n['sticking']}")
