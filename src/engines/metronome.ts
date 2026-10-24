// @ts-nocheck
/**
 * High-Precision Web Audio Metronome & Visualizer with Full Subdivision Control
 * Supports:
 *  - Custom Time Signatures / Pulses per Measure (2, 3, 4, 5, 6, 7, 8, 12)
 *  - Clicks per Pulse / Subdivisions (1=Quarter ♩, 2=Eighths "1 y", 3=Triplets, 4=16ths "1 e & a", 6=Sextuplets)
 *  - Dynamic calculation (e.g. 6 beats × 2 clicks = 12 clicks per measure: "uny, dosy, tresy, cuatry...")
 *  - Dynamic Orbs visualizer & Sub-beat ticker
 *  - Audio click hierarchy: Beat 1 Accent, Pulse Beats, and subtle wooden Sub-beat ticks
 */

class DonnerMetronome {
    constructor() {
        this.bpm = 83;
        this.defaultBpm = 83;
        this.beatsPerMeasure = 4; // Main pulses per bar (e.g. 4, 6, 3, etc.)
        this.clicksPerBeat = 1;   // Clicks per pulse (1, 2, 3, 4, 6)
        this.currentTickInMeasure = 0; // 0 to (beatsPerMeasure * clicksPerBeat - 1)
        this.isPlaying = false;
        this.clickAudioEnabled = true;

        this.audioContext = null;
        this.nextNoteTime = 0.0;
        this.scheduleAheadTime = 0.12;
        this.lookahead = 20.0; // ms

        // Callbacks
        this.onTickCallbacks = [];
        this.onBeatCallbacks = [];
        this.onTempoChangeCallbacks = [];
        this.onConfigChangeCallbacks = [];

        // Tap tempo history
        this.tapTimes = [];
    }

    init() {
        if (!this.audioContext && window.drumAudio && window.drumAudio.ctx) {
            this.audioContext = window.drumAudio.ctx;
        }
    }

    setBpm(newBpm) {
        this.bpm = Math.max(30, Math.min(300, Math.round(newBpm)));
        this.notifyTempoChange();
    }

    setDefaultBpm(bpm) {
        this.defaultBpm = Math.max(30, Math.min(300, Math.round(bpm)));
        this.setBpm(this.defaultBpm);
    }

    resetToDefaultBpm() {
        this.setBpm(this.defaultBpm);
    }

    adjustBpm(delta) {
        this.setBpm(this.bpm + delta);
    }

    setBeatsPerMeasure(beats) {
        const val = Math.max(1, Math.min(16, Number(beats) || 4));
        this.beatsPerMeasure = val;
        this.currentTickInMeasure = 0;
        this.renderOrbs();
        this.updateCalcBadge();
        this.notifyConfigChange();
    }

    setClicksPerBeat(clicks) {
        const val = Math.max(1, Math.min(8, Number(clicks) || 1));
        this.clicksPerBeat = val;
        this.currentTickInMeasure = 0;
        this.renderSubTicker();
        this.updateCalcBadge();
        this.notifyConfigChange();
    }

    setTimeSignature(numerator, denominator = 4) {
        this.setBeatsPerMeasure(numerator);
        if (denominator === 8 && numerator % 3 === 0) {
            // In 6/8, 9/8, 12/8 compound meters, default to 3 subdivisions or as desired
            // The user can freely toggle clicksPerBeat
        }
    }

    getTotalClicksPerMeasure() {
        return this.beatsPerMeasure * this.clicksPerBeat;
    }

    getExplanationText() {
        const total = this.getTotalClicksPerMeasure();
        let subText = 'negras';
        let phonetic = '';

        if (this.clicksPerBeat === 1) {
            subText = '1 click por pulso (♩)';
            phonetic = Array.from({ length: this.beatsPerMeasure }, (_, i) => `${i + 1}`).join(', ');
        } else if (this.clicksPerBeat === 2) {
            subText = '2 clicks por pulso (♪♪ corcheas)';
            phonetic = Array.from({ length: this.beatsPerMeasure }, (_, i) => `${i + 1}-y`).join(', ');
        } else if (this.clicksPerBeat === 3) {
            subText = '3 clicks por pulso (tresillos)';
            phonetic = Array.from({ length: this.beatsPerMeasure }, (_, i) => `${i + 1}-trip-let`).join(', ');
        } else if (this.clicksPerBeat === 4) {
            subText = '4 clicks por pulso (semicorcheas)';
            phonetic = Array.from({ length: this.beatsPerMeasure }, (_, i) => `${i + 1}-e-&-a`).join(', ');
        } else if (this.clicksPerBeat === 6) {
            subText = '6 clicks por pulso (seisillos)';
            phonetic = Array.from({ length: this.beatsPerMeasure }, (_, i) => `${i + 1}-sextu`).join(', ');
        }

        return `⚡ ${this.beatsPerMeasure} pulsos × ${this.clicksPerBeat} ${this.clicksPerBeat === 1 ? 'click' : 'clicks'} = <strong>${total} clicks por compás</strong> <span class="phonetic-guide">(${phonetic})</span>`;
    }

    getItalianTempo() {
        const b = this.bpm;
        if (b < 45) return 'Grave';
        if (b < 60) return 'Largo';
        if (b < 76) return 'Adagio';
        if (b < 108) return 'Andante';
        if (b < 120) return 'Moderato';
        if (b < 168) return 'Allegro';
        if (b < 200) return 'Presto';
        return 'Prestissimo';
    }

    tapTempo() {
        const now = performance.now();
        if (this.tapTimes.length > 0 && (now - this.tapTimes[this.tapTimes.length - 1] > 2500)) {
            this.tapTimes = [];
        }
        this.tapTimes.push(now);
        if (this.tapTimes.length > 4) {
            this.tapTimes.shift();
        }

        if (this.tapTimes.length >= 2) {
            const intervals = [];
            for (let i = 1; i < this.tapTimes.length; i++) {
                intervals.push(this.tapTimes[i] - this.tapTimes[i - 1]);
            }
            const avgMs = intervals.reduce((a, b) => a + b, 0) / intervals.length;
            const calculatedBpm = Math.round(60000 / avgMs);
            this.setBpm(calculatedBpm);
        }
    }

    start() {
        this.init();
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.currentTickInMeasure = 0;
        this.nextNoteTime = this.audioContext.currentTime + 0.05;
        this.renderOrbs();
        this.renderSubTicker();
        this.scheduler();
    }

    stop() {
        this.isPlaying = false;
        this.currentTickInMeasure = 0;
        this.updateBeatUI(-1, -1);
    }

    toggle() {
        if (this.isPlaying) {
            this.stop();
        } else {
            this.start();
        }
        return this.isPlaying;
    }

    scheduler() {
        if (!this.isPlaying) return;

        while (this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadTime) {
            this.scheduleTick(this.currentTickInMeasure, this.nextNoteTime);
            this.advanceTick();
        }

        setTimeout(() => this.scheduler(), this.lookahead);
    }

    advanceTick() {
        const secondsPerPulse = 60.0 / this.bpm;
        const secondsPerSubTick = secondsPerPulse / this.clicksPerBeat;
        this.nextNoteTime += secondsPerSubTick;

        const totalTicks = this.getTotalClicksPerMeasure();
        this.currentTickInMeasure = (this.currentTickInMeasure + 1) % totalTicks;
    }

    scheduleTick(tickIndex, time) {
        const beatIndex = Math.floor(tickIndex / this.clicksPerBeat);
        const subIndex = tickIndex % this.clicksPerBeat;

        let clickType = 'sub';
        if (beatIndex === 0 && subIndex === 0) {
            clickType = 'accent'; // Beat 1 Downbeat (Accent!)
        } else if (subIndex === 0) {
            clickType = 'beat';   // Main Beat Pulse (Beats 2, 3, 4...)
        } else {
            clickType = 'sub';    // Subdivision click ("y", "e", "a", triplets)
        }

        // Play audio click if enabled
        if (this.clickAudioEnabled && window.drumAudio) {
            window.drumAudio.playClick(clickType, time);
        }

        // Schedule visual flash synchronized with audio clock
        const timeUntilHit = Math.max(0, (time - this.audioContext.currentTime) * 1000);
        setTimeout(() => {
            if (this.isPlaying) {
                this.updateBeatUI(beatIndex, subIndex);
                this.onTickCallbacks.forEach(cb => cb(tickIndex, beatIndex, subIndex, clickType));
                if (subIndex === 0) {
                    this.onBeatCallbacks.forEach(cb => cb(beatIndex, beatIndex === 0));
                }
            }
        }, timeUntilHit);
    }

    renderOrbs() {
        const container = document.getElementById('metronome-orbs-container');
        if (!container) return;
        container.innerHTML = '';

        for (let i = 0; i < this.beatsPerMeasure; i++) {
            const orb = document.createElement('div');
            orb.className = 'metronome-orb';
            if (i === 0) orb.classList.add('accent');
            orb.dataset.beat = i;

            const num = document.createElement('span');
            num.className = 'orb-num';
            num.textContent = (i + 1);
            orb.appendChild(num);

            container.appendChild(orb);
        }
    }

    renderSubTicker() {
        const ticker = document.getElementById('metro-subdivision-ticker');
        if (!ticker) return;
        ticker.innerHTML = '';

        if (this.clicksPerBeat === 1) {
            ticker.style.display = 'none';
            return;
        }

        ticker.style.display = 'flex';
        let labels = [];
        if (this.clicksPerBeat === 2) labels = ['1', '&'];
        else if (this.clicksPerBeat === 3) labels = ['1', 'trip', 'let'];
        else if (this.clicksPerBeat === 4) labels = ['1', 'e', '&', 'a'];
        else if (this.clicksPerBeat === 6) labels = ['1', 'trip', 'let', '&', 'trip', 'let'];
        else labels = Array.from({ length: this.clicksPerBeat }, (_, i) => (i === 0 ? '1' : '+'));

        labels.forEach((lbl, idx) => {
            const dot = document.createElement('div');
            dot.className = 'sub-tick-item';
            dot.dataset.sub = idx;
            dot.innerHTML = `<span class="sub-tick-label">${lbl}</span>`;
            ticker.appendChild(dot);
        });
    }

    updateCalcBadge() {
        const badge = document.getElementById('metro-calculation-badge');
        if (badge) {
            badge.innerHTML = this.getExplanationText();
        }
    }

    updateBeatUI(beatIndex, subIndex) {
        // 1. Update Main Beat Orbs
        const orbs = document.querySelectorAll('.metronome-orb');
        orbs.forEach((orb, idx) => {
            orb.classList.remove('active', 'accent');
            if (idx === 0) orb.classList.add('accent'); // Keep accent border style

            if (idx === beatIndex) {
                orb.classList.add('active');
            }
        });

        // 2. Update Sub-Beat Ticker
        const subItems = document.querySelectorAll('.sub-tick-item');
        subItems.forEach((item, idx) => {
            item.classList.toggle('active', idx === subIndex);
        });
    }

    onTick(callback) {
        this.onTickCallbacks.push(callback);
    }

    onBeat(callback) {
        this.onBeatCallbacks.push(callback);
    }

    onTempoChange(callback) {
        this.onTempoChangeCallbacks.push(callback);
    }

    onConfigChange(callback) {
        this.onConfigChangeCallbacks.push(callback);
    }

    notifyTempoChange() {
        this.onTempoChangeCallbacks.forEach(cb => cb(this.bpm, this.getItalianTempo()));
    }

    notifyConfigChange() {
        this.onConfigChangeCallbacks.forEach(cb => cb({
            beatsPerMeasure: this.beatsPerMeasure,
            clicksPerBeat: this.clicksPerBeat,
            totalClicks: this.getTotalClicksPerMeasure()
        }));
    }
}

window.donnerMetronome = new DonnerMetronome();
