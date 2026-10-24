// @ts-nocheck
/**
 * Donner DED-300X Web MIDI Controller & Pad Mapper
 * Connects directly to Donner DED-300X with zero driver requirements.
 */

class DonnerMIDIController {
    constructor() {
        this.midiAccess = null;
        this.selectedInput = null;
        this.connectedDeviceName = null;
        this.isSupported = !!navigator.requestMIDIAccess;
        
        // Donner DED-300X Default MIDI Note Map (all rows match sequencer & visual pads)
        this.noteMap = {
            // Kick
            36: 'KICK', 35: 'KICK',
            // Snare (head, rimshot, side stick)
            38: 'SNARE', 40: 'SNARE', 37: 'SNARE',
            // Hi-Hat (Open, Closed, Pedal, Half-Open all map to 'HI_HAT' row)
            42: 'HI_HAT', 44: 'HI_HAT', 46: 'HI_HAT', 22: 'HI_HAT', 26: 'HI_HAT',
            23: 'HI_HAT', 24: 'HI_HAT', 25: 'HI_HAT', 92: 'HI_HAT', 98: 'HI_HAT',
            // Toms
            48: 'TOM_1', 50: 'TOM_1',
            45: 'TOM_2', 47: 'TOM_2',
            43: 'TOM_3', 41: 'TOM_3', 58: 'TOM_3',
            // Cymbals (Donner DED-300X: Crash 1 Izquierdo, Crash 2 Derecho)
            49: 'CRASH_1', 55: 'CRASH_1', 95: 'CRASH_1',
            57: 'CRASH_2', 52: 'CRASH_2', 96: 'CRASH_2', 97: 'CRASH_2',
            51: 'RIDE', 53: 'RIDE', 59: 'RIDE', 93: 'RIDE', 94: 'RIDE',
            // Electronic Cymbal Choke Notes (sent by certain module firmware)
            85: 'CRASH_1', 87: 'CRASH_2', 89: 'RIDE'
        };

        // Detailed Drum Articulations for realistic playback & visual badges
        this.noteArticulations = {
            46: 'open',       // Hi-Hat Pad Hit with Pedal Open / Released
            26: 'open',       // Hi-Hat Edge with Pedal Open
            42: 'closed',     // Hi-Hat Pad Hit with Pedal Closed / Pressed
            22: 'closed',     // Hi-Hat Edge with Pedal Closed
            44: 'pedal',      // Hi-Hat Pedal Chick / Foot Splash
            23: 'half_open',  // Semiabierto
            24: 'half_open',
            25: 'half_open',
            92: 'half_open',
            98: 'half_open',
            53: 'bell',       // Ride Bell / Campana
            51: 'normal',     // Ride Bow / Cuerpo natural
            59: 'normal',     // Ride Edge
            40: 'cross_stick',// Rimshot / Cross-Stick
            37: 'cross_stick',// Side-stick
            38: 'normal',
            85: 'choke',      // Crash Choke Note
            87: 'choke',      // Crash 2 Choke Note
            89: 'choke'       // Ride Choke Note
        };

        // Track Hi-Hat Pedal position via MIDI CC 4 (0 = fully open, 127 = tightly closed)
        this.hiHatPedalValue = 0;

        // Backup of factory maps
        this.factoryNoteMap = { ...this.noteMap };
        this.factoryArticulations = { ...this.noteArticulations };
        this.loadCustomMap();

        // Listeners for hits and state changes
        this.onHitCallbacks = [];
        this.onStateChangeCallbacks = [];
        this.onRawMIDICallbacks = [];
        this.onPedalChangeCallbacks = [];
        this.onProgramChangeCallbacks = [];
        this.onChokeCallbacks = [];
        this.learnModeTargetRow = null; // for custom MIDI Learn
        this.recentHits = []; // log for MIDI Monitor
        this.selectedInputId = 'all';
    }

    async init() {
        // Check secure context restriction
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (!window.isSecureContext && !isLocal) {
            this.notifyStateChange({
                status: 'insecure_context',
                message: 'Bloqueado por navegador (Se requiere HTTPS o localhost)',
                isNetworkInsecure: true
            });
            return false;
        }

        if (!this.isSupported) {
            this.notifyStateChange({
                status: 'unsupported',
                message: 'Navegador no soporta Web MIDI (Usa Chrome, Edge u Opera)'
            });
            return false;
        }

        return await this.requestAccess();
    }

    async requestAccess() {
        try {
            this.midiAccess = await navigator.requestMIDIAccess({ sysex: false });
            this.midiAccess.onstatechange = () => this.scanAndAutoConnect();
            this.scanAndAutoConnect();
            return true;
        } catch (err) {
            console.warn('Acceso a Web MIDI no concedido aún o denegado:', err);
            this.notifyStateChange({
                status: 'denied',
                message: 'Permiso MIDI pendiente o bloqueado en navegador'
            });
            return false;
        }
    }

    scanAndAutoConnect() {
        if (!this.midiAccess) return;
        const inputs = Array.from(this.midiAccess.inputs.values());

        if (inputs.length === 0) {
            this.connectedDeviceName = null;
            this.notifyStateChange({
                status: 'disconnected',
                deviceNames: [],
                message: 'Sin dispositivos MIDI detectados en este equipo'
            });
            return;
        }

        // Connect to all inputs simultaneously by default
        this.connectInputs(this.selectedInputId || 'all');
    }

    connectInputs(targetId = 'all') {
        if (!this.midiAccess) return;
        const inputs = Array.from(this.midiAccess.inputs.values());
        this.selectedInputId = targetId;

        // Disconnect old listeners
        inputs.forEach(i => i.onmidimessage = null);

        let activeInputs = [];
        if (targetId === 'all') {
            activeInputs = inputs;
        } else {
            const matched = inputs.find(i => i.id === targetId);
            activeInputs = matched ? [matched] : inputs;
        }

        activeInputs.forEach(input => {
            input.onmidimessage = (e) => this.handleMIDIMessage(e, input.name || 'MIDI');
        });

        const hasDonner = inputs.some(i => /donner|ded|medeli|drum|bateria/i.test(i.name));
        let label = '';
        if (hasDonner) {
            const d = inputs.find(i => /donner|ded|medeli|drum/i.test(i.name));
            label = `Donner DED-300X (${d.name})`;
        } else if (inputs.length === 1) {
            label = `MIDI: ${inputs[0].name}`;
        } else {
            label = `MIDI Activo (${inputs.length} entradas)`;
        }

        this.connectedDeviceName = label;
        this.notifyStateChange({
            status: 'connected',
            deviceNames: inputs.map(i => i.name || 'Dispositivo USB MIDI'),
            activeCount: activeInputs.length,
            isDonner: hasDonner,
            message: label
        });
    }

    getAvailableInputs() {
        if (!this.midiAccess) return [];
        return Array.from(this.midiAccess.inputs.values()).map(i => ({
            id: i.id,
            name: i.name || 'Dispositivo MIDI USB',
            manufacturer: i.manufacturer || 'Generico'
        }));
    }

    handleMIDIMessage(event, inputName = 'USB MIDI') {
        const [status, note, velocity] = event.data;
        const command = status >> 4;
        const channel = status & 0xf;

        // Control Change (command 11 / 0xB)
        if (command === 11) {
            const ccNumber = note;
            const ccValue = velocity;
            // Listen to CC 4 (Hi-Hat Controller), CC 11 (Expression), CC 1 (Modulation), or any CC on drum channel
            if (ccNumber === 4 || ccNumber === 11 || ccNumber === 1 || channel === 9) {
                this.setPedalValue(ccValue, true);
            }
            return;
        }

        // Program Change (command 12 / 0xC) - Triggered when turning the kit wheel on DED 300 console
        if (command === 12) {
            const kitPresetNum = note + 1; // 1-indexed
            this.onProgramChangeCallbacks.forEach(cb => cb(kitPresetNum));
            const logItem = {
                row: 'CONSOLA',
                subType: null,
                artText: `Kit #${kitPresetNum}`,
                velocity: 127,
                note: kitPresetNum,
                inputName: inputName,
                timestamp: performance.now(),
                timeStr: new Date().toLocaleTimeString()
            };
            this.recentHits.unshift(logItem);
            this.onRawMIDICallbacks.forEach(cb => cb(logItem));
            return;
        }

        // Polyphonic Aftertouch (command 10) or Channel Aftertouch (command 13) - Cymbal Choke (hand grab)
        if (command === 10 || command === 13) {
            const isRide = (note === 51 || note === 53 || note === 59);
            const cymbalType = isRide ? 'RIDE' : 'CRASH';
            if (window.drumAudio) window.drumAudio.chokeCymbals(cymbalType);
            this.onChokeCallbacks.forEach(cb => cb(cymbalType));

            const logItem = {
                row: cymbalType,
                subType: 'choke',
                artText: `Choke ${cymbalType}`,
                velocity: velocity || 127,
                note: note || (isRide ? 51 : 49),
                inputName: inputName,
                timestamp: performance.now(),
                timeStr: new Date().toLocaleTimeString()
            };
            this.recentHits.unshift(logItem);
            if (this.recentHits.length > 25) this.recentHits.pop();
            this.onRawMIDICallbacks.forEach(cb => cb(logItem));
            return;
        }

        // Note Off (command 8) or Note On with velocity 0
        if (command === 8 || (command === 9 && velocity === 0)) {
            if (note === 44) {
                // Foot lifted off hi-hat pedal -> Open pedal (0%)
                this.setPedalValue(0, false);
            }
            return;
        }

        // Note On (command 9) with velocity > 0
        if (command === 9 && velocity > 0) {
            // Mesh head & pad vibration debounce (Retrigger Cancel / Mask Time)
            const now = performance.now();
            if (!this.lastNoteHitTimes) this.lastNoteHitTimes = new Map();
            const prevHit = this.lastNoteHitTimes.get(note);
            if (prevHit && (now - prevHit < 32)) {
                // Drop mechanical bounce/retrigger
                return;
            }
            this.lastNoteHitTimes.set(note, now);

            if (this.learnModeTargetRow) {
                // Calibrate / Learn mode
                this.noteMap[note] = this.learnModeTargetRow;
                const learnedRow = this.learnModeTargetRow;
                this.learnModeTargetRow = null;
                this.triggerHit(learnedRow, velocity, note, true, inputName);
                return;
            }

            const row = this.noteMap[note] || this.fallbackNoteToRow(note);
            let subType = this.noteArticulations[note] || null;

            // Handle dedicated Choke notes
            if (subType === 'choke' || note === 85 || note === 87 || note === 89) {
                const chokeTarget = (row === 'RIDE' || note === 89) ? 'RIDE' : 'CRASH';
                if (window.drumAudio) window.drumAudio.chokeCymbals(chokeTarget);
                this.onChokeCallbacks.forEach(cb => cb(chokeTarget));
                this.triggerHit(chokeTarget, velocity, note, false, inputName, 'choke');
                return;
            }

            // Hi-Hat intelligence: Check pedal status & notes
            if (row === 'HI_HAT') {
                if (note === 46 || note === 26) {
                    subType = 'open';
                    this.setPedalValue(0, false); // Cymbal hit with open pedal confirms 0%
                } else if (note === 44) {
                    subType = 'pedal';
                    this.setPedalValue(127, false); // Pedal stomp confirms 100% (Cerrado)
                } else if (note === 42 || note === 22) {
                    subType = 'closed';
                    this.setPedalValue(127, false); // Closed hit confirms 100% (Cerrado)
                } else if (note === 23 || note === 24 || note === 25 || note === 92 || note === 98) {
                    subType = 'half_open';
                    this.setPedalValue(64, false); // Half-open hit confirms 50%
                } else {
                    if (this.hiHatPedalValue < 35) {
                        subType = 'open';
                    } else if (this.hiHatPedalValue < 80) {
                        subType = 'half_open';
                    } else {
                        subType = 'closed';
                    }
                }
            }

            // Ride Cymbal intelligence: differentiate Bell vs Bow
            if (row === 'RIDE') {
                if (note === 53) {
                    subType = 'bell';
                } else {
                    subType = subType || 'normal';
                }
            }

            this.triggerHit(row, velocity, note, false, inputName, subType);
        }
    }

    triggerHit(row, velocity, note, wasLearned = false, inputName = 'MIDI', subType = null) {
        let artText = '';
        if (subType === 'open') artText = 'Abierto';
        else if (subType === 'closed') artText = 'Cerrado';
        else if (subType === 'pedal') artText = 'Pedal';
        else if (subType === 'half_open') artText = 'Semiabierto';
        else if (subType === 'cross_stick') artText = 'Cross-Stick';
        else if (subType === 'bell') artText = 'Campana';
        else if (subType === 'choke') artText = 'Choke ✋';

        // Log hit for live MIDI Monitor
        const hitInfo = {
            row: row,
            subType: subType,
            artText: artText,
            velocity: velocity,
            note: note,
            inputName: inputName,
            timestamp: performance.now(),
            wasLearned: wasLearned,
            timeStr: new Date().toLocaleTimeString()
        };
        this.recentHits.unshift(hitInfo);
        if (this.recentHits.length > 20) this.recentHits.pop();

        // Trigger sound instantly in Web Audio Engine with kit & articulation
        if (window.drumAudio) {
            window.drumAudio.resume();
            window.drumAudio.trigger(row, velocity, null, subType);
        }

        // Notify app listeners for score hit detection & UI animations
        this.onHitCallbacks.forEach(cb => cb(hitInfo));
        this.onRawMIDICallbacks.forEach(cb => cb(hitInfo));
    }

    fallbackNoteToRow(note) {
        if (note < 37) return 'KICK';
        if (note >= 37 && note <= 40) return 'SNARE';
        if (note === 41 || note === 43) return 'TOM_3';
        if (note === 45 || note === 47) return 'TOM_2';
        if (note === 48 || note === 50) return 'TOM_1';
        if (note === 49 || note === 57 || note === 52) return 'CRASH';
        if (note === 51 || note === 53 || note === 59) return 'RIDE';
        return 'HI_HAT';
    }

    startLearnMode(targetRow) {
        this.learnModeTargetRow = targetRow;
    }

    cancelLearnMode() {
        this.learnModeTargetRow = null;
    }

    onHit(callback) {
        this.onHitCallbacks.push(callback);
    }

    onRawMIDI(callback) {
        this.onRawMIDICallbacks.push(callback);
    }

    onStateChange(callback) {
        this.onStateChangeCallbacks.push(callback);
    }

    loadCustomMap() {
        try {
            const saved = localStorage.getItem('donner_custom_map');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.noteMap) this.noteMap = { ...this.factoryNoteMap, ...parsed.noteMap };
                if (parsed.articulations) this.noteArticulations = { ...this.factoryArticulations, ...parsed.articulations };
                console.log('[DonnerMIDI] Mapa personalizado cargado desde almacenamiento local.');
            }
        } catch (e) {
            console.warn('[DonnerMIDI] Error cargando mapa personalizado:', e);
        }
    }

    saveCustomMap(newMap, newArticulations) {
        if (newMap) this.noteMap = { ...this.noteMap, ...newMap };
        if (newArticulations) this.noteArticulations = { ...this.noteArticulations, ...newArticulations };
        try {
            localStorage.setItem('donner_custom_map', JSON.stringify({
                noteMap: this.noteMap,
                articulations: this.noteArticulations,
                savedAt: new Date().toISOString()
            }));
            console.log('[DonnerMIDI] Mapa personalizado guardado exitosamente.');
        } catch (e) {
            console.warn('[DonnerMIDI] Error guardando mapa:', e);
        }
    }

    resetToFactoryMap() {
        localStorage.removeItem('donner_custom_map');
        this.noteMap = { ...this.factoryNoteMap };
        this.noteArticulations = { ...this.factoryArticulations };
        console.log('[DonnerMIDI] Mapa restaurado a valores originales de fábrica DED-300X.');
    }

    setPedalValue(val, fromCC = false) {
        this.hiHatPedalValue = Math.max(0, Math.min(127, Math.round(val)));
        this.onPedalChangeCallbacks.forEach(cb => cb(this.hiHatPedalValue));
        // Instant Hi-Hat Choke: Closing the pedal dampens any ringing open hi-hat wash!
        if (this.hiHatPedalValue >= 45 && window.drumAudio) {
            window.drumAudio.chokeHiHat();
        }
    }

    onPedalChange(callback) {
        this.onPedalChangeCallbacks.push(callback);
    }

    onProgramChange(callback) {
        this.onProgramChangeCallbacks.push(callback);
    }

    onChoke(callback) {
        this.onChokeCallbacks.push(callback);
    }

    notifyStateChange(state) {
        this.onStateChangeCallbacks.forEach(cb => cb(state));
    }
}

window.donnerMidi = new DonnerMIDIController();
