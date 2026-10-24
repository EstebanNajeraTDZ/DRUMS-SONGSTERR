/**
 * Interactive Grid Sequencer / Drum Roll Matrix with Guitar Hero Continuous Highway & Page Views
 * Features:
 *  1. GUITAR HERO / HIGHWAY CONTINUOUS SCROLL (Active by default):
 *     Measures glide smoothly from right to left across a fixed strike zone (🎯 GOLPE).
 *     Upcoming notes (1.5 - 2 full measures ahead) are always clearly visible before they reach the hit zone.
 *     Eliminates abrupt measure flips so drummers can prepare their hits and stickings in advance.
 *  2. SINGLE-MEASURE PAGE VIEW (Classic):
 *     Displays one isolated measure with cursor sweeping left to right.
 *  3. Interactive note placement ("pegar y quitar notas con clic"):
 *     Click empty cell to add, click note to delete (works in both Highway and Page views).
 *  4. Dynamic subdivision switcher:
 *     - Doble / Corcheas (2 golpes por pulso)
 *     - Triple / Tresillos (3 golpes por pulso)
 *     - Cuatro / Semicorcheas (4 golpes por pulso)
 *     - Sextu / Seisillos (6 golpes por pulso - Fill Imagen 1)
 *  5. Time signature switcher (2/4, 3/4, 4/4, 5/4, 6/8, 7/8, 12/8)
 *  6. Instant acoustic playback preview on note toggle
 *  7. Preset practice patterns (Fill Sextuplets Image 1, Rock 4/4, Shuffle Blues, 6/8 Ballad, Funk 16th)
 *  8. Clear measure button
 *  9. Real-time synchronization with Drum Notation Canvas & Donner DED-300X strike evaluation
 */

class GridSequencer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.currentMeasure = null;
        this.measures = [];
        this.currentMeasureIndex = 0;
        this.playheadPos = 0; // 0.0 to 1.0 within current measure
        this.activeSubdivisionIndex = -1;
        this.scrollMode = 'guitar_hero'; // 'guitar_hero' (continuous smooth scroll) or 'page' (static single measure)

        // Continuous Highway parameters (synchronized with DrumNotationRenderer)
        this.measureWidth = 560; // Exact match to notationCanvas.measureWidth
        this.targetX = 250;      // Fixed Strike Zone position from left edge
        this.labelWidth = 140;   // Pinned instrument column width
        this.loopStart = 0;
        this.loopEnd = 0;

        this.mountedMeasures = new Map(); // k -> { cardEl, measure }
        this.highwaySlider = null;
        this.highwayViewport = null;

        this.rows = [
            { id: 'HI_HAT', name: 'HI HAT', color: '#eab308', dot: '#facc15' },
            { id: 'CRASH',  name: 'CRASH',  color: '#64748b', dot: '#94a3b8' },
            { id: 'RIDE',   name: 'RIDE',   color: '#ec4899', dot: '#f472b6' },
            { id: 'TOM_1',  name: 'TOM 1',  color: '#3b82f6', dot: '#60a5fa' },
            { id: 'TOM_2',  name: 'TOM 2',  color: '#22c55e', dot: '#4ade80' },
            { id: 'TOM_3',  name: 'TOM 3',  color: '#a855f7', dot: '#c084fc' },
            { id: 'SNARE',  name: 'SNARE',  color: '#ef4444', dot: '#f87171' },
            { id: 'KICK',   name: 'KICK',   color: '#f97316', dot: '#fb923c' }
        ];

        // Initialize with default practice measure if none loaded
        this.initDefaultMeasure();
    }

    setDimensions(targetX, measureWidth) {
        this.targetX = targetX;
        this.measureWidth = measureWidth;
        const isMobile = window.innerWidth < 640;
        this.labelWidth = isMobile ? 80 : (window.innerWidth < 1024 ? 110 : 140);
        if (this.scrollMode === 'guitar_hero' && this.container) {
            const strikeZone = this.container.querySelector('.matrix-strike-zone');
            if (strikeZone) {
                strikeZone.style.left = `${this.targetX}px`;
            }
            const pinnedLeft = this.container.querySelector('.matrix-pinned-left');
            if (pinnedLeft) {
                pinnedLeft.style.width = `${this.labelWidth}px`;
            }
            if (this.mountedMeasures) {
                for (const [k, item] of this.mountedMeasures.entries()) {
                    if (item.cardEl) {
                        item.cardEl.style.left = `${k * this.measureWidth}px`;
                        item.cardEl.style.width = `${this.measureWidth}px`;
                    }
                }
            }
            if (this.highwaySlider) {
                const globalMeasurePos = this.currentMeasureIndex + (this.playheadPos || 0);
                const targetXInViewport = this.targetX - this.labelWidth;
                const scrollX = targetXInViewport - (globalMeasurePos * this.measureWidth);
                this.highwaySlider.style.transform = `translate3d(${scrollX}px, 0, 0)`;
            }
        }
    }

    initDefaultMeasure() {
        if (!this.currentMeasure) {
            this.currentMeasure = this.createDefaultRockMeasure(4, 4);
        }
    }

    createDefaultRockMeasure(beats = 4, subdivsPerBeat = 4) {
        const totalSubdivs = beats * subdivsPerBeat;
        const totalTicks = 1920;
        const stepTicks = totalTicks / totalSubdivs;

        const notes = [];
        // Hi-Hat on every 8th or step
        for (let i = 0; i < totalSubdivs; i += (subdivsPerBeat >= 4 ? 2 : 1)) {
            notes.push({
                row: 'HI_HAT',
                tick: Math.round(i * stepTicks),
                duration: [1, totalSubdivs],
                beat_ticks: stepTicks,
                velocity: 'f',
                accent: (i === 0),
                sticking: 'R',
                sub_type: 'closed'
            });
        }
        // Kick on Beat 1 and Beat 3
        notes.push({ row: 'KICK', tick: 0, duration: [1, totalSubdivs], beat_ticks: stepTicks, velocity: 'f', accent: true, sticking: 'K' });
        if (beats >= 3) {
            const beat3Tick = Math.round((2 * subdivsPerBeat) * stepTicks);
            notes.push({ row: 'KICK', tick: beat3Tick, duration: [1, totalSubdivs], beat_ticks: stepTicks, velocity: 'f', accent: false, sticking: 'K' });
        }
        // Snare on Beat 2 and Beat 4
        if (beats >= 2) {
            const beat2Tick = Math.round((1 * subdivsPerBeat) * stepTicks);
            notes.push({ row: 'SNARE', tick: beat2Tick, duration: [1, totalSubdivs], beat_ticks: stepTicks, velocity: 'f', accent: true, sticking: 'L' });
        }
        if (beats >= 4) {
            const beat4Tick = Math.round((3 * subdivsPerBeat) * stepTicks);
            notes.push({ row: 'SNARE', tick: beat4Tick, duration: [1, totalSubdivs], beat_ticks: stepTicks, velocity: 'f', accent: true, sticking: 'L' });
        }

        return {
            measure_index: 0,
            measure_number: 1,
            signature: [beats, 4],
            bpm: 83,
            measure_ticks: totalTicks,
            subdivision_count: totalSubdivs,
            subdivisions_per_beat: subdivsPerBeat,
            notes: notes
        };
    }

    setSong(songData) {
        if (!songData) return;
        this.measures = songData.measures || [];
        this.loopStart = 0;
        this.loopEnd = Math.max(0, this.measures.length - 1);
        if (this.measures.length > 0) {
            this.currentMeasureIndex = 0;
            this.currentMeasure = this.measures[0];
        }
        this.render();
    }

    setLoopRange(startM, endM) {
        this.loopStart = Math.max(0, startM);
        this.loopEnd = Math.max(this.loopStart, endM);
        this.render();
    }

    setMeasure(measure) {
        if (!measure) return;
        const isSame = (this.currentMeasure === measure && this.currentMeasureIndex === measure.measure_index);
        this.currentMeasure = measure;
        if (typeof measure.measure_index === 'number') {
            this.currentMeasureIndex = measure.measure_index;
        }
        if (this.measures.length === 0 || !this.measures[this.currentMeasureIndex]) {
            this.measures = [measure];
            this.currentMeasureIndex = 0;
            this.loopStart = 0;
            this.loopEnd = 0;
        }
        const beats = (measure.signature && measure.signature[0]) || 4;
        const totalSubdivs = measure.subdivision_count || 16;
        const subdivsPerBeat = measure.subdivisions_per_beat || Math.max(1, Math.round(totalSubdivs / beats));
        measure.subdivisions_per_beat = subdivsPerBeat;
        measure.subdivision_count = totalSubdivs;
        this.updateSubdivButtons(subdivsPerBeat);

        // If it's the exact same measure, avoid DOM work
        if (isSame) return;

        // In highway guitar hero mode, do NOT destroy innerHTML on every measure wrap/change!
        if (this.scrollMode === 'guitar_hero' && this.highwaySlider) {
            this.updateHighwayPosition();
        } else {
            this.render();
        }
    }

    setMeasureIndex(index) {
        const newIdx = Math.max(0, index);
        if (this.currentMeasureIndex === newIdx && this.currentMeasure === (this.measures && this.measures[newIdx])) {
            return;
        }
        this.currentMeasureIndex = newIdx;
        if (this.measures && this.measures[this.currentMeasureIndex]) {
            this.currentMeasure = this.measures[this.currentMeasureIndex];
        }
        if (this.scrollMode === 'guitar_hero' && this.highwaySlider) {
            this.updateHighwayPosition();
        } else {
            this.render();
        }
    }

    setScrollMode(mode) {
        this.scrollMode = (mode === 'page') ? 'page' : 'guitar_hero';
        this.render();
    }

    toggleScrollMode() {
        this.scrollMode = (this.scrollMode === 'guitar_hero') ? 'page' : 'guitar_hero';
        this.render();
        return this.scrollMode;
    }

    setPlayhead(pos, measureIndex = null) {
        this.playheadPos = Math.max(0, Math.min(1.0, pos));
        if (typeof measureIndex === 'number' && measureIndex >= 0) {
            this.currentMeasureIndex = measureIndex;
            if (this.measures && this.measures[measureIndex]) {
                this.currentMeasure = this.measures[measureIndex];
            }
        }

        if (this.scrollMode === 'guitar_hero') {
            this.updateHighwayPosition();
        } else {
            this.updatePlayheadCursor();
        }
    }

    setSubdivision(subdivsPerBeat) {
        if (!this.currentMeasure) this.initDefaultMeasure();
        const m = this.currentMeasure;
        const beats = (m.signature && m.signature[0]) || 4;
        const newTotalSubdivs = beats * subdivsPerBeat;
        const totalTicks = m.measure_ticks || 1920;
        const oldStepTicks = totalTicks / (m.subdivision_count || 16);
        const newStepTicks = totalTicks / newTotalSubdivs;

        // Preserve note musical timing with nearest slot snapping
        (m.notes || []).forEach(n => {
            const rawStep = n.tick / newStepTicks;
            const snappedStep = Math.round(rawStep);
            n.tick = Math.round(snappedStep * newStepTicks);
            n.duration = [1, newTotalSubdivs];
            n.beat_ticks = newStepTicks;
        });

        m.subdivisions_per_beat = subdivsPerBeat;
        m.subdivision_count = newTotalSubdivs;

        this.updateSubdivButtons(subdivsPerBeat);
        this.render();
        this.syncWithNotationCanvas();
    }

    setTimeSignature(beats, beatType = 4) {
        if (!this.currentMeasure) this.initDefaultMeasure();
        const m = this.currentMeasure;
        m.signature = [beats, beatType];
        const subdivsPerBeat = m.subdivisions_per_beat || 4;
        m.subdivision_count = beats * subdivsPerBeat;

        this.render();
        this.syncWithNotationCanvas();

        if (window.donnerMetronome) {
            window.donnerMetronome.setBeatsPerMeasure(beats);
        }
    }

    clearMeasure() {
        if (!this.currentMeasure) this.initDefaultMeasure();
        this.currentMeasure.notes = [];
        this.render();
        this.syncWithNotationCanvas();
    }

    loadPresetPattern(presetId) {
        if (!this.currentMeasure) this.initDefaultMeasure();
        const m = this.currentMeasure;
        const totalTicks = 1920;

        if (presetId === 'fill_image1') {
            // Sextuplet Tom & Kick Fill (Exact match to user's Image 1!)
            this.setSubdivision(6);
            m.notes = [
                // Beat 1: R L (Tom 2), R L (Tom 3), K K (Kick)
                { midi: 47, row: 'TOM_2', tick: 0, duration: [1, 24], velocity: 'f', sticking: 'R' },
                { midi: 47, row: 'TOM_2', tick: 80, duration: [1, 24], velocity: 'f', sticking: 'L' },
                { midi: 43, row: 'TOM_3', tick: 160, duration: [1, 24], velocity: 'f', sticking: 'R' },
                { midi: 43, row: 'TOM_3', tick: 240, duration: [1, 24], velocity: 'f', sticking: 'L' },
                { midi: 36, row: 'KICK', tick: 320, duration: [1, 24], velocity: 'f', sticking: 'K' },
                { midi: 36, row: 'KICK', tick: 400, duration: [1, 24], velocity: 'f', sticking: 'K' },

                // Beat 2: R L (Tom 2), R L (Tom 3), K K (Kick)
                { midi: 47, row: 'TOM_2', tick: 480, duration: [1, 24], velocity: 'f', sticking: 'R' },
                { midi: 47, row: 'TOM_2', tick: 560, duration: [1, 24], velocity: 'f', sticking: 'L' },
                { midi: 43, row: 'TOM_3', tick: 640, duration: [1, 24], velocity: 'f', sticking: 'R' },
                { midi: 43, row: 'TOM_3', tick: 720, duration: [1, 24], velocity: 'f', sticking: 'L' },
                { midi: 36, row: 'KICK', tick: 800, duration: [1, 24], velocity: 'f', sticking: 'K' },
                { midi: 36, row: 'KICK', tick: 880, duration: [1, 24], velocity: 'f', sticking: 'K' },

                // Beat 3: R L (Tom 2), R L (Tom 3), K K (Kick)
                { midi: 47, row: 'TOM_2', tick: 960, duration: [1, 24], velocity: 'f', sticking: 'R' },
                { midi: 47, row: 'TOM_2', tick: 1040, duration: [1, 24], velocity: 'f', sticking: 'L' },
                { midi: 43, row: 'TOM_3', tick: 1120, duration: [1, 24], velocity: 'f', sticking: 'R' },
                { midi: 43, row: 'TOM_3', tick: 1200, duration: [1, 24], velocity: 'f', sticking: 'L' },
                { midi: 36, row: 'KICK', tick: 1280, duration: [1, 24], velocity: 'f', sticking: 'K' },
                { midi: 36, row: 'KICK', tick: 1360, duration: [1, 24], velocity: 'f', sticking: 'K' },

                // Beat 4: R L (Tom 1), R L (Tom 2), R L (Snare)
                { midi: 48, row: 'TOM_1', tick: 1440, duration: [1, 24], velocity: 'f', sticking: 'R' },
                { midi: 48, row: 'TOM_1', tick: 1520, duration: [1, 24], velocity: 'f', sticking: 'L' },
                { midi: 47, row: 'TOM_2', tick: 1600, duration: [1, 24], velocity: 'f', sticking: 'R' },
                { midi: 47, row: 'TOM_2', tick: 1680, duration: [1, 24], velocity: 'f', sticking: 'L' },
                { midi: 38, row: 'SNARE', tick: 1760, duration: [1, 24], velocity: 'f', sticking: 'R', accent: true },
                { midi: 38, row: 'SNARE', tick: 1840, duration: [1, 24], velocity: 'f', sticking: 'L', accent: true }
            ];
        } else if (presetId === 'rock_basic') {
            this.setSubdivision(4);
            this.currentMeasure = this.createDefaultRockMeasure(4, 4);
        } else if (presetId === 'shuffle_triplet') {
            this.setSubdivision(3);
            const notes = [];
            const step = totalTicks / 12;
            for (let i = 0; i < 12; i++) {
                if (i % 3 !== 1) { // Shuffle bounce on 1 and let
                    notes.push({ row: 'RIDE', tick: Math.round(i * step), duration: [1, 12], sticking: 'R' });
                }
            }
            notes.push({ row: 'KICK', tick: 0, duration: [1, 12], sticking: 'K', accent: true });
            notes.push({ row: 'KICK', tick: Math.round(6 * step), duration: [1, 12], sticking: 'K' });
            notes.push({ row: 'SNARE', tick: Math.round(3 * step), duration: [1, 12], sticking: 'L', accent: true });
            notes.push({ row: 'SNARE', tick: Math.round(9 * step), duration: [1, 12], sticking: 'L', accent: true });
            m.notes = notes;
        } else if (presetId === 'ballad_6_8') {
            this.setTimeSignature(6, 8);
            this.setSubdivision(2);
            const notes = [];
            const step = totalTicks / 12;
            for (let i = 0; i < 12; i++) {
                notes.push({ row: 'HI_HAT', tick: Math.round(i * step), duration: [1, 12], sticking: 'R' });
            }
            notes.push({ row: 'KICK', tick: 0, duration: [1, 12], sticking: 'K', accent: true });
            notes.push({ row: 'SNARE', tick: Math.round(6 * step), duration: [1, 12], sticking: 'L', accent: true });
            m.notes = notes;
        } else if (presetId === 'funk_16th') {
            this.setSubdivision(4);
            const step = totalTicks / 16;
            const notes = [];
            for (let i = 0; i < 16; i++) {
                notes.push({ row: 'HI_HAT', tick: Math.round(i * step), duration: [1, 16], sticking: (i % 2 === 0 ? 'R' : 'L') });
            }
            notes.push({ row: 'KICK', tick: 0, duration: [1, 16], sticking: 'K', accent: true });
            notes.push({ row: 'KICK', tick: Math.round(6 * step), duration: [1, 16], sticking: 'K' });
            notes.push({ row: 'KICK', tick: Math.round(10 * step), duration: [1, 16], sticking: 'K' });
            notes.push({ row: 'SNARE', tick: Math.round(4 * step), duration: [1, 16], sticking: 'L', accent: true });
            notes.push({ row: 'SNARE', tick: Math.round(12 * step), duration: [1, 16], sticking: 'L', accent: true });
            notes.push({ row: 'SNARE', tick: Math.round(15 * step), duration: [1, 16], sticking: 'L', ghost: true });
            m.notes = notes;
        }

        this.render();
        this.syncWithNotationCanvas();
    }

    // Toggle note on grid cell click ("pegar / quitar nota")
    toggleCell(rowId, stepIndex, targetMeasure = null) {
        const m = targetMeasure || this.currentMeasure;
        if (!m) return;
        const totalSubdivs = m.subdivision_count || 16;
        const totalTicks = m.measure_ticks || 1920;
        const targetTick = Math.round((stepIndex / totalSubdivs) * totalTicks);
        const tolerance = (totalTicks / totalSubdivs) * 0.48;

        // Check if a note already exists on this row that matches this cell closest
        let existingIdx = -1;
        let minDiff = Infinity;
        (m.notes || []).forEach((n, idx) => {
            if (n.row === rowId) {
                const diff = Math.abs(n.tick - targetTick);
                if (diff <= tolerance && diff < minDiff) {
                    minDiff = diff;
                    existingIdx = idx;
                }
            }
        });

        if (existingIdx !== -1) {
            // Delete note
            m.notes.splice(existingIdx, 1);
        } else {
            // Add note
            let sticking = 'R';
            if (rowId === 'KICK') sticking = 'K';
            else if (rowId === 'SNARE') sticking = (stepIndex % 2 === 0 ? 'R' : 'L');
            else sticking = (stepIndex % 2 === 0 ? 'R' : 'L');

            let subType = null;
            if (rowId === 'HI_HAT') subType = (window.donnerMidi && window.donnerMidi.hiHatPedalValue > 60) ? 'closed' : 'open';

            const newNote = {
                row: rowId,
                tick: targetTick,
                duration: [1, totalSubdivs],
                beat_ticks: totalTicks / totalSubdivs,
                velocity: 'f',
                accent: (stepIndex % (m.subdivisions_per_beat || 4) === 0),
                sticking: sticking,
                sub_type: subType
            };

            m.notes.push(newNote);

            // Instant audio feedback
            if (window.drumAudio) {
                window.drumAudio.resume();
                window.drumAudio.trigger(rowId, 110, null, subType);
            }
            this.flashRowHit(rowId);
        }

        if (this.scrollMode === 'guitar_hero') {
            this.refreshMountedMeasureNotes(m);
        } else {
            this.updateNotesInPlace();
        }
        this.syncWithNotationCanvas();
    }

    syncWithNotationCanvas() {
        if (window.notationRenderer) {
            window.notationRenderer.setMeasure(this.currentMeasure);
        }
        if (window.app) {
            window.app.isLessonMode = true;
            if (window.app.currentSong && window.app.currentSong.measures && window.app.currentSong.measures[window.app.currentMeasureIndex]) {
                window.app.currentSong.measures[window.app.currentMeasureIndex] = this.currentMeasure;
            }
        }
    }

    updateSubdivButtons(activeSub) {
        document.querySelectorAll('.subdiv-btn').forEach(btn => {
            btn.classList.toggle('active', Number(btn.dataset.sub) === activeSub);
        });
    }

    render() {
        if (!this.container) return;
        this.container.innerHTML = '';
        this.mountedMeasures.clear();

        if (!this.currentMeasure) {
            this.initDefaultMeasure();
        }

        if (this.scrollMode === 'guitar_hero') {
            this.renderHighway();
        } else {
            this.renderPage();
        }
    }

    // ==========================================
    // 1. GUITAR HERO / CONTINUOUS HIGHWAY RENDERER
    // ==========================================
    renderHighway() {
        const wrapper = document.createElement('div');
        wrapper.className = 'matrix-highway-wrapper';

        // A. Pinned Left Column (Instrument Dot, Name, Mute button)
        const pinnedLeft = document.createElement('div');
        pinnedLeft.className = 'matrix-pinned-left';

        // Pinned Top Bar aligned with Highway Measure Top Bar
        const pinnedTopBar = document.createElement('div');
        pinnedTopBar.className = 'matrix-pinned-top-bar';
        pinnedLeft.appendChild(pinnedTopBar);

        const pinnedHeader = document.createElement('div');
        pinnedHeader.className = 'matrix-pinned-header';
        pinnedHeader.textContent = 'PADS / KIT';
        pinnedLeft.appendChild(pinnedHeader);

        this.rows.forEach(r => {
            const rowEl = document.createElement('div');
            rowEl.className = 'matrix-pinned-row';
            rowEl.dataset.row = r.id;

            const dot = document.createElement('span');
            dot.className = 'instrument-dot';
            dot.style.backgroundColor = r.dot;

            const name = document.createElement('span');
            name.className = 'instrument-name';
            name.textContent = r.name;

            const muteBtn = document.createElement('button');
            muteBtn.className = 'mute-toggle-btn';
            muteBtn.title = `Silenciar ${r.name}`;
            muteBtn.textContent = 'M';
            if (window.drumAudio && window.drumAudio.isVoiceMuted(r.id)) {
                muteBtn.classList.add('muted');
            }
            muteBtn.onclick = (e) => {
                e.stopPropagation();
                if (window.drumAudio) {
                    const isMuted = window.drumAudio.toggleMuteVoice(r.id);
                    muteBtn.classList.toggle('muted', isMuted);
                }
            };

            rowEl.appendChild(dot);
            rowEl.appendChild(name);
            rowEl.appendChild(muteBtn);
            pinnedLeft.appendChild(rowEl);
        });

        wrapper.appendChild(pinnedLeft);

        // B. Fixed Strike Zone (🎯 GOLPE Laser & Target Fret Rings)
        const strikeZone = document.createElement('div');
        strikeZone.className = 'matrix-strike-zone';
        strikeZone.style.left = `${this.targetX}px`;

        const badge = document.createElement('div');
        badge.className = 'matrix-strike-badge';
        badge.textContent = '🎯 GOLPE';
        strikeZone.appendChild(badge);

        const laser = document.createElement('div');
        laser.className = 'matrix-strike-laser';
        strikeZone.appendChild(laser);

        // Fret target rings aligned to the vertical center of each drum track
        // TopBar: 20px + gap 5px + Sublabels: 20px + gap 5px = 50px.
        // Row height: 38px, center = 50 + 19 = 69px. Ring is 24px high, top = 69 - 12 = 57px.
        // Successive rows center: 57 + idx * 43px.
        this.rows.forEach((r, idx) => {
            const ring = document.createElement('div');
            ring.className = 'matrix-target-ring';
            ring.dataset.row = r.id;
            ring.style.top = `${57 + idx * 43}px`;
            strikeZone.appendChild(ring);
        });

        wrapper.appendChild(strikeZone);

        // C. Continuous Highway Viewport & Slider
        const viewport = document.createElement('div');
        viewport.className = 'matrix-highway-viewport';
        this.highwayViewport = viewport;

        const slider = document.createElement('div');
        slider.className = 'matrix-highway-slider';
        this.highwaySlider = slider;
        viewport.appendChild(slider);

        wrapper.appendChild(viewport);
        this.container.appendChild(wrapper);

        this.updateHighwayPosition();
    }

    updateHighwayPosition() {
        if (!this.highwaySlider || !this.highwayViewport) return;

        const measuresPool = (this.measures && this.measures.length > 0) ? this.measures : [this.currentMeasure];
        const activeIdx = this.currentMeasureIndex;
        const prog = this.playheadPos;
        const globalMeasurePos = activeIdx + prog;

        // Position target zone inside the viewport
        const targetXInViewport = this.targetX - this.labelWidth; // 250 - 140 = 110px
        const scrollX = targetXInViewport - (globalMeasurePos * this.measureWidth);

        // Hardware-accelerated 60 FPS sub-pixel translation
        this.highwaySlider.style.transform = `translate3d(${scrollX}px, 0, 0)`;

        const viewportWidth = this.highwayViewport.clientWidth || 1060;
        const minK = Math.floor((-scrollX - this.measureWidth) / this.measureWidth) - 1;
        const maxK = Math.ceil((viewportWidth - scrollX) / this.measureWidth) + 1;

        const lStart = Math.min(this.loopStart || 0, measuresPool.length - 1);
        const lEnd = Math.max(lStart, Math.min(this.loopEnd || (measuresPool.length - 1), measuresPool.length - 1));
        const loopSpan = Math.max(1, lEnd - lStart + 1);

        // 1. Mount missing visible measures
        for (let k = minK; k <= maxK; k++) {
            if (!this.mountedMeasures.has(k)) {
                let m = null;
                if (measuresPool.length === 1) {
                    m = measuresPool[0];
                } else if (k >= lStart && k <= lEnd) {
                    m = measuresPool[k];
                } else {
                    const offset = ((k - lStart) % loopSpan + loopSpan) % loopSpan;
                    m = measuresPool[lStart + offset];
                }

                if (m) {
                    const cardEl = this.buildHighwayMeasureCard(m, k);
                    this.highwaySlider.appendChild(cardEl);
                    this.mountedMeasures.set(k, { cardEl, measure: m });
                }
            }
        }

        // 2. Unmount out-of-view measures and update active/passed states
        for (const [mountedK, item] of this.mountedMeasures.entries()) {
            if (mountedK < minK || mountedK > maxK) {
                if (item.cardEl && item.cardEl.parentNode) {
                    item.cardEl.parentNode.removeChild(item.cardEl);
                }
                this.mountedMeasures.delete(mountedK);
            } else {
                const isActive = (mountedK === activeIdx);
                item.cardEl.classList.toggle('active-measure', isActive);
                const badge = item.cardEl.querySelector('.highway-measure-badge');
                if (badge) badge.classList.toggle('active-badge', isActive);

                // Highlight active subdivision and dim passed notes
                if (isActive) {
                    const totalSubdivs = item.measure.subdivision_count || 16;
                    const curStep = Math.floor(prog * totalSubdivs);
                    const subCells = item.cardEl.querySelectorAll('.sublabel-cell');
                    subCells.forEach((c, idx) => c.classList.toggle('active-sub', idx === curStep));

                    const cells = item.cardEl.querySelectorAll('.grid-slot-cell');
                    cells.forEach(c => {
                        const step = Number(c.dataset.step);
                        c.classList.toggle('passed-strike', step < curStep);
                    });
                } else if (mountedK < activeIdx) {
                    const cells = item.cardEl.querySelectorAll('.grid-slot-cell');
                    cells.forEach(c => c.classList.add('passed-strike'));
                } else {
                    const cells = item.cardEl.querySelectorAll('.grid-slot-cell');
                    cells.forEach(c => c.classList.remove('passed-strike'));
                }
            }
        }
    }

    buildHighwayMeasureCard(m, k) {
        const card = document.createElement('div');
        card.className = 'highway-measure-card';
        card.dataset.k = k;
        card.style.left = `${k * this.measureWidth}px`;
        card.style.width = `${this.measureWidth}px`;

        const totalSubdivs = m.subdivision_count || 16;
        const beats = (m.signature && m.signature[0]) || 4;
        const subdivsPerBeat = m.subdivisions_per_beat || Math.max(1, Math.round(totalSubdivs / beats));
        const totalTicks = m.measure_ticks || 1920;
        const stepTicks = totalTicks / totalSubdivs;
        const tolerance = stepTicks * 0.48;

        // 1. Measure Top Bar: Badge Pill (Strictly ABOVE the subdivision numbers row)
        const topBar = document.createElement('div');
        topBar.className = 'highway-measure-top-bar';

        const badge = document.createElement('span');
        badge.className = 'highway-measure-badge';
        const measNum = m.measure_number || (k + 1);
        badge.textContent = `Compás ${measNum}`;
        topBar.appendChild(badge);
        card.appendChild(topBar);

        // 2. Subdivision Labels Row (1:1 direct grid matching drum tracks below)
        const sublabels = document.createElement('div');
        sublabels.className = 'highway-sublabels';
        sublabels.style.gridTemplateColumns = `repeat(${totalSubdivs}, 1fr)`;

        for (let i = 0; i < totalSubdivs; i++) {
            const beatIndex = Math.floor(i / subdivsPerBeat) + 1;
            const subIndex = i % subdivsPerBeat;
            const subEl = document.createElement('div');
            subEl.className = 'sublabel-cell';
            if (subIndex === 0) subEl.classList.add('beat-start');

            let label = '';
            if (subdivsPerBeat === 6) {
                const sextLabels = ['', 'trip', 'let', '+', 'trip', 'let'];
                label = subIndex === 0 ? `<span class="beat-num">${beatIndex}</span>` : sextLabels[subIndex];
            } else if (subdivsPerBeat === 4) {
                const sixteenthLabels = ['', 'e', '+', 'a'];
                label = subIndex === 0 ? `<span class="beat-num">${beatIndex}</span>` : sixteenthLabels[subIndex];
            } else if (subdivsPerBeat === 3) {
                const tripLabels = ['', 'trip', 'let'];
                label = subIndex === 0 ? `<span class="beat-num">${beatIndex}</span>` : tripLabels[subIndex];
            } else {
                label = subIndex === 0 ? `<span class="beat-num">${beatIndex}</span>` : '+';
            }

            subEl.innerHTML = label;
            sublabels.appendChild(subEl);
        }
        card.appendChild(sublabels);

        // Map notes into [rowId][subdivIndex]
        const noteMatrix = {};
        this.rows.forEach(r => {
            noteMatrix[r.id] = {};
            const rowNotes = (m.notes || []).filter(n => n.row === r.id);
            for (let c = 0; c < totalSubdivs; c++) {
                const targetTick = Math.round((c / totalSubdivs) * totalTicks);
                let closest = null;
                let minDiff = Infinity;
                for (let i = 0; i < rowNotes.length; i++) {
                    const diff = Math.abs(rowNotes[i].tick - targetTick);
                    if (diff <= tolerance && diff < minDiff) {
                        minDiff = diff;
                        closest = rowNotes[i];
                    }
                }
                if (closest) noteMatrix[r.id][c] = closest;
            }
        });

        // 2. 8 Drum Track Lanes
        this.rows.forEach(r => {
            const lane = document.createElement('div');
            lane.className = `highway-row-lane track-${r.id.toLowerCase()}`;
            lane.dataset.row = r.id;
            lane.style.gridTemplateColumns = `repeat(${totalSubdivs}, 1fr)`;

            for (let c = 0; c < totalSubdivs; c++) {
                const cell = document.createElement('div');
                cell.className = 'grid-slot-cell';
                if (c % subdivsPerBeat === 0) cell.classList.add('beat-boundary');
                cell.dataset.step = c;
                cell.dataset.row = r.id;

                cell.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.toggleCell(r.id, c, m);
                });

                const note = noteMatrix[r.id][c];
                if (note) {
                    cell.appendChild(this.createNoteBlock(note, r));
                }

                lane.appendChild(cell);
            }

            card.appendChild(lane);
        });

        return card;
    }

    refreshMountedMeasureNotes(targetMeasure) {
        if (!targetMeasure) return;
        const totalSubdivs = targetMeasure.subdivision_count || 16;
        const totalTicks = targetMeasure.measure_ticks || 1920;
        const stepTicks = totalTicks / totalSubdivs;
        const tolerance = stepTicks * 0.48;

        const noteMatrix = {};
        this.rows.forEach(r => {
            noteMatrix[r.id] = {};
            const rowNotes = (targetMeasure.notes || []).filter(n => n.row === r.id);
            for (let c = 0; c < totalSubdivs; c++) {
                const targetTick = Math.round((c / totalSubdivs) * totalTicks);
                let closest = null;
                let minDiff = Infinity;
                for (let i = 0; i < rowNotes.length; i++) {
                    const diff = Math.abs(rowNotes[i].tick - targetTick);
                    if (diff <= tolerance && diff < minDiff) {
                        minDiff = diff;
                        closest = rowNotes[i];
                    }
                }
                if (closest) noteMatrix[r.id][c] = closest;
            }
        });

        for (const item of this.mountedMeasures.values()) {
            if (item.measure === targetMeasure) {
                const cells = item.cardEl.querySelectorAll('.grid-slot-cell');
                cells.forEach(cell => {
                    const rowId = cell.dataset.row;
                    const step = Number(cell.dataset.step);
                    const note = noteMatrix[rowId] ? noteMatrix[rowId][step] : null;
                    cell.textContent = '';
                    if (note) {
                        const r = this.rows.find(x => x.id === rowId) || { id: rowId, color: '#ef4444' };
                        cell.appendChild(this.createNoteBlock(note, r));
                    }
                });
            }
        }
    }

    // ==========================================
    // 2. SINGLE-MEASURE PAGE VIEW RENDERER (Classic)
    // ==========================================
    renderPage() {
        const m = this.currentMeasure;
        const totalSubdivs = m.subdivision_count || 16;
        const beats = (m.signature && m.signature[0]) || 4;
        const subdivsPerBeat = m.subdivisions_per_beat || Math.max(1, Math.round(totalSubdivs / beats));

        this.renderedSubdivs = totalSubdivs;
        this.renderedBeats = beats;

        const isMobile = window.innerWidth < 640;
        const labelWidth = isMobile ? 80 : (window.innerWidth < 1024 ? 110 : 140);
        // Minimum width so that 16 steps never squash below ~28px each
        const minGridWidth = Math.max(480, totalSubdivs * 28);

        // Outer wrapper
        const pageWrapper = document.createElement('div');
        pageWrapper.className = 'matrix-page-wrapper';

        // 1. Pinned Left Labels Column
        const pinnedLabels = document.createElement('div');
        pinnedLabels.className = 'page-pinned-labels';
        pinnedLabels.style.width = `${labelWidth}px`;

        const headerSpacer = document.createElement('div');
        headerSpacer.className = 'page-header-spacer';
        pinnedLabels.appendChild(headerSpacer);

        this.rows.forEach(r => {
            const labelCol = document.createElement('div');
            labelCol.className = 'page-row-label';

            const dot = document.createElement('span');
            dot.className = 'instrument-dot';
            dot.style.backgroundColor = r.dot;

            const name = document.createElement('span');
            name.className = 'instrument-name';
            name.textContent = r.name;

            const muteBtn = document.createElement('button');
            muteBtn.className = 'mute-toggle-btn';
            muteBtn.title = `Silenciar ${r.name}`;
            muteBtn.textContent = 'M';
            if (window.drumAudio && window.drumAudio.isVoiceMuted(r.id)) {
                muteBtn.classList.add('muted');
            }
            muteBtn.onclick = (e) => {
                e.stopPropagation();
                if (window.drumAudio) {
                    const isMuted = window.drumAudio.toggleMuteVoice(r.id);
                    muteBtn.classList.toggle('muted', isMuted);
                }
            };

            labelCol.appendChild(dot);
            labelCol.appendChild(name);
            labelCol.appendChild(muteBtn);
            pinnedLabels.appendChild(labelCol);
        });

        pageWrapper.appendChild(pinnedLabels);

        // 2. Horizontally Scrollable Cells Viewport (Smooth follow like Guitar Hero)
        const scrollViewport = document.createElement('div');
        scrollViewport.className = 'page-matrix-scroll-viewport';

        const scrollContent = document.createElement('div');
        scrollContent.className = 'page-matrix-scroll-content';
        scrollContent.style.minWidth = `${minGridWidth}px`;

        // Sublabels Header
        const subLabelsContainer = document.createElement('div');
        subLabelsContainer.className = 'grid-sublabels-container';
        subLabelsContainer.style.gridTemplateColumns = `repeat(${totalSubdivs}, 1fr)`;

        for (let i = 0; i < totalSubdivs; i++) {
            const beatIndex = Math.floor(i / subdivsPerBeat) + 1;
            const subIndex = i % subdivsPerBeat;
            const subEl = document.createElement('div');
            subEl.className = 'sublabel-cell';
            if (subIndex === 0) subEl.classList.add('beat-start');

            let label = '';
            if (subdivsPerBeat === 6) {
                const sextLabels = ['', 'trip', 'let', '+', 'trip', 'let'];
                label = subIndex === 0 ? `<span class="beat-num">${beatIndex}</span>` : sextLabels[subIndex];
            } else if (subdivsPerBeat === 4) {
                const sixteenthLabels = ['', 'e', '+', 'a'];
                label = subIndex === 0 ? `<span class="beat-num">${beatIndex}</span>` : sixteenthLabels[subIndex];
            } else if (subdivsPerBeat === 3) {
                const tripLabels = ['', 'trip', 'let'];
                label = subIndex === 0 ? `<span class="beat-num">${beatIndex}</span>` : tripLabels[subIndex];
            } else {
                label = subIndex === 0 ? `<span class="beat-num">${beatIndex}</span>` : '+';
            }

            subEl.innerHTML = label;
            subLabelsContainer.appendChild(subEl);
        }
        scrollContent.appendChild(subLabelsContainer);

        // Grid Body with playhead
        const gridBody = document.createElement('div');
        gridBody.className = 'grid-body';
        gridBody.id = 'grid-body-matrix';

        const playheadEl = document.createElement('div');
        playheadEl.className = 'grid-playhead-line';
        playheadEl.id = 'grid-playhead';
        gridBody.appendChild(playheadEl);

        const totalTicks = m.measure_ticks || 1920;
        const stepTicks = totalTicks / totalSubdivs;
        const tolerance = stepTicks * 0.48;

        const noteMatrix = {};
        this.rows.forEach(r => {
            noteMatrix[r.id] = {};
            const rowNotes = (m.notes || []).filter(n => n.row === r.id);
            for (let c = 0; c < totalSubdivs; c++) {
                const targetTick = Math.round((c / totalSubdivs) * totalTicks);
                let closest = null;
                let minDiff = Infinity;
                rowNotes.forEach(n => {
                    const diff = Math.abs(n.tick - targetTick);
                    if (diff <= tolerance && diff < minDiff) {
                        minDiff = diff;
                        closest = n;
                    }
                });
                if (closest) noteMatrix[r.id][c] = closest;
            }
        });

        this.rows.forEach(r => {
            const rowEl = document.createElement('div');
            rowEl.className = `drum-row-track track-${r.id.toLowerCase()}`;
            rowEl.dataset.row = r.id;

            const cellsContainer = document.createElement('div');
            cellsContainer.className = 'row-cells-container';
            cellsContainer.style.gridTemplateColumns = `repeat(${totalSubdivs}, 1fr)`;

            for (let c = 0; c < totalSubdivs; c++) {
                const cell = document.createElement('div');
                cell.className = 'grid-slot-cell';
                if (c % subdivsPerBeat === 0) cell.classList.add('beat-boundary');
                cell.dataset.step = c;
                cell.dataset.row = r.id;

                cell.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.toggleCell(r.id, c, m);
                });

                const note = noteMatrix[r.id][c];
                if (note) {
                    cell.appendChild(this.createNoteBlock(note, r));
                }

                cellsContainer.appendChild(cell);
            }

            rowEl.appendChild(cellsContainer);
            gridBody.appendChild(rowEl);
        });

        scrollContent.appendChild(gridBody);
        scrollViewport.appendChild(scrollContent);
        pageWrapper.appendChild(scrollViewport);

        this.container.appendChild(pageWrapper);
        this.updatePlayheadCursor();
    }

    createNoteBlock(note, row) {
        const block = document.createElement('div');
        block.className = 'hit-block';
        block.style.backgroundColor = row.color;

        if (note.accent) {
            block.classList.add('accented');
        }

        const letter = note.sticking || '';
        let symbolHtml = '';

        if (row.id === 'HI_HAT') {
            if (note.sub_type === 'half_open') {
                block.classList.add('hihat-half-open');
                symbolHtml = `<span class="sub-symbol">⊘</span>`;
            } else if (note.sub_type === 'open') {
                block.classList.add('hihat-open');
                symbolHtml = `<span class="sub-symbol">⊗</span>`;
            } else if (note.sub_type === 'pedal') {
                block.classList.add('hihat-pedal');
            }
        } else if (row.id === 'SNARE' && note.sub_type === 'cross_stick') {
            block.classList.add('snare-cross-stick');
            symbolHtml = `<span class="sub-symbol">◇</span>`;
        } else if (row.id === 'RIDE' && note.sub_type === 'bell') {
            block.classList.add('ride-bell');
            symbolHtml = `<span class="sub-symbol">◇</span>`;
        }

        let content = `<span class="sticking-char">${letter}</span>${symbolHtml}`;
        if (note.accent) {
            content = `<span class="accent-mark">&gt;</span>` + content;
        }
        block.innerHTML = content;
        return block;
    }

    updateNotesInPlace() {
        if (!this.container || !this.currentMeasure) return;
        const m = this.currentMeasure;
        const totalSubdivs = m.subdivision_count || 16;
        const totalTicks = m.measure_ticks || 1920;
        const stepTicks = totalTicks / totalSubdivs;
        const tolerance = stepTicks * 0.48;

        const noteMatrix = {};
        this.rows.forEach(r => {
            noteMatrix[r.id] = {};
            const rowNotes = (m.notes || []).filter(n => n.row === r.id);
            for (let c = 0; c < totalSubdivs; c++) {
                const targetTick = Math.round((c / totalSubdivs) * totalTicks);
                let closest = null;
                let minDiff = Infinity;
                for (let i = 0; i < rowNotes.length; i++) {
                    const diff = Math.abs(rowNotes[i].tick - targetTick);
                    if (diff <= tolerance && diff < minDiff) {
                        minDiff = diff;
                        closest = rowNotes[i];
                    }
                }
                if (closest) noteMatrix[r.id][c] = closest;
            }
        });

        const cells = this.container.querySelectorAll('.grid-slot-cell');
        for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];
            const rowId = cell.dataset.row;
            const step = Number(cell.dataset.step);
            const note = noteMatrix[rowId] ? noteMatrix[rowId][step] : null;

            cell.textContent = '';
            if (note) {
                const r = this.rows.find(x => x.id === rowId) || { id: rowId, color: '#ef4444' };
                cell.appendChild(this.createNoteBlock(note, r));
            }
        }
    }

    updatePlayheadCursor() {
        const playhead = document.getElementById('grid-playhead');
        const gridBody = document.getElementById('grid-body-matrix');
        if (!playhead || !gridBody || !this.currentMeasure) return;

        const totalWidth = gridBody.clientWidth;
        const x = this.playheadPos * totalWidth;
        playhead.style.left = `${x}px`;
        playhead.style.display = 'block';

        // Auto-scroll viewport if content is scrollable on narrow screens
        const scrollViewport = this.container.querySelector('.page-matrix-scroll-viewport');
        if (scrollViewport && scrollViewport.scrollWidth > scrollViewport.clientWidth) {
            const maxScroll = scrollViewport.scrollWidth - scrollViewport.clientWidth;
            const targetScroll = Math.max(0, Math.min(maxScroll, x - (scrollViewport.clientWidth * 0.4)));
            scrollViewport.scrollLeft = targetScroll;
        }

        const totalSubdivs = this.currentMeasure.subdivision_count || 16;
        const currentSubdiv = Math.floor(this.playheadPos * totalSubdivs);
        if (currentSubdiv !== this.activeSubdivisionIndex) {
            this.activeSubdivisionIndex = currentSubdiv;
            const subCells = this.container.querySelectorAll('.sublabel-cell');
            subCells.forEach((c, idx) => {
                c.classList.toggle('active-sub', idx === currentSubdiv);
            });
        }
    }

    flashRowHit(rowId, wasAccurate = null) {
        // Flash in both Highway and Page views
        const elementsToFlash = [];

        // 1. Highway pinned row & target fret ring
        const pinnedRow = this.container.querySelector(`.matrix-pinned-row[data-row="${rowId}"]`);
        if (pinnedRow) elementsToFlash.push(pinnedRow);

        const targetRing = this.container.querySelector(`.matrix-target-ring[data-row="${rowId}"]`);
        if (targetRing) elementsToFlash.push(targetRing);

        // 2. Page track
        const pageRow = this.container.querySelector(`.drum-row-track[data-row="${rowId}"]`);
        if (pageRow) elementsToFlash.push(pageRow);

        elementsToFlash.forEach(el => {
            el.classList.remove('hit-flash', 'hit-perfect', 'hit-good', 'hit-early', 'hit-late', 'hit-miss');
            void el.offsetWidth; // retrigger animation

            if (wasAccurate === 'perfect') {
                el.classList.add('hit-perfect');
            } else if (wasAccurate === 'early') {
                el.classList.add('hit-early');
            } else if (wasAccurate === 'late') {
                el.classList.add('hit-late');
            } else if (wasAccurate === 'good') {
                el.classList.add('hit-good');
            } else if (wasAccurate === 'miss' || wasAccurate === 'off') {
                el.classList.add('hit-miss');
            } else {
                el.classList.add('hit-flash');
            }

            setTimeout(() => {
                el.classList.remove('hit-flash', 'hit-perfect', 'hit-good', 'hit-early', 'hit-late', 'hit-miss');
            }, 220);
        });
    }
}

window.gridSequencer = new GridSequencer('grid-sequencer-container');
