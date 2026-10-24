/**
 * Donner DED-300X High-Fidelity Web Audio Drum Engine
 * Features:
 *  - Real acoustic multi-velocity sampled percussion (Kick, Snare, Hi-Hats, Toms, Crash, Ride)
 *  - Dynamic velocity filter tracking (soft hits sound warm & dark, hard hits sound explosive & bright)
 *  - Perceptual exponential loudness curve for authentic dynamic range (ghost notes to heavy rimshots)
 *  - Hi-Hat choke group (chokes ringing open hi-hat immediately when pedal is pressed or closed hit occurs)
 *  - Cymbal choke engine (instant acoustic damping of Crash and Ride on hand-grab aftertouch)
 *  - Direct Donner Console mode (mutes web drums so drummer can listen directly to Donner module via AUX IN / Phones)
 *  - Multiple sound kits: Original Studio (Acoustic), Rock & Heavy, Jazz Vintage, Electro 808
 */

class DrumAudioEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.compressor = null;
        this.mutedVoices = new Set();
        this.volume = 0.90;
        this.isReady = false;
        this.currentKit = 'original'; // 'original', 'rock', 'jazz', 'electronic', 'donner_direct'
        this.directDonnerMode = false;
        this.onAudioUnlocked = null;

        // Sample Storage & Tracking
        this.buffers = {};
        this.samplesLoaded = false;
        this.samplesLoading = false;
        this.loadProgress = { loaded: 0, total: 13 };

        // Active voice references for Choke Groups
        this.activeHiHats = [];
        this.activeCrashes = [];
        this.activeRides = [];

        // Sample URLs mapped to kit elements
        this.sampleUrls = {
            kick: '/audio/samples/kick.wav',
            snare: '/audio/samples/snare.wav',
            snare_rim: '/audio/samples/snare_rim.wav',
            hihat_closed: '/audio/samples/hihat_closed.wav',
            hihat_half: '/audio/samples/hihat_half.wav',
            hihat_open: '/audio/samples/hihat_open.wav',
            hihat_pedal: '/audio/samples/hihat_pedal.wav',
            tom1: '/audio/samples/tom1.wav',
            tom2: '/audio/samples/tom2.wav',
            tom3: '/audio/samples/tom3.wav',
            crash: '/audio/samples/crash.wav',
            ride: '/audio/samples/ride.wav',
            ride_bell: '/audio/samples/ride_bell.wav'
        };
    }

    init() {
        if (this.ctx) return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext({ latencyHint: 'interactive' });

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);

        // Studio dynamics compressor + soft limiter:
        // Allows high volume boost (up to 200%) without harsh clipping
        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.setValueAtTime(-6.0, this.ctx.currentTime);
        this.compressor.knee.setValueAtTime(6.0, this.ctx.currentTime);
        this.compressor.ratio.setValueAtTime(4.0, this.ctx.currentTime);
        this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
        this.compressor.release.setValueAtTime(0.06, this.ctx.currentTime);

        this.masterGain.connect(this.compressor);
        this.compressor.connect(this.ctx.destination);
        this.isReady = true;

        // Start preloading high-fidelity acoustic samples
        this.preloadSamples();

        const unlockHandler = async () => {
            await this.resume();
            if (this.ctx && this.ctx.state === 'running') {
                window.removeEventListener('pointerdown', unlockHandler);
                window.removeEventListener('click', unlockHandler);
                window.removeEventListener('keydown', unlockHandler);
                window.removeEventListener('touchstart', unlockHandler);
            }
        };

        window.addEventListener('pointerdown', unlockHandler);
        window.addEventListener('click', unlockHandler);
        window.addEventListener('keydown', unlockHandler);
        window.addEventListener('touchstart', unlockHandler);
    }

    async preloadSamples() {
        if (this.samplesLoading || this.samplesLoaded) return;
        this.samplesLoading = true;

        const keys = Object.keys(this.sampleUrls);
        this.loadProgress.total = keys.length;
        this.loadProgress.loaded = 0;

        const loadPromises = keys.map(async (key) => {
            try {
                const response = await fetch(this.sampleUrls[key]);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
                this.buffers[key] = audioBuffer;
                this.loadProgress.loaded++;
            } catch (err) {
                console.warn(`[AudioEngine] Error cargando muestra ${key}:`, err);
            }
        });

        await Promise.allSettled(loadPromises);
        this.samplesLoaded = Object.keys(this.buffers).length > 0;
        this.samplesLoading = false;
        console.log(`[AudioEngine] Muestras acústicas cargadas: ${this.loadProgress.loaded}/${this.loadProgress.total}`);
    }

    async resume() {
        if (!this.ctx) this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            try {
                await this.ctx.resume();
                console.log('[AudioEngine] Web AudioContext activo y corriendo.');
                if (typeof this.onAudioUnlocked === 'function') {
                    this.onAudioUnlocked();
                }
            } catch (err) {
                console.warn('[AudioEngine] Context resume error:', err);
            }
        }
    }

    setKit(kitName) {
        const validKits = ['original', 'rock', 'jazz', 'electronic', 'donner_direct'];
        if (validKits.includes(kitName)) {
            this.currentKit = kitName;
            this.directDonnerMode = (kitName === 'donner_direct');
            console.log(`[AudioEngine] Modo/Kit configurado: ${kitName} (Directo Donner: ${this.directDonnerMode})`);
            return true;
        }
        return false;
    }

    getKit() {
        return this.currentKit;
    }

    setDirectDonnerMode(enabled) {
        this.directDonnerMode = !!enabled;
        if (this.directDonnerMode) {
            this.currentKit = 'donner_direct';
        } else if (this.currentKit === 'donner_direct') {
            this.currentKit = 'original';
        }
    }

    setMasterVolume(val) {
        // Allows clean volume boost up to 2.0 (200% Master Boost)
        this.volume = Math.max(0, Math.min(2.0, Number(val) || 1.0));
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.01);
        }
    }

    toggleMuteVoice(voiceName) {
        if (this.mutedVoices.has(voiceName)) {
            this.mutedVoices.delete(voiceName);
            return false;
        } else {
            this.mutedVoices.add(voiceName);
            return true;
        }
    }

    isVoiceMuted(voiceName) {
        return this.mutedVoices.has(voiceName);
    }

    // Main Trigger Method
    trigger(rowName, velocity = 100, time = null, subType = null) {
        // In Direct Donner mode, drum playback in the web app is muted so the drummer
        // hears only the Donner module's factory sounds via headphones / AUX IN
        if (this.directDonnerMode) return;
        if (this.mutedVoices.has(rowName)) return;

        if (!this.ctx) this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }

        const t = time !== null ? time : this.ctx.currentTime;
        const rawVel = Math.max(1, Math.min(127, Number(velocity) || 100));
        const normVel = rawVel / 127;

        // Enhanced punchy dynamics for Electronic Drum Kits (Donner DED-300X):
        // Floor of ~0.35 ensures ghost notes and lighter hits remain loud and crisp,
        // and solid hits (vel 70-100) hit strong presence without sounding distant or quiet.
        const dynamicGain = (0.35 + 0.65 * Math.pow(normVel, 1.20)) * 1.35;

        // Dynamic Low-Pass Filter:
        // Soft hits are warm and rounded (1,800Hz - 3,500Hz)
        // Hard hits unleash full presence and explosive transients (18,000Hz - 20,000Hz)
        const dynamicFilterCutoff = 1800 + Math.pow(normVel, 1.45) * 18200;

        // If Electronic Kit is selected, use synthetic 808 engine
        if (this.currentKit === 'electronic') {
            this.triggerElectronic(rowName, t, normVel, subType);
            return;
        }

        switch (rowName) {
            case 'KICK':
                this.playAcousticKick(t, dynamicGain, dynamicFilterCutoff, normVel);
                break;
            case 'SNARE':
                this.playAcousticSnare(t, dynamicGain, dynamicFilterCutoff, normVel, subType);
                break;
            case 'HI_HAT':
            case 'HI_HAT_OPEN':
                const hatType = (rowName === 'HI_HAT_OPEN') ? 'open' : (subType || 'closed');
                this.playAcousticHiHat(t, dynamicGain, dynamicFilterCutoff, normVel, hatType);
                break;
            case 'TOM_1':
                this.playAcousticTom(t, dynamicGain, dynamicFilterCutoff, normVel, 'tom1', 1.0);
                break;
            case 'TOM_2':
                this.playAcousticTom(t, dynamicGain, dynamicFilterCutoff, normVel, 'tom2', 1.0);
                break;
            case 'TOM_3':
                this.playAcousticTom(t, dynamicGain, dynamicFilterCutoff, normVel, 'tom3', 1.0);
                break;
            case 'CRASH':
                this.playAcousticCrash(t, dynamicGain, dynamicFilterCutoff, normVel);
                break;
            case 'RIDE':
                this.playAcousticRide(t, dynamicGain, dynamicFilterCutoff, normVel, subType);
                break;
            default:
                this.playAcousticSnare(t, dynamicGain, dynamicFilterCutoff, normVel, null);
                break;
        }
    }

    // --- GENERIC SAMPLE PLAYER HELPER ---
    playSampleBuffer(bufferKey, time, gainValue, cutoffFreq, playbackRate = 1.0, onNodeCreated = null) {
        if (!this.ctx || !this.buffers[bufferKey]) {
            return null;
        }

        const source = this.ctx.createBufferSource();
        source.buffer = this.buffers[bufferKey];
        source.playbackRate.setValueAtTime(playbackRate, time);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(Math.min(21000, cutoffFreq), time);
        filter.Q.setValueAtTime(0.707, time); // Butterworth flat response

        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(gainValue, time);

        source.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterGain);

        source.start(time);

        if (typeof onNodeCreated === 'function') {
            onNodeCreated({ source, filter, gainNode, startTime: time });
        }

        return { source, filter, gainNode };
    }

    // --- ACOUSTIC KICK ---
    playAcousticKick(t, dynamicGain, dynamicFilterCutoff, normVel) {
        if (this.buffers['kick']) {
            let rate = 1.0;
            let gainScale = 1.15;
            if (this.currentKit === 'rock') {
                rate = 0.93; // Deeper sub punch for 24" kick
                gainScale = 1.30;
            } else if (this.currentKit === 'jazz') {
                rate = 1.08; // High-tuned 18" bop kick
                gainScale = 0.95;
            }

            this.playSampleBuffer('kick', t, dynamicGain * gainScale, dynamicFilterCutoff * 1.1, rate);
        } else {
            // Synthetic fallback
            this.playSynthKick(t, normVel);
        }
    }

    // --- ACOUSTIC SNARE ---
    playAcousticSnare(t, dynamicGain, dynamicFilterCutoff, normVel, subType) {
        const isRim = (subType === 'cross_stick');
        const bufferKey = isRim ? (this.buffers['snare_rim'] ? 'snare_rim' : 'snare') : 'snare';

        if (this.buffers[bufferKey]) {
            let rate = 1.0;
            let gainScale = 1.05;
            if (this.currentKit === 'rock') {
                rate = 0.96;
                gainScale = 1.20;
            } else if (this.currentKit === 'jazz') {
                rate = 1.12;
                gainScale = 0.90;
            }

            const node = this.playSampleBuffer(bufferKey, t, dynamicGain * gainScale, dynamicFilterCutoff, rate);
            
            // Drum head tension micro-pitch modulation on hard hits:
            // Striking harder temporarily raises pitch by 15-25 cents for first 25ms
            if (node && normVel > 0.65) {
                const pitchRise = rate * (1.0 + (normVel - 0.65) * 0.08);
                node.source.playbackRate.setValueAtTime(pitchRise, t);
                node.source.playbackRate.exponentialRampToValueAtTime(rate, t + 0.035);
            }
        } else {
            this.playSynthSnare(t, normVel, isRim);
        }
    }

    // --- ACOUSTIC HI-HAT ---
    playAcousticHiHat(t, dynamicGain, dynamicFilterCutoff, normVel, subType = 'closed') {
        const isOpen = (subType === 'open');
        const isHalfOpen = (subType === 'half_open');
        const isPedal = (subType === 'pedal');
        const isClosed = (!isOpen && !isHalfOpen);

        // Hi-Hat Choke Rule:
        // Hitting closed hi-hat or pressing pedal immediately chokes ringing open hi-hats!
        if (isClosed || isPedal) {
            this.chokeHiHat(t);
        }

        let bufferKey = 'hihat_closed';
        let gainScale = 0.95;
        let rate = 1.0;

        if (isOpen) {
            bufferKey = 'hihat_open';
            gainScale = 1.05;
        } else if (isHalfOpen) {
            bufferKey = this.buffers['hihat_half'] ? 'hihat_half' : 'hihat_open';
            gainScale = 1.00;
        } else if (isPedal) {
            bufferKey = this.buffers['hihat_pedal'] ? 'hihat_pedal' : 'hihat_closed';
            gainScale = 0.85;
        }

        if (this.currentKit === 'rock') {
            rate = 0.97;
            gainScale *= 1.15;
        } else if (this.currentKit === 'jazz') {
            rate = 1.04;
            gainScale *= 0.90;
        }

        if (this.buffers[bufferKey]) {
            const node = this.playSampleBuffer(
                bufferKey,
                t,
                dynamicGain * gainScale,
                Math.max(4000, dynamicFilterCutoff),
                rate,
                (nodeObj) => {
                    if (isOpen || isHalfOpen) {
                        this.activeHiHats.push(nodeObj);
                    }
                }
            );

            // Clean up stopped references after sound duration
            if (isOpen || isHalfOpen) {
                setTimeout(() => {
                    this.activeHiHats = this.activeHiHats.filter(h => h.startTime !== t);
                }, 2200);
            }
        } else {
            this.playSynthHiHat(t, normVel, subType);
        }
    }

    // Hi-Hat Choke Group Function (Immediate damping on pedal-down or closed strike)
    chokeHiHat(time = null) {
        if (!this.ctx) return;
        const t = time !== null ? time : this.ctx.currentTime;

        this.activeHiHats.forEach(h => {
            try {
                h.gainNode.gain.cancelScheduledValues(t);
                h.gainNode.gain.setValueAtTime(h.gainNode.gain.value, t);
                h.gainNode.gain.exponentialRampToValueAtTime(0.0001, t + 0.022);
                setTimeout(() => {
                    try { h.source.stop(); } catch (e) {}
                }, 30);
            } catch (err) {}
        });
        this.activeHiHats = [];
    }

    // --- ACOUSTIC TOMS ---
    playAcousticTom(t, dynamicGain, dynamicFilterCutoff, normVel, tomKey, defaultRate = 1.0) {
        if (this.buffers[tomKey]) {
            let rate = defaultRate;
            let gainScale = 1.05;
            if (this.currentKit === 'rock') {
                rate *= 0.94;
                gainScale = 1.25;
            } else if (this.currentKit === 'jazz') {
                rate *= 1.10;
                gainScale = 0.92;
            }

            const node = this.playSampleBuffer(tomKey, t, dynamicGain * gainScale, dynamicFilterCutoff, rate);
            if (node && normVel > 0.6) {
                const pitchRise = rate * (1.0 + (normVel - 0.6) * 0.07);
                node.source.playbackRate.setValueAtTime(pitchRise, t);
                node.source.playbackRate.exponentialRampToValueAtTime(rate, t + 0.04);
            }
        } else {
            // Synthetic fallback
            let sF = (tomKey === 'tom1') ? 145 : (tomKey === 'tom2') ? 115 : 85;
            let eF = (tomKey === 'tom1') ? 105 : (tomKey === 'tom2') ? 80 : 55;
            this.playSynthTom(t, normVel, sF, eF, 0.32);
        }
    }

    // --- ACOUSTIC CRASH ---
    playAcousticCrash(t, dynamicGain, dynamicFilterCutoff, normVel) {
        if (this.buffers['crash']) {
            let rate = 1.0;
            let gainScale = 1.10;
            if (this.currentKit === 'rock') {
                rate = 0.97;
                gainScale = 1.30;
            } else if (this.currentKit === 'jazz') {
                rate = 1.05;
                gainScale = 0.85;
            }

            this.playSampleBuffer(
                'crash',
                t,
                dynamicGain * gainScale,
                Math.max(5000, dynamicFilterCutoff),
                rate,
                (nodeObj) => {
                    this.activeCrashes.push(nodeObj);
                }
            );

            setTimeout(() => {
                this.activeCrashes = this.activeCrashes.filter(c => c.startTime !== t);
            }, 3500);
        } else {
            this.playSynthCrash(t, normVel);
        }
    }

    // --- ACOUSTIC RIDE (Natural bronze cymbal body ping & shimmer wash) ---
    playAcousticRide(t, dynamicGain, dynamicFilterCutoff, normVel, subType = null) {
        const isBell = (subType === 'bell');
        const bufferKey = (isBell && this.buffers['ride_bell']) ? 'ride_bell' : 'ride';

        if (this.buffers[bufferKey]) {
            let rate = 1.0;
            let gainScale = isBell ? 1.05 : 0.95;

            if (this.currentKit === 'rock') {
                rate = 0.98;
                gainScale *= 1.20;
            } else if (this.currentKit === 'jazz') {
                rate = 1.04;
                gainScale *= 0.90;
            }

            this.playSampleBuffer(
                bufferKey,
                t,
                dynamicGain * gainScale,
                Math.max(4500, dynamicFilterCutoff),
                rate,
                (nodeObj) => {
                    this.activeRides.push(nodeObj);
                }
            );

            setTimeout(() => {
                this.activeRides = this.activeRides.filter(r => r.startTime !== t);
            }, 4000);
        } else {
            this.playSynthRide(t, normVel, isBell);
        }
    }

    // Cymbal Choke Engine (Instant acoustic damping for Crash and Ride on hand-grab)
    chokeCymbals(target = 'ALL', time = null) {
        if (!this.ctx) return;
        const t = time !== null ? time : this.ctx.currentTime;

        const chokeList = [];
        if (target === 'CRASH' || target === 'ALL') {
            chokeList.push(...this.activeCrashes);
            this.activeCrashes = [];
        }
        if (target === 'RIDE' || target === 'ALL') {
            chokeList.push(...this.activeRides);
            this.activeRides = [];
        }

        chokeList.forEach(c => {
            try {
                c.gainNode.gain.cancelScheduledValues(t);
                c.gainNode.gain.setValueAtTime(c.gainNode.gain.value, t);
                // Tight hand-choke damping curve in 16ms
                c.gainNode.gain.exponentialRampToValueAtTime(0.0001, t + 0.016);
                setTimeout(() => {
                    try { c.source.stop(); } catch (e) {}
                }, 25);
            } catch (err) {}
        });
    }

    // --- SYNTHETIC ENGINE (Used for Electro 808 kit or fallback) ---
    triggerElectronic(rowName, t, normVel, subType) {
        switch (rowName) {
            case 'KICK':
                this.playSynth808Kick(t, normVel);
                break;
            case 'SNARE':
                this.playSynth808Snare(t, normVel, subType === 'cross_stick');
                break;
            case 'HI_HAT':
            case 'HI_HAT_OPEN':
                this.playSynthHiHat(t, normVel, (rowName === 'HI_HAT_OPEN') ? 'open' : (subType || 'closed'));
                break;
            case 'TOM_1':
                this.playSynthTom(t, normVel, 190, 95, 0.25);
                break;
            case 'TOM_2':
                this.playSynthTom(t, normVel, 140, 70, 0.30);
                break;
            case 'TOM_3':
                this.playSynthTom(t, normVel, 95, 45, 0.38);
                break;
            case 'CRASH':
                this.playSynthCrash(t, normVel);
                break;
            case 'RIDE':
                this.playSynthRide(t, normVel, subType === 'bell');
                break;
            default:
                this.playSynth808Snare(t, normVel);
                break;
        }
    }

    playSynth808Kick(t, vel) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(160, t);
        osc.frequency.exponentialRampToValueAtTime(46, t + 0.06);
        osc.frequency.exponentialRampToValueAtTime(32, t + 0.52);

        gain.gain.setValueAtTime(1.25 * Math.pow(vel, 1.8), t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.58);
    }

    playSynth808Snare(t, vel, isRim = false) {
        if (isRim) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(1750, t);
            osc.frequency.exponentialRampToValueAtTime(950, t + 0.03);
            gain.gain.setValueAtTime(0.9 * Math.pow(vel, 1.8), t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(t);
            osc.stop(t + 0.045);
            return;
        }

        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(180, t);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(330, t);

        const dyn = Math.pow(vel, 1.8);
        oscGain.gain.setValueAtTime(0.7 * dyn, t);
        oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
        osc1.connect(oscGain);
        osc2.connect(oscGain);
        oscGain.connect(this.masterGain);
        osc1.start(t);
        osc2.start(t);
        osc1.stop(t + 0.1);
        osc2.stop(t + 0.1);

        const bufferSize = this.ctx.sampleRate * 0.18;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(2200, t);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.85 * dyn, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.17);
        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        noise.start(t);
        noise.stop(t + 0.18);
    }

    playSynthKick(t, vel) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(135, t);
        osc.frequency.exponentialRampToValueAtTime(45, t + 0.08);
        osc.frequency.exponentialRampToValueAtTime(34, t + 0.32);

        gain.gain.setValueAtTime(1.15 * Math.pow(vel, 1.8), t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.36);
    }

    playSynthSnare(t, vel, isRim = false) {
        const dyn = Math.pow(vel, 1.8);
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(isRim ? 650 : 210, t);
        osc.frequency.exponentialRampToValueAtTime(isRim ? 380 : 140, t + 0.06);

        oscGain.gain.setValueAtTime((isRim ? 0.9 : 0.75) * dyn, t);
        oscGain.gain.exponentialRampToValueAtTime(0.001, t + (isRim ? 0.06 : 0.14));
        osc.connect(oscGain);
        oscGain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.15);

        if (!isRim) {
            const bufferSize = this.ctx.sampleRate * 0.22;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.setValueAtTime(1100, t);

            const noiseGain = this.ctx.createGain();
            noiseGain.gain.setValueAtTime(0.85 * dyn, t);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.20);
            noise.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(this.masterGain);
            noise.start(t);
            noise.stop(t + 0.22);
        }
    }

    playSynthHiHat(t, vel, subType = 'closed') {
        const isOpen = (subType === 'open' || subType === 'half_open');
        const duration = isOpen ? 0.55 : 0.06;
        const dyn = Math.pow(vel, 1.8);

        const bufferSize = Math.floor(this.ctx.sampleRate * duration);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(8000, t);
        filter.Q.setValueAtTime(2.5, t);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.9 * dyn, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration * 0.9);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        noise.start(t);
        noise.stop(t + duration);
    }

    playSynthTom(t, vel, startFreq, endFreq, decay) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(startFreq, t);
        osc.frequency.exponentialRampToValueAtTime(endFreq, t + 0.08);

        gain.gain.setValueAtTime(1.05 * Math.pow(vel, 1.8), t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + decay);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + decay + 0.02);
    }

    playSynthCrash(t, vel) {
        const duration = 1.35;
        const bufferSize = Math.floor(this.ctx.sampleRate * duration);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const hp = this.ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.setValueAtTime(4500, t);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.8 * Math.pow(vel, 1.8), t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration * 0.9);

        noise.connect(hp);
        hp.connect(gain);
        gain.connect(this.masterGain);

        this.activeCrashes.push({ source: noise, gainNode: gain, startTime: t });
        noise.start(t);
        noise.stop(t + duration);
    }

    playSynthRide(t, vel, isBell = false) {
        const duration = isBell ? 0.9 : 1.2;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = isBell ? 'triangle' : 'sine';
        osc1.frequency.setValueAtTime(isBell ? 740 : 580, t);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(isBell ? 1480 : 1185, t);

        gain.gain.setValueAtTime(0.7 * Math.pow(vel, 1.8), t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration * 0.9);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.masterGain);

        this.activeRides.push({ source: osc1, gainNode: gain, startTime: t });
        osc1.start(t);
        osc2.start(t);
        osc1.stop(t + duration);
        osc2.stop(t + duration);
    }

    // Metronome click (crisp wooden percussive pulse with accent, beat, and subdivision hierarchy)
    playClick(clickType = 'beat', time = null) {
        if (!this.ctx) this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
        const t = time !== null ? time : this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        let freq = 1150;
        let vol = 0.55;
        let decay = 0.030;

        if (clickType === true || clickType === 'accent') {
            // Beat 1: High crisp wood accent
            freq = 2100;
            vol = 0.85;
            decay = 0.038;
        } else if (clickType === 'sub') {
            // Subdivision ("y", "e", "a", triplets): Soft subtle tick
            freq = 720;
            vol = 0.28;
            decay = 0.020;
        } else {
            // Main beat pulse (Beats 2, 3, 4...)
            freq = 1200;
            vol = 0.58;
            decay = 0.030;
        }

        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(vol, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + decay);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + decay + 0.005);
    }
}

window.drumAudio = new DrumAudioEngine();
