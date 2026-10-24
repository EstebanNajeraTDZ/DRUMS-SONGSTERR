from songsterr import fetch_part, get_meta

meta = get_meta(9374)
part = fetch_part(9374, meta['revisionId'], meta['image'], 14)

def classify_drum_note(n):
    f = n.get('fret')
    s = n.get('string')
    
    # 1. Hi-Hat classification
    if s == -0.5 or f in (42, 46, 92, 98):
        if f == 57:
            return 'CRASH', 'crash_2'
        if f == 46:
            return 'HI_HAT', 'open'
        elif f in (92, 98):
            return 'HI_HAT', 'half_open'
        else:
            return 'HI_HAT', 'closed'
    if s == 4.5 or f == 44:
        return 'HI_HAT', 'pedal'
        
    # 2. Snare / Caja
    if s == 1.5 or f in (37, 38, 40, 54):
        if f in (37, 40):
            return 'SNARE', 'cross_stick' # Diamond notehead (Electrónica / Caja)
        return 'SNARE', 'normal'
        
    # 3. Kick / Bombo
    if s in (3.5, 4) or f in (35, 36, 70):
        return 'KICK', 'normal'
        
    # 4. Ride
    if s == 0 or f in (51, 53, 59):
        if f == 53:
            return 'RIDE', 'bell'
        return 'RIDE', 'bow'
        
    # 5. Crash
    if s in (-1, -1.5) or f in (49, 52, 55, 97):
        return 'CRASH', 'normal'
        
    # 6. Toms
    if s in (2.5, 3) or f in (41, 43):
        return 'TOM_3', 'normal'
    if s == 2 or f in (45, 47):
        return 'TOM_2', 'normal'
    if s in (0.5, 1) or f in (48, 50):
        return 'TOM_1', 'normal'
        
    return 'UNKNOWN', 'normal'

m4 = part['measures'][3] # Measure 4
print('=== Measure 4 Classification ===')
for b_idx, b in enumerate(m4['voices'][0]['beats']):
    notes_str = []
    for n in b.get('notes', []):
        cat, sub = classify_drum_note(n)
        notes_str.append(f"{cat}:{sub} (fret={n.get('fret')}, s={n.get('string')})")
    print(f"Beat {b_idx}: {', '.join(notes_str)}")
