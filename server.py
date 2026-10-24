"""Flask Server for Donner DED-300X Drum Practice Studio
Provides Songsterr search, drum track extraction, MIDI and GP5 exports, and serves the UI.
"""
from __future__ import annotations

import io
import json
import os
import re
import urllib.parse
import urllib.request
import time
from flask import Flask, jsonify, request, send_file, send_from_directory

import guitarpro as gp
from songsterr import get_meta, fetch_part, fetch_song, extract_song_id
from convert import build_song
from drum_engine import parse_songsterr_drum_track, export_midi_file
from lessons_data import LESSONS, get_lesson

app = Flask(__name__, static_folder='static', static_url_path='')
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

@app.after_request
def add_no_cache_headers(response):
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

CACHE_DIR = os.path.join(os.path.dirname(__file__), 'cache')
os.makedirs(CACHE_DIR, exist_ok=True)
CUSTOM_DIR = os.path.join(os.path.dirname(__file__), 'custom_songs')
os.makedirs(CUSTOM_DIR, exist_ok=True)

# Preset exercises including the exact fill from user's Image 1!
IMAGE_1_EXERCISE = {
    'song_id': 'exercise-sextuplet-fill',
    'artist': 'Rudimentos & Fills',
    'title': 'Sextuplet Tom & Kick Fill (Ejercicio Imagen 1)',
    'default_bpm': 75,
    'total_measures': 2,
    'sections': [{'name': 'Fill Sextuple', 'measure_index': 0, 'measure_number': 1}],
    'measures': [
        {
            'measure_index': 0,
            'measure_number': 1,
            'signature': [4, 4],
            'bpm': 75,
            'marker': 'Sextuplets (6)',
            'measure_ticks': 1920,
            'subdivision_count': 24, # 4 beats * 6 subdivisions
            'notes': [
                # Beat 1: R L (Tom 2), R L (Tom 3), K K (Kick)
                {'midi': 47, 'row': 'TOM_2', 'row_idx': 4, 'tick': 0, 'duration': [1, 24], 'beat_ticks': 80, 'velocity': 'f', 'accent': False, 'ghost': False, 'sticking': 'R'},
                {'midi': 47, 'row': 'TOM_2', 'row_idx': 4, 'tick': 80, 'duration': [1, 24], 'beat_ticks': 80, 'velocity': 'f', 'accent': False, 'ghost': False, 'sticking': 'L'},
                {'midi': 43, 'row': 'TOM_3', 'row_idx': 5, 'tick': 160, 'duration': [1, 24], 'beat_ticks': 80, 'velocity': 'f', 'accent': False, 'ghost': False, 'sticking': 'R'},
                {'midi': 43, 'row': 'TOM_3', 'row_idx': 5, 'tick': 240, 'duration': [1, 24], 'beat_ticks': 80, 'velocity': 'f', 'accent': False, 'ghost': False, 'sticking': 'L'},
                {'midi': 36, 'row': 'KICK', 'row_idx': 7, 'tick': 320, 'duration': [1, 24], 'beat_ticks': 80, 'velocity': 'f', 'accent': False, 'ghost': False, 'sticking': 'K'},
                {'midi': 36, 'row': 'KICK', 'row_idx': 7, 'tick': 400, 'duration': [1, 24], 'beat_ticks': 80, 'velocity': 'f', 'accent': False, 'ghost': False, 'sticking': 'K'},

                # Beat 2: R L (Tom 2), R L (Tom 3), K K (Kick)
                {'midi': 47, 'row': 'TOM_2', 'row_idx': 4, 'tick': 480, 'duration': [1, 24], 'beat_ticks': 80, 'velocity': 'f', 'accent': False, 'ghost': False, 'sticking': 'R'},
                {'midi': 47, 'row': 'TOM_2', 'row_idx': 4, 'tick': 560, 'duration': [1, 24], 'beat_ticks': 80, 'velocity': 'f', 'accent': False, 'ghost': False, 'sticking': 'L'},
                {'midi': 43, 'row': 'TOM_3', 'row_idx': 5, 'tick': 640, 'duration': [1, 24], 'beat_ticks': 80, 'velocity': 'f', 'accent': False, 'ghost': False, 'sticking': 'R'},
                {'midi': 43, 'row': 'TOM_3', 'row_idx': 5, 'tick': 720, 'duration': [1, 24], 'beat_ticks': 80, 'velocity': 'f', 'accent': False, 'ghost': False, 'sticking': 'L'},
                {'midi': 36, 'row': 'KICK', 'row_idx': 7, 'tick': 800, 'duration': [1, 24], 'beat_ticks': 80, 'velocity': 'f', 'accent': False, 'ghost': False, 'sticking': 'K'},
                {'midi': 36, 'row': 'KICK', 'row_idx': 7, 'tick': 880, 'duration': [1, 24], 'beat_ticks': 80, 'velocity': 'f', 'accent': False, 'ghost': False, 'sticking': 'K'},

                # Beat 3: R L (Tom 2), R L (Tom 3), K K (Kick)
                {'midi': 47, 'row': 'TOM_2', 'row_idx': 4, 'tick': 960, 'duration': [1, 24], 'beat_ticks': 80, 'velocity': 'f', 'accent': False, 'ghost': False, 'sticking': 'R'},
                {'midi': 47, 'row': 'TOM_2', 'row_idx': 4, 'tick': 1040, 'duration': [1, 24], 'beat_ticks': 80, 'velocity': 'f', 'accent': False, 'ghost': False, 'sticking': 'L'},
                {'midi': 43, 'row': 'TOM_3', 'row_idx': 5, 'tick': 1120, 'duration': [1, 24], 'beat_ticks': 80, 'velocity': 'f', 'accent': False, 'ghost': False, 'sticking': 'R'},
                {'midi': 43, 'row': 'TOM_3', 'row_idx': 5, 'tick': 1200, 'duration': [1, 24], 'beat_ticks': 80, 'velocity': 'f', 'accent': False, 'ghost': False, 'sticking': 'L'},
                {'midi': 36, 'row': 'KICK', 'row_idx': 7, 'tick': 1280, 'duration': [1, 24], 'beat_ticks': 80, 'velocity': 'f', 'accent': False, 'ghost': False, 'sticking': 'K'},
                {'midi': 36, 'row': 'KICK', 'row_idx': 7, 'tick': 1360, 'duration': [1, 24], 'beat_ticks': 80, 'velocity': 'f', 'accent': False, 'ghost': False, 'sticking': 'K'},

                # Beat 4: Accented Left Hand Snare hit!
                {'midi': 38, 'row': 'SNARE', 'row_idx': 6, 'tick': 1440, 'duration': [1, 4], 'beat_ticks': 480, 'velocity': 'ff', 'accent': True, 'ghost': False, 'sticking': 'L'},
            ]
        }
    ]
}


@app.route('/')
def index():
    return send_from_directory('static', 'index.html')


@app.route('/api/presets')
def get_presets():
    custom_presets = []
    if os.path.exists(CUSTOM_DIR):
        for fn in os.listdir(CUSTOM_DIR):
            if fn.endswith('.json'):
                try:
                    with open(os.path.join(CUSTOM_DIR, fn), 'r', encoding='utf-8') as f:
                        item = json.load(f)
                        custom_presets.append({
                            'id': item.get('song_id', fn.replace('.json', '')),
                            'artist': f"⭐ {item.get('artist', 'Custom')}",
                            'title': item.get('title', 'Partitura Guardada'),
                            'bpm': item.get('default_bpm', 120),
                            'is_featured': True,
                            'is_custom': True
                        })
                except Exception:
                    pass

    presets = [
        {
            'id': '2664276',
            'artist': 'Songsterr Notation Official',
            'title': 'Drum Key (Todas las Notaciones Batería)',
            'bpm': 120,
            'is_featured': True
        },
        {
            'id': '9374',
            'artist': 'Hoobastank',
            'title': 'The Reason (De tu captura)',
            'bpm': 83,
            'is_featured': True
        },
        {
            'id': 'exercise-sextuplet-fill',
            'artist': 'Técnica & Rudimentos',
            'title': 'Fill Séxtuple Tom-Kick (Imagen 1)',
            'bpm': 75,
            'is_featured': True
        },

        {
            'id': '20',
            'artist': 'Nirvana',
            'title': 'Smells Like Teen Spirit',
            'bpm': 117,
            'is_featured': False
        },
        {
            'id': '79',
            'artist': 'AC/DC',
            'title': 'Back In Black',
            'bpm': 93,
            'is_featured': False
        },
        {
            'id': '19',
            'artist': 'Metallica',
            'title': 'Enter Sandman',
            'bpm': 123,
            'is_featured': False
        },
        {
            'id': '258',
            'artist': 'Blink-182',
            'title': 'All The Small Things',
            'bpm': 148,
            'is_featured': False
        }
    ]
    return jsonify(custom_presets + presets)


@app.route('/api/lessons')
def get_lessons():
    """Return categorized drum lessons and rudiments."""
    categories = {}
    for les in LESSONS:
        cat = les.get('category', 'Otros')
        if cat not in categories:
            categories[cat] = []
        categories[cat].append({
            'id': les['id'],
            'title': les['title'],
            'description': les['description'],
            'difficulty': les['difficulty'],
            'bpm': les['recommended_bpm'],
            'bpm_range': les['bpm_range'],
            'signature': les['signature'],
            'sticking': les.get('sticking_summary', '')
        })
    return jsonify({
        'categories': [{'name': cat, 'lessons': items} for cat, items in categories.items()],
        'all': [
            {
                'id': les['id'],
                'category': les.get('category'),
                'title': les['title'],
                'description': les['description'],
                'difficulty': les['difficulty'],
                'bpm': les['recommended_bpm'],
                'signature': les['signature'],
                'sticking': les.get('sticking_summary', '')
            }
            for les in LESSONS
        ]
    })


@app.route('/api/search')
def search():
    query = request.args.get('q', '').strip()
    if not query:
        return jsonify([])

    # If it's a Songsterr URL or ID, return direct target
    if 'songsterr.com' in query or query.isdigit():
        try:
            s_id = extract_song_id(query)
            meta = get_meta(s_id)
            return jsonify([{
                'songId': s_id,
                'artist': meta.get('artist'),
                'title': meta.get('title'),
                'hasDrums': any(t.get('instrumentId') == 1024 or 'drum' in (t.get('instrument') or '').lower() or 'drum' in (t.get('name') or '').lower() for t in meta.get('tracks', []))
            }])
        except Exception:
            pass

    encoded = urllib.parse.quote(query)
    url = f"https://www.songsterr.com/api/songs?pattern={encoded}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
            results = []
            for item in data[:20]:
                tracks = item.get('tracks', [])
                has_drums = any(
                    t.get('instrumentId') == 1024 or 
                    'drum' in (t.get('name') or '').lower() or 
                    'drum' in (t.get('instrument') or '').lower()
                    for t in tracks
                )
                results.append({
                    'songId': item.get('songId'),
                    'artist': item.get('artist'),
                    'title': item.get('title'),
                    'hasDrums': has_drums
                })
            return jsonify(results)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/custom-songs', methods=['GET', 'POST'])
def custom_songs():
    if request.method == 'POST':
        data = request.get_json(force=True)
        song_id = data.get('song_id')
        if not song_id:
            song_id = f"custom-{int(time.time() * 1000)}"
            data['song_id'] = song_id
        data['is_custom'] = True
        custom_path = os.path.join(CUSTOM_DIR, f"{song_id}.json")
        with open(custom_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        cache_path = os.path.join(CACHE_DIR, f"{song_id}_parsed.json")
        with open(cache_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False)
        return jsonify({'success': True, 'song': data})
    else:
        results = []
        if os.path.exists(CUSTOM_DIR):
            for fn in os.listdir(CUSTOM_DIR):
                if fn.endswith('.json'):
                    try:
                        with open(os.path.join(CUSTOM_DIR, fn), 'r', encoding='utf-8') as f:
                            item = json.load(f)
                            results.append({
                                'song_id': item.get('song_id', fn.replace('.json', '')),
                                'title': item.get('title', 'Sin Título'),
                                'artist': item.get('artist', 'Custom'),
                                'default_bpm': item.get('default_bpm', 120),
                                'total_measures': item.get('total_measures', len(item.get('measures', []))),
                                'signature': item.get('signature', [4, 4]),
                                'created_at': item.get('created_at', '')
                            })
                    except Exception:
                        pass
        return jsonify(results)


@app.route('/api/custom-songs/<song_id>', methods=['DELETE'])
def delete_custom_song(song_id):
    custom_path = os.path.join(CUSTOM_DIR, f"{song_id}.json")
    if os.path.exists(custom_path):
        os.remove(custom_path)
        return jsonify({'success': True})
    return jsonify({'error': 'Partitura no encontrada'}), 404


@app.route('/api/song/<song_id_or_url>')
def get_song(song_id_or_url):
    handedness = request.args.get('handedness', 'right')
    
    # Check if this is a custom saved score
    custom_path = os.path.join(CUSTOM_DIR, f"{song_id_or_url}.json")
    if os.path.exists(custom_path):
        with open(custom_path, 'r', encoding='utf-8') as f:
            return jsonify(json.load(f))

    # Check if this is a professional lesson or rudiment
    lesson = get_lesson(song_id_or_url)
    if lesson:
        return jsonify(lesson)

    if song_id_or_url == 'exercise-sextuplet-fill':
        return jsonify(IMAGE_1_EXERCISE)

    try:
        song_id = extract_song_id(song_id_or_url)
        meta = get_meta(song_id)
        tracks = meta.get('tracks', [])
        
        # Find drum track index
        drum_track_idx = None
        for i, t in enumerate(tracks):
            instr = (t.get('instrument') or '').lower()
            name = (t.get('name') or '').lower()
            if t.get('instrumentId') == 1024 or 'drum' in instr or 'drum' in name or 'batería' in name:
                drum_track_idx = i
                break
                
        if drum_track_idx is None:
            # Fallback to last track or search for percussion
            for i, t in enumerate(tracks):
                if 'percussion' in (t.get('name') or '').lower():
                    drum_track_idx = i
                    break
        
        if drum_track_idx is None:
            return jsonify({'error': 'No se encontró pista de batería en esta canción de Songsterr'}), 404

        revision_id = meta['revisionId']
        image = meta.get('image', '')
        part_data = fetch_part(song_id, revision_id, image, drum_track_idx)
        
        parsed = parse_songsterr_drum_track(part_data, meta, handedness)
        parsed['drum_track_name'] = tracks[drum_track_idx].get('name', 'Drums')
        
        # Save cache for fast export
        cache_file = os.path.join(CACHE_DIR, f"{song_id}_parsed.json")
        with open(cache_file, 'w', encoding='utf-8') as f:
            json.dump(parsed, f)

        return jsonify(parsed)
    except Exception as e:
        return jsonify({'error': f"Error al descargar partitura: {str(e)}"}), 500


@app.route('/api/export/midi/<song_id>')
def export_midi(song_id):
    # Check if custom song
    custom_path = os.path.join(CUSTOM_DIR, f"{song_id}.json")
    if os.path.exists(custom_path):
        with open(custom_path, 'r', encoding='utf-8') as f:
            custom_data = json.load(f)
            midi_path = os.path.join(CACHE_DIR, f"{song_id}.mid")
            export_midi_file(custom_data, midi_path)
            safe_name = re.sub(r'[^\w\-_\.]', '_', f"{custom_data.get('title', 'Custom')}.mid")
            return send_file(midi_path, as_attachment=True, download_name=safe_name, mimetype="audio/midi")

    lesson = get_lesson(song_id)
    if lesson:
        midi_path = os.path.join(CACHE_DIR, f"{song_id}.mid")
        export_midi_file(lesson, midi_path)
        safe_name = re.sub(r'[^\w\-_\.]', '_', f"{lesson['title']}.mid")
        return send_file(midi_path, as_attachment=True, download_name=safe_name, mimetype="audio/midi")

    if song_id == 'exercise-sextuplet-fill':
        midi_path = os.path.join(CACHE_DIR, "exercise_fill.mid")
        export_midi_file(IMAGE_1_EXERCISE, midi_path)
        return send_file(midi_path, as_attachment=True, download_name="Sextuplet_Fill_Drums.mid", mimetype="audio/midi")

    try:
        cache_file = os.path.join(CACHE_DIR, f"{song_id}_parsed.json")
        if not os.path.exists(cache_file):
            # load it
            get_song(song_id)
            
        with open(cache_file, 'r', encoding='utf-8') as f:
            parsed = json.load(f)

        midi_path = os.path.join(CACHE_DIR, f"{song_id}_drums.mid")
        export_midi_file(parsed, midi_path)
        
        safe_title = re.sub(r'[^\w\-_\.]', '_', f"{parsed['artist']}_{parsed['title']}_Drums.mid")
        return send_file(midi_path, as_attachment=True, download_name=safe_title, mimetype="audio/midi")
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/export/gp5/<song_id>')
def export_gp5(song_id):
    if song_id == 'exercise-sextuplet-fill':
        return jsonify({'error': 'GP5 disponible para canciones de Songsterr'}), 400

    try:
        gp5_path = os.path.join(CACHE_DIR, f"{song_id}.gp5")
        if not os.path.exists(gp5_path):
            meta, parts = fetch_song(song_id)
            song = build_song(meta, parts)
            gp.write(song, gp5_path)

        meta = get_meta(int(song_id))
        safe_title = re.sub(r'[^\w\-_\.]', '_', f"{meta.get('artist', 'Artist')}_{meta.get('title', 'Song')}.gp5")
        return send_file(gp5_path, as_attachment=True, download_name=safe_title, mimetype="application/x-guitar-pro")
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    print(">>> Donner DED-300X Drum Practice Studio Server iniciado!")
    print(">>> Abre tu navegador en: http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=False)
