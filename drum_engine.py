"""Drum Track Processing & Sticking Engine
Parses Songsterr drum data, normalizes notes, generates smart sticking (R, L, K, F),
and organizes measures and sections for practice.
"""
from __future__ import annotations

import mido
from mido import MidiFile, MidiTrack, Message, MetaMessage

# Standard Drum Instrument Map
# Categorizes MIDI drum notes into rows matching Donner DED-300X physical kit:
# HI_HAT, CRASH_1 (Left), CRASH_2 (Right), RIDE, TOM_1, TOM_2, TOM_3, SNARE, KICK, PERC
DRUM_ROWS = {
    'HI_HAT':  {'name': 'HI HAT',  'color': '#eab308', 'midi': [42, 44, 46, 92, 98, 102, 29, 30], 'row_idx': 0},
    'CRASH_1': {'name': 'CRASH 1', 'color': '#94a3b8', 'midi': [49, 55, 95],                     'row_idx': 1},
    'CRASH_2': {'name': 'CRASH 2', 'color': '#38bdf8', 'midi': [57, 52, 96, 97],                 'row_idx': 2},
    'RIDE':    {'name': 'RIDE',    'color': '#ec4899', 'midi': [51, 53, 59, 93, 94],             'row_idx': 3},
    'TOM_1':   {'name': 'TOM 1',   'color': '#3b82f6', 'midi': [48, 50, 60, 65],                 'row_idx': 4},
    'TOM_2':   {'name': 'TOM 2',   'color': '#22c55e', 'midi': [45, 47, 61, 66],                 'row_idx': 5},
    'TOM_3':   {'name': 'TOM 3',   'color': '#a855f7', 'midi': [41, 43, 58, 86, 87, 28],         'row_idx': 6},
    'SNARE':   {'name': 'SNARE',   'color': '#ef4444', 'midi': [37, 38, 40, 54, 91, 31, 32, 39, 27], 'row_idx': 7},
    'KICK':    {'name': 'KICK',    'color': '#f97316', 'midi': [35, 36, 70],                     'row_idx': 8},
    'PERC':    {'name': 'PERC',    'color': '#14b8a6', 'midi': [33, 34, 56, 62, 63, 64, 67, 68, 69, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 99], 'row_idx': 9},
}

# Compatibility alias for legacy references
DRUM_ROWS['CRASH'] = DRUM_ROWS['CRASH_1']

NOTE_TO_ROW = {}
for row_key, row_info in DRUM_ROWS.items():
    if row_key == 'CRASH':
        continue
    for note in row_info['midi']:
        NOTE_TO_ROW[note] = row_key

# Comprehensive Songsterr Drum Key Notation Map
# Source: https://www.songsterr.com/a/wsa/notation-drum-key-drum-tab-s2664276
# Maps fret -> (row, sub_type, head_type, symbol, gm_midi, display_name, choked)
SONGSTERR_NOTATION_MAP = {
    # 1. Bombo
    36: ('KICK', 'normal', 'oval', '●', 36, 'Bombo Normal', False),
    35: ('KICK', 'acoustic', 'oval', '●', 35, 'Bombo Acústico', False),
    # 2. Caja
    38: ('SNARE', 'normal', 'oval', '●', 38, 'Caja Normal', False),
    91: ('SNARE', 'rimshot', 'diamond', '◇', 91, 'Caja Rimshot', False),
    40: ('SNARE', 'electric', 'diamond', '◇', 40, 'Caja Electrónica', False),
    37: ('SNARE', 'cross_stick', 'x', '×', 37, 'Caja Golpe de Aro', False),
    # 3. Charles (Hi-Hat)
    42: ('HI_HAT', 'closed', 'x', '×', 42, 'Charles Cerrado', False),
    102: ('HI_HAT', 'tight', 'x', '×', 42, 'Charles Apretado', False),
    46: ('HI_HAT', 'open', 'circle_x', '⊗', 46, 'Charles Abierto', False),
    44: ('HI_HAT', 'pedal', 'x', '×', 44, 'Charles de Pedal', False),
    92: ('HI_HAT', 'half_open', 'circle_slash', '⊘', 46, 'Charles Semiabierto', False),
    98: ('HI_HAT', 'half_open_2', 'circle_slash', '⊘', 46, 'Charles Semiabierto 2', False),
    # 4. Toms
    50: ('TOM_1', 'floor_agudo', 'oval', '●', 50, 'Tom de Piso Agudo', False),
    48: ('TOM_1', 'agudo', 'oval', '●', 48, 'Tom Agudo (Tom 1)', False),
    47: ('TOM_2', 'medio', 'oval', '●', 47, 'Tom Medio (Tom 2)', False),
    45: ('TOM_2', 'grave', 'oval', '●', 45, 'Tom Grave', False),
    43: ('TOM_3', 'muy_grave', 'oval', '●', 43, 'Tom Muy Grave (Tom 3)', False),
    41: ('TOM_3', 'de_piso', 'oval', '●', 41, 'Tom de Piso', False),
    # 5. Crash (Donner DED-300X: Crash 1 Izquierdo, Crash 2 Derecho)
    49: ('CRASH_1', 'crash_1', 'x', '×', 49, 'Crash Medio (Crash 1)', False),
    95: ('CRASH_1', 'crash_1_choked', 'x', '×', 49, 'Crash Medio Apagado', True),
    57: ('CRASH_2', 'crash_2', 'x', '×', 57, 'Crash Agudo (Crash 2)', False),
    97: ('CRASH_2', 'crash_2_choked', 'x', '×', 57, 'Crash Agudo Apagado', True),
    # 6. Splash
    55: ('CRASH_1', 'splash', 'x', '×', 55, 'Splash Abierto', False),
    96: ('CRASH_2', 'splash_choked', 'x', '×', 55, 'Splash Apagado', True),
    # 7. Plato Ride
    51: ('RIDE', 'bow', 'x', '×', 51, 'Plato Ride (Bow)', False),
    53: ('RIDE', 'bell', 'diamond', '◇', 53, 'Plato Ride Campana', False),
    93: ('RIDE', 'edge', 'x_tilde', '×~', 59, 'Plato Ride Borde', False),
    94: ('RIDE', 'edge_2', 'x_tilde', '×~', 59, 'Plato Ride Borde 2', False),
    59: ('RIDE', 'ride_2', 'x', '×', 59, 'Plato Ride 2', False),
    # 8. China
    52: ('CRASH_2', 'china', 'china_cross', '⨝', 52, 'Plato China Abierto', False),
    # 9. Electrónica
    27: ('SNARE', 'square_click', 'x', '×', 37, 'Clic Cuadrado', False),
    28: ('TOM_3', 'slap', 'oval', '●', 41, 'Slap', False),
    29: ('HI_HAT', 'scratch_push', 'x', '×', 42, 'Scratch Push', False),
    30: ('HI_HAT', 'scratch_pull', 'x', '×', 46, 'Scratch Pull', False),
    31: ('SNARE', 'drumsticks', 'diamond', '◇', 37, 'Baquetas', False),
    32: ('SNARE', 'electro_click', 'diamond', '◇', 37, 'Clic Electrónico', False),
    33: ('PERC', 'metronome_click', 'x', '×', 33, 'Metrónomo Clic', False),
    34: ('PERC', 'metronome_bell', 'diamond', '◇', 34, 'Metrónomo Campana', False),
    # 10. Percusión
    39: ('SNARE', 'clap', 'oval', '●', 39, 'Palmas (Clap)', False),
    54: ('PERC', 'tambourine', 'triangle', '▲', 54, 'Pandereta', False),
    56: ('PERC', 'cowbell', 'triangle', '▲', 56, 'Cencerro Normal', False),
    58: ('PERC', 'vibraslap', 'diamond', '◇', 58, 'Vibraslap', False),
    60: ('TOM_1', 'bongo_hi', 'oval', '●', 60, 'Bongó Agudo', False),
    61: ('TOM_2', 'bongo_lo', 'oval', '●', 61, 'Bongó Grave', False),
    62: ('PERC', 'conga_mute', 'x', '×', 62, 'Conga Agudo Apagado', True),
    63: ('PERC', 'conga_open', 'oval', '●', 63, 'Conga Agudo Abierto', False),
    64: ('PERC', 'conga_lo', 'oval', '●', 64, 'Conga Grave', False),
    65: ('TOM_1', 'timbale_hi', 'oval', '●', 65, 'Timbal Agudo', False),
    66: ('TOM_2', 'timbale_lo', 'oval', '●', 66, 'Timbal Grave', False),
    67: ('PERC', 'agogo_hi', 'triangle', '▲', 67, 'Agogó Agudo', False),
    68: ('PERC', 'agogo_lo', 'triangle', '▲', 68, 'Agogó Grave', False),
    69: ('PERC', 'cabasa', 'oval', '●', 69, 'Cabasa', False),
    70: ('PERC', 'maracas', 'diamond', '◇', 70, 'Maracas', False),
    71: ('PERC', 'whistle_short', 'oval', '●', 71, 'Silbato Corto', False),
    72: ('PERC', 'whistle_long', 'oval', '●', 72, 'Silbato Largo', False),
    73: ('PERC', 'guiro_short', 'oval', '●', 73, 'Güiro Corto', False),
    74: ('PERC', 'guiro_long', 'oval', '●', 74, 'Güiro Largo', False),
    75: ('PERC', 'claves', 'oval', '●', 75, 'Claves', False),
    76: ('PERC', 'woodblock_hi', 'triangle', '▲', 76, 'Caja China Aguda', False),
    77: ('PERC', 'woodblock_lo', 'triangle', '▲', 77, 'Caja China Grave', False),
    78: ('PERC', 'cuica_mute', 'x', '×', 78, 'Cuíca Apagada', True),
    79: ('PERC', 'cuica_open', 'oval', '●', 79, 'Cuíca Abierta', False),
    80: ('PERC', 'triangle_mute', 'x', '×', 80, 'Triángulo Apagado', True),
    81: ('PERC', 'triangle_open', 'oval', '●', 81, 'Triángulo Abierto', False),
    82: ('PERC', 'shaker', 'oval', '●', 82, 'Shaker', False),
    83: ('PERC', 'jingle_bell', 'oval', '●', 83, 'Cascabel', False),
    84: ('PERC', 'belltree', 'oval', '●', 84, 'Árbol de Campanas', False),
    85: ('PERC', 'castanets', 'square', '■', 85, 'Castañuelas', False),
    86: ('TOM_3', 'surdo_mute', 'x', '×', 86, 'Surdo Apagado', True),
    87: ('TOM_3', 'surdo_open', 'oval', '●', 87, 'Surdo Abierto', False),
    99: ('PERC', 'cowbell_hi', 'triangle', '▲', 99, 'Cencerro Agudo', False)
}


def classify_songsterr_drum_note(n: dict) -> tuple[str, str, str, str, int, str, bool]:
    """
    Classifies a Songsterr drum note based on fret (articulation/pitch) and string (staff position).
    Returns: (row, sub_type, head_type, symbol, gm_midi, display_name, is_choked)
    """
    f = n.get('fret')
    s = n.get('string')

    if f is not None and f in SONGSTERR_NOTATION_MAP:
        return SONGSTERR_NOTATION_MAP[f]

    # Fallback by staff string position if fret is missing or not in table
    if s is not None:
        if s == 4.5:
            return 'HI_HAT', 'pedal', 'x', '×', 44, 'Charles de Pedal', False
        elif s == 4.0:
            return 'KICK', 'acoustic', 'oval', '●', 35, 'Bombo Acústico', False
        elif s == 3.5:
            return 'KICK', 'normal', 'oval', '●', 36, 'Bombo Normal', False
        elif s in (2.5, 3.0):
            return 'TOM_3', 'de_piso', 'oval', '●', 41, 'Tom de Piso', False
        elif s == 2.0:
            return 'TOM_2', 'medio', 'oval', '●', 47, 'Tom Medio', False
        elif s == 1.5:
            return 'SNARE', 'normal', 'oval', '●', 38, 'Caja Normal', False
        elif s in (0.5, 1.0):
            return 'TOM_1', 'agudo', 'oval', '●', 48, 'Tom Agudo', False
        elif s == 0.0:
            return 'RIDE', 'bow', 'x', '×', 51, 'Plato Ride (Bow)', False
        elif s == -0.5:
            return 'HI_HAT', 'closed', 'x', '×', 42, 'Charles Cerrado', False
        elif s == -1.0:
            return 'CRASH_1', 'crash_1', 'x', '×', 49, 'Crash Medio (Crash 1)', False
        elif s in (-1.5, -2.0):
            return 'CRASH_2', 'crash_2', 'x', '×', 57, 'Crash Agudo (Crash 2)', False

    # Generic MIDI pitch fallback
    if f is not None:
        if f in NOTE_TO_ROW:
            row = NOTE_TO_ROW[f]
            return row, 'normal', 'oval' if 'TOM' in row or row in ('SNARE', 'KICK') else 'x', '●' if 'TOM' in row or row in ('SNARE', 'KICK') else '×', f, row, False

    return 'SNARE', 'normal', 'oval', '●', 38, 'Caja Normal', False


def get_drum_row(midi_note: int) -> str:
    if midi_note in NOTE_TO_ROW:
        return NOTE_TO_ROW[midi_note]
    if midi_note < 37:
        return 'KICK'
    elif midi_note in (37, 38, 39, 40, 54, 91):
        return 'SNARE'
    elif midi_note in (41, 43, 58, 86, 87):
        return 'TOM_3'
    elif midi_note in (45, 47, 61, 66):
        return 'TOM_2'
    elif midi_note in (48, 50, 60, 65):
        return 'TOM_1'
    elif midi_note in (51, 53, 59, 93, 94):
        return 'RIDE'
    elif midi_note in (49, 55, 95):
        return 'CRASH_1'
    elif midi_note in (52, 57, 96, 97):
        return 'CRASH_2'
    elif midi_note in (42, 44, 46, 92, 98, 102):
        return 'HI_HAT'
    return 'PERC'


def calculate_sticking(measure_notes, handedness='right'):
    """Calculate smart sticking (R, L, K, F) tailored for Donner DED-300X physical drum kit:
    - 1 Hi-Hat (Left), 1 Kick (Pedal), 1 Snare (Center-left)
    - 3 Toms: Tom 1 (Left), Tom 2 (Right), Tom 3 (Floor right)
    - 2 Crashes: Crash 1 (Left), Crash 2 (Right)
    - 1 Ride (Far right)
    
    Prevents awkward crossed hands:
    - Dual Crash Accent (Crash 1 + Crash 2 simultaneous): Left hand -> Crash 1, Right hand -> Crash 2.
    - Crash 2 solo: Always Right Hand (R), never crosses left arm across the entire kit.
    - Ride solo: Always Right Hand (R).
    - Hi-Hat + Snare: Right Hand -> Hi-Hat, Left Hand -> Snare.
    - Tom fills: Natural hand alternation (R L R L ...).
    - Tom fill ending on Crash 2: Naturally flows into Right Hand (R).
    - Foot notes: Kick -> K, Hi-Hat Pedal -> F.
    """
    lead_hand = 'R' if handedness == 'right' else 'L'
    off_hand = 'L' if handedness == 'right' else 'R'

    # Sort notes chronologically by tick/position
    sorted_events = sorted(measure_notes, key=lambda n: (n['tick'], n['row']))

    # Group notes that happen at the exact same tick
    tick_groups = {}
    for note in sorted_events:
        t = note['tick']
        if t not in tick_groups:
            tick_groups[t] = []
        tick_groups[t].append(note)

    sorted_ticks = sorted(tick_groups.keys())
    last_hand = off_hand  # so first hit starts with lead hand

    for t in sorted_ticks:
        notes_at_t = tick_groups[t]

        # 1. Assign Foot notes (Kick -> K, Hi-Hat Pedal -> F)
        for n in notes_at_t:
            if n['row'] == 'KICK':
                n['sticking'] = 'K'
            elif n['row'] == 'HI_HAT' and (n.get('sub_type') == 'pedal' or n.get('midi') == 44 or n.get('string') == 4.5):
                n['sticking'] = 'F'

        # Filter to hand notes (exclude Kick and Pedal Hi-Hat)
        hand_notes = [
            n for n in notes_at_t 
            if n['row'] != 'KICK' and not (n['row'] == 'HI_HAT' and (n.get('sub_type') == 'pedal' or n.get('midi') == 44 or n.get('string') == 4.5))
        ]

        # 2. Assign Hand notes
        if len(hand_notes) == 1:
            hn = hand_notes[0]
            # Specific physical placement on Donner DED-300X:
            # Crash 2 and Ride are positioned on the RIGHT side of the kit.
            # Sticking Crash 2 or Ride with Left Hand in a groove forces unneeded cross-arm reaching.
            if hn['row'] in ('CRASH_2', 'RIDE'):
                hn['sticking'] = 'R'
                last_hand = 'R'
            elif hn['row'] in ('HI_HAT', 'CRASH_1') and not hn.get('fill_mode'):
                hn['sticking'] = lead_hand
                last_hand = lead_hand
            elif hn['row'] == 'SNARE' and not hn.get('fill_mode'):
                # In standard grooves with steady hats, snare backbeat is played with off_hand (L)
                hn['sticking'] = off_hand
                last_hand = off_hand
            else:
                # In fills/rolls, alternate hands
                next_hand = off_hand if last_hand == lead_hand else lead_hand
                hn['sticking'] = next_hand
                last_hand = next_hand

        elif len(hand_notes) >= 2:
            # Check for Dual Crash Accent (Crash 1 Left + Crash 2 Right)
            c1_notes = [n for n in hand_notes if n['row'] == 'CRASH_1']
            c2_notes = [n for n in hand_notes if n['row'] == 'CRASH_2']

            if c1_notes and c2_notes:
                # Ergonomic rule: Open arms! Left hand hits Crash 1, Right hand hits Crash 2
                for c1 in c1_notes:
                    c1['sticking'] = 'L'
                for c2 in c2_notes:
                    c2['sticking'] = 'R'
                # Any remaining hand note gets off hand
                for other in hand_notes:
                    if other not in c1_notes and other not in c2_notes:
                        other['sticking'] = off_hand
            else:
                # Simultaneous hand hits (e.g. Hi-Hat + Snare, Ride + Snare, Crash 1 + Snare, Crash 2 + Snare)
                cymbals = [n for n in hand_notes if n['row'] in ('HI_HAT', 'RIDE', 'CRASH_1', 'CRASH_2')]
                drums = [n for n in hand_notes if n['row'] in ('SNARE', 'TOM_1', 'TOM_2', 'TOM_3', 'PERC')]

                if cymbals and drums:
                    for c in cymbals:
                        c['sticking'] = lead_hand if c['row'] != 'CRASH_2' else 'R'
                    for d in drums:
                        d['sticking'] = off_hand
                else:
                    # Double toms or flams: sort by kit physical position (left to right)
                    # Tom 1 is left of Tom 2, Tom 2 is left of Tom 3
                    pos_order = {'CRASH_1': 0, 'HI_HAT': 1, 'SNARE': 2, 'TOM_1': 3, 'TOM_2': 4, 'TOM_3': 5, 'CRASH_2': 6, 'RIDE': 7, 'PERC': 8}
                    hand_notes.sort(key=lambda x: pos_order.get(x['row'], 4))
                    for i, n in enumerate(hand_notes):
                        n['sticking'] = off_hand if i == 0 else lead_hand

    return measure_notes



def parse_songsterr_drum_track(part_data, meta, handedness='right'):
    """Extract clean structure from Songsterr drum part JSON."""
    measures_data = []
    sections = []
    
    # Tempo from automations
    base_bpm = 120
    automations = part_data.get('automations', {})
    tempo_list = automations.get('tempo', [])
    tempo_map = {}
    for t in tempo_list:
        m_idx = t.get('measure', 0)
        bpm = t.get('bpm', 120)
        tempo_map[m_idx] = bpm
    if 0 in tempo_map:
        base_bpm = tempo_map[0]

    raw_measures = part_data.get('measures', [])
    current_sig = [4, 4]
    current_bpm = base_bpm

    ticks_per_quarter = 480

    cumulative_sec = 0.0

    for m_idx, m in enumerate(raw_measures):
        if 'signature' in m:
            current_sig = m['signature']
        if m_idx in tempo_map:
            current_bpm = tempo_map[m_idx]

        # Markers/Sections (e.g. Intro, Verse 1, Chorus)
        marker = None
        if 'marker' in m and m['marker'].get('text'):
            marker_text = m['marker']['text']
            marker = marker_text
            sections.append({
                'name': marker_text,
                'measure_index': m_idx,
                'measure_number': m_idx + 1
            })

        num, den = current_sig
        measure_ticks = int(ticks_per_quarter * 4 * (num / den))
        measure_duration_sec = (60.0 / current_bpm) * (num * (4.0 / den))
        measure_start_sec = round(cumulative_sec, 3)
        cumulative_sec += measure_duration_sec
        
        notes = []
        is_rest = m.get('rest', False)
        
        if not is_rest:
            voices = m.get('voices', [])
            for voice in voices:
                beats = voice.get('beats', [])
                voice_tick = 0
                for beat in beats:
                    dur = beat.get('duration', [1, 4])
                    dur_num, dur_den = dur
                    beat_ticks = int(ticks_per_quarter * 4 * (dur_num / dur_den))
                    
                    if not beat.get('rest'):
                        vel_str = beat.get('velocity', 'mf')
                        beat_notes = beat.get('notes', [])
                        for n in beat_notes:
                            if not n.get('rest'):
                                row, sub_type, head_type, symbol, gm_midi, display_name, is_choked = classify_songsterr_drum_note(n)
                                accent = bool(n.get('accentuated') or beat.get('accentuated'))
                                ghost = bool(n.get('ghost'))
                                
                                # Subdivision position within measure (0.0 to 1.0)
                                rel_pos = voice_tick / measure_ticks if measure_ticks > 0 else 0
                                
                                notes.append({
                                    'fret': n.get('fret', 38),
                                    'midi': gm_midi,
                                    'string': n.get('string'),
                                    'name': display_name,
                                    'row': row,
                                    'row_idx': DRUM_ROWS[row]['row_idx'],
                                    'sub_type': sub_type,
                                    'head_type': head_type,
                                    'symbol': symbol,
                                    'choked': is_choked,
                                    'tick': voice_tick,
                                    'relative_pos': rel_pos,
                                    'duration': dur,
                                    'beat_ticks': beat_ticks,
                                    'velocity': vel_str,
                                    'accent': accent,
                                    'ghost': ghost,
                                    'sticking': ''
                                })

                    voice_tick += beat_ticks

        # Compute sticking for notes in this measure
        notes = calculate_sticking(notes, handedness)

        # Detect tuplet / subdivision feel (e.g. 16ths, 8th triplets, sextuplets)
        subdivision_count = 16 # default 16 slots per 4/4 measure
        if any(n['duration'] == [1, 12] or n['duration'] == [1, 24] or n['duration'] == [1, 6] for n in notes):
            subdivision_count = 24 # sextuplets / triplets
        elif num == 3 and den == 4:
            subdivision_count = 12

        measures_data.append({
            'measure_index': m_idx,
            'measure_number': m_idx + 1,
            'signature': current_sig,
            'bpm': current_bpm,
            'marker': marker,
            'measure_ticks': measure_ticks,
            'subdivision_count': subdivision_count,
            'start_time_sec': measure_start_sec,
            'duration_sec': round(measure_duration_sec, 3),
            'notes': notes
        })

    return {
        'song_id': meta.get('songId'),
        'artist': meta.get('artist', 'Unknown Artist'),
        'title': meta.get('title', 'Unknown Title'),
        'default_bpm': base_bpm,
        'total_measures': len(measures_data),
        'sections': sections,
        'videos': meta.get('videos', []),
        'measures': measures_data
    }


def export_midi_file(parsed_data, output_path):
    """Write parsed drum data to a standard GM drum MIDI file."""
    mid = MidiFile(type=1)
    track = MidiTrack()
    mid.tracks.append(track)
    
    track.append(MetaMessage('track_name', name=f"{parsed_data['title']} - Drums", time=0))
    tempo_us = mido.bpm2tempo(parsed_data['default_bpm'])
    track.append(MetaMessage('set_tempo', tempo=tempo_us, time=0))
    
    ticks_per_beat = mid.ticks_per_beat
    events = []
    
    cumulative_measure_tick = 0
    for m in parsed_data['measures']:
        m_ticks = m['measure_ticks']
        bpm = m.get('bpm', parsed_data['default_bpm'])
        
        for n in m['notes']:
            abs_tick = cumulative_measure_tick + n['tick']
            vel = 120 if n.get('accent') else 95
            if n.get('ghost'):
                vel = 45
            events.append((abs_tick, 'note_on', n['midi'], vel))
            events.append((abs_tick + min(n['beat_ticks'] - 10, int(ticks_per_beat * 0.4)), 'note_off', n['midi'], 0))
            
        cumulative_measure_tick += m_ticks

    events.sort(key=lambda x: (x[0], 0 if x[1] == 'note_off' else 1))
    
    last_tick = 0
    for tick, etype, note, vel in events:
        delta = max(0, tick - last_tick)
        track.append(Message(etype, channel=9, note=note, velocity=vel, time=delta))
        last_tick = tick
        
    track.append(MetaMessage('end_of_track', time=ticks_per_beat))
    mid.save(output_path)
    return output_path
