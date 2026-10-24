"""Professional Drum Lessons & Rudiments Library
Includes PAS 40 fundamental drum rudiments, iconic drum fills, independence grooves,
and subdivision exercises formatted for Donner DED-300X Drum Practice Studio.
"""

LESSONS = [
    # --- 1. RUDIMENTOS FUNDAMENTALES (PAS 40) ---
    {
        'id': 'single-stroke-roll',
        'category': 'Rudimentos Fundamentales',
        'category_id': 'rudiments',
        'title': 'Single Stroke Roll (Golpes Simples)',
        'description': 'El rudimento base de todo baterista: golpes alternados continuos R L R L.',
        'difficulty': 'Principiante',
        'recommended_bpm': 90,
        'bpm_range': [60, 150],
        'signature': [4, 4],
        'subdivision_count': 16,
        'subdivisions_per_beat': 4,
        'sticking_summary': 'R L R L  R L R L  R L R L  R L R L',
        'notes': [
            # 16th notes on Snare (1920 ticks total, step = 120 ticks)
            {'midi': 38, 'row': 'SNARE', 'tick': i * 120, 'duration': [1, 16], 'velocity': 'f', 'sticking': 'R' if i % 2 == 0 else 'L', 'accent': (i % 4 == 0)}
            for i in range(16)
        ]
    },
    {
        'id': 'double-stroke-roll',
        'category': 'Rudimentos Fundamentales',
        'category_id': 'rudiments',
        'title': 'Double Stroke Roll (Rebote Doble)',
        'description': 'Control de muñeca y dedos con dos golpes por mano: R R L L.',
        'difficulty': 'Intermedio',
        'recommended_bpm': 80,
        'bpm_range': [60, 140],
        'signature': [4, 4],
        'subdivision_count': 16,
        'subdivisions_per_beat': 4,
        'sticking_summary': 'R R L L  R R L L  R R L L  R R L L',
        'notes': [
            {'midi': 38, 'row': 'SNARE', 'tick': i * 120, 'duration': [1, 16], 'velocity': 'f', 
             'sticking': 'R' if (i % 4 in (0, 1)) else 'L', 'accent': (i % 4 == 0)}
            for i in range(16)
        ]
    },
    {
        'id': 'single-paradiddle',
        'category': 'Rudimentos Fundamentales',
        'category_id': 'rudiments',
        'title': 'Single Paradiddle Clásico',
        'description': 'El rudimento rey: R L R R  L R L L con acento en el primer tiempo.',
        'difficulty': 'Intermedio',
        'recommended_bpm': 85,
        'bpm_range': [65, 140],
        'signature': [4, 4],
        'subdivision_count': 16,
        'subdivisions_per_beat': 4,
        'sticking_summary': '>R L R R  >L R L L  >R L R R  >L R L L',
        'notes': [
            # Beat 1: R L R R
            {'midi': 38, 'row': 'SNARE', 'tick': 0, 'duration': [1, 16], 'velocity': 'ff', 'sticking': 'R', 'accent': True},
            {'midi': 38, 'row': 'SNARE', 'tick': 120, 'duration': [1, 16], 'velocity': 'p', 'sticking': 'L', 'accent': False},
            {'midi': 38, 'row': 'SNARE', 'tick': 240, 'duration': [1, 16], 'velocity': 'p', 'sticking': 'R', 'accent': False},
            {'midi': 38, 'row': 'SNARE', 'tick': 360, 'duration': [1, 16], 'velocity': 'p', 'sticking': 'R', 'accent': False},
            # Beat 2: L R L L
            {'midi': 38, 'row': 'SNARE', 'tick': 480, 'duration': [1, 16], 'velocity': 'ff', 'sticking': 'L', 'accent': True},
            {'midi': 38, 'row': 'SNARE', 'tick': 600, 'duration': [1, 16], 'velocity': 'p', 'sticking': 'R', 'accent': False},
            {'midi': 38, 'row': 'SNARE', 'tick': 720, 'duration': [1, 16], 'velocity': 'p', 'sticking': 'L', 'accent': False},
            {'midi': 38, 'row': 'SNARE', 'tick': 840, 'duration': [1, 16], 'velocity': 'p', 'sticking': 'L', 'accent': False},
            # Beat 3: R L R R
            {'midi': 38, 'row': 'SNARE', 'tick': 960, 'duration': [1, 16], 'velocity': 'ff', 'sticking': 'R', 'accent': True},
            {'midi': 38, 'row': 'SNARE', 'tick': 1080, 'duration': [1, 16], 'velocity': 'p', 'sticking': 'L', 'accent': False},
            {'midi': 38, 'row': 'SNARE', 'tick': 1200, 'duration': [1, 16], 'velocity': 'p', 'sticking': 'R', 'accent': False},
            {'midi': 38, 'row': 'SNARE', 'tick': 1320, 'duration': [1, 16], 'velocity': 'p', 'sticking': 'R', 'accent': False},
            # Beat 4: L R L L
            {'midi': 38, 'row': 'SNARE', 'tick': 1440, 'duration': [1, 16], 'velocity': 'ff', 'sticking': 'L', 'accent': True},
            {'midi': 38, 'row': 'SNARE', 'tick': 1560, 'duration': [1, 16], 'velocity': 'p', 'sticking': 'R', 'accent': False},
            {'midi': 38, 'row': 'SNARE', 'tick': 1680, 'duration': [1, 16], 'velocity': 'p', 'sticking': 'L', 'accent': False},
            {'midi': 38, 'row': 'SNARE', 'tick': 1800, 'duration': [1, 16], 'velocity': 'p', 'sticking': 'L', 'accent': False},
        ]
    },
    {
        'id': 'paradiddle-diddle',
        'category': 'Rudimentos Fundamentales',
        'category_id': 'rudiments',
        'title': 'Paradiddle-Diddle en Seisillos',
        'description': 'Patrón de seis golpes continuo: R L R R L L fluido para redobles rápidos.',
        'difficulty': 'Avanzado',
        'recommended_bpm': 75,
        'bpm_range': [60, 130],
        'signature': [4, 4],
        'subdivision_count': 24,
        'subdivisions_per_beat': 6,
        'sticking_summary': 'R L R R L L (x4 en seisillos)',
        'notes': [
            {'midi': 38, 'row': 'SNARE', 'tick': (beat * 480) + (sub * 80), 'duration': [1, 24], 
             'velocity': 'ff' if sub == 0 else 'f',
             'sticking': ['R', 'L', 'R', 'R', 'L', 'L'][sub],
             'accent': (sub == 0)}
            for beat in range(4) for sub in range(6)
        ]
    },

    # --- 2. FILLS & REDOBLES PROFESIONALES ---
    {
        'id': 'exercise-sextuplet-fill',
        'category': 'Fills & Redobles',
        'category_id': 'fills',
        'title': 'Fill Séxtuple Tom & Kick (Ejercicio Imagen 1)',
        'description': 'El fill icónico: R L (Tom 2), R L (Tom 3), K K (Bombo) x3, rematando en Caja acentuada.',
        'difficulty': 'Avanzado',
        'recommended_bpm': 75,
        'bpm_range': [55, 115],
        'signature': [4, 4],
        'subdivision_count': 24,
        'subdivisions_per_beat': 6,
        'sticking_summary': 'R L (T2) R L (T3) K K (Bombo) x3 + >L (Caja)',
        'notes': [
            # Beat 1: R L (Tom 2), R L (Tom 3), K K (Kick)
            {'midi': 47, 'row': 'TOM_2', 'tick': 0, 'duration': [1, 24], 'velocity': 'f', 'sticking': 'R'},
            {'midi': 47, 'row': 'TOM_2', 'tick': 80, 'duration': [1, 24], 'velocity': 'f', 'sticking': 'L'},
            {'midi': 43, 'row': 'TOM_3', 'tick': 160, 'duration': [1, 24], 'velocity': 'f', 'sticking': 'R'},
            {'midi': 43, 'row': 'TOM_3', 'tick': 240, 'duration': [1, 24], 'velocity': 'f', 'sticking': 'L'},
            {'midi': 36, 'row': 'KICK', 'tick': 320, 'duration': [1, 24], 'velocity': 'f', 'sticking': 'K'},
            {'midi': 36, 'row': 'KICK', 'tick': 400, 'duration': [1, 24], 'velocity': 'f', 'sticking': 'K'},
            # Beat 2
            {'midi': 47, 'row': 'TOM_2', 'tick': 480, 'duration': [1, 24], 'velocity': 'f', 'sticking': 'R'},
            {'midi': 47, 'row': 'TOM_2', 'tick': 560, 'duration': [1, 24], 'velocity': 'f', 'sticking': 'L'},
            {'midi': 43, 'row': 'TOM_3', 'tick': 640, 'duration': [1, 24], 'velocity': 'f', 'sticking': 'R'},
            {'midi': 43, 'row': 'TOM_3', 'tick': 720, 'duration': [1, 24], 'velocity': 'f', 'sticking': 'L'},
            {'midi': 36, 'row': 'KICK', 'tick': 800, 'duration': [1, 24], 'velocity': 'f', 'sticking': 'K'},
            {'midi': 36, 'row': 'KICK', 'tick': 880, 'duration': [1, 24], 'velocity': 'f', 'sticking': 'K'},
            # Beat 3
            {'midi': 47, 'row': 'TOM_2', 'tick': 960, 'duration': [1, 24], 'velocity': 'f', 'sticking': 'R'},
            {'midi': 47, 'row': 'TOM_2', 'tick': 1040, 'duration': [1, 24], 'velocity': 'f', 'sticking': 'L'},
            {'midi': 43, 'row': 'TOM_3', 'tick': 1120, 'duration': [1, 24], 'velocity': 'f', 'sticking': 'R'},
            {'midi': 43, 'row': 'TOM_3', 'tick': 1200, 'duration': [1, 24], 'velocity': 'f', 'sticking': 'L'},
            {'midi': 36, 'row': 'KICK', 'tick': 1280, 'duration': [1, 24], 'velocity': 'f', 'sticking': 'K'},
            {'midi': 36, 'row': 'KICK', 'tick': 1360, 'duration': [1, 24], 'velocity': 'f', 'sticking': 'K'},
            # Beat 4: Accented Snare
            {'midi': 38, 'row': 'SNARE', 'tick': 1440, 'duration': [1, 4], 'velocity': 'ff', 'sticking': 'L', 'accent': True}
        ]
    },
    {
        'id': 'bonham-triplets',
        'category': 'Fills & Redobles',
        'category_id': 'fills',
        'title': 'Bonham Triplet (Mano-Mano-Pie)',
        'description': 'El legendario tresillo de John Bonham (Led Zeppelin): Caja (R) - Tom (L) - Bombo (K).',
        'difficulty': 'Intermedio',
        'recommended_bpm': 90,
        'bpm_range': [65, 135],
        'signature': [4, 4],
        'subdivision_count': 12,
        'subdivisions_per_beat': 3,
        'sticking_summary': 'R (Caja) - L (Tom) - K (Bombo) en tresillos',
        'notes': [
            # Beat 1: R L K
            {'midi': 38, 'row': 'SNARE', 'tick': 0, 'duration': [1, 12], 'velocity': 'ff', 'sticking': 'R', 'accent': True},
            {'midi': 47, 'row': 'TOM_2', 'tick': 160, 'duration': [1, 12], 'velocity': 'f', 'sticking': 'L'},
            {'midi': 36, 'row': 'KICK', 'tick': 320, 'duration': [1, 12], 'velocity': 'f', 'sticking': 'K'},
            # Beat 2
            {'midi': 38, 'row': 'SNARE', 'tick': 480, 'duration': [1, 12], 'velocity': 'ff', 'sticking': 'R', 'accent': True},
            {'midi': 47, 'row': 'TOM_2', 'tick': 640, 'duration': [1, 12], 'velocity': 'f', 'sticking': 'L'},
            {'midi': 36, 'row': 'KICK', 'tick': 800, 'duration': [1, 12], 'velocity': 'f', 'sticking': 'K'},
            # Beat 3
            {'midi': 43, 'row': 'TOM_3', 'tick': 960, 'duration': [1, 12], 'velocity': 'ff', 'sticking': 'R', 'accent': True},
            {'midi': 43, 'row': 'TOM_3', 'tick': 1120, 'duration': [1, 12], 'velocity': 'f', 'sticking': 'L'},
            {'midi': 36, 'row': 'KICK', 'tick': 1280, 'duration': [1, 12], 'velocity': 'f', 'sticking': 'K'},
            # Beat 4: Crash + Kick resolution
            {'midi': 49, 'row': 'CRASH', 'tick': 1440, 'duration': [1, 4], 'velocity': 'ff', 'sticking': 'R', 'accent': True},
            {'midi': 36, 'row': 'KICK', 'tick': 1440, 'duration': [1, 4], 'velocity': 'ff', 'sticking': 'K', 'accent': True}
        ]
    },
    {
        'id': 'rock-toms-build',
        'category': 'Fills & Redobles',
        'category_id': 'fills',
        'title': 'Rock Power Build-Up (Descenso de Toms)',
        'description': 'Fill de semicorcheas descendiendo por Tom 1, Tom 2, Tom 3 y remate Crash.',
        'difficulty': 'Principiante',
        'recommended_bpm': 95,
        'bpm_range': [70, 130],
        'signature': [4, 4],
        'subdivision_count': 16,
        'subdivisions_per_beat': 4,
        'sticking_summary': 'Tom 1 (x4) -> Tom 2 (x4) -> Tom 3 (x4) -> Crash + Bombo',
        'notes': [
            # Beat 1: Tom 1 (R L R L)
            {'midi': 48, 'row': 'TOM_1', 'tick': 0, 'duration': [1, 16], 'velocity': 'ff', 'sticking': 'R', 'accent': True},
            {'midi': 48, 'row': 'TOM_1', 'tick': 120, 'duration': [1, 16], 'velocity': 'f', 'sticking': 'L'},
            {'midi': 48, 'row': 'TOM_1', 'tick': 240, 'duration': [1, 16], 'velocity': 'f', 'sticking': 'R'},
            {'midi': 48, 'row': 'TOM_1', 'tick': 360, 'duration': [1, 16], 'velocity': 'f', 'sticking': 'L'},
            # Beat 2: Tom 2
            {'midi': 47, 'row': 'TOM_2', 'tick': 480, 'duration': [1, 16], 'velocity': 'ff', 'sticking': 'R', 'accent': True},
            {'midi': 47, 'row': 'TOM_2', 'tick': 600, 'duration': [1, 16], 'velocity': 'f', 'sticking': 'L'},
            {'midi': 47, 'row': 'TOM_2', 'tick': 720, 'duration': [1, 16], 'velocity': 'f', 'sticking': 'R'},
            {'midi': 47, 'row': 'TOM_2', 'tick': 840, 'duration': [1, 16], 'velocity': 'f', 'sticking': 'L'},
            # Beat 3: Tom 3
            {'midi': 43, 'row': 'TOM_3', 'tick': 960, 'duration': [1, 16], 'velocity': 'ff', 'sticking': 'R', 'accent': True},
            {'midi': 43, 'row': 'TOM_3', 'tick': 1080, 'duration': [1, 16], 'velocity': 'f', 'sticking': 'L'},
            {'midi': 43, 'row': 'TOM_3', 'tick': 1200, 'duration': [1, 16], 'velocity': 'f', 'sticking': 'R'},
            {'midi': 43, 'row': 'TOM_3', 'tick': 1320, 'duration': [1, 16], 'velocity': 'f', 'sticking': 'L'},
            # Beat 4: Crash + Snare + Kick finish
            {'midi': 49, 'row': 'CRASH', 'tick': 1440, 'duration': [1, 4], 'velocity': 'ff', 'sticking': 'R', 'accent': True},
            {'midi': 38, 'row': 'SNARE', 'tick': 1440, 'duration': [1, 4], 'velocity': 'ff', 'sticking': 'L', 'accent': True},
            {'midi': 36, 'row': 'KICK', 'tick': 1440, 'duration': [1, 4], 'velocity': 'ff', 'sticking': 'K', 'accent': True}
        ]
    },

    # --- 3. RITMOS & GROOVES DE COORDINACIÓN ---
    {
        'id': 'rock-basic-backbeat',
        'category': 'Grooves & Independencia',
        'category_id': 'grooves',
        'title': 'Rock Beat 4/4 Fundamental (Backbeat)',
        'description': 'El ritmo estándar: Bombo en 1 y 3, Caja en 2 y 4, Charles en corcheas constantes.',
        'difficulty': 'Principiante',
        'recommended_bpm': 88,
        'bpm_range': [60, 130],
        'signature': [4, 4],
        'subdivision_count': 8,
        'subdivisions_per_beat': 2,
        'sticking_summary': 'Hi-Hat corcheas, Bombo 1 y 3, Caja 2 y 4',
        'notes': [
            # Hi-Hat 8th notes (8 steps of 240 ticks)
            {'midi': 42, 'row': 'HI_HAT', 'tick': i * 240, 'duration': [1, 8], 'velocity': 'f', 'sticking': 'R', 'sub_type': 'closed'}
            for i in range(8)
        ] + [
            # Kick on Beat 1 & 3
            {'midi': 36, 'row': 'KICK', 'tick': 0, 'duration': [1, 8], 'velocity': 'ff', 'sticking': 'K', 'accent': True},
            {'midi': 36, 'row': 'KICK', 'tick': 960, 'duration': [1, 8], 'velocity': 'f', 'sticking': 'K'},
            # Snare on Beat 2 & 4
            {'midi': 38, 'row': 'SNARE', 'tick': 480, 'duration': [1, 8], 'velocity': 'ff', 'sticking': 'L', 'accent': True},
            {'midi': 38, 'row': 'SNARE', 'tick': 1440, 'duration': [1, 8], 'velocity': 'ff', 'sticking': 'L', 'accent': True}
        ]
    },
    {
        'id': 'four-on-the-floor-disco',
        'category': 'Grooves & Independencia',
        'category_id': 'grooves',
        'title': 'Four on the Floor (Pop & Disco Dance)',
        'description': 'Bombo en los 4 tiempos con Charles abierto a contratiempo en el "+".',
        'difficulty': 'Intermedio',
        'recommended_bpm': 115,
        'bpm_range': [95, 135],
        'signature': [4, 4],
        'subdivision_count': 8,
        'subdivisions_per_beat': 2,
        'sticking_summary': 'Bombo cada tiempo, Charles abierto en contratiempo (+)',
        'notes': [
            # Kicks on 1, 2, 3, 4
            {'midi': 36, 'row': 'KICK', 'tick': 0, 'duration': [1, 8], 'velocity': 'ff', 'sticking': 'K', 'accent': True},
            {'midi': 36, 'row': 'KICK', 'tick': 480, 'duration': [1, 8], 'velocity': 'ff', 'sticking': 'K'},
            {'midi': 36, 'row': 'KICK', 'tick': 960, 'duration': [1, 8], 'velocity': 'ff', 'sticking': 'K'},
            {'midi': 36, 'row': 'KICK', 'tick': 1440, 'duration': [1, 8], 'velocity': 'ff', 'sticking': 'K'},
            # Snare on 2 & 4
            {'midi': 38, 'row': 'SNARE', 'tick': 480, 'duration': [1, 8], 'velocity': 'ff', 'sticking': 'L', 'accent': True},
            {'midi': 38, 'row': 'SNARE', 'tick': 1440, 'duration': [1, 8], 'velocity': 'ff', 'sticking': 'L', 'accent': True},
            # Hi-Hats: closed on beat, open on the '+'
            {'midi': 42, 'row': 'HI_HAT', 'tick': 0, 'duration': [1, 8], 'velocity': 'f', 'sticking': 'R', 'sub_type': 'closed'},
            {'midi': 46, 'row': 'HI_HAT', 'tick': 240, 'duration': [1, 8], 'velocity': 'ff', 'sticking': 'R', 'sub_type': 'open', 'accent': True},
            {'midi': 42, 'row': 'HI_HAT', 'tick': 480, 'duration': [1, 8], 'velocity': 'f', 'sticking': 'R', 'sub_type': 'closed'},
            {'midi': 46, 'row': 'HI_HAT', 'tick': 720, 'duration': [1, 8], 'velocity': 'ff', 'sticking': 'R', 'sub_type': 'open', 'accent': True},
            {'midi': 42, 'row': 'HI_HAT', 'tick': 960, 'duration': [1, 8], 'velocity': 'f', 'sticking': 'R', 'sub_type': 'closed'},
            {'midi': 46, 'row': 'HI_HAT', 'tick': 1200, 'duration': [1, 8], 'velocity': 'ff', 'sticking': 'R', 'sub_type': 'open', 'accent': True},
            {'midi': 42, 'row': 'HI_HAT', 'tick': 1440, 'duration': [1, 8], 'velocity': 'f', 'sticking': 'R', 'sub_type': 'closed'},
            {'midi': 46, 'row': 'HI_HAT', 'tick': 1680, 'duration': [1, 8], 'velocity': 'ff', 'sticking': 'R', 'sub_type': 'open', 'accent': True}
        ]
    },
    {
        'id': 'funk-syncopated-ghosts',
        'category': 'Grooves & Independencia',
        'category_id': 'grooves',
        'title': 'Funk Sincopado & Ghost Notes',
        'description': 'Patrón funk sincopado con notas fantasma en caja y bombo desplazado.',
        'difficulty': 'Avanzado',
        'recommended_bpm': 88,
        'bpm_range': [70, 110],
        'signature': [4, 4],
        'subdivision_count': 16,
        'subdivisions_per_beat': 4,
        'sticking_summary': 'Charles 16ths alternadas, caja acento + ghosts',
        'notes': [
            # 16th Hi-Hats
            {'midi': 42, 'row': 'HI_HAT', 'tick': i * 120, 'duration': [1, 16], 'velocity': 'f' if i % 2 == 0 else 'p', 
             'sticking': 'R' if i % 2 == 0 else 'L', 'sub_type': 'closed'}
            for i in range(16)
        ] + [
            # Kicks: 1, 1a, 3+
            {'midi': 36, 'row': 'KICK', 'tick': 0, 'duration': [1, 16], 'velocity': 'ff', 'sticking': 'K', 'accent': True},
            {'midi': 36, 'row': 'KICK', 'tick': 360, 'duration': [1, 16], 'velocity': 'f', 'sticking': 'K'},
            {'midi': 36, 'row': 'KICK', 'tick': 1200, 'duration': [1, 16], 'velocity': 'f', 'sticking': 'K'},
            # Snare: main backbeat on 2 & 4 + ghost notes on 'e' and 'a'
            {'midi': 38, 'row': 'SNARE', 'tick': 480, 'duration': [1, 16], 'velocity': 'ff', 'sticking': 'L', 'accent': True},
            {'midi': 38, 'row': 'SNARE', 'tick': 720, 'duration': [1, 16], 'velocity': 'pp', 'sticking': 'L', 'ghost': True},
            {'midi': 38, 'row': 'SNARE', 'tick': 1440, 'duration': [1, 16], 'velocity': 'ff', 'sticking': 'L', 'accent': True},
            {'midi': 38, 'row': 'SNARE', 'tick': 1800, 'duration': [1, 16], 'velocity': 'pp', 'sticking': 'L', 'ghost': True}
        ]
    },
    {
        'id': 'shuffle-blues-ride',
        'category': 'Grooves & Independencia',
        'category_id': 'grooves',
        'title': 'Shuffle Blues (Rebote en Plato Ride)',
        'description': 'Rebote swing ternario en Ride con caja acentuada en 2 y 4.',
        'difficulty': 'Intermedio',
        'recommended_bpm': 82,
        'bpm_range': [65, 115],
        'signature': [4, 4],
        'subdivision_count': 12,
        'subdivisions_per_beat': 3,
        'sticking_summary': 'Ride shuffle bounce (1 - let, 2 - let), Bombo 1 y 3',
        'notes': [
            # Ride shuffle (skip middle triplet)
            {'midi': 51, 'row': 'RIDE', 'tick': 0, 'duration': [1, 12], 'velocity': 'ff', 'sticking': 'R'},
            {'midi': 51, 'row': 'RIDE', 'tick': 320, 'duration': [1, 12], 'velocity': 'f', 'sticking': 'R'},
            {'midi': 51, 'row': 'RIDE', 'tick': 480, 'duration': [1, 12], 'velocity': 'ff', 'sticking': 'R'},
            {'midi': 51, 'row': 'RIDE', 'tick': 800, 'duration': [1, 12], 'velocity': 'f', 'sticking': 'R'},
            {'midi': 51, 'row': 'RIDE', 'tick': 960, 'duration': [1, 12], 'velocity': 'ff', 'sticking': 'R'},
            {'midi': 51, 'row': 'RIDE', 'tick': 1280, 'duration': [1, 12], 'velocity': 'f', 'sticking': 'R'},
            {'midi': 51, 'row': 'RIDE', 'tick': 1440, 'duration': [1, 12], 'velocity': 'ff', 'sticking': 'R'},
            {'midi': 51, 'row': 'RIDE', 'tick': 1760, 'duration': [1, 12], 'velocity': 'f', 'sticking': 'R'},
            # Kicks on 1 & 3
            {'midi': 36, 'row': 'KICK', 'tick': 0, 'duration': [1, 12], 'velocity': 'ff', 'sticking': 'K', 'accent': True},
            {'midi': 36, 'row': 'KICK', 'tick': 960, 'duration': [1, 12], 'velocity': 'f', 'sticking': 'K'},
            # Snare on 2 & 4
            {'midi': 38, 'row': 'SNARE', 'tick': 480, 'duration': [1, 12], 'velocity': 'ff', 'sticking': 'L', 'accent': True},
            {'midi': 38, 'row': 'SNARE', 'tick': 1440, 'duration': [1, 12], 'velocity': 'ff', 'sticking': 'L', 'accent': True}
        ]
    }
]


def get_lesson(lesson_id: str) -> dict | None:
    """Return a lesson formatted as a first-class practice song."""
    for les in LESSONS:
        if les['id'] == lesson_id:
            return {
                'song_id': les['id'],
                'artist': 'Academia de Batería DED-300X',
                'title': les['title'],
                'description': les['description'],
                'category': les['category'],
                'difficulty': les['difficulty'],
                'default_bpm': les['recommended_bpm'],
                'total_measures': 1,
                'is_lesson': True,
                'sections': [{'name': les['title'], 'measure_index': 0, 'measure_number': 1}],
                'measures': [
                    {
                        'measure_index': 0,
                        'measure_number': 1,
                        'signature': les['signature'],
                        'bpm': les['recommended_bpm'],
                        'marker': les['category'],
                        'measure_ticks': 1920,
                        'subdivision_count': les['subdivision_count'],
                        'subdivisions_per_beat': les['subdivisions_per_beat'],
                        'start_time_sec': 0.0,
                        'duration_sec': round((60.0 / les['recommended_bpm']) * les['signature'][0], 3),
                        'notes': les['notes']
                    }
                ]
            }
    return None
