/**
 * Master Application Controller
 * Handles Songsterr loading, measure chunking, playback synchronization,
 * Donner DED-300X MIDI evaluation, and UI interactions.
 */

class DrumPracticeStudio {
    constructor() {
        this.currentSong = null;
        this.currentMeasureIndex = 0;
        this.loopStartMeasure = 0;
        this.loopEndMeasure = 0;
        this.selectedMeasures = new Set(); // 0-based measure indices selected for loop practice
        this.chunkSize = 0; // 1, 2, 4 or 0 (continuous)
        this.autoAdvance = true;

        this.isPlaying = false;
        this.playbackStartTime = 0;
        this.currentTick = 0;
        this.animationFrameId = null;

        // Hit scoring & accuracy
        this.score = 0;
        this.hitsCount = 0;
        this.perfectCount = 0;
        this.earlyCount = 0;
        this.lateCount = 0;
        this.goodCount = 0;
        this.missCount = 0;
        this.consumedNoteKeys = new Set();

        // Preferences & Mode
        this.handedness = 'right'; // 'right' or 'left'
        this.soundMuted = false;   // mute backing track so drummer hears only their Donner kit

        // Songsterr Audio & YouTube Player Engine
        this.audioMode = 'orig';    // 'orig' (YouTube audio) or 'synth' (Web Audio drum kit)
        this.audioSource = 'full';  // 'full' (Mezcla completa), 'backing' (Sin Batería), 'solo'
        this.autoPlayDrums = false; // Virtual drum demo: notes play themselves automatically
        this.playbackSpeed = 1.0;   // 0.5, 0.75, 1.0, 1.25
        this.isLessonMode = false;  // When practicing a lesson/fill, stays locked in isolated loop

        this.ytPlayer = null;
        this.ytPlayerReady = false;
        this.currentVideoId = null;
        this.songVideos = [];
        this.lessonsLibrary = [];
        this.currentSongDefaultBpm = 83;
        this.userCustomBpm = null;     // Drummer's custom defined BPM for practice
        this.isBpmLocked = false;      // When true, measure advances won't overwrite user's BPM
        this.currentMeasureDurationSec = 0;

        // Synchronization state
        this.audioOffsetMs = 0;        // Fine-tuned manual sync offset in ms
        this.isAwaitingAudio = false;  // Waits for video/audio to start before starting metronome
        this.isBufferingPaused = false;// Holds playback if stream buffers mid-song
        this.isSeekingMedia = false;   // Guard against stale audio time during video seek
        this.seekTargetSec = 0;
        this.seekStartTime = 0;
    }

    async init() {
        // Initialize Audio & MIDI
        window.drumAudio.init();
        await window.donnerMidi.init();

        // Initialize Lateral Full Score Sidebar
        if (window.fullScoreSidebar) {
            window.fullScoreSidebar.init();
            window.fullScoreSidebar.onSelectMeasure((idx) => this.setMeasure(idx, true));
            window.fullScoreSidebar.onSelectSection((startM, endM, secName) => {
                this.setPracticeLoop(startM, endM, secName);
            });
            window.fullScoreSidebar.onSelectionChange((selectedList) => {
                this.handleSelectionChange(selectedList);
            });
            if (window.fullScoreSidebar.onQuantityChange) {
                window.fullScoreSidebar.onQuantityChange((qty) => {
                    this.chunkSize = qty;
                    document.querySelectorAll('.chunk-size-btn').forEach(b => {
                        const bSize = Number(b.dataset.size);
                        b.classList.toggle('active', bSize === qty);
                    });
                });
            }
            if (window.fullScoreSidebar.onAutoAdvanceChange) {
                window.fullScoreSidebar.onAutoAdvanceChange((enabled) => {
                    this.setAutoAdvance(enabled, true);
                });
            }
        }

        // Initialize Donner Calibration Wizard
        if (window.calibrationWizard) {
            window.calibrationWizard.init();
        }

        this.bindEvents();
        this.loadPresetsList();
        this.loadLessonsLibrary();
        this.initYouTubePlayer();

        // Load the featured fill from Image 1 as initial showcase
        this.loadSong('exercise-sextuplet-fill', true);
    }

    bindEvents() {
        // MIDI Hit & Monitor Listener
        window.donnerMidi.onHit((hit) => this.handleDrummerHit(hit));
        window.donnerMidi.onRawMIDI((hit) => this.appendMIDIMonitorLog(hit));
        window.donnerMidi.onStateChange((state) => this.updateMIDIStatusUI(state));

        // Donner DED-300X Real-Time Sensor Listeners
        window.donnerMidi.onPedalChange((ccVal) => this.updateHiHatPedalGauge(ccVal));
        window.donnerMidi.onProgramChange((kitNum) => this.handleConsoleKitChange(kitNum));
        window.donnerMidi.onChoke((cymbal) => this.handleCymbalChoke(cymbal));

        // Interactive Hi-Hat Pedal Manual Test (allows testing open/closed even when drum is disconnected)
        const pedalMeterBox = document.getElementById('pedal-gauge-fill')?.closest('.sensor-meter-box');
        if (pedalMeterBox) {
            pedalMeterBox.style.cursor = 'pointer';
            pedalMeterBox.title = 'Haz clic aquí para abrir o cerrar el pedal manualmente y probar el sensor';
            pedalMeterBox.addEventListener('click', () => {
                const isCurrentlyClosed = (window.donnerMidi.hiHatPedalValue > 60);
                const newVal = isCurrentlyClosed ? 0 : 127;
                window.donnerMidi.setPedalValue(newVal);
                if (window.drumAudio) {
                    window.drumAudio.resume();
                    window.drumAudio.trigger('HI_HAT', 105, null, isCurrentlyClosed ? 'open' : 'pedal');
                }
            });
        }

        // Open MIDI Diagnostic Modal
        const midiBadge = document.getElementById('midi-status-badge');
        const midiModal = document.getElementById('midi-diagnostic-modal');
        const closeMidiModalBtn = document.getElementById('close-midi-modal-btn');
        const rescanMidiBtn = document.getElementById('rescan-midi-btn');
        const clearMidiLogBtn = document.getElementById('clear-midi-log-btn');
        const midiInputSelect = document.getElementById('midi-input-select');

        if (midiBadge && midiModal) {
            midiBadge.onclick = () => {
                this.refreshMIDIDevicesDropdown();
                midiModal.classList.add('open');
            };
        }
        if (closeMidiModalBtn && midiModal) {
            closeMidiModalBtn.onclick = () => midiModal.classList.remove('open');
        }
        if (rescanMidiBtn) {
            rescanMidiBtn.onclick = async () => {
                rescanMidiBtn.textContent = 'Buscando...';
                await window.donnerMidi.requestAccess();
                this.refreshMIDIDevicesDropdown();
                setTimeout(() => rescanMidiBtn.innerHTML = '🔄 Re-escanear / Solicitar Permiso', 500);
            };
        }
        if (clearMidiLogBtn) {
            clearMidiLogBtn.onclick = () => {
                const con = document.getElementById('midi-live-console');
                if (con) con.innerHTML = '<div class="console-empty-hint">Esperando golpes de la batería...</div>';
            };
        }
        if (midiInputSelect) {
            midiInputSelect.onchange = (e) => {
                window.donnerMidi.connectInputs(e.target.value);
            };
        }

        // Drum Sound Preset Selectors (Synced between top toolbar & Donner kit HUD)
        const kitSelectToolbar = document.getElementById('drum-kit-select');
        const kitSelectPanel = document.getElementById('drum-kit-select-panel');

        const directBanner = document.getElementById('donner-direct-banner');

        const changeDrumKit = (kitName) => {
            window.drumAudio.setKit(kitName);
            if (kitSelectToolbar) kitSelectToolbar.value = kitName;
            if (kitSelectPanel) kitSelectPanel.value = kitName;

            if (directBanner) {
                if (kitName === 'donner_direct') {
                    directBanner.classList.remove('hidden');
                } else {
                    directBanner.classList.add('hidden');
                }
            }

            // Play quick preview sound so user hears kit timbre change (unless muted for Direct Donner mode)
            if (kitName !== 'donner_direct') {
                window.drumAudio.resume();
                window.drumAudio.trigger('SNARE', 110);
            }
        };

        if (kitSelectToolbar) {
            kitSelectToolbar.onchange = (e) => changeDrumKit(e.target.value);
        }
        if (kitSelectPanel) {
            kitSelectPanel.onchange = (e) => changeDrumKit(e.target.value);
        }

        // Audio Unlock Banner (helps user resume suspended audio context)
        const unlockBanner = document.getElementById('audio-unlock-banner');
        const unlockBtn = document.getElementById('audio-unlock-btn');

        const checkAudioStatus = () => {
            if (!unlockBanner) return;
            if (window.drumAudio.ctx && window.drumAudio.ctx.state === 'suspended') {
                unlockBanner.classList.remove('hidden');
            } else {
                unlockBanner.classList.add('hidden');
            }
        };

        const doUnlockAudio = async () => {
            await window.drumAudio.resume();
            window.drumAudio.trigger('KICK', 110);
            checkAudioStatus();
        };

        if (unlockBanner) unlockBanner.onclick = doUnlockAudio;
        if (unlockBtn) unlockBtn.onclick = (e) => { e.stopPropagation(); doUnlockAudio(); };
        window.drumAudio.onAudioUnlocked = checkAudioStatus;
        setTimeout(checkAudioStatus, 400);

        // Interactive Clickable / Tappable Drum Pads (Immediate audio feedback)
        document.querySelectorAll('.drum-pad').forEach(pad => {
            pad.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                window.drumAudio.resume();
                checkAudioStatus();
                const row = pad.getAttribute('data-row');
                if (row) {
                    const subType = (row === 'HI_HAT') ? (window.donnerMidi.hiHatPedalValue > 60 ? 'closed' : 'open') : null;
                    window.drumAudio.trigger(row, 115, null, subType);
                    this.handleDrummerHit({
                        row: row,
                        velocity: 110,
                        articulation: subType,
                        timeStr: new Date().toLocaleTimeString(),
                        note: 38,
                        inputName: 'Virtual Pad'
                    });
                }
            });
        });

        // Metronome sync
        window.donnerMetronome.onTempoChange((bpm, term) => {
            document.getElementById('bpm-display').textContent = bpm;
            document.getElementById('bpm-slider').value = bpm;
            document.getElementById('tempo-term-display').textContent = term;
            const mobileBpm = document.getElementById('mobile-bpm-val');
            if (mobileBpm) mobileBpm.textContent = bpm;
        });

        // Metronome buttons with user practice BPM lock
        document.getElementById('bpm-minus-5').onclick = () => {
            window.donnerMetronome.adjustBpm(-5);
            this.setUserBpm(window.donnerMetronome.bpm);
        };
        document.getElementById('bpm-minus-1').onclick = () => {
            window.donnerMetronome.adjustBpm(-1);
            this.setUserBpm(window.donnerMetronome.bpm);
        };
        document.getElementById('bpm-plus-1').onclick  = () => {
            window.donnerMetronome.adjustBpm(1);
            this.setUserBpm(window.donnerMetronome.bpm);
        };
        document.getElementById('bpm-plus-5').onclick  = () => {
            window.donnerMetronome.adjustBpm(5);
            this.setUserBpm(window.donnerMetronome.bpm);
        };

        document.getElementById('bpm-slider').oninput = (e) => {
            this.setUserBpm(Number(e.target.value));
        };

        document.getElementById('reset-bpm-btn').onclick = () => {
            this.resetToOriginalBpm();
        };

        document.getElementById('tap-tempo-btn').onclick = () => {
            window.donnerMetronome.tapTempo();
            this.setUserBpm(window.donnerMetronome.bpm);
        };

        // Metronome Pulses per Measure (Pulsos / Compás: 2, 3, 4, 5, 6, 7, 8, 12)
        const beatsValTag = document.getElementById('metro-beats-val');
        document.querySelectorAll('#metro-beats-pills .metro-pill').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('#metro-beats-pills .metro-pill').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const beats = Number(btn.dataset.beats);
                window.donnerMetronome.setBeatsPerMeasure(beats);
                if (beatsValTag) beatsValTag.textContent = `${beats} pulsos`;

                // Also sync with sequencer grid compás
                if (window.gridSequencer) {
                    window.gridSequencer.setTimeSignature(beats);
                    const seqTimeSelect = document.getElementById('seq-time-signature-select');
                    if (seqTimeSelect) {
                        const match = Array.from(seqTimeSelect.options).find(o => o.value.startsWith(`${beats}/`));
                        if (match) seqTimeSelect.value = match.value;
                    }
                }
            };
        });

        // Metronome Clicks per Pulse (Subdivisión: 1, 2, 3, 4, 6 clicks por pulso)
        const clicksValTag = document.getElementById('metro-clicks-val');
        document.querySelectorAll('#metro-clicks-pills .metro-pill').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('#metro-clicks-pills .metro-pill').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const clicks = Number(btn.dataset.clicks);
                window.donnerMetronome.setClicksPerBeat(clicks);
                if (clicksValTag) {
                    const tagLabels = { 1: '1 click (♩)', 2: '2 clicks (un-y)', 3: '3 clicks (triple)', 4: '4 clicks (cuatro)', 6: '6 clicks (sextu)' };
                    clicksValTag.textContent = tagLabels[clicks] || `${clicks} clicks`;
                }
            };
        });

        // Sequencer Subdivision Switcher Buttons (2, 3, 4, 6)
        document.querySelectorAll('.subdiv-btn').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.subdiv-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const sub = Number(btn.dataset.sub);
                window.gridSequencer.setSubdivision(sub);

                // Sync clicks per beat on metronome if desired
                window.donnerMetronome.setClicksPerBeat(sub);
                document.querySelectorAll('#metro-clicks-pills .metro-pill').forEach(b => {
                    b.classList.toggle('active', Number(b.dataset.clicks) === sub);
                });
                if (clicksValTag) {
                    const tagLabels = { 1: '1 click (♩)', 2: '2 clicks (un-y)', 3: '3 clicks (triple)', 4: '4 clicks (cuatro)', 6: '6 clicks (sextu)' };
                    clicksValTag.textContent = tagLabels[sub] || `${sub} clicks`;
                }
            };
        });

        // Sequencer Time Signature Select
        const seqTimeSelect = document.getElementById('seq-time-signature-select');
        if (seqTimeSelect) {
            seqTimeSelect.onchange = (e) => {
                const parts = e.target.value.split('/');
                const num = Number(parts[0]) || 4;
                const den = Number(parts[1]) || 4;
                window.gridSequencer.setTimeSignature(num, den);

                // Sync metronome beats
                window.donnerMetronome.setBeatsPerMeasure(num);
                document.querySelectorAll('#metro-beats-pills .metro-pill').forEach(b => {
                    b.classList.toggle('active', Number(b.dataset.beats) === num);
                });
                if (beatsValTag) beatsValTag.textContent = `${num} pulsos`;
            };
        }

        // --- Songsterr Audio Controller Bindings ---
        const modeOrigBtn = document.getElementById('mode-orig-btn');
        const modeSynthBtn = document.getElementById('mode-synth-btn');
        if (modeOrigBtn) modeOrigBtn.onclick = () => this.setAudioMode('orig');
        if (modeSynthBtn) modeSynthBtn.onclick = () => this.setAudioMode('synth');

        const audioSourceSelect = document.getElementById('audio-source-select');
        if (audioSourceSelect) {
            audioSourceSelect.onchange = (e) => this.setAudioSource(e.target.value);
        }

        document.querySelectorAll('.speed-opt-btn').forEach(btn => {
            btn.onclick = () => this.setPlaybackSpeed(Number(btn.dataset.speed));
        });

        // Sync offset nudge buttons (-500ms, -100ms, -20ms, +20ms, +100ms, +500ms)
        const m500 = document.getElementById('offset-minus-500-btn');
        const m100 = document.getElementById('offset-minus-100-btn');
        const m20 = document.getElementById('offset-minus-20-btn');
        const p20 = document.getElementById('offset-plus-20-btn');
        const p100 = document.getElementById('offset-plus-100-btn');
        const p500 = document.getElementById('offset-plus-500-btn');
        const syncDisplay = document.getElementById('sync-offset-display');
        const captureBeat1Btn = document.getElementById('sync-capture-beat1-btn');
        const ytSetBeat1Btn = document.getElementById('yt-set-beat1-btn');

        if (m500) m500.onclick = () => this.adjustAudioOffset(-500);
        if (m100) m100.onclick = () => this.adjustAudioOffset(-100);
        if (m20) m20.onclick = () => this.adjustAudioOffset(-20);
        if (p20) p20.onclick = () => this.adjustAudioOffset(20);
        if (p100) p100.onclick = () => this.adjustAudioOffset(100);
        if (p500) p500.onclick = () => this.adjustAudioOffset(500);
        if (syncDisplay) {
            syncDisplay.style.cursor = 'pointer';
            syncDisplay.title = 'Haz clic para restablecer la sincronización a 0 ms';
            syncDisplay.onclick = () => this.setAudioOffset(0);
        }
        if (captureBeat1Btn) captureBeat1Btn.onclick = () => this.captureCurrentTimeAsBeat1();
        if (ytSetBeat1Btn) ytSetBeat1Btn.onclick = () => this.captureCurrentTimeAsBeat1();

        const autoDemoBtn = document.getElementById('auto-demo-btn');
        if (autoDemoBtn) autoDemoBtn.onclick = () => this.toggleAutoDemo();

        const drumVolSlider = document.getElementById('drum-volume-slider');
        const drumVolBadge = document.getElementById('drum-volume-badge');
        if (drumVolSlider) {
            drumVolSlider.oninput = (e) => {
                const val = Number(e.target.value);
                const gain = val / 100.0;
                window.drumAudio.setMasterVolume(gain);
                if (drumVolBadge) {
                    drumVolBadge.textContent = val > 100 ? `${val}% 🔥` : `${val}%`;
                    drumVolBadge.classList.toggle('boost', val > 100);
                }
            };
        }

        const toggleYtBtn = document.getElementById('toggle-yt-video-btn');
        const ytContainer = document.getElementById('youtube-player-container');
        const ytCloseBtn = document.getElementById('yt-close-btn');
        if (toggleYtBtn && ytContainer) {
            toggleYtBtn.onclick = () => {
                const isCollapsed = ytContainer.classList.toggle('collapsed');
                const textEl = document.getElementById('yt-video-btn-text');
                if (textEl) textEl.textContent = isCollapsed ? 'Ver Video' : 'Ocultar Video';
            };
        }
        if (ytCloseBtn && ytContainer) {
            ytCloseBtn.onclick = () => {
                ytContainer.classList.add('collapsed');
                const textEl = document.getElementById('yt-video-btn-text');
                if (textEl) textEl.textContent = 'Ver Video';
            };
        }

        // --- Academy Modal Bindings ---
        const openAcademyBtn = document.getElementById('open-academy-btn');
        const academyModal = document.getElementById('academy-modal');
        const closeAcademyModalBtn = document.getElementById('close-academy-modal-btn');
        if (openAcademyBtn && academyModal) {
            openAcademyBtn.onclick = () => academyModal.classList.add('open');
        }
        if (closeAcademyModalBtn && academyModal) {
            closeAcademyModalBtn.onclick = () => academyModal.classList.remove('open');
        }
        if (academyModal) {
            academyModal.addEventListener('click', (e) => {
                if (e.target === academyModal) academyModal.classList.remove('open');
            });
        }
        const songsterrModal = document.getElementById('songsterr-modal');
        if (songsterrModal) {
            songsterrModal.addEventListener('click', (e) => {
                if (e.target === songsterrModal) songsterrModal.classList.remove('open');
            });
        }
        document.querySelectorAll('.academy-tab-btn').forEach(tab => {
            tab.onclick = () => {
                document.querySelectorAll('.academy-tab-btn').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.filterAcademyLessons(tab.dataset.category);
            };
        });

        // Sequencer Presets Select (Maps to lessons with isolated loop practice!)
        const seqPresetsSelect = document.getElementById('seq-preset-patterns-select');
        if (seqPresetsSelect) {
            seqPresetsSelect.onchange = (e) => {
                const val = e.target.value;
                if (!val) return;
                const map = {
                    'fill_image1': 'exercise-sextuplet-fill',
                    'rock_basic': 'rock-basic-backbeat',
                    'shuffle_triplet': 'shuffle-blues-ride',
                    'ballad_6_8': 'exercise-sextuplet-fill',
                    'funk_16th': 'single-paradiddle'
                };
                const targetId = map[val] || val;
                this.loadSong(targetId, true);
                e.target.value = '';
            };
        }

        // Sequencer Clear Measure Button
        const clearMeasureBtn = document.getElementById('clear-grid-measure-btn');
        if (clearMeasureBtn) {
            clearMeasureBtn.onclick = () => {
                if (confirm('¿Deseas limpiar todas las notas de este compás para empezar desde cero?')) {
                    window.gridSequencer.clearMeasure();
                }
            };
        }

        // Big Play / Pause button
        document.getElementById('master-play-btn').onclick = () => this.togglePlayback();

        // Measure Navigation & Chunking
        document.getElementById('prev-measure-btn').onclick = () => this.stepMeasure(-1);
        document.getElementById('next-measure-btn').onclick = () => this.stepMeasure(1);
        document.getElementById('measure-slider').oninput = (e) => this.setMeasure(Number(e.target.value));

        document.querySelectorAll('.chunk-size-btn').forEach(btn => {
            btn.onclick = (e) => {
                document.querySelectorAll('.chunk-size-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const size = Number(btn.dataset.size);
                this.chunkSize = size;
                if (window.fullScoreSidebar) {
                    window.fullScoreSidebar.setQuantity(size, this.currentMeasureIndex);
                } else {
                    if (size === 0) {
                        this.handleSelectionChange([]);
                    } else if (size === 1) {
                        this.handleSelectionChange([this.currentMeasureIndex]);
                    } else if (size > 1) {
                        const endM = Math.min((this.currentSong?.total_measures || 1) - 1, this.currentMeasureIndex + size - 1);
                        const list = [];
                        for (let i = this.currentMeasureIndex; i <= endM; i++) list.push(i);
                        this.handleSelectionChange(list);
                    }
                }
            };
        });

        const autoAdvToggle = document.getElementById('auto-advance-toggle');
        if (autoAdvToggle) {
            autoAdvToggle.onchange = (e) => {
                this.setAutoAdvance(e.target.checked, true);
            };
        }

        document.getElementById('drum-audio-toggle').onchange = (e) => {
            this.soundMuted = !e.target.checked;
        };

        document.getElementById('metronome-click-toggle').onchange = (e) => {
            window.donnerMetronome.clickAudioEnabled = e.target.checked;
        };

        // Handedness switch
        document.getElementById('handedness-select').onchange = (e) => {
            this.handedness = e.target.value;
            if (this.currentSong) {
                this.loadSong(this.currentSong.song_id);
            }
        };

        // Section dropdown change
        document.getElementById('section-select').onchange = (e) => {
            const startM = Number(e.target.value);
            const sections = this.currentSong ? this.currentSong.sections || [] : [];
            const secIdx = sections.findIndex(s => s.measure_index === startM);
            let endM = this.currentSong ? this.currentSong.total_measures - 1 : startM;
            if (secIdx !== -1 && secIdx < sections.length - 1) {
                endM = sections[secIdx + 1].measure_index - 1;
            }
            this.setPracticeLoop(startM, endM);
        };

        // Sidebar Toggle Buttons
        const toggleSidebarBtn = document.getElementById('toggle-sidebar-nav-btn');
        if (toggleSidebarBtn) {
            toggleSidebarBtn.onclick = () => window.fullScoreSidebar.toggle();
        }
        const openSidebarBtn = document.getElementById('open-sidebar-floating-btn');
        if (openSidebarBtn) {
            openSidebarBtn.onclick = () => window.fullScoreSidebar.open();
        }
        const headerSidebarBtn = document.getElementById('header-sidebar-btn');
        if (headerSidebarBtn) {
            headerSidebarBtn.onclick = () => window.fullScoreSidebar.toggle();
        }
        const mobileOpenSidebarBtn = document.getElementById('mobile-open-sidebar-btn');
        if (mobileOpenSidebarBtn) {
            mobileOpenSidebarBtn.onclick = () => window.fullScoreSidebar.toggle();
        }

        // Mobile Sticky Playbar Controls
        const mobilePlayBtn = document.getElementById('mobile-play-btn');
        if (mobilePlayBtn) {
            mobilePlayBtn.onclick = () => this.togglePlayback();
        }
        const mobilePrevBtn = document.getElementById('mobile-prev-btn');
        if (mobilePrevBtn) {
            mobilePrevBtn.onclick = () => this.stepMeasure(-1);
        }
        const mobileNextBtn = document.getElementById('mobile-next-btn');
        if (mobileNextBtn) {
            mobileNextBtn.onclick = () => this.stepMeasure(1);
        }

        // Studio View Tabs (Tablet & Mobile)
        const viewTabs = document.querySelectorAll('.studio-view-tabs .view-tab-btn');
        const bottomGrid = document.querySelector('.bottom-studio-grid');
        if (viewTabs && bottomGrid) {
            viewTabs.forEach(btn => {
                btn.onclick = () => {
                    viewTabs.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    const view = btn.dataset.view;
                    bottomGrid.classList.remove('view-pads-only', 'view-metro-only');
                    if (view === 'pads') bottomGrid.classList.add('view-pads-only');
                    if (view === 'metro') bottomGrid.classList.add('view-metro-only');
                };
            });
        }

        // Notation & Matrix Toggles
        const toggleScrollBtn = document.getElementById('toggle-scroll-mode-btn');
        const toggleGridScrollBtn = document.getElementById('toggle-grid-scroll-btn');

        const updateScrollModeUI = (mode) => {
            const isHighway = (mode === 'guitar_hero');
            if (toggleScrollBtn) {
                toggleScrollBtn.classList.toggle('active', isHighway);
                toggleScrollBtn.textContent = isHighway ? '🎮 GUITAR HERO: ON' : '📄 COMPÁS FIJO';
            }
            if (toggleGridScrollBtn) {
                toggleGridScrollBtn.classList.toggle('active', isHighway);
                toggleGridScrollBtn.textContent = isHighway ? '🎮 GUITAR HERO: ON' : '📄 COMPÁS FIJO';
            }
        };

        const handleToggleScrollMode = () => {
            const mode = window.notationRenderer ? window.notationRenderer.toggleScrollMode() : 'guitar_hero';
            if (window.gridSequencer && window.gridSequencer.setScrollMode) {
                window.gridSequencer.setScrollMode(mode);
            }
            updateScrollModeUI(mode);
        };

        if (toggleScrollBtn) toggleScrollBtn.onclick = handleToggleScrollMode;
        if (toggleGridScrollBtn) toggleGridScrollBtn.onclick = handleToggleScrollMode;

        document.getElementById('toggle-sticking-btn').onclick = (e) => {
            const active = e.target.classList.toggle('active');
            e.target.textContent = `STICKING: ${active ? 'ON' : 'OFF'}`;
            window.notationRenderer.setShowSticking(active);
        };

        document.getElementById('toggle-cursor-btn').onclick = (e) => {
            const active = e.target.classList.toggle('active');
            e.target.textContent = `CURSOR: ${active ? 'ON' : 'OFF'}`;
            window.notationRenderer.setShowCursor(active);
        };

        const toggleLegendBtn = document.getElementById('toggle-legend-btn');
        const legendPanel = document.getElementById('songsterr-legend-panel');
        const closeLegendBtn = document.getElementById('close-legend-btn');
        if (toggleLegendBtn && legendPanel) {
            toggleLegendBtn.onclick = () => {
                const isHidden = legendPanel.classList.toggle('hidden');
                toggleLegendBtn.classList.toggle('active', !isHidden);
            };
        }
        if (closeLegendBtn && legendPanel) {
            closeLegendBtn.onclick = () => {
                legendPanel.classList.add('hidden');
                if (toggleLegendBtn) toggleLegendBtn.classList.remove('active');
            };
        }

        // Songsterr Search & Load Modal
        const openSearchModal = () => {
            document.getElementById('songsterr-modal').classList.add('open');
            document.getElementById('song-search-input').focus();
        };

        document.getElementById('open-search-modal-btn').onclick = openSearchModal;
        const headerSearchBtn = document.getElementById('header-search-btn');
        if (headerSearchBtn) {
            headerSearchBtn.onclick = openSearchModal;
        }

        document.getElementById('close-modal-btn').onclick = () => {
            document.getElementById('songsterr-modal').classList.remove('open');
        };

        document.getElementById('song-search-btn').onclick = () => this.searchSongsterr();
        document.getElementById('song-search-input').onkeydown = (e) => {
            if (e.key === 'Enter') this.searchSongsterr();
        };

        // Export Buttons
        document.getElementById('export-midi-btn').onclick = () => this.exportMidi();
        document.getElementById('export-gp5-btn').onclick = () => this.exportGp5();

        // Keyboard Shortcuts
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
                return;
            }
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
            if (e.code === 'Space') {
                e.preventDefault();
                this.togglePlayback();
            } else if (e.code === 'ArrowLeft') {
                this.stepMeasure(-1);
            } else if (e.code === 'ArrowRight') {
                this.stepMeasure(1);
            } else if (e.key === 't' || e.key === 'T') {
                window.donnerMetronome.tapTempo();
            }
        });
    }

    buildCustomSongObject(config) {
        const title = config.title || 'Mi Partitura Custom';
        const artist = config.artist || 'Custom / Batería';
        const bpm = Number(config.bpm) || 85;
        const beats = Number(config.beats) || 4;
        const denominator = Number(config.denominator) || 4;
        const subdivsPerBeat = Number(config.subdivisionsPerBeat) || 4;
        const totalMeasures = Number(config.measuresCount) || 2;
        const preset = config.startingPreset || 'blank';
        const songId = `custom-${Date.now()}`;

        const totalTicks = 1920;
        const totalSubdivs = beats * subdivsPerBeat;
        const stepTicks = totalTicks / totalSubdivs;

        const measures = [];
        for (let mIdx = 0; mIdx < totalMeasures; mIdx++) {
            const notes = [];
            if (preset === 'rock' && mIdx === 0) {
                // Hi-Hat on 8ths
                for (let i = 0; i < totalSubdivs; i += (subdivsPerBeat >= 4 ? 2 : 1)) {
                    notes.push({ row: 'HI_HAT', tick: Math.round(i * stepTicks), duration: [1, totalSubdivs], beat_ticks: stepTicks, velocity: 'f', accent: (i === 0), sticking: 'R', sub_type: 'closed', symbol: '×', head_type: 'x' });
                }
                notes.push({ row: 'KICK', tick: 0, duration: [1, totalSubdivs], beat_ticks: stepTicks, velocity: 'f', accent: true, sticking: 'K', sub_type: 'normal', symbol: '●' });
                if (beats >= 3) {
                    notes.push({ row: 'KICK', tick: Math.round((2 * subdivsPerBeat) * stepTicks), duration: [1, totalSubdivs], beat_ticks: stepTicks, velocity: 'f', accent: false, sticking: 'K', sub_type: 'normal', symbol: '●' });
                }
                if (beats >= 2) {
                    notes.push({ row: 'SNARE', tick: Math.round((1 * subdivsPerBeat) * stepTicks), duration: [1, totalSubdivs], beat_ticks: stepTicks, velocity: 'f', accent: true, sticking: 'L', sub_type: 'normal', symbol: '●' });
                }
                if (beats >= 4) {
                    notes.push({ row: 'SNARE', tick: Math.round((3 * subdivsPerBeat) * stepTicks), duration: [1, totalSubdivs], beat_ticks: stepTicks, velocity: 'f', accent: true, sticking: 'L', sub_type: 'normal', symbol: '●' });
                }
            } else if (preset === 'sextuplet' && mIdx === 0) {
                // Sextuplet fill
                for (let i = 0; i < Math.min(24, totalSubdivs); i++) {
                    const row = i < 4 ? 'TOM_2' : (i < 8 ? 'TOM_3' : (i < 12 ? 'KICK' : (i < 16 ? 'TOM_2' : (i < 20 ? 'TOM_3' : 'SNARE'))));
                    notes.push({ row, tick: Math.round(i * stepTicks), duration: [1, totalSubdivs], beat_ticks: stepTicks, velocity: 'f', accent: (i === 23), sticking: (row === 'KICK' ? 'K' : (i % 2 === 0 ? 'R' : 'L')), sub_type: 'normal', symbol: '●' });
                }
            }

            measures.push({
                measure_index: mIdx,
                measure_number: mIdx + 1,
                signature: [beats, denominator],
                bpm: bpm,
                measure_ticks: totalTicks,
                subdivision_count: totalSubdivs,
                subdivisions_per_beat: subdivsPerBeat,
                notes: notes
            });
        }

        return {
            song_id: songId,
            artist: artist,
            title: title,
            default_bpm: bpm,
            total_measures: totalMeasures,
            signature: [beats, denominator],
            is_custom: true,
            created_at: new Date().toISOString(),
            sections: [
                { name: 'Inicio', measure_index: 0, measure_number: 1 }
            ],
            measures: measures
        };
    }

    async saveCurrentAsCustom(customTitle = null) {
        if (!this.currentSong) return null;
        const songData = JSON.parse(JSON.stringify(this.currentSong));
        if (customTitle) songData.title = customTitle;
        if (!songData.song_id || !String(songData.song_id).startsWith('custom-')) {
            songData.song_id = `custom-${Date.now()}`;
        }
        songData.is_custom = true;
        songData.updated_at = new Date().toISOString();

        // 1. Save to LocalStorage
        try {
            const raw = localStorage.getItem('donner_custom_scores_v1') || '[]';
            const list = JSON.parse(raw);
            const existIdx = list.findIndex(s => s.song_id === songData.song_id);
            if (existIdx !== -1) {
                list[existIdx] = songData;
            } else {
                list.unshift(songData);
            }
            localStorage.setItem('donner_custom_scores_v1', JSON.stringify(list));
        } catch (e) {
            console.warn('LocalStorage save error:', e);
        }

        // 2. Save to Flask backend
        try {
            await fetch('/api/custom-songs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(songData)
            });
        } catch (e) {
            console.warn('Server save error:', e);
        }

        // 3. Update current title in UI
        const titleEl = document.getElementById('song-title');
        if (titleEl) titleEl.textContent = songData.title;

        return songData;
    }

    async loadSong(songIdOrUrl, isLesson = false) {
        this.stopPlayback();

        try {
            let data = null;
            if (typeof songIdOrUrl === 'object' && songIdOrUrl !== null) {
                data = songIdOrUrl;
            } else {
                this.showLoading(true, 'Descargando partitura de batería de Songsterr...');
                const resp = await fetch(`/api/song/${songIdOrUrl}?handedness=${this.handedness}`);
                data = await resp.json();
            }

            if (data.error) {
                alert(`Error: ${data.error}`);
                this.showLoading(false);
                return;
            }

            this.currentSong = data;
            window.notationRenderer.setSong(data);
            if (window.gridSequencer && window.gridSequencer.setSong) {
                window.gridSequencer.setSong(data);
            }
            this.currentSongDefaultBpm = data.default_bpm || 83;
            this.currentMeasureIndex = 0;
            this.loopStartMeasure = 0;
            this.loopEndMeasure = (data.total_measures || 1) - 1;
            this.selectedMeasures.clear();
            this.isBpmLocked = false;
            this.userCustomBpm = null;
            this.updateBpmLockUI();

            // Check if this is an isolated practice lesson / rudiment / fill
            this.isLessonMode = !!(isLesson || data.is_lesson || String(songIdOrUrl).startsWith('exercise-'));

            // Reset scores
            this.resetAccuracyStats();

            // Update UI headers
            document.getElementById('song-title').textContent = data.title;
            document.getElementById('song-artist').textContent = data.artist;
            document.getElementById('total-measures-display').textContent = data.total_measures || 1;

            // Update BPM
            window.donnerMetronome.setDefaultBpm(data.default_bpm || 83);
            if (this.playbackSpeed !== 1.0) {
                this.setPlaybackSpeed(this.playbackSpeed);
            }

            // Load and configure YouTube videos
            if (this.isLessonMode) {
                this.loadSongVideos([]);
                const ytTitle = document.getElementById('yt-now-playing');
                if (ytTitle) ytTitle.textContent = `🎓 Lección: ${data.title}`;
            } else {
                this.loadSongVideos(data.videos || []);
                const ytTitle = document.getElementById('yt-now-playing');
                if (ytTitle) ytTitle.textContent = `🎬 ${data.artist} - ${data.title} (Songsterr Sync)`;
            }

            // Populate Section dropdown
            const sectionSelect = document.getElementById('section-select');
            sectionSelect.innerHTML = '';
            if (data.sections && data.sections.length > 0) {
                data.sections.forEach(s => {
                    const opt = document.createElement('option');
                    opt.value = s.measure_index;
                    opt.textContent = `${s.name} (Compás ${s.measure_number})`;
                    sectionSelect.appendChild(opt);
                });
            } else {
                const opt = document.createElement('option');
                opt.value = 0;
                opt.textContent = this.isLessonMode ? 'Ejercicio / Lección' : 'Canción Completa';
                sectionSelect.appendChild(opt);
            }

            // For full songs, continuous playback is default so the song flows naturally through all bars
            if (!this.isLessonMode) {
                this.chunkSize = 0;
                this.setAutoAdvance(true, true);
                document.querySelectorAll('.chunk-size-btn').forEach(b => {
                    b.classList.toggle('active', b.id === 'chunk-cont-btn');
                });
            } else {
                this.chunkSize = 1;
                this.setAutoAdvance(false, true);
                document.querySelectorAll('.chunk-size-btn').forEach(b => {
                    b.classList.toggle('active', b.id === 'chunk-1-btn');
                });
            }

            // Render first measure & populate lateral score
            window.notationRenderer.setLoopRange(0, (data.total_measures || 1) - 1);
            if (window.gridSequencer && window.gridSequencer.setLoopRange) {
                window.gridSequencer.setLoopRange(0, (data.total_measures || 1) - 1);
            }
            this.setMeasure(0);
            if (window.fullScoreSidebar) {
                window.fullScoreSidebar.setSong(data, 0, 0, (data.total_measures || 1) - 1);
            }
            this.showLoading(false);
            const sModal = document.getElementById('songsterr-modal');
            if (sModal) sModal.classList.remove('open');
            const aModal = document.getElementById('academy-modal');
            if (aModal) aModal.classList.remove('open');
        } catch (err) {
            console.error('Error al cargar canción:', err);
            alert('Error al conectar con el servidor.');
            this.showLoading(false);
        }
    }

    setAutoAdvance(enabled, syncUI = true) {
        this.autoAdvance = !!enabled;
        if (syncUI) {
            const toggle1 = document.getElementById('auto-advance-toggle');
            if (toggle1 && toggle1.checked !== this.autoAdvance) {
                toggle1.checked = this.autoAdvance;
            }
            if (window.fullScoreSidebar && window.fullScoreSidebar.setAutoAdvanceToggle) {
                window.fullScoreSidebar.setAutoAdvanceToggle(this.autoAdvance);
            }
        }
    }

    handleSelectionChange(selectedList) {
        if (!this.currentSong) return;
        this.selectedMeasures = new Set(selectedList);

        if (this.selectedMeasures.size === 0) {
            // MODO TODA LA CANCIÓN: Flujo continuo sin restricciones de bucle
            this.loopStartMeasure = 0;
            this.loopEndMeasure = (this.currentSong.total_measures || 1) - 1;
            this.chunkSize = 0;
            this.setAutoAdvance(true, true);

            document.querySelectorAll('.chunk-size-btn').forEach(b => {
                b.classList.toggle('active', b.id === 'chunk-cont-btn');
            });
            if (window.fullScoreSidebar) {
                window.fullScoreSidebar.selectedQuantity = 0;
                window.fullScoreSidebar.updateQuantityUI();
            }

            window.notationRenderer.setLoopRange(this.loopStartMeasure, this.loopEndMeasure);
            if (window.gridSequencer?.setLoopRange) {
                window.gridSequencer.setLoopRange(this.loopStartMeasure, this.loopEndMeasure);
            }
        } else {
            // MODO BUCLE MANUAL (UNO O VARIOS COMPASES SELECCIONADOS):
            const sorted = Array.from(this.selectedMeasures).sort((a, b) => a - b);
            this.loopStartMeasure = sorted[0];
            this.loopEndMeasure = sorted[sorted.length - 1];
            this.chunkSize = sorted.length;

            // RESPETAR EL ESTADO REAL DEL TOGGLE DEL USUARIO:
            // Si el toggle está desactivado, this.autoAdvance DEBE ser false (Bucle Cerrado Estricto).
            const autoAdvToggle = document.getElementById('auto-advance-toggle');
            const shouldAdvance = autoAdvToggle ? autoAdvToggle.checked : this.autoAdvance;
            this.setAutoAdvance(shouldAdvance, true);

            document.querySelectorAll('.chunk-size-btn').forEach(b => {
                const bSize = Number(b.dataset.size);
                b.classList.toggle('active', bSize === sorted.length);
            });
            if (window.fullScoreSidebar) {
                window.fullScoreSidebar.selectedQuantity = sorted.length;
                window.fullScoreSidebar.updateQuantityUI();
            }

            window.notationRenderer.setLoopRange(this.loopStartMeasure, this.loopEndMeasure);
            if (window.gridSequencer?.setLoopRange) {
                window.gridSequencer.setLoopRange(this.loopStartMeasure, this.loopEndMeasure);
            }

            // Si el compás actual no está en la selección, saltar al primero seleccionado
            if (!this.selectedMeasures.has(this.currentMeasureIndex)) {
                this.setMeasure(sorted[0], true);
            }
        }
    }

    advanceRollingSelectionWindow(nextMeasureIndex) {
        if (!this.autoAdvance) return; // NUNCA avanzar si Auto-Avanzar está desactivado por el usuario
        if (!this.selectedMeasures || this.selectedMeasures.size <= 0 || !this.currentSong) return;
        const total = this.currentSong.total_measures || 1;
        const sorted = Array.from(this.selectedMeasures).sort((a, b) => a - b);
        const windowSize = sorted.length;

        // Si el siguiente compás se sale de la ventana activa, desplazar la ventana progresivamente:
        // "liberando espacio" (sale el compás más antiguo) e "integrando el siguiente" (entra el nuevo)
        if (nextMeasureIndex > sorted[sorted.length - 1] || nextMeasureIndex < sorted[0]) {
            let newStart = 0;
            let newEnd = 0;

            if (nextMeasureIndex > sorted[sorted.length - 1]) {
                newStart = Math.max(0, nextMeasureIndex - windowSize + 1);
                newEnd = Math.min(total - 1, newStart + windowSize - 1);
            } else {
                newStart = nextMeasureIndex;
                newEnd = Math.min(total - 1, newStart + windowSize - 1);
            }

            this.selectedMeasures.clear();
            for (let i = newStart; i <= newEnd; i++) {
                this.selectedMeasures.add(i);
            }
            this.loopStartMeasure = newStart;
            this.loopEndMeasure = newEnd;

            // Sincronizar límites visuales en notación y secuenciador
            window.notationRenderer.setLoopRange(newStart, newEnd);
            if (window.gridSequencer?.setLoopRange) {
                window.gridSequencer.setLoopRange(newStart, newEnd);
            }

            // Sincronizar selección visual en la barra lateral sin interrumpir el flujo de audio
            if (window.fullScoreSidebar) {
                window.fullScoreSidebar.selectedMeasures = new Set(this.selectedMeasures);
                window.fullScoreSidebar.loopStart = newStart;
                window.fullScoreSidebar.loopEnd = newEnd;
                window.fullScoreSidebar.updateCardSelectionClasses();
                window.fullScoreSidebar.updateLoopRangeText();
            }
        }
    }

    setPracticeLoop(startM, endM, label = '') {
        if (!this.currentSong) return;
        const total = (this.currentSong.total_measures || 1);
        this.loopStartMeasure = Math.max(0, startM);
        this.loopEndMeasure = Math.min(total - 1, endM);

        if (this.loopStartMeasure === 0 && this.loopEndMeasure >= total - 1) {
            if (window.fullScoreSidebar) {
                window.fullScoreSidebar.clearSelection();
            } else {
                this.handleSelectionChange([]);
            }
        } else {
            if (window.fullScoreSidebar) {
                window.fullScoreSidebar.selectRange(this.loopStartMeasure, this.loopEndMeasure);
            } else {
                const list = [];
                for (let i = this.loopStartMeasure; i <= this.loopEndMeasure; i++) list.push(i);
                this.handleSelectionChange(list);
            }
        }

        this.setMeasure(this.loopStartMeasure, true);

        // Sync section select dropdown if matching
        const sectionSelect = document.getElementById('section-select');
        if (sectionSelect) {
            const matchingOpt = Array.from(sectionSelect.options).find(o => Number(o.value) === startM);
            if (matchingOpt) sectionSelect.value = startM;
        }
    }

    setMeasure(index, seekMedia = false) {
        if (!this.currentSong || !this.currentSong.measures) return;
        if (this.consumedNoteKeys) this.consumedNoteKeys.clear();
        this.currentMeasureIndex = Math.max(0, Math.min(this.currentSong.measures.length - 1, index));
        const m = this.currentSong.measures[this.currentMeasureIndex];

        document.getElementById('current-measure-num').textContent = m.measure_number;
        const mNumEl = document.getElementById('mobile-meas-num');
        if (mNumEl) mNumEl.textContent = m.measure_number;
        document.getElementById('measure-slider').value = this.currentMeasureIndex;
        document.getElementById('measure-slider').max = Math.max(0, this.currentSong.measures.length - 1);

        // Update BPM if measure has automated tempo AND user has not locked a custom BPM
        if (!this.isBpmLocked && m.bpm && this.playbackSpeed === 1.0) {
            window.donnerMetronome.setBpm(m.bpm);
        }

        // Render Notation and Grid Roll
        window.notationRenderer.setMeasure(m);
        window.notationRenderer.setMeasureIndex(this.currentMeasureIndex);
        window.gridSequencer.setMeasure(m);
        if (window.gridSequencer.setMeasureIndex) {
            window.gridSequencer.setMeasureIndex(this.currentMeasureIndex);
        }

        // Update active measure on lateral full score
        if (window.fullScoreSidebar) {
            window.fullScoreSidebar.setActiveMeasure(this.currentMeasureIndex);
        }

        // If explicitly seeking during playback, jump time / video to this measure
        if (seekMedia && this.isPlaying) {
            if (this.audioMode === 'orig' && this.ytPlayer && this.ytPlayerReady && !this.isLessonMode) {
                const seekSec = Math.max(0, ((typeof m.start_time_sec === 'number') ? m.start_time_sec : 0) + (this.audioOffsetMs / 1000));
                this.isSeekingMedia = true;
                this.seekStartTime = performance.now();
                this.seekTargetSec = seekSec;
                try {
                    this.ytPlayer.seekTo(seekSec, true);
                    this.ytPlayer.playVideo();
                    this.lastYtReportedSec = seekSec;
                    this.lastYtReportedPerf = performance.now();
                } catch (e) {}
            } else {
                this.playbackStartTime = performance.now();
            }
        }
    }

    stepMeasure(delta) {
        if (!this.currentSong) return;
        this.setMeasure(this.currentMeasureIndex + delta, true);
    }

    togglePlayback() {
        if (this.isPlaying || this.isAwaitingAudio) {
            this.stopPlayback();
        } else {
            this.startPlayback();
        }
    }

    startPlayback() {
        const m = (this.currentSong && this.currentSong.measures) ? this.currentSong.measures[this.currentMeasureIndex] : window.gridSequencer.currentMeasure;
        if (!m) return;
        window.drumAudio.init();

        const hasYouTubeAudio = (this.audioMode === 'orig' && this.ytPlayer && this.ytPlayerReady && this.currentVideoId && !this.isLessonMode);

        if (hasYouTubeAudio) {
            // ORIGINAL AUDIO SYNC WORKFLOW:
            // 1. Indicate buffering/waiting state on the play button
            this.isAwaitingAudio = true;
            this.isPlaying = false;
            this.isBufferingPaused = false;

            const playBtn = document.getElementById('master-play-btn');
            if (playBtn) {
                playBtn.classList.remove('playing');
                playBtn.classList.add('syncing');
            }
            const playIcon = document.getElementById('play-icon');
            const playText = document.getElementById('play-text');
            if (playIcon) playIcon.textContent = '⏳';
            if (playText) playText.textContent = 'ESPERANDO AUDIO...';

            // 2. Seek YouTube video to exact measure start time + sync offset
            const seekSec = Math.max(0, ((typeof m.start_time_sec === 'number') ? m.start_time_sec : 0) + (this.audioOffsetMs / 1000));
            try {
                this.ytPlayer.seekTo(seekSec, true);
                this.ytPlayer.setPlaybackRate(this.playbackSpeed);
                this.ytPlayer.playVideo();
            } catch (err) {
                console.warn('[YouTube] Error iniciando video sync:', err);
                // Fallback to active playback if player fails
                this.beginActivePlayback(m);
            }

            // Safety timeout: if YouTube API hangs or is blocked, fallback after 4.5s
            clearTimeout(this.awaitAudioTimeout);
            this.awaitAudioTimeout = setTimeout(() => {
                if (this.isAwaitingAudio) {
                    console.warn('[YouTube] Timeout esperando stream de YouTube; iniciando reproducción directa.');
                    this.beginActivePlayback(m);
                }
            }, 4500);
        } else {
            // SYNTHESIZER / SIN CANCIÓN / LESSON WORKFLOW:
            // Zero buffering delay! Metronome, score cursor, and virtual drums start INSTANTLY.
            if (this.ytPlayer && this.ytPlayerReady) {
                try { this.ytPlayer.pauseVideo(); } catch (e) {}
            }
            this.beginActivePlayback(m);
        }
    }

    beginActivePlayback(currentM) {
        clearTimeout(this.awaitAudioTimeout);
        this.isAwaitingAudio = false;
        this.isPlaying = true;
        this.isBufferingPaused = false;

        const m = currentM || ((this.currentSong && this.currentSong.measures) ? this.currentSong.measures[this.currentMeasureIndex] : window.gridSequencer.currentMeasure);
        if (!m) return;

        // UI active playing state
        const playBtn = document.getElementById('master-play-btn');
        if (playBtn) {
            playBtn.classList.remove('syncing');
            playBtn.classList.add('playing');
        }
        const playIcon = document.getElementById('play-icon');
        const playText = document.getElementById('play-text');
        if (playIcon) playIcon.textContent = '⏸';
        if (playText) playText.textContent = 'PAUSAR';

        const mobilePlayBtn = document.getElementById('mobile-play-btn');
        if (mobilePlayBtn) {
            mobilePlayBtn.classList.remove('syncing');
            mobilePlayBtn.classList.add('playing');
        }
        const mobilePlayIcon = document.getElementById('mobile-play-icon');
        const mobilePlayText = document.getElementById('mobile-play-text');
        if (mobilePlayIcon) mobilePlayIcon.textContent = '⏸';
        if (mobilePlayText) mobilePlayText.textContent = 'PAUSAR';

        window.drumAudio.init();
        window.drumAudio.resume();

        const hasYouTubeAudio = (this.audioMode === 'orig' && this.ytPlayer && this.ytPlayerReady && this.currentVideoId && !this.isLessonMode);

        // Always stop standalone free-running metronome scheduler during synchronized practice
        window.donnerMetronome.init();
        window.donnerMetronome.stop();
        window.donnerMetronome.renderOrbs();
        window.donnerMetronome.renderSubTicker();

        const beats = (m.signature && m.signature[0]) ? m.signature[0] : (window.donnerMetronome.beatsPerMeasure || 4);
        const mBpm = this.isBpmLocked 
            ? (this.userCustomBpm || window.donnerMetronome.bpm) 
            : (m.bpm || window.donnerMetronome.bpm || 83);
        const measureDurationSec = ((60.0 / mBpm) * beats) / (this.playbackSpeed || 1.0);
        this.currentMeasureDurationSec = measureDurationSec;
        this.playbackStartTime = performance.now();
        this.lastYtReportedSec = 0;
        this.lastYtReportedPerf = performance.now();

        this.runPlaybackLoop(m, measureDurationSec);
    }

    runPlaybackLoop(initialMeasure, initialMeasureDurationSec) {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        let m = initialMeasure;
        let measureDurationSec = initialMeasureDurationSec;
        const playedNotes = new Set();
        let lastBeatTriggered = -1;
        let lastFrameTick = -1;

        const loop = () => {
            if (!this.isPlaying) return;

            // Pause playhead progress if YouTube video is buffering mid-song
            if (this.isBufferingPaused) {
                this.animationFrameId = requestAnimationFrame(loop);
                return;
            }

            // Adapt dynamically if user changed BPM during live playback
            if (this.currentMeasureDurationSec && this.currentMeasureDurationSec !== measureDurationSec) {
                measureDurationSec = this.currentMeasureDurationSec;
            }

            let progress = 0;
            const isOrigMode = (this.audioMode === 'orig' && this.ytPlayer && this.ytPlayerReady && this.currentVideoId && !this.isLessonMode);

            if (isOrigMode) {
                // MASTER CLOCK DRIVEN BY YOUTUBE AUDIO WITH 60FPS SUB-FRAME INTERPOLATION:
                let rawSec = 0;
                try {
                    rawSec = this.ytPlayer.getCurrentTime();
                } catch (e) {
                    rawSec = 0;
                }

                const now = performance.now();

                // Seek Guard with Continuous Virtual Clock:
                // Prevents buffering freezes and ensures seamless, uninterrupted rhythmic flow during loops!
                if (this.isSeekingMedia) {
                    const elapsedSeek = (now - (this.seekStartTime || now)) / 1000;
                    const virtualSec = this.seekTargetSec + (elapsedSeek * (this.playbackSpeed || 1.0));
                    const diff = Math.abs(rawSec - virtualSec);

                    // If YouTube has caught up with the virtual timeline or max timeout reached:
                    if ((diff < 0.35 && elapsedSeek > 0.12) || elapsedSeek > 1.5) {
                        this.isSeekingMedia = false;
                        this.lastYtReportedSec = rawSec;
                        this.lastYtReportedPerf = now;
                    } else {
                        // Keep time flowing seamlessly forward so playhead, metronome, and notes never halt:
                        rawSec = virtualSec;
                        this.lastYtReportedSec = virtualSec;
                        this.lastYtReportedPerf = now;
                    }
                } else if (rawSec !== this.lastYtReportedSec) {
                    this.lastYtReportedSec = rawSec;
                    this.lastYtReportedPerf = now;
                }

                // Smooth progression between YouTube API 150-250ms ticks:
                const elapsedSinceYtTick = Math.max(0, (now - this.lastYtReportedPerf) / 1000);
                const safeOffset = Math.min(0.35, elapsedSinceYtTick * (this.playbackSpeed || 1.0));
                const currentAudioSec = this.lastYtReportedSec + safeOffset;
                const adjustedAudioSec = currentAudioSec - (this.audioOffsetMs / 1000);

                const measureStartSec = (typeof m.start_time_sec === 'number') ? m.start_time_sec : 0;
                const durationSec = (typeof m.duration_sec === 'number' && m.duration_sec > 0) ? m.duration_sec : measureDurationSec;

                const elapsedMeasureSec = adjustedAudioSec - measureStartSec;
                progress = elapsedMeasureSec / durationSec;

                if (this.selectedMeasures && this.selectedMeasures.size > 0) {
                    if (elapsedMeasureSec >= durationSec) {
                        const overshootSec = Math.max(0, elapsedMeasureSec - durationSec);
                        const safeOvershootSec = Math.min(overshootSec, 0.25);

                        let nextIdx = this.currentMeasureIndex;
                        const totalMeasures = this.currentSong.measures.length;

                        if (this.autoAdvance) {
                            // MODO CONTINUO / VENTANA DESLIZANTE (Rolling Window):
                            // Fluye sin detenerse de forma ininterrumpida compás tras compás
                            // liberando espacio del compás pasado e integrando el siguiente
                            nextIdx = this.currentMeasureIndex + 1;
                            if (nextIdx >= totalMeasures) {
                                nextIdx = 0;
                            }
                            this.advanceRollingSelectionWindow(nextIdx);
                        } else {
                            // MODO BUCLE FIJO (Repite estrictamente los compases seleccionados)
                            const sorted = Array.from(this.selectedMeasures).sort((a, b) => a - b);
                            const currPos = sorted.indexOf(this.currentMeasureIndex);
                            const nextPos = (currPos !== -1) ? ((currPos + 1) % sorted.length) : 0;
                            nextIdx = sorted[nextPos];
                        }

                        const nextM = this.currentSong.measures[nextIdx];
                        const targetSec = Math.max(0, ((typeof nextM.start_time_sec === 'number') ? nextM.start_time_sec : 0) + (this.audioOffsetMs / 1000));
                        
                        // Solo seeking si salta hacia atrás o no es estrictamente contiguo:
                        if (nextIdx !== this.currentMeasureIndex + 1) {
                            this.isSeekingMedia = true;
                            this.seekStartTime = now - (safeOvershootSec * 1000);
                            this.seekTargetSec = targetSec;
                            try { 
                                this.ytPlayer.seekTo(targetSec + safeOvershootSec, true);
                                this.ytPlayer.playVideo();
                                this.lastYtReportedSec = targetSec + safeOvershootSec;
                                this.lastYtReportedPerf = now;
                            } catch (e) {}
                        }

                        if (nextIdx !== this.currentMeasureIndex) {
                            this.setMeasure(nextIdx);
                        }
                        m = this.currentSong.measures[this.currentMeasureIndex];

                        playedNotes.clear();
                        if (this.consumedNoteKeys) this.consumedNoteKeys.clear();
                        lastBeatTriggered = -1;
                        lastFrameTick = -1;

                        // Recalcular inmediatamente duración y progreso para el nuevo compás en este mismo frame:
                        const newDurationSec = (typeof m.duration_sec === 'number' && m.duration_sec > 0) ? m.duration_sec : measureDurationSec;
                        measureDurationSec = newDurationSec;
                        progress = safeOvershootSec / newDurationSec;
                    } else if (!this.isSeekingMedia) {
                        const activeMeasureIdx = this.findMeasureByAudioTime(adjustedAudioSec);
                        if (activeMeasureIdx !== -1 && activeMeasureIdx !== this.currentMeasureIndex) {
                            if (this.autoAdvance) {
                                // Flujo continuo: avanza la ventana deslizante conforme la canción progresa naturalmente
                                this.advanceRollingSelectionWindow(activeMeasureIdx);
                                this.setMeasure(activeMeasureIdx);
                                m = this.currentSong.measures[this.currentMeasureIndex];
                                playedNotes.clear();
                                if (this.consumedNoteKeys) this.consumedNoteKeys.clear();
                                lastBeatTriggered = -1;
                                lastFrameTick = -1;
                            } else if (this.selectedMeasures.has(activeMeasureIdx)) {
                                this.setMeasure(activeMeasureIdx);
                                m = this.currentSong.measures[this.currentMeasureIndex];
                                playedNotes.clear();
                                if (this.consumedNoteKeys) this.consumedNoteKeys.clear();
                                lastBeatTriggered = -1;
                                lastFrameTick = -1;
                            } else {
                                // En bucle cerrado, si el audio se sale del rango seleccionado, re-sincronizar al inicio del bucle
                                const sorted = Array.from(this.selectedMeasures).sort((a, b) => a - b);
                                const loopStartIdx = sorted[0];
                                const targetM = this.currentSong.measures[loopStartIdx];
                                const targetSec = Math.max(0, ((typeof targetM.start_time_sec === 'number') ? targetM.start_time_sec : 0) + (this.audioOffsetMs / 1000));
                                this.isSeekingMedia = true;
                                this.seekStartTime = performance.now();
                                this.seekTargetSec = targetSec;
                                try {
                                    this.ytPlayer.seekTo(targetSec, true);
                                    this.ytPlayer.playVideo();
                                    this.lastYtReportedSec = targetSec;
                                    this.lastYtReportedPerf = performance.now();
                                } catch (e) {}
                                this.setMeasure(loopStartIdx);
                                m = this.currentSong.measures[this.currentMeasureIndex];
                                playedNotes.clear();
                                if (this.consumedNoteKeys) this.consumedNoteKeys.clear();
                                lastBeatTriggered = -1;
                                lastFrameTick = -1;
                            }
                        }
                    }
                } else {
                    // TODA LA CANCIÓN FLUJE EN YOUTUBE (SIN COMPASES MANUALES SELECCIONADOS):
                    const activeMeasureIdx = this.findMeasureByAudioTime(adjustedAudioSec);
                    if (activeMeasureIdx !== -1 && activeMeasureIdx !== this.currentMeasureIndex) {
                        this.setMeasure(activeMeasureIdx);
                        m = this.currentSong.measures[this.currentMeasureIndex];
                        playedNotes.clear();
                        if (this.consumedNoteKeys) this.consumedNoteKeys.clear();
                        lastBeatTriggered = -1;
                        lastFrameTick = -1;
                    }

                    // Si llega al final de toda la canción, reiniciar desde el compás 1
                    const lastM = this.currentSong.measures[this.currentSong.measures.length - 1];
                    const songEndSec = (lastM.start_time_sec || 0) + (lastM.duration_sec || 3.0);
                    if (adjustedAudioSec >= songEndSec) {
                        try {
                            const firstM = this.currentSong.measures[0];
                            const startSec = Math.max(0, (firstM.start_time_sec || 0) + (this.audioOffsetMs / 1000));
                            this.isSeekingMedia = true;
                            this.seekStartTime = performance.now();
                            this.seekTargetSec = startSec;
                            this.ytPlayer.seekTo(startSec, true);
                            this.ytPlayer.playVideo();
                            this.lastYtReportedSec = startSec;
                            this.lastYtReportedPerf = performance.now();
                        } catch (e) {}
                        this.setMeasure(0);
                    }
                }
            } else {
                // MASTER CLOCK DRIVEN BY HIGH-PRECISION PERFORMANCE TIMER (MODO SINTETIZADOR / SIN CANCIÓN):
                const now = performance.now();
                let elapsedSec = (now - this.playbackStartTime) / 1000;

                // Seamless measure wrap & advance with ZERO dropped time:
                if (elapsedSec >= measureDurationSec) {
                    const overshootSec = elapsedSec - measureDurationSec;

                    let nextIdx = this.currentMeasureIndex;
                    const totalMeasures = this.currentSong?.measures?.length || 1;

                    if (this.isLessonMode) {
                        nextIdx = this.currentMeasureIndex;
                    } else if (this.selectedMeasures && this.selectedMeasures.size > 0) {
                        if (this.autoAdvance) {
                            // MODO CONTINUO / VENTANA DESLIZANTE (Rolling Window):
                            nextIdx = this.currentMeasureIndex + 1;
                            if (nextIdx >= totalMeasures) {
                                nextIdx = 0;
                            }
                            this.advanceRollingSelectionWindow(nextIdx);
                        } else {
                            // MODO BUCLE FIJO (Repite estrictamente los compases seleccionados):
                            const sorted = Array.from(this.selectedMeasures).sort((a, b) => a - b);
                            const currPos = sorted.indexOf(this.currentMeasureIndex);
                            if (currPos !== -1) {
                                const nextPos = (currPos + 1) % sorted.length;
                                nextIdx = sorted[nextPos];
                            } else {
                                nextIdx = sorted[0];
                            }
                        }
                    } else {
                        // Toda la canción fluye secuencialmente compás por compás
                        nextIdx = this.currentMeasureIndex + 1;
                        if (nextIdx >= totalMeasures) {
                            nextIdx = 0; // Reinicia al compás 1 al completar la canción
                        }
                    }

                    // Only invoke setMeasure if actually switching to a different measure!
                    if (nextIdx !== this.currentMeasureIndex) {
                        this.setMeasure(nextIdx);
                    }
                    m = (this.currentSong && this.currentSong.measures) 
                        ? this.currentSong.measures[this.currentMeasureIndex] 
                        : window.gridSequencer.currentMeasure;

                    playedNotes.clear();
                    if (this.consumedNoteKeys) this.consumedNoteKeys.clear();
                    lastBeatTriggered = -1;
                    lastFrameTick = -1;

                    // Recalculate duration for the new measure respecting user's locked BPM
                    const beats = (m.signature && m.signature[0]) ? m.signature[0] : (window.donnerMetronome.beatsPerMeasure || 4);
                    const mBpm = this.isBpmLocked 
                        ? (this.userCustomBpm || window.donnerMetronome.bpm) 
                        : (m.bpm || window.donnerMetronome.bpm || 83);
                    measureDurationSec = ((60.0 / mBpm) * beats) / (this.playbackSpeed || 1.0);
                    this.currentMeasureDurationSec = measureDurationSec;

                    // Clamp safe overshoot to prevent runaway lag after window defocus
                    const safeOvershootSec = Math.min(overshootSec, measureDurationSec * 0.4);

                    // Re-anchor playbackStartTime carrying forward the exact overshoot
                    this.playbackStartTime = now - (safeOvershootSec * 1000);
                    elapsedSec = safeOvershootSec;
                }

                progress = elapsedSec / measureDurationSec;
            }

            // Update playhead on notation and matrix
            const clampedProgress = Math.max(0, Math.min(1.0, progress));
            window.notationRenderer.setPlayhead(clampedProgress, this.currentMeasureIndex);
            window.gridSequencer.setPlayhead(clampedProgress, this.currentMeasureIndex);

            // Metronome Beat & Click Lockstep (In BOTH Modes with Full Subdivision Support!):
            if (progress >= 0 && progress <= 1.0) {
                const beats = (m.signature && m.signature[0]) ? m.signature[0] : (window.donnerMetronome.beatsPerMeasure || 4);
                const clicksPerBeat = window.donnerMetronome.clicksPerBeat || 1;
                const totalClicks = beats * clicksPerBeat;
                const currentSubTick = Math.floor(clampedProgress * totalClicks);

                if (currentSubTick !== lastBeatTriggered && currentSubTick >= 0 && currentSubTick < totalClicks) {
                    lastBeatTriggered = currentSubTick;
                    const currentBeatIndex = Math.floor(currentSubTick / clicksPerBeat);
                    const subIndex = currentSubTick % clicksPerBeat;

                    window.donnerMetronome.updateBeatUI(currentBeatIndex, subIndex);

                    if (window.donnerMetronome.clickAudioEnabled && window.drumAudio && window.drumAudio.ctx) {
                        let clickType = 'sub';
                        if (currentBeatIndex === 0 && subIndex === 0) {
                            clickType = 'accent'; // Beat 1 Downbeat
                        } else if (subIndex === 0) {
                            clickType = 'beat';   // Beat Pulse 2, 3, 4
                        } else {
                            clickType = 'sub';    // Subdivision click
                        }
                        window.drumAudio.playClick(clickType, window.drumAudio.ctx.currentTime);
                    }
                }
            }

            const totalMeasureTicks = m.measure_ticks || 1920;
            const currentTick = clampedProgress * totalMeasureTicks;

            // Loop Wrap Reset: whenever the playhead wraps back to the start of the bar, clear playedNotes immediately
            if (lastFrameTick >= 0 && currentTick < lastFrameTick - 100) {
                playedNotes.clear();
                lastBeatTriggered = -1;
            }

            // Auto-Drummer / Modo Demo:
            // - MODO DEMO: OFF -> Las notas NO suenan solas. El baterista es quien debe golpear los pads de su batería física o pantalla para hacer ruido.
            // - MODO DEMO: ON  -> La computadora toca la pista de batería automáticamente para escuchar y ver cómo suena el patrón.
            const shouldTriggerVirtualDrums = Boolean(this.autoPlayDrums);
            const activeMeasureForDrums = (this.currentSong && this.currentSong.measures && this.currentSong.measures[this.currentMeasureIndex]) 
                ? this.currentSong.measures[this.currentMeasureIndex] 
                : (window.gridSequencer?.currentMeasure || m);

            if (shouldTriggerVirtualDrums && activeMeasureForDrums && activeMeasureForDrums.notes && progress >= 0) {
                activeMeasureForDrums.notes.forEach((n, idx) => {
                    const inRange = (lastFrameTick < 0)
                        ? (n.tick <= currentTick + 45)
                        : (n.tick >= lastFrameTick - 15 && n.tick <= currentTick + 45);

                    if (inRange && !playedNotes.has(idx)) {
                        playedNotes.add(idx);
                        if (window.drumAudio) {
                            window.drumAudio.resume();
                            window.drumAudio.trigger(n.row, n.accent ? 118 : 96, null, n.sub_type);
                        }
                        this.animateVisualPad(n.row);
                    }
                });
            }
            lastFrameTick = currentTick;

            this.animationFrameId = requestAnimationFrame(loop);
        };

        this.animationFrameId = requestAnimationFrame(loop);
    }

    stopPlayback() {
        clearTimeout(this.awaitAudioTimeout);
        this.isAwaitingAudio = false;
        this.isPlaying = false;
        this.isBufferingPaused = false;
        this.isSeekingMedia = false;

        if (this.consumedNoteKeys) this.consumedNoteKeys.clear();
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        // Pause YouTube Video
        if (this.ytPlayer && this.ytPlayerReady) {
            try { this.ytPlayer.pauseVideo(); } catch (e) {}
        }

        window.donnerMetronome.stop();
        window.donnerMetronome.updateBeatUI(-1, -1);
        window.notationRenderer.setPlayhead(0, this.currentMeasureIndex);
        window.gridSequencer.setPlayhead(0, this.currentMeasureIndex);

        const playBtn = document.getElementById('master-play-btn');
        if (playBtn) {
            playBtn.classList.remove('playing', 'syncing');
        }
        document.getElementById('play-icon').textContent = '▶';
        document.getElementById('play-text').textContent = 'INICIAR PRÁCTICA';

        const mobilePlayBtn = document.getElementById('mobile-play-btn');
        if (mobilePlayBtn) {
            mobilePlayBtn.classList.remove('playing', 'syncing');
        }
        const mobilePlayIcon = document.getElementById('mobile-play-icon');
        const mobilePlayText = document.getElementById('mobile-play-text');
        if (mobilePlayIcon) mobilePlayIcon.textContent = '▶';
        if (mobilePlayText) mobilePlayText.textContent = 'PRACTICAR';
    }

    // --- YOUTUBE & AUDIO ENGINE METHODS ---
    initYouTubePlayer() {
        if (this.ytPlayer || !window.YT || !window.YT.Player) return;
        try {
            this.ytPlayer = new YT.Player('youtube-iframe-holder', {
                height: '100%',
                width: '100%',
                videoId: this.currentVideoId || 'fV4DiAyExN0',
                playerVars: {
                    autoplay: 0,
                    controls: 1,
                    rel: 0,
                    modestbranding: 1,
                    playsinline: 1,
                    origin: window.location.origin
                },
                events: {
                    onReady: () => {
                        this.ytPlayerReady = true;
                        console.log('[YouTube Player] Listo y preparado para sincronización.');
                        if (this.playbackSpeed !== 1.0) {
                            try { this.ytPlayer.setPlaybackRate(this.playbackSpeed); } catch (e) {}
                        }
                    },
                    onStateChange: (event) => {
                        console.log('[YouTube Player State]', event.data);
                        if (event.data === YT.PlayerState.PLAYING) {
                            if (this.isAwaitingAudio) {
                                const currentM = (this.currentSong && this.currentSong.measures) ? this.currentSong.measures[this.currentMeasureIndex] : window.gridSequencer?.currentMeasure;
                                this.beginActivePlayback(currentM);
                            } else if (this.isBufferingPaused) {
                                this.isBufferingPaused = false;
                                const playBtn = document.getElementById('master-play-btn');
                                if (playBtn) playBtn.classList.remove('syncing');
                            } else if (!this.isPlaying && this.audioMode === 'orig') {
                                this.startPlayback();
                            }
                        } else if (event.data === YT.PlayerState.BUFFERING) {
                            // Never hard-pause or freeze master clock if buffering is due to an active loop seek!
                            if (this.isPlaying && !this.isSeekingMedia) {
                                this.isBufferingPaused = true;
                                const playBtn = document.getElementById('master-play-btn');
                                if (playBtn) playBtn.classList.add('syncing');
                            }
                        } else if ((event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) && this.isPlaying) {
                            if (!this.isAwaitingAudio && !this.isBufferingPaused && !this.isSeekingMedia) {
                                this.stopPlayback();
                            }
                        }
                    }
                }
            });
        } catch (err) {
            console.warn('[YouTube API] Error inicializando:', err);
        }
    }

    findMeasureByAudioTime(sec) {
        if (!this.currentSong || !this.currentSong.measures || this.currentSong.measures.length === 0) {
            return -1;
        }
        const measures = this.currentSong.measures;
        if (sec <= (measures[0].start_time_sec || 0)) {
            return 0;
        }
        const lastM = measures[measures.length - 1];
        if (sec >= (lastM.start_time_sec + (lastM.duration_sec || 2.89))) {
            return measures.length - 1;
        }

        // Fast search: check adjacent to currentMeasureIndex first
        const curr = this.currentMeasureIndex;
        if (curr >= 0 && curr < measures.length) {
            const m = measures[curr];
            const start = m.start_time_sec || 0;
            const dur = m.duration_sec || 2.89;
            if (sec >= start && sec < start + dur) {
                return curr;
            }
            if (curr + 1 < measures.length) {
                const nextM = measures[curr + 1];
                const nStart = nextM.start_time_sec || 0;
                const nDur = nextM.duration_sec || 2.89;
                if (sec >= nStart && sec < nStart + nDur) {
                    return curr + 1;
                }
            }
        }

        // Binary search across all measures
        let low = 0;
        let high = measures.length - 1;
        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            const m = measures[mid];
            const start = m.start_time_sec || 0;
            const dur = m.duration_sec || 2.89;
            if (sec >= start && sec < start + dur) {
                return mid;
            } else if (sec < start) {
                high = mid - 1;
            } else {
                low = mid + 1;
            }
        }
        return Math.max(0, Math.min(measures.length - 1, low));
    }

    captureCurrentTimeAsBeat1() {
        if (!this.ytPlayer || !this.ytPlayerReady) {
            alert('El reproductor de YouTube no está listo para capturar el tiempo.');
            return;
        }
        let currentVideoSec = 0;
        try {
            currentVideoSec = this.ytPlayer.getCurrentTime();
        } catch (e) {
            console.warn(e);
            return;
        }

        const m = (this.currentSong && this.currentSong.measures) ? this.currentSong.measures[this.currentMeasureIndex] : null;
        const measureStartSec = m ? (m.start_time_sec || 0) : 0;
        const calculatedOffsetMs = Math.round((currentVideoSec - measureStartSec) * 1000);
        this.setAudioOffset(calculatedOffsetMs);
        console.log(`[Sync Calibración] Beat 1 fijado en ${currentVideoSec.toFixed(3)}s (Nuevo Offset: ${calculatedOffsetMs} ms)`);
    }

    setAudioOffset(ms) {
        this.audioOffsetMs = ms;
        const display = document.getElementById('sync-offset-display');
        if (display) {
            const sign = this.audioOffsetMs > 0 ? '+' : '';
            if (Math.abs(this.audioOffsetMs) >= 1000) {
                const s = (this.audioOffsetMs / 1000).toFixed(1);
                display.textContent = `${sign}${s}s`;
            } else {
                display.textContent = `${sign}${this.audioOffsetMs} ms`;
            }
            display.classList.toggle('modified', this.audioOffsetMs !== 0);
        }
        // Live nudge if playing in YouTube orig mode
        if (this.isPlaying && this.audioMode === 'orig' && this.ytPlayer && this.ytPlayerReady && !this.isLessonMode) {
            const m = (this.currentSong && this.currentSong.measures) ? this.currentSong.measures[this.currentMeasureIndex] : null;
            if (m) {
                const progress = window.gridSequencer ? window.gridSequencer.playheadPos : 0;
                const duration = m.duration_sec || ((60.0 / (m.bpm || 83)) * 4);
                const newTarget = Math.max(0, (m.start_time_sec || 0) + (progress * duration) + (this.audioOffsetMs / 1000));
                try { this.ytPlayer.seekTo(newTarget, true); } catch (e) {}
            }
        }
    }

    adjustAudioOffset(deltaMs) {
        this.setAudioOffset(this.audioOffsetMs + deltaMs);
    }

    loadSongVideos(videos) {
        this.songVideos = videos || [];
        const sourceSelect = document.getElementById('audio-source-select');
        if (!sourceSelect) return;

        sourceSelect.innerHTML = '';

        if (!this.songVideos || this.songVideos.length === 0) {
            const opt = document.createElement('option');
            opt.value = 'synth';
            opt.textContent = '⚡ Sintetizador Virtual (Web Drums)';
            sourceSelect.appendChild(opt);
            this.setAudioMode('synth');
            return;
        }

        const fullVideo = this.songVideos.find(v => v.feature === null || !v.feature);
        const backingVideo = this.songVideos.find(v => v.feature === 'backing');
        const soloVideo = this.songVideos.find(v => v.feature === 'solo');

        if (fullVideo) {
            const opt = document.createElement('option');
            opt.value = 'full';
            opt.dataset.videoId = fullVideo.videoId;
            opt.textContent = '🎧 Mezcla completa (Audio Original)';
            sourceSelect.appendChild(opt);
        }

        if (backingVideo) {
            const opt = document.createElement('option');
            opt.value = 'backing';
            opt.dataset.videoId = backingVideo.videoId;
            opt.textContent = '🥁 Pista de acompañamiento (Sin Batería)';
            sourceSelect.appendChild(opt);
        }

        if (soloVideo) {
            const opt = document.createElement('option');
            opt.value = 'solo';
            opt.dataset.videoId = soloVideo.videoId;
            opt.textContent = '🎸 Pista Solo (Instrumento)';
            sourceSelect.appendChild(opt);
        }

        const synthOpt = document.createElement('option');
        synthOpt.value = 'synth';
        synthOpt.textContent = '⚡ Sintetizador Virtual (Web Drums)';
        sourceSelect.appendChild(synthOpt);

        // Drummers prefer backing track without drums if available, else full mix
        const defaultChoice = backingVideo ? 'backing' : (fullVideo ? 'full' : 'synth');
        sourceSelect.value = defaultChoice;
        this.setAudioSource(defaultChoice);
    }

    setAudioSource(sourceKey) {
        this.audioSource = sourceKey;
        if (sourceKey === 'synth') {
            this.setAudioMode('synth');
            return;
        }

        this.setAudioMode('orig');
        const opt = document.querySelector(`#audio-source-select option[value="${sourceKey}"]`);
        const vidId = opt ? opt.dataset.videoId : null;
        if (vidId) {
            this.currentVideoId = vidId;
            if (this.ytPlayer && this.ytPlayerReady) {
                try { this.ytPlayer.cueVideoById(vidId); } catch (e) {}
            }
        }
    }

    setAudioMode(mode) {
        this.audioMode = mode;
        const origBtn = document.getElementById('mode-orig-btn');
        const synthBtn = document.getElementById('mode-synth-btn');
        const controller = document.querySelector('.songsterr-audio-controller');

        if (origBtn && synthBtn) {
            origBtn.classList.toggle('active', mode === 'orig');
            synthBtn.classList.toggle('active', mode === 'synth');
        }

        if (controller) {
            controller.classList.toggle('no-song-mode', mode === 'synth');
        }

        if (mode === 'synth') {
            // Cancel awaiting YouTube stream if user toggles while loading
            if (this.isAwaitingAudio) {
                clearTimeout(this.awaitAudioTimeout);
                this.isAwaitingAudio = false;
                this.beginActivePlayback();
            }
            // Pause YouTube video and collapse video screen
            if (this.ytPlayer && this.ytPlayerReady) {
                try { this.ytPlayer.pauseVideo(); } catch (e) {}
            }
            const ytContainer = document.getElementById('youtube-player-container');
            if (ytContainer) ytContainer.classList.add('collapsed');
            const ytVideoBtnText = document.getElementById('yt-video-btn-text');
            if (ytVideoBtnText) ytVideoBtnText.textContent = 'Ver Video';
        }
    }

    setPlaybackSpeed(speed) {
        this.playbackSpeed = speed;

        // Update active speed button pill
        document.querySelectorAll('.speed-opt-btn').forEach(btn => {
            btn.classList.toggle('active', Number(btn.dataset.speed) === speed);
        });

        // Update YouTube playback speed
        if (this.ytPlayer && this.ytPlayerReady) {
            try { this.ytPlayer.setPlaybackRate(speed); } catch (e) {}
        }

        // Adjust Metronome BPM according to speed percentage
        const baseBpm = (this.currentSong && this.currentSong.default_bpm) ? this.currentSong.default_bpm : 83;
        const targetBpm = Math.max(30, Math.min(300, Math.round(baseBpm * speed)));
        if (!this.isBpmLocked) {
            window.donnerMetronome.setBpm(targetBpm);
        }
    }

    setUserBpm(bpm) {
        this.userCustomBpm = Math.max(30, Math.min(300, Math.round(bpm)));
        this.isBpmLocked = true;
        window.donnerMetronome.setBpm(this.userCustomBpm);
        this.updateBpmLockUI();

        // Si está en modo YouTube original, pasar a sintetizador para practicar con samples exactos al BPM deseado
        if (this.audioMode === 'orig') {
            this.setAudioMode('synth');
        }

        // Si está reproduciendo, adaptar duración de compás inmediatamente
        if (this.isPlaying) {
            const m = (this.currentSong && this.currentSong.measures) 
                ? this.currentSong.measures[this.currentMeasureIndex] 
                : window.gridSequencer.currentMeasure;
            if (m) {
                const beats = (m.signature && m.signature[0]) ? m.signature[0] : (window.donnerMetronome.beatsPerMeasure || 4);
                this.currentMeasureDurationSec = ((60.0 / this.userCustomBpm) * beats) / (this.playbackSpeed || 1.0);
            }
        }
    }

    resetToOriginalBpm() {
        this.userCustomBpm = null;
        this.isBpmLocked = false;
        this.updateBpmLockUI();

        const m = (this.currentSong && this.currentSong.measures) 
            ? this.currentSong.measures[this.currentMeasureIndex] 
            : null;
        const baseBpm = (m && m.bpm) ? m.bpm : (this.currentSong?.default_bpm || 83);
        const targetBpm = Math.max(30, Math.min(300, Math.round(baseBpm * (this.playbackSpeed || 1.0))));
        window.donnerMetronome.setBpm(targetBpm);

        if (this.isPlaying) {
            const beats = (m && m.signature && m.signature[0]) ? m.signature[0] : (window.donnerMetronome.beatsPerMeasure || 4);
            this.currentMeasureDurationSec = ((60.0 / targetBpm) * beats) / (this.playbackSpeed || 1.0);
        }
    }

    updateBpmLockUI() {
        const badge = document.getElementById('bpm-lock-indicator');
        if (badge) {
            badge.style.display = this.isBpmLocked ? 'inline-flex' : 'none';
        }
        const resetBtn = document.getElementById('reset-bpm-btn');
        if (resetBtn) {
            resetBtn.classList.toggle('active-override', this.isBpmLocked);
        }
    }

    toggleAutoDemo() {
        this.autoPlayDrums = !this.autoPlayDrums;
        const btn = document.getElementById('auto-demo-btn');
        const text = document.getElementById('demo-btn-text');
        if (btn) btn.classList.toggle('active', this.autoPlayDrums);
        if (text) text.textContent = this.autoPlayDrums ? 'MODO DEMO: ON' : 'MODO DEMO: OFF';

        if (this.autoPlayDrums) {
            window.drumAudio.resume();
        }
    }

    // --- ACADEMY & LESSONS LIBRARY METHODS ---
    async loadLessonsLibrary() {
        try {
            const resp = await fetch('/api/lessons');
            const data = await resp.json();
            this.lessonsLibrary = data.all || [];
            this.renderAcademyLessons(this.lessonsLibrary);
        } catch (err) {
            console.warn('[Academy] Error cargando biblioteca de lecciones:', err);
        }
    }

    renderAcademyLessons(lessons) {
        const container = document.getElementById('academy-lessons-container');
        if (!container) return;

        container.innerHTML = '';
        if (!lessons || lessons.length === 0) {
            container.innerHTML = '<div class="no-results">No se encontraron lecciones en esta categoría.</div>';
            return;
        }

        lessons.forEach(les => {
            const card = document.createElement('div');
            card.className = 'lesson-card';

            const diffClass = (les.difficulty || '').toLowerCase();

            card.innerHTML = `
                <div class="lesson-header">
                    <div class="lesson-title">${les.title}</div>
                    <span class="lesson-diff-badge ${diffClass}">${les.difficulty || 'Básico'}</span>
                </div>
                <div class="lesson-desc">${les.description || ''}</div>
                ${les.sticking ? `<div class="lesson-sticking-box"><strong>Sticking:</strong> ${les.sticking}</div>` : ''}
                <div class="lesson-footer">
                    <span class="lesson-bpm-tag">⚡ ${les.bpm} BPM</span>
                    <button class="btn-start-lesson">▶ PRACTICAR AHORA</button>
                </div>
            `;

            const startBtn = card.querySelector('.btn-start-lesson');
            startBtn.onclick = () => {
                const modal = document.getElementById('academy-modal');
                if (modal) modal.classList.remove('open');
                this.loadSong(les.id, true);
            };

            container.appendChild(card);
        });
    }

    filterAcademyLessons(category) {
        if (!category || category === 'all') {
            this.renderAcademyLessons(this.lessonsLibrary);
        } else {
            const filtered = this.lessonsLibrary.filter(l => l.category === category);
            this.renderAcademyLessons(filtered);
        }
    }

    handleDrummerHit(hit) {
        // 1. Live visual feedback for hit
        this.animateVisualPad(hit.row);
        this.updateVelocityGauge(hit.velocity);

        // 2. Score & timing evaluation against current playhead
        const isRowMatch = (noteRow, hitRow) => {
            if (!noteRow || !hitRow) return false;
            if (noteRow === hitRow) return true;
            if (/^CRASH/i.test(noteRow) && /^CRASH/i.test(hitRow)) return true;
            if (/^HI_HAT/i.test(noteRow) && /^HI_HAT/i.test(hitRow)) return true;
            if (/^SNARE/i.test(noteRow) && /^SNARE/i.test(hitRow)) return true;
            if (/^KICK/i.test(noteRow) && /^KICK/i.test(hitRow)) return true;
            return false;
        };

        const currentActiveM = (this.currentSong && this.currentSong.measures && this.currentSong.measures[this.currentMeasureIndex]) 
            ? this.currentSong.measures[this.currentMeasureIndex] 
            : (window.gridSequencer?.currentMeasure || null);

        if (this.isPlaying && currentActiveM) {
            const m = currentActiveM;
            const totalTicks = m.measure_ticks || 1920;
            const beats = (m.signature && m.signature[0]) ? m.signature[0] : (window.donnerMetronome?.beatsPerMeasure || 4);
            const currentBpm = this.isBpmLocked 
                ? (this.userCustomBpm || window.donnerMetronome?.bpm || 83) 
                : (m.bpm || window.donnerMetronome?.bpm || 83);
            const measureDurationMs = this.currentMeasureDurationSec 
                ? (this.currentMeasureDurationSec * 1000) 
                : ((60000.0 / currentBpm) * beats);

            const progress = (typeof this.currentProgress === 'number' && this.currentProgress >= 0) 
                ? this.currentProgress 
                : (window.gridSequencer?.playheadPos || 0);
            const currentHitMs = progress * measureDurationMs;

            // Collect candidate notes: current measure + adjacent measures if near barline
            const candidateNotes = [];
            const addMeasureCandidates = (measObj, measIdx, timeOffsetMs) => {
                if (!measObj || !measObj.notes) return;
                const mTicks = measObj.measure_ticks || 1920;
                measObj.notes.forEach((n, idx) => {
                    if (isRowMatch(n.row, hit.row)) {
                        const noteKey = `${measIdx}_${n.row}_${n.tick}_${idx}`;
                        const noteMs = ((n.tick / mTicks) * measureDurationMs) + timeOffsetMs;
                        candidateNotes.push({ note: n, noteKey, noteMs, measIdx });
                    }
                });
            };

            addMeasureCandidates(m, this.currentMeasureIndex, 0);

            // If hit occurs early at measure boundary (progress < 0.20), allow matching last beat of prev measure
            if (progress < 0.20 && this.currentSong && this.currentSong.measures) {
                const prevIdx = (this.currentMeasureIndex > 0) ? (this.currentMeasureIndex - 1) : (this.currentSong.measures.length - 1);
                addMeasureCandidates(this.currentSong.measures[prevIdx], prevIdx, -measureDurationMs);
            }
            // If hit occurs near end of measure (progress > 0.80), allow matching downbeat of next measure
            if (progress > 0.80 && this.currentSong && this.currentSong.measures) {
                const nextIdx = (this.currentMeasureIndex + 1 < this.currentSong.measures.length) ? (this.currentMeasureIndex + 1) : 0;
                addMeasureCandidates(this.currentSong.measures[nextIdx], nextIdx, measureDurationMs);
            }

            if (candidateNotes.length === 0) {
                this.missCount++;
                this.updateTimingPocketMeter(null, 'off', 'OFF-BEAT (SIN NOTA)');
                this.showAccuracyBadge('OFF-BEAT', 'off');
                window.gridSequencer.flashRowHit(hit.row, 'miss');
                this.updateAccuracyUI();
                return;
            }

            let bestCandidate = null;
            let minAbsDeltaMs = Infinity;

            candidateNotes.forEach((cand) => {
                const isConsumed = this.consumedNoteKeys.has(cand.noteKey);
                let deltaMs = Math.round(currentHitMs - cand.noteMs);

                // Tolerance window: up to 135ms
                const absDelta = Math.abs(deltaMs);
                if (!isConsumed && absDelta <= 135) {
                    if (absDelta < minAbsDeltaMs) {
                        minAbsDeltaMs = absDelta;
                        bestCandidate = { ...cand, deltaMs };
                    }
                }
            });

            if (bestCandidate) {
                this.consumedNoteKeys.add(bestCandidate.noteKey);
                this.hitsCount++;

                const d = bestCandidate.deltaMs;
                const sign = d > 0 ? '+' : '';

                // Authentic groove pocket: ±50ms is clean musical PERFECT (matches Roland Coach & Melodics)
                if (Math.abs(d) <= 50) {
                    this.perfectCount++;
                    this.score += 100;
                    this.updateTimingPocketMeter(d, 'perfect', `${sign}${d} ms (PERFECTO 100%)`);
                    this.showAccuracyBadge('¡PERFECTO! 100%', 'perfect');
                    window.gridSequencer.flashRowHit(hit.row, 'perfect');
                } else if (d < -50) {
                    this.earlyCount++;
                    this.score += 75;
                    const accuracyPct = Math.max(70, Math.round(100 - (Math.abs(d) - 50) * 0.65));
                    this.updateTimingPocketMeter(d, 'early', `◀ ${d} ms (ADELANTADO ${accuracyPct}%)`);
                    this.showAccuracyBadge(`ADELANTADO (${d}ms)`, 'early');
                    window.gridSequencer.flashRowHit(hit.row, 'early');
                } else {
                    this.lateCount++;
                    this.score += 75;
                    const accuracyPct = Math.max(70, Math.round(100 - (d - 50) * 0.65));
                    this.updateTimingPocketMeter(d, 'late', `+${d} ms (ATRASADO ${accuracyPct}%) ▶`);
                    this.showAccuracyBadge(`ATRASADO (+${d}ms)`, 'late');
                    window.gridSequencer.flashRowHit(hit.row, 'late');
                }
            } else {
                this.missCount++;

                let closestDeltaMs = null;
                let minAnyDelta = Infinity;
                candidateNotes.forEach(cand => {
                    const d = Math.round(currentHitMs - cand.noteMs);
                    if (Math.abs(d) < minAnyDelta) {
                        minAnyDelta = Math.abs(d);
                        closestDeltaMs = d;
                    }
                });

                const sign = (closestDeltaMs != null && closestDeltaMs > 0) ? '+' : '';
                const offLabel = closestDeltaMs != null ? `${sign}${closestDeltaMs} ms (DESFASADO)` : 'OFF-BEAT (DESFASADO)';
                this.updateTimingPocketMeter(closestDeltaMs, 'off', offLabel);
                this.showAccuracyBadge('OFF-BEAT', 'off');
                window.gridSequencer.flashRowHit(hit.row, 'miss');
            }

            this.updateAccuracyUI();
        } else {
            // Hit during pause or free play: flash matrix normally
            window.gridSequencer.flashRowHit(hit.row);
        }
    }

    animateVisualPad(row) {
        const pad = document.querySelector(`.drum-pad[data-row="${row}"]`);
        if (pad) {
            pad.classList.remove('struck');
            void pad.offsetWidth;
            pad.classList.add('struck');
            setTimeout(() => pad.classList.remove('struck'), 160);
        }
    }

    updateVelocityGauge(vel) {
        const fill = document.getElementById('velocity-gauge-fill');
        const status = document.getElementById('velocity-gauge-status');
        if (!fill || !status) return;

        const pct = Math.min(100, Math.round((vel / 127) * 100));
        fill.style.width = `${pct}%`;

        let dynLabel = 'mf (Medio)';
        let colorClass = 'vel-mf';
        if (vel < 35) { dynLabel = 'pp (Muy suave)'; colorClass = 'vel-pp'; }
        else if (vel < 60) { dynLabel = 'p (Suave)'; colorClass = 'vel-p'; }
        else if (vel < 90) { dynLabel = 'mf (Medio)'; colorClass = 'vel-mf'; }
        else if (vel < 115) { dynLabel = 'f (Fuerte)'; colorClass = 'vel-f'; }
        else { dynLabel = 'ff (Muy fuerte)'; colorClass = 'vel-ff'; }

        status.textContent = `Vel: ${vel} (${dynLabel})`;
        fill.className = `sensor-fill vel-fill ${colorClass}`;

        clearTimeout(this.velGaugeTimeout);
        this.velGaugeTimeout = setTimeout(() => {
            fill.style.width = '0%';
        }, 1200);
    }

    updateHiHatPedalGauge(ccVal) {
        const fill = document.getElementById('pedal-gauge-fill');
        const status = document.getElementById('pedal-gauge-status');
        if (!fill || !status) return;

        const pct = Math.min(100, Math.round((ccVal / 127) * 100));
        fill.style.width = `${pct}%`;

        if (pct < 30) {
            status.textContent = `${pct}% (Abierto)`;
            status.style.color = '#eab308';
        } else if (pct < 85) {
            status.textContent = `${pct}% (Semiabierto)`;
            status.style.color = '#38bdf8';
        } else {
            status.textContent = `${pct}% (Cerrado)`;
            status.style.color = '#10b981';
        }
    }

    handleConsoleKitChange(kitNum) {
        const badge = document.getElementById('console-kit-badge');
        if (!badge) return;
        badge.textContent = `Consola: Kit #${kitNum}`;
        badge.classList.remove('hidden');
        badge.classList.add('flash-kit');
        setTimeout(() => badge.classList.remove('flash-kit'), 800);
    }

    handleCymbalChoke(cymbal) {
        const pad = document.querySelector(`.drum-pad[data-row="${cymbal}"]`);
        if (pad) {
            pad.classList.add('choked');
            setTimeout(() => pad.classList.remove('choked'), 250);
        }
    }

    showAccuracyBadge(text, type) {
        const badge = document.getElementById('accuracy-floating-badge');
        if (!badge) return;
        badge.textContent = text;
        badge.className = `accuracy-badge ${type} show`;
        clearTimeout(this.badgeTimeout);
        this.badgeTimeout = setTimeout(() => {
            badge.classList.remove('show');
        }, 400);
    }

    updateTimingPocketMeter(deltaMs, type, labelText) {
        const badge = document.getElementById('timing-offset-badge');
        const needle = document.getElementById('timing-pocket-needle');

        if (badge) {
            badge.textContent = labelText;
            badge.className = `timing-offset-badge ${type}`;
        }

        if (needle) {
            let clampedMs = 0;
            if (deltaMs !== null && deltaMs !== undefined) {
                clampedMs = Math.max(-75, Math.min(75, deltaMs));
            } else {
                clampedMs = (type === 'early') ? -75 : (type === 'late' ? 75 : 0);
            }
            const pct = ((clampedMs + 75) / 150) * 100;
            needle.style.left = `${pct}%`;
            needle.className = `timing-needle ${type}`;
        }
    }

    updateAccuracyUI() {
        const total = this.perfectCount + this.earlyCount + this.lateCount + this.missCount;
        let accuracy = 100;
        if (total > 0) {
            const pointsEarned = (this.perfectCount * 1.0) + (this.earlyCount * 0.8) + (this.lateCount * 0.8);
            accuracy = Math.round((pointsEarned / total) * 100);
        }
        const accEl = document.getElementById('accuracy-pct');
        if (accEl) accEl.textContent = `${accuracy}%`;

        const scoreEl = document.getElementById('score-display');
        if (scoreEl) scoreEl.textContent = this.score;

        const perfectEl = document.getElementById('perfect-count');
        if (perfectEl) perfectEl.textContent = this.perfectCount;

        const earlyEl = document.getElementById('early-count');
        if (earlyEl) earlyEl.textContent = this.earlyCount;

        const lateEl = document.getElementById('late-count');
        if (lateEl) lateEl.textContent = this.lateCount;

        const missEl = document.getElementById('miss-count');
        if (missEl) missEl.textContent = this.missCount;
    }

    resetAccuracyStats() {
        this.score = 0;
        this.hitsCount = 0;
        this.perfectCount = 0;
        this.earlyCount = 0;
        this.lateCount = 0;
        this.goodCount = 0;
        this.missCount = 0;
        if (this.consumedNoteKeys) this.consumedNoteKeys.clear();
        this.updateAccuracyUI();
        this.updateTimingPocketMeter(0, 'perfect', '0 ms (PERFECTO 100%)');
    }

    updateMIDIStatusUI(state) {
        const badge = document.getElementById('midi-status-badge');
        const text = document.getElementById('midi-status-text');
        const indicator = document.getElementById('midi-status-indicator');

        const modalDot = document.getElementById('modal-midi-dot');
        const modalText = document.getElementById('modal-midi-status-text');
        const insecureAlert = document.getElementById('midi-insecure-warning');

        if (insecureAlert) {
            insecureAlert.classList.toggle('hidden', !state.isNetworkInsecure);
        }

        if (state.status === 'connected') {
            badge.classList.add('connected');
            indicator.className = 'status-dot online';
            text.textContent = state.message || 'Donner DED-300X Conectada';

            if (modalDot) modalDot.className = 'status-dot online';
            if (modalText) modalText.textContent = `Conectado: ${state.message}`;
        } else {
            badge.classList.remove('connected');
            indicator.className = 'status-dot offline';
            text.textContent = state.message || 'Sin Conexión MIDI';

            if (modalDot) modalDot.className = 'status-dot offline';
            if (modalText) modalText.textContent = state.message || 'Sin Conexión MIDI';
        }

        this.refreshMIDIDevicesDropdown();
    }

    appendMIDIMonitorLog(hit) {
        const consoleEl = document.getElementById('midi-live-console');
        if (!consoleEl) return;
        const emptyHint = consoleEl.querySelector('.console-empty-hint');
        if (emptyHint) emptyHint.remove();

        const artBadge = hit.artText ? `<span class="log-art">(${hit.artText})</span>` : '';
        const line = document.createElement('div');
        line.className = 'log-line hit-anim';
        line.innerHTML = `
            <span class="log-time">${hit.timeStr}</span>
            <span class="log-pad pad-${hit.row.toLowerCase()}">${hit.row} ${artBadge}</span>
            <span class="log-note">Nota: <strong>${hit.note}</strong></span>
            <span class="log-vel">Vel: ${hit.velocity}</span>
            <span class="log-dev">${hit.inputName}</span>
        `;
        consoleEl.insertBefore(line, consoleEl.firstChild);

        // Keep last 30 hits in log
        while (consoleEl.children.length > 30) {
            consoleEl.removeChild(consoleEl.lastChild);
        }
    }

    refreshMIDIDevicesDropdown() {
        const select = document.getElementById('midi-input-select');
        if (!select) return;
        const inputs = window.donnerMidi.getAvailableInputs();
        select.innerHTML = '<option value="all">Escuchar todas las entradas (Recomendado)</option>';
        inputs.forEach(inp => {
            const opt = document.createElement('option');
            opt.value = inp.id;
            opt.textContent = `${inp.name} (${inp.manufacturer || 'USB MIDI'})`;
            select.appendChild(opt);
        });
        select.value = window.donnerMidi.selectedInputId || 'all';
    }

    async searchSongsterr() {
        const q = document.getElementById('song-search-input').value.trim();
        if (!q) return;

        const resultsContainer = document.getElementById('search-results-list');
        resultsContainer.innerHTML = '<div class="loading-spinner">Buscando en Songsterr...</div>';

        try {
            const resp = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
            const items = await resp.json();

            resultsContainer.innerHTML = '';
            if (items.length === 0) {
                resultsContainer.innerHTML = '<div class="no-results">No se encontraron partituras. Prueba con otro artista o pega el link de Songsterr.</div>';
                return;
            }

            items.forEach(song => {
                const card = document.createElement('div');
                card.className = 'search-result-item';

                const info = document.createElement('div');
                info.className = 'result-info';
                info.innerHTML = `
                    <div class="result-title">${song.title}</div>
                    <div class="result-artist">${song.artist}</div>
                `;

                const btn = document.createElement('button');
                btn.className = 'btn-load-song';
                btn.innerHTML = song.hasDrums ? '🥁 Cargar Batería' : 'Ver Pistas';
                btn.onclick = () => this.loadSong(song.songId);

                card.appendChild(info);
                card.appendChild(btn);
                resultsContainer.appendChild(card);
            });
        } catch (e) {
            resultsContainer.innerHTML = `<div class="error-msg">Error: ${e.message}</div>`;
        }
    }

    async loadPresetsList() {
        try {
            const resp = await fetch('/api/presets');
            const presets = await resp.json();
            const container = document.getElementById('presets-list-container');
            if (!container) return;

            container.innerHTML = '';
            presets.forEach(p => {
                const btn = document.createElement('button');
                btn.className = `preset-chip ${p.is_featured ? 'featured' : ''}`;
                btn.innerHTML = `<span>${p.artist}</span> - <strong>${p.title}</strong> (${p.bpm} BPM)`;
                btn.onclick = () => this.loadSong(p.id);
                container.appendChild(btn);
            });
        } catch (e) {}
    }

    exportMidi() {
        if (!this.currentSong) return;
        window.location.href = `/api/export/midi/${this.currentSong.song_id}`;
    }

    exportGp5() {
        if (!this.currentSong) return;
        window.location.href = `/api/export/gp5/${this.currentSong.song_id}`;
    }

    showLoading(show, msg = '') {
        const overlay = document.getElementById('loading-overlay');
        const text = document.getElementById('loading-msg');
        if (show) {
            text.textContent = msg;
            overlay.classList.add('visible');
        } else {
            overlay.classList.remove('visible');
        }
    }
}

window.onYouTubeIframeAPIReady = () => {
    if (window.app) {
        window.app.initYouTubePlayer();
    }
};

window.addEventListener('DOMContentLoaded', () => {
    window.app = new DrumPracticeStudio();
    window.app.init();
});
