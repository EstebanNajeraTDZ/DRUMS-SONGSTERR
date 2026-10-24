/**
 * Donner DED-300X Interactive Calibration & Mapping Wizard
 * Guides the drummer step-by-step through testing and calibrating every pad, rim, and pedal.
 */

class DonnerCalibrationWizard {
    constructor() {
        this.currentStepIndex = 0;
        this.isActive = false;
        this.mappedData = {};
        this.mappedArticulations = {};

        this.steps = [
            {
                id: 'KICK',
                name: 'Bombo / Kick',
                icon: '🥁',
                prompt: 'Pisa el pedal del Bombo (fuerza media o normal)',
                row: 'KICK',
                subType: null,
                defaultNote: 36
            },
            {
                id: 'SNARE_HEAD',
                name: 'Tarola - Centro (Head)',
                icon: '🪘',
                prompt: 'Golpea el centro del parche de la Tarola',
                row: 'SNARE',
                subType: 'normal',
                defaultNote: 38
            },
            {
                id: 'SNARE_RIM',
                name: 'Tarola - Aro (Rimshot / Cross-Stick)',
                icon: '🥢',
                prompt: 'Golpea el aro de la Tarola (o toca con la baqueta apoyada)',
                row: 'SNARE',
                subType: 'cross_stick',
                defaultNote: 40
            },
            {
                id: 'HI_HAT_OPEN',
                name: 'Hi-Hat - Abierto',
                icon: '🟡',
                prompt: 'Golpea el plato del Hi-Hat SIN presionar el pedal',
                row: 'HI_HAT',
                subType: 'open',
                defaultNote: 46
            },
            {
                id: 'HI_HAT_CLOSED',
                name: 'Hi-Hat - Cerrado',
                icon: '🟡',
                prompt: 'Presiona el pedal del Hi-Hat con el pie y golpea el plato',
                row: 'HI_HAT',
                subType: 'closed',
                defaultNote: 42
            },
            {
                id: 'HI_HAT_PEDAL',
                name: 'Hi-Hat - Solo Pedal (Chick)',
                icon: '🦶',
                prompt: 'Pisa firme el pedal del Hi-Hat con el pie (sin golpear el plato)',
                row: 'HI_HAT',
                subType: 'pedal',
                defaultNote: 44
            },
            {
                id: 'TOM_1',
                name: 'Tom 1 (Agudo)',
                icon: '🔵',
                prompt: 'Golpea el parche del Tom 1 (arriba a la izquierda)',
                row: 'TOM_1',
                subType: null,
                defaultNote: 48
            },
            {
                id: 'TOM_2',
                name: 'Tom 2 (Medio)',
                icon: '🟢',
                prompt: 'Golpea el parche del Tom 2 (arriba a la derecha)',
                row: 'TOM_2',
                subType: null,
                defaultNote: 45
            },
            {
                id: 'TOM_3',
                name: 'Tom 3 (De Piso / Floor Tom)',
                icon: '🟣',
                prompt: 'Golpea el parche del Tom 3 (el tom bajo/suelo)',
                row: 'TOM_3',
                subType: null,
                defaultNote: 43
            },
            {
                id: 'CRASH',
                name: 'Plato Crash',
                icon: '⚪',
                prompt: 'Golpea el plato Crash (y prueba agarrar el borde para Choke)',
                row: 'CRASH',
                subType: null,
                defaultNote: 49
            },
            {
                id: 'RIDE_BODY',
                name: 'Plato Ride - Cuerpo (Bow)',
                icon: '🌸',
                prompt: 'Golpea el cuerpo/superficie del plato Ride con la punta de la baqueta',
                row: 'RIDE',
                subType: 'normal',
                defaultNote: 51
            },
            {
                id: 'RIDE_BELL',
                name: 'Plato Ride - Campana (Bell)',
                icon: '🔔',
                prompt: 'Golpea la campana del plato Ride (o presiona Omitir si tu plato es de 1 zona)',
                row: 'RIDE',
                subType: 'bell',
                defaultNote: 53
            }
        ];
    }

    init() {
        this.modalEl = document.getElementById('calibration-modal');
        if (!this.modalEl) return;

        // Raw MIDI Listener for calibration captures
        window.donnerMidi.onRawMIDI((hit) => {
            if (this.isActive) {
                this.handleCalibrationHit(hit);
            }
        });

        const openBtn = document.getElementById('open-calibration-btn');
        const closeBtn = document.getElementById('close-calib-modal-btn');
        const skipBtn = document.getElementById('calib-skip-btn');
        const resetBtn = document.getElementById('calib-reset-factory-btn');

        if (openBtn) openBtn.onclick = () => this.startWizard();
        if (closeBtn) closeBtn.onclick = () => this.closeWizard();
        if (skipBtn) skipBtn.onclick = () => this.nextStep(true);
        if (resetBtn) {
            resetBtn.onclick = () => {
                if (confirm('¿Deseas restaurar todas las notas al mapa de fábrica original de la Donner DED-300X?')) {
                    window.donnerMidi.resetToFactoryMap();
                    alert('Mapa de fábrica restaurado correctamente.');
                    this.closeWizard();
                }
            };
        }
    }

    startWizard() {
        this.isActive = true;
        this.currentStepIndex = 0;
        this.mappedData = {};
        this.mappedArticulations = {};
        if (this.modalEl) this.modalEl.classList.add('open');
        this.renderStep();
    }

    closeWizard() {
        this.isActive = false;
        if (this.modalEl) this.modalEl.classList.remove('open');
    }

    renderStep() {
        if (!this.isActive) return;

        const totalSteps = this.steps.length;
        const current = this.steps[this.currentStepIndex];

        // Progress bar
        const progressPct = Math.round(((this.currentStepIndex) / totalSteps) * 100);
        const progressBar = document.getElementById('calib-progress-bar');
        const progressText = document.getElementById('calib-step-counter');
        if (progressBar) progressBar.style.width = `${progressPct}%`;
        if (progressText) progressText.textContent = `Paso ${this.currentStepIndex + 1} de ${totalSteps}`;

        // Content
        const iconEl = document.getElementById('calib-step-icon');
        const titleEl = document.getElementById('calib-step-title');
        const promptEl = document.getElementById('calib-step-prompt');
        const feedbackEl = document.getElementById('calib-step-feedback');

        if (iconEl) iconEl.textContent = current.icon;
        if (titleEl) titleEl.textContent = current.name;
        if (promptEl) promptEl.textContent = current.prompt;
        if (feedbackEl) {
            feedbackEl.className = 'calib-feedback-box waiting';
            feedbackEl.innerHTML = `<span class="pulse-dot"></span> Esperando golpe en la batería...`;
        }
    }

    handleCalibrationHit(hit) {
        if (!this.isActive || hit.row === 'CONSOLA') return;

        const current = this.steps[this.currentStepIndex];
        const feedbackEl = document.getElementById('calib-step-feedback');

        // Capture note
        this.mappedData[hit.note] = current.row;
        if (current.subType) {
            this.mappedArticulations[hit.note] = current.subType;
        }

        // Positive feedback UI
        if (feedbackEl) {
            feedbackEl.className = 'calib-feedback-box success hit-anim';
            feedbackEl.innerHTML = `
                <div class="calib-success-title">✓ ¡GOLPE REGISTRADO!</div>
                <div class="calib-success-meta">
                    <span>Nota MIDI: <strong>${hit.note}</strong></span>
                    <span>Velocidad: <strong>${hit.velocity}</strong></span>
                    <span>Pad: <strong>${current.name}</strong></span>
                </div>
            `;
        }

        // Audio preview
        if (window.drumAudio) {
            window.drumAudio.resume();
            window.drumAudio.trigger(current.row, hit.velocity, null, current.subType);
        }

        // Brief delay before advancing
        setTimeout(() => {
            if (this.isActive) {
                this.nextStep(false);
            }
        }, 550);
    }

    nextStep(wasSkipped = false) {
        if (!this.isActive) return;

        if (wasSkipped) {
            const current = this.steps[this.currentStepIndex];
            // Use default note
            this.mappedData[current.defaultNote] = current.row;
            if (current.subType) {
                this.mappedArticulations[current.defaultNote] = current.subType;
            }
        }

        this.currentStepIndex++;
        if (this.currentStepIndex >= this.steps.length) {
            this.finishWizard();
        } else {
            this.renderStep();
        }
    }

    finishWizard() {
        this.isActive = false;
        window.donnerMidi.saveCustomMap(this.mappedData, this.mappedArticulations);

        const contentEl = document.getElementById('calib-step-container');
        if (contentEl) {
            contentEl.innerHTML = `
                <div class="calib-completed-card">
                    <div class="calib-completed-icon">🎉</div>
                    <h3>¡CALIBRACIÓN COMPLETADA!</h3>
                    <p>Tu batería Donner DED-300X ha sido configurada con éxito. Todas las notas y zonas quedaron calibradas a tu estilo de toque.</p>
                    <div class="calib-summary-list">
                        ${this.steps.map(s => {
                            const note = Object.keys(this.mappedData).find(k => this.mappedData[k] === s.row && (!s.subType || this.mappedArticulations[k] === s.subType)) || s.defaultNote;
                            return `<div class="calib-summary-row"><span class="sum-name">${s.icon} ${s.name}:</span> <span class="sum-note">Nota ${note}</span></div>`;
                        }).join('')}
                    </div>
                    <button id="calib-finish-btn" class="btn btn-primary" style="margin-top: 18px;">
                        ✓ COMENZAR A PRACTICAR
                    </button>
                </div>
            `;

            const finishBtn = document.getElementById('calib-finish-btn');
            if (finishBtn) finishBtn.onclick = () => this.closeWizard();
        }
    }
}

window.calibrationWizard = new DonnerCalibrationWizard();
