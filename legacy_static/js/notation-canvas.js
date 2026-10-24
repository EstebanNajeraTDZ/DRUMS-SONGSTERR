/**
 * Drum Notation Canvas Renderer with Guitar Hero Continuous Highway & Page Views
 * Supports:
 *  1. GUITAR HERO / HIGHWAY CONTINUOUS SCROLL (Active by default):
 *     Measures glide smoothly from right to left across a fixed hit zone / strike line.
 *     Upcoming notes (1.5 - 2 full measures ahead) are always clearly visible before they reach the hit zone.
 *     Eliminates abrupt measure flips so drummers can prepare their hits and stickings in advance.
 *  2. SINGLE-MEASURE PAGE VIEW (Classic):
 *     Displays one isolated measure with cursor sweeping left to right.
 *  3. Seamless cyclic looping for isolated exercises (e.g. 1-measure fills/rudiments).
 *  4. 5 staff lines, percussion clef, tuplet indicators, colored noteheads, accents, and sticking row (R, L, K, F).
 */

class DrumNotationRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.currentMeasure = null;
        this.measures = [];
        this.currentMeasureIndex = 0;
        this.playheadPos = 0; // 0.0 to 1.0 within current measure
        this.showSticking = true;
        this.showCursor = true;
        this.scrollMode = 'guitar_hero'; // 'guitar_hero' (smooth continuous scroll) or 'page' (static single measure)

        // Continuous Highway parameters
        this.measureWidth = 560; // Width of each measure in pixels
        this.targetX = 250;      // Fixed Strike Zone / Hit Line position from left edge
        this.loopStart = 0;
        this.loopEnd = 0;

        this.colors = {
            'HI_HAT': '#eab308',
            'CRASH':  '#64748b',
            'RIDE':   '#ec4899',
            'TOM_1':  '#3b82f6',
            'TOM_2':  '#22c55e',
            'TOM_3':  '#a855f7',
            'SNARE':  '#ef4444',
            'KICK':   '#f97316'
        };

        this.setupResizeListener();
    }

    setupResizeListener() {
        if (!this.canvas) return;
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        setTimeout(() => this.handleResize(), 60);
    }

    handleResize() {
        if (!this.canvas) return;
        const container = this.canvas.parentElement;
        if (!container) return;
        const availableW = Math.max(300, container.clientWidth);
        if (Math.abs(this.canvas.width - availableW) > 4) {
            this.canvas.width = availableW;
        }

        const w = this.canvas.width;
        if (w < 480) {
            this.targetX = 120;
            this.measureWidth = 440;
        } else if (w < 768) {
            this.targetX = 160;
            this.measureWidth = 480;
        } else if (w < 1024) {
            this.targetX = 200;
            this.measureWidth = 520;
        } else {
            this.targetX = 250;
            this.measureWidth = 560;
        }

        if (window.gridSequencer && typeof window.gridSequencer.setDimensions === 'function') {
            window.gridSequencer.setDimensions(this.targetX, this.measureWidth);
        }

        this.render();
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
        const changed = (this.currentMeasure !== measure);
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
        if (changed && this.scrollMode !== 'guitar_hero') {
            this.render();
        }
    }

    setMeasureIndex(index) {
        const newIdx = Math.max(0, index);
        const changed = (this.currentMeasureIndex !== newIdx);
        this.currentMeasureIndex = newIdx;
        if (this.measures && this.measures[newIdx]) {
            this.currentMeasure = this.measures[newIdx];
        }
        if (changed && this.scrollMode !== 'guitar_hero') {
            this.render();
        }
    }

    setPlayhead(pos, measureIndex = null) {
        this.playheadPos = Math.max(0, Math.min(1.0, pos));
        if (typeof measureIndex === 'number' && measureIndex >= 0) {
            this.currentMeasureIndex = measureIndex;
            if (this.measures && this.measures[measureIndex]) {
                this.currentMeasure = this.measures[measureIndex];
            }
        }
        this.render();
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

    setShowSticking(val) {
        this.showSticking = val;
        this.render();
    }

    setShowCursor(val) {
        this.showCursor = val;
        this.render();
    }

    render() {
        if (!this.canvas || !this.ctx) return;
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Clean Canvas Background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);

        if (!this.currentMeasure && (!this.measures || this.measures.length === 0)) {
            ctx.fillStyle = '#94a3b8';
            ctx.font = '14px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Carga una canción para ver la partitura de batería...', w / 2, h / 2);
            return;
        }

        if (this.scrollMode === 'guitar_hero') {
            this.renderGuitarHeroHighway(ctx, w, h);
        } else {
            this.renderSingleMeasurePage(ctx, w, h);
        }
    }

    // ==========================================
    // 1. GUITAR HERO / CONTINUOUS HIGHWAY RENDERER
    // ==========================================
    renderGuitarHeroHighway(ctx, w, h) {
        const staffY = 55;
        const lineSpacing = 12;
        const staffHeight = 4 * lineSpacing; // 48px

        // A. Continuous Staff Background & Lanes
        ctx.fillStyle = 'rgba(248, 250, 252, 0.9)';
        ctx.fillRect(0, staffY - 26, w, 122);

        // 5 Staff Lines running continuously across the entire screen
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.3;
        for (let i = 0; i < 5; i++) {
            const y = staffY + i * lineSpacing;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }

        // B. Calculate Horizontal Camera Scroll
        const measuresPool = (this.measures && this.measures.length > 0) ? this.measures : [this.currentMeasure];
        const activeIdx = this.currentMeasureIndex;
        const prog = this.playheadPos;
        const globalMeasurePos = activeIdx + prog;
        const scrollX = this.targetX - (globalMeasurePos * this.measureWidth);

        // Loop boundaries for seamless repeating
        const lStart = Math.min(this.loopStart || 0, measuresPool.length - 1);
        const lEnd = Math.max(lStart, Math.min(this.loopEnd || (measuresPool.length - 1), measuresPool.length - 1));
        const loopSpan = Math.max(1, lEnd - lStart + 1);

        // Determine visible measure index range
        const minK = Math.floor((-scrollX - this.measureWidth) / this.measureWidth) - 1;
        const maxK = Math.ceil((w - scrollX) / this.measureWidth) + 1;

        // C. Render Visible Measures
        for (let k = minK; k <= maxK; k++) {
            const mX = scrollX + (k * this.measureWidth);
            if (mX + this.measureWidth < 0 || mX > w) continue;

            // Cyclic index mapping for loops / single measure exercises
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
                this.drawHighwayMeasure(ctx, m, mX, this.measureWidth, staffY, lineSpacing, k === activeIdx);
            }
        }

        // D. Render Fixed Strike Zone (Guitar Hero Hit Line)
        if (this.showCursor) {
            this.drawStrikeZone(ctx, staffY, staffHeight, h);
        }

        // E. Fixed Left Clef Overlay (Percussion Clef & Double Bar)
        this.drawFixedClefOverlay(ctx, staffY, staffHeight, h);
    }

    drawHighwayMeasure(ctx, m, mX, mWidth, staffY, lineSpacing, isCurrent) {
        const staffHeight = 4 * lineSpacing;

        // 1. Measure Barline at start
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(mX, staffY);
        ctx.lineTo(mX, staffY + staffHeight);
        ctx.stroke();

        // 2. Measure Header Pill & Info
        const measNum = m.measure_number || (this.currentMeasureIndex + 1);
        const badgeLabel = `Compás ${measNum}`;
        ctx.font = 'bold 11px Outfit, sans-serif';
        const labelWidth = ctx.measureText(badgeLabel).width + 12;

        // Badge pill
        ctx.fillStyle = isCurrent ? '#0284c7' : '#64748b';
        ctx.beginPath();
        ctx.roundRect(mX + 10, staffY - 26, labelWidth, 16, 4);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText(badgeLabel, mX + 16, staffY - 14);

        // Tempo text
        if (m.bpm) {
            ctx.fillStyle = '#64748b';
            ctx.font = '600 10px Outfit, sans-serif';
            ctx.fillText(`♩=${m.bpm}`, mX + labelWidth + 16, staffY - 14);
        }

        // Section Marker
        if (m.marker) {
            ctx.fillStyle = '#ea580c';
            ctx.font = 'bold 11px Outfit, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(`[${m.marker}]`, mX + mWidth - 12, staffY - 14);
        }

        // 3. Tuplet markers (e.g. 6 for sextuplets)
        const totalTicks = m.measure_ticks || 1920;
        const usableWidth = mWidth - 44;
        const contentStartX = mX + 22;

        if (m.subdivision_count === 24) {
            ctx.fillStyle = '#475569';
            ctx.font = 'bold 11px Outfit, sans-serif';
            ctx.textAlign = 'center';
            for (let beat = 0; beat < 4; beat++) {
                const beatX = contentStartX + ((beat * 480 + 240) / totalTicks) * usableWidth;
                ctx.fillText('6', beatX, staffY - 6);
            }
        }

        // 4. Notes & Sticking
        const notes = m.notes || [];
        if (notes.length === 0) return;

        // Group notes by tick
        const tickMap = {};
        notes.forEach(n => {
            const t = n.tick;
            if (!tickMap[t]) tickMap[t] = [];
            tickMap[t].push(n);
        });

        const sortedTicks = Object.keys(tickMap).map(Number).sort((a, b) => a - b);

        // Draw connecting beams between 16th/sextuplet notes
        if (sortedTicks.length > 1) {
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 3.0;
            for (let i = 0; i < sortedTicks.length - 1; i++) {
                const t1 = sortedTicks[i];
                const t2 = sortedTicks[i + 1];
                if (t2 - t1 <= (totalTicks / (m.subdivision_count || 16)) * 1.5) {
                    const x1 = contentStartX + (t1 / totalTicks) * usableWidth;
                    const x2 = contentStartX + (t2 / totalTicks) * usableWidth;
                    const beamY = staffY - 2;

                    ctx.beginPath();
                    ctx.moveTo(x1, beamY);
                    ctx.lineTo(x2, beamY);
                    ctx.stroke();

                    // Second beam line
                    ctx.beginPath();
                    ctx.moveTo(x1, beamY + 4);
                    ctx.lineTo(x2, beamY + 4);
                    ctx.stroke();
                }
            }
        }

        // Draw each note group
        sortedTicks.forEach(tick => {
            const groupNotes = tickMap[tick];
            const x = contentStartX + (tick / totalTicks) * usableWidth;

            // Guitar Hero Dimming: Passed notes (left of strike zone) fade gently
            const isPassed = (x < this.targetX - 10);
            ctx.globalAlpha = isPassed ? 0.38 : 1.0;

            const noteYs = groupNotes.map(n => this.getNoteY(n, staffY, lineSpacing));
            const minY = Math.min(...noteYs);
            const maxY = Math.max(...noteYs);
            const stemTop = Math.min(staffY - 14, minY - 2);

            // Note stem
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(x + 5, stemTop);
            ctx.lineTo(x + 5, Math.max(maxY, staffY + 36));
            ctx.stroke();

            // Noteheads
            groupNotes.forEach((n, i) => {
                const y = noteYs[i];
                const color = this.colors[n.row] || '#22c55e';
                this.drawNoteHead(ctx, x, y, n, color, staffY);

                if (n.accent) {
                    ctx.fillStyle = '#dc2626';
                    ctx.font = 'bold 15px Outfit, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('>', x, stemTop - 6);
                }
            });

            // Sticking letters below staff (R, L, K, F)
            if (this.showSticking) {
                const letters = groupNotes.map(n => n.sticking).filter(Boolean);
                const stickingText = letters.join('/');
                if (stickingText) {
                    ctx.fillStyle = isPassed ? '#94a3b8' : '#0f172a';
                    ctx.font = '900 15px Outfit, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(stickingText, x, staffY + 74);
                }
            }

            ctx.globalAlpha = 1.0;
        });
    }

    drawStrikeZone(ctx, staffY, staffHeight, h) {
        const tx = this.targetX;

        // Glowing Laser Band
        const glowGrad = ctx.createLinearGradient(tx - 16, 0, tx + 16, 0);
        glowGrad.addColorStop(0, 'rgba(14, 165, 233, 0)');
        glowGrad.addColorStop(0.5, 'rgba(14, 165, 233, 0.22)');
        glowGrad.addColorStop(1, 'rgba(14, 165, 233, 0)');
        ctx.fillStyle = glowGrad;
        ctx.fillRect(tx - 16, staffY - 26, 32, 118);

        // Sharp Center Strike Line
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(tx, staffY - 26);
        ctx.lineTo(tx, staffY + 84);
        ctx.stroke();

        // Target Rings on each staff lane
        ctx.fillStyle = '#0284c7';
        for (let i = 0; i < 5; i++) {
            const y = staffY + i * 12;
            ctx.beginPath();
            ctx.arc(tx, y, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Top Target Badge (Guitar Hero Target Indicator)
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.roundRect(tx - 32, staffY - 44, 64, 16, 4);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🎯 GOLPE', tx, staffY - 32);

        // Downward Arrow Triangle pointing into hit zone
        ctx.beginPath();
        ctx.moveTo(tx - 5, staffY - 28);
        ctx.lineTo(tx + 5, staffY - 28);
        ctx.lineTo(tx, staffY - 22);
        ctx.closePath();
        ctx.fillStyle = '#0284c7';
        ctx.fill();
    }

    drawFixedClefOverlay(ctx, staffY, staffHeight, h) {
        // Frosted Glass Fade on far left so scrolled notes cleanly glide beneath
        const overlayW = 85;
        const clefGrad = ctx.createLinearGradient(0, 0, overlayW, 0);
        clefGrad.addColorStop(0, 'rgba(255, 255, 255, 0.98)');
        clefGrad.addColorStop(0.72, 'rgba(255, 255, 255, 0.92)');
        clefGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = clefGrad;
        ctx.fillRect(0, 0, overlayW, h);

        // Staff lines on fixed header
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.3;
        for (let i = 0; i < 5; i++) {
            const y = staffY + i * 12;
            ctx.beginPath();
            ctx.moveTo(14, y);
            ctx.lineTo(overlayW - 10, y);
            ctx.stroke();
        }

        // Double Bar at far left
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(18, staffY);
        ctx.lineTo(18, staffY + staffHeight);
        ctx.moveTo(22, staffY);
        ctx.lineTo(22, staffY + staffHeight);
        ctx.stroke();

        // Percussion Clef (Two thick vertical rectangles)
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(28, staffY + 8, 4, 32);
        ctx.fillRect(35, staffY + 8, 4, 32);

        // Small Label
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 9px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('DRUMS', 35, staffY + 54);
    }

    // ==========================================
    // 2. SINGLE-MEASURE PAGE VIEW (Classic)
    // ==========================================
    renderSingleMeasurePage(ctx, w, h) {
        const m = this.currentMeasure;
        const staffY = 55;
        const lineSpacing = 12;
        // Never squeeze below a comfortable, legible width (min 520px)
        const minStaffWidth = 520;
        const staffWidth = Math.max(w - 70, minStaffWidth);
        const startX = 65;
        const contentStartX = startX + 45;
        const usableWidth = staffWidth - 60;
        const totalMeasureWidth = startX + staffWidth + 25;

        // Smooth camera follow for narrow / mobile screens like Guitar Hero
        let cameraX = 0;
        if (totalMeasureWidth > w) {
            const cursorX = contentStartX + (this.playheadPos >= 0 ? this.playheadPos : 0) * usableWidth;
            const maxScroll = totalMeasureWidth - w;
            cameraX = Math.max(0, Math.min(maxScroll, cursorX - (w * 0.42)));
        }

        ctx.save();
        if (cameraX > 0) {
            ctx.translate(-cameraX, 0);
        }

        // 1. Draw 5 Staff lines
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 5; i++) {
            const y = staffY + i * lineSpacing;
            ctx.beginPath();
            ctx.moveTo(startX - 20, y);
            ctx.lineTo(startX + staffWidth + 10, y);
            ctx.stroke();
        }

        // 2. Bar lines at start and end
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(startX - 20, staffY);
        ctx.lineTo(startX - 20, staffY + 4 * lineSpacing);
        ctx.moveTo(startX - 15, staffY);
        ctx.lineTo(startX - 15, staffY + 4 * lineSpacing);
        ctx.moveTo(startX + staffWidth + 10, staffY);
        ctx.lineTo(startX + staffWidth + 10, staffY + 4 * lineSpacing);
        ctx.stroke();

        // 3. Percussion Clef
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(startX - 10, staffY + 8, 4, 32);
        ctx.fillRect(startX - 3, staffY + 8, 4, 32);

        // 4. Time Signature
        const sig = m.signature || [4, 4];
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 22px "Times New Roman", serif';
        ctx.textAlign = 'center';
        ctx.fillText(sig[0], startX + 16, staffY + 20);
        ctx.fillText(sig[1], startX + 16, staffY + 44);

        // 5. Tempo & Marker
        ctx.fillStyle = '#0f172a';
        ctx.font = '600 13px Outfit, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`♩ = ${m.bpm || 80}`, startX - 20, staffY - 24);

        if (m.marker) {
            ctx.fillStyle = '#ea580c';
            ctx.font = 'bold 13px Outfit, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(m.marker, startX + staffWidth, staffY - 24);
        }

        // 6. Notes
        const notes = m.notes || [];
        const totalTicks = m.measure_ticks || 1920;

        const tickMap = {};
        notes.forEach(n => {
            const t = n.tick;
            if (!tickMap[t]) tickMap[t] = [];
            tickMap[t].push(n);
        });

        // Tuplets
        if (m.subdivision_count === 24) {
            ctx.fillStyle = '#475569';
            ctx.font = 'bold 12px Outfit, sans-serif';
            ctx.textAlign = 'center';
            for (let beat = 0; beat < 4; beat++) {
                const beatX = contentStartX + (beat * 480 + 240) / totalTicks * usableWidth;
                ctx.fillText('6', beatX, staffY - 10);
            }
        }

        const sortedTicks = Object.keys(tickMap).map(Number).sort((a, b) => a - b);

        // Beams
        if (sortedTicks.length > 1) {
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 3.5;
            for (let i = 0; i < sortedTicks.length - 1; i++) {
                const t1 = sortedTicks[i];
                const t2 = sortedTicks[i + 1];
                if (t2 - t1 <= (totalTicks / (m.subdivision_count || 16)) * 1.5) {
                    const x1 = contentStartX + (t1 / totalTicks) * usableWidth;
                    const x2 = contentStartX + (t2 / totalTicks) * usableWidth;
                    const beamY = staffY - 2;
                    ctx.beginPath();
                    ctx.moveTo(x1, beamY);
                    ctx.lineTo(x2, beamY);
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.moveTo(x1, beamY + 5);
                    ctx.lineTo(x2, beamY + 5);
                    ctx.stroke();
                }
            }
        }

        sortedTicks.forEach(tick => {
            const groupNotes = tickMap[tick];
            const x = contentStartX + (tick / totalTicks) * usableWidth;

            const noteYs = groupNotes.map(n => this.getNoteY(n, staffY, lineSpacing));
            const minY = Math.min(...noteYs);
            const maxY = Math.max(...noteYs);
            const stemTop = Math.min(staffY - 14, minY - 2);

            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x + 5, stemTop);
            ctx.lineTo(x + 5, Math.max(maxY, staffY + 36));
            ctx.stroke();

            groupNotes.forEach((n, i) => {
                const y = noteYs[i];
                const color = this.colors[n.row] || '#22c55e';
                this.drawNoteHead(ctx, x, y, n, color, staffY);

                if (n.accent) {
                    ctx.fillStyle = '#dc2626';
                    ctx.font = 'bold 16px Outfit, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('>', x, stemTop - 8);
                }
            });

            if (this.showSticking) {
                const letters = groupNotes.map(n => n.sticking).filter(Boolean);
                const stickingText = letters.join('/');
                if (stickingText) {
                    ctx.fillStyle = '#0f172a';
                    ctx.font = '900 17px Outfit, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(stickingText, x, staffY + 76);
                }
            }
        });

        // Classic Sweeping Cursor
        if (this.showCursor && this.playheadPos >= 0) {
            const cursorX = contentStartX + this.playheadPos * usableWidth;
            ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
            ctx.fillRect(cursorX - 8, staffY - 28, 16, 115);

            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(cursorX, staffY - 28);
            ctx.lineTo(cursorX, staffY + 87);
            ctx.stroke();

            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.moveTo(cursorX - 6, staffY - 28);
            ctx.lineTo(cursorX + 6, staffY - 28);
            ctx.lineTo(cursorX, staffY - 20);
            ctx.fill();
        }

        ctx.restore();
    }

    // ==========================================
    // 3. COMMON HELPER METHODS
    // ==========================================
    getNoteY(n, staffY, lineSpacing = 12) {
        if (typeof n.string === 'number') {
            return staffY + n.string * lineSpacing;
        }
        switch (n.row) {
            case 'HI_HAT':
                return (n.sub_type === 'pedal') ? staffY + 54 : staffY - 6;
            case 'CRASH':
                return (n.sub_type === 'crash_2') ? staffY - 18 : staffY - 12;
            case 'RIDE':
                return staffY;
            case 'TOM_1':
                return staffY + 12;
            case 'SNARE':
                return staffY + 18;
            case 'TOM_2':
                return staffY + 24;
            case 'TOM_3':
                return staffY + 30;
            case 'KICK':
                return staffY + 42;
            default:
                return staffY + 18;
        }
    }

    drawNoteHead(ctx, x, y, n, color, staffY) {
        const headType = n.head_type || (
            (n.row === 'HI_HAT' || n.row === 'CRASH' || n.row === 'RIDE') ? 'x' : 'oval'
        );

        // Ledger lines if outside staff
        if (y <= staffY - 12) {
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x - 9, staffY - 12);
            ctx.lineTo(x + 9, staffY - 12);
            ctx.stroke();
            if (y <= staffY - 24) {
                ctx.beginPath();
                ctx.moveTo(x - 9, staffY - 24);
                ctx.lineTo(x + 9, staffY - 24);
                ctx.stroke();
            }
        } else if (y >= staffY + 54) {
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x - 9, staffY + 54);
            ctx.lineTo(x + 9, staffY + 54);
            ctx.stroke();
        }

        if (headType === 'circle_slash') {
            // Charles Semiabierto (Circle with diagonal slash) - Songsterr style
            ctx.strokeStyle = color;
            ctx.lineWidth = 2.2;
            const r = 5.5;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x - r * 0.72, y + r * 0.72);
            ctx.lineTo(x + r * 0.72, y - r * 0.72);
            ctx.stroke();
        } else if (headType === 'circle_x') {
            // Charles Abierto (Circle with cross inside) - Songsterr style
            ctx.strokeStyle = color;
            ctx.lineWidth = 2.2;
            const r = 5.5;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.stroke();
            const s = r * 0.65;
            ctx.beginPath();
            ctx.moveTo(x - s, y - s);
            ctx.lineTo(x + s, y + s);
            ctx.moveTo(x + s, y - s);
            ctx.lineTo(x - s, y + s);
            ctx.stroke();
        } else if (headType === 'diamond') {
            // Caja Electrónica / Cross-stick / Rimshot or Ride Bell
            ctx.fillStyle = color;
            const sz = 5.5;
            ctx.beginPath();
            ctx.moveTo(x, y - sz);
            ctx.lineTo(x + sz * 1.15, y);
            ctx.lineTo(x, y + sz);
            ctx.lineTo(x - sz * 1.15, y);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 1.2;
            ctx.stroke();
        } else if (headType === 'x') {
            // Cross for Closed Hi-Hat, Crash, Ride Bow, or Pedal Hi-Hat
            ctx.strokeStyle = color;
            ctx.lineWidth = 2.8;
            const size = 5;
            ctx.beginPath();
            ctx.moveTo(x - size, y - size);
            ctx.lineTo(x + size, y + size);
            ctx.moveTo(x + size, y - size);
            ctx.lineTo(x - size, y + size);
            ctx.stroke();
        } else {
            // Oval notehead for Bombo, Caja normal, Toms
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.ellipse(x, y, 6.5, 4.5, -0.25, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }
}

window.notationRenderer = new DrumNotationRenderer('notation-canvas');
