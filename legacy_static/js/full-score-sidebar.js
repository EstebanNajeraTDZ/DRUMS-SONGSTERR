/**
 * Full Score Lateral Sidebar Component
 * Displays the complete song notation / score in a side panel,
 * highlights the active playing measure in real-time as it advances,
 * and allows clicking to select one or multiple individual measures for custom looping practice,
 * or flowing continuously through the full song when no measures are manually selected.
 */

class FullScoreSidebar {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.currentSong = null;
        this.activeMeasureIndex = 0;
        this.selectedMeasures = new Set(); // 0-based measure indices selected for looping
        this.lastClickedMeasureIndex = -1;  // For shift-click range selection
        this.selectedQuantity = 0;          // 0 = Toda la canción, 1, 2, 4, 8, 16, etc.
        this.loopStart = 0;
        this.loopEnd = 0;
        this.isOpen = true;

        this.onSelectMeasureCallback = null;
        this.onSelectSectionCallback = null;
        this.onSelectionChangeCallback = null;
        this.onQuantityChangeCallback = null;
    }

    init() {
        if (!this.container) return;
        this.renderShell();
    }

    renderShell() {
        this.container.innerHTML = `
            <div class="sidebar-header">
                <div class="sidebar-title-group">
                    <span class="sidebar-icon">📖</span>
                    <div>
                        <h4 class="sidebar-title">PARTITURA COMPLETA</h4>
                        <span class="sidebar-subtitle" id="sidebar-song-info">Vista general de la canción</span>
                    </div>
                </div>
                <div class="sidebar-actions">
                    <button id="sidebar-collapse-btn" class="sidebar-toggle-btn" title="Ocultar / Mostrar panel lateral">
                        ✕
                    </button>
                </div>
            </div>

            <!-- Quick Section Chips -->
            <div class="sidebar-sections-wrapper">
                <div class="sidebar-sections-label">SECCIONES DE LA CANCIÓN:</div>
                <div id="sidebar-sections-chips" class="sidebar-sections-chips">
                    <!-- Populated dynamically -->
                </div>
            </div>

            <!-- Loop Range Info & Controls -->
            <div class="sidebar-loop-controls">
                <div class="loop-status-text">
                    <span class="loop-status-label">Bucle de práctica:</span>
                    <div id="sidebar-loop-range-text" class="sidebar-loop-range-text">
                        <strong class="loop-all-tag">Toda la Canción</strong>
                    </div>
                </div>
                <div class="loop-actions-group">
                    <label class="toggle-control sidebar-auto-adv-toggle" title="Avanzar automáticamente compás tras compás (ventana deslizante) o repetir en bucle">
                        <input type="checkbox" id="sidebar-auto-advance-toggle">
                        <span class="toggle-slider"></span>
                        <span class="toggle-text">Auto-Avanzar</span>
                    </label>
                    <button id="sidebar-loop-all-btn" class="btn-loop-all active" title="Practicar toda la canción en flujo continuo">Toda la Canción</button>
                    <button id="sidebar-clear-btn" class="btn-clear-selection" style="display:none;" title="Limpiar selección manual">✕ Quitar</button>
                </div>
            </div>

            <!-- Direct Measure Quantity Selector in Sidebar -->
            <div class="sidebar-quantity-wrapper">
                <div class="sidebar-qty-header">
                    <span class="sidebar-qty-title">🎯 Cantidad de compases a practicar:</span>
                    <div class="sidebar-qty-custom-stepper" title="Ajusta el número exacto de compases">
                        <button id="sidebar-qty-minus-btn" class="qty-step-btn" title="Restar 1 compás">-</button>
                        <span id="sidebar-qty-custom-val" class="qty-custom-val">4</span>
                        <button id="sidebar-qty-plus-btn" class="qty-step-btn" title="Sumar 1 compás">+</button>
                    </div>
                </div>
                <div class="sidebar-qty-pills" id="sidebar-qty-pills">
                    <button class="sidebar-qty-btn" data-qty="1" title="Practicar 1 compás">1 Compás</button>
                    <button class="sidebar-qty-btn" data-qty="2" title="Practicar 2 compases">2 Compases</button>
                    <button class="sidebar-qty-btn" data-qty="4" title="Practicar 4 compases">4 Compases</button>
                    <button class="sidebar-qty-btn" data-qty="8" title="Practicar 8 compases">8 Compases</button>
                    <button class="sidebar-qty-btn" data-qty="16" title="Practicar 16 compases">16 Compases</button>
                    <button class="sidebar-qty-btn active" data-qty="0" title="Toda la canción sin restricciones">Toda</button>
                </div>
            </div>

            <!-- Scrollable Full Measures Score List -->
            <div id="sidebar-measures-list" class="sidebar-measures-list">
                <div class="sidebar-empty">Carga una canción para explorar la partitura completa.</div>
            </div>
        `;

        const collapseBtn = document.getElementById('sidebar-collapse-btn');
        if (collapseBtn) collapseBtn.onclick = () => this.toggle();

        const backdrop = document.getElementById('sidebar-backdrop');
        if (backdrop) {
            backdrop.onclick = () => this.closeDrawer();
        }

        const loopAllBtn = document.getElementById('sidebar-loop-all-btn');
        if (loopAllBtn) {
            loopAllBtn.onclick = () => {
                this.setQuantity(0);
            };
        }

        const clearBtn = document.getElementById('sidebar-clear-btn');
        if (clearBtn) {
            clearBtn.onclick = () => this.setQuantity(0);
        }

        const sAutoAdv = document.getElementById('sidebar-auto-advance-toggle');
        if (sAutoAdv) {
            sAutoAdv.onchange = (e) => {
                this.autoAdvanceEnabled = e.target.checked;
                if (this.onAutoAdvanceChangeCallback) {
                    this.onAutoAdvanceChangeCallback(e.target.checked);
                }
            };
        }

        // Quantity Pills Event Listeners
        const qtyPills = this.container.querySelectorAll('.sidebar-qty-btn');
        qtyPills.forEach(pill => {
            pill.onclick = () => {
                const qty = Number(pill.dataset.qty);
                this.setQuantity(qty);
            };
        });

        // Stepper Minus / Plus Listeners
        const minusBtn = document.getElementById('sidebar-qty-minus-btn');
        if (minusBtn) {
            minusBtn.onclick = () => {
                const cur = this.selectedQuantity > 1 ? this.selectedQuantity : 1;
                const nextQ = Math.max(1, cur - 1);
                this.setQuantity(nextQ);
            };
        }

        const plusBtn = document.getElementById('sidebar-qty-plus-btn');
        if (plusBtn) {
            plusBtn.onclick = () => {
                const cur = this.selectedQuantity > 0 ? this.selectedQuantity : 1;
                const maxM = this.currentSong ? this.currentSong.total_measures : 100;
                const nextQ = Math.min(maxM, cur + 1);
                this.setQuantity(nextQ);
            };
        }
    }

    setSong(songData, activeIndex = 0, loopStart = 0, loopEnd = 0) {
        this.currentSong = songData;
        this.activeMeasureIndex = activeIndex;
        this.selectedMeasures.clear(); // Reset manual selection on new song -> flows whole song
        this.selectedQuantity = 0;
        this.lastClickedMeasureIndex = -1;
        this.loopStart = loopStart;
        this.loopEnd = loopEnd || ((songData.total_measures || 1) - 1);
        this.renderContent();
    }

    renderContent() {
        if (!this.currentSong) return;

        // Update song subtitle
        const infoEl = document.getElementById('sidebar-song-info');
        if (infoEl) {
            infoEl.textContent = `${this.currentSong.total_measures} compases • ${(this.currentSong.sections || []).length} secciones`;
        }

        // Render Section Chips
        const chipsContainer = document.getElementById('sidebar-sections-chips');
        if (chipsContainer) {
            chipsContainer.innerHTML = '';
            const sections = this.currentSong.sections || [];
            
            if (sections.length === 0) {
                chipsContainer.innerHTML = '<span class="no-sections-tag">Sin marcadores definidos</span>';
            } else {
                sections.forEach((sec, idx) => {
                    const nextSec = sections[idx + 1];
                    const startM = sec.measure_index;
                    const endM = nextSec ? (nextSec.measure_index - 1) : (this.currentSong.total_measures - 1);

                    const chip = document.createElement('button');
                    chip.className = 'section-chip';
                    chip.innerHTML = `<strong>${sec.name}</strong> <span>(C${sec.measure_number}-${endM + 1})</span>`;
                    chip.onclick = () => {
                        document.querySelectorAll('.section-chip').forEach(c => c.classList.remove('active'));
                        chip.classList.add('active');
                        this.selectSection(startM, endM, sec.name);
                    };
                    chipsContainer.appendChild(chip);
                });
            }
        }

        // Render Measures in Score
        const listContainer = document.getElementById('sidebar-measures-list');
        if (!listContainer) return;
        listContainer.innerHTML = '';

        const measures = this.currentSong.measures || [];
        measures.forEach((m, mIdx) => {
            const card = document.createElement('div');
            card.className = 'sidebar-measure-card';
            card.dataset.measureIndex = mIdx;
            card.id = `sidebar-measure-${mIdx}`;

            if (mIdx === this.activeMeasureIndex) {
                card.classList.add('active-playing');
            }
            if (this.selectedMeasures.has(mIdx)) {
                card.classList.add('selected-measure');
            } else if (this.selectedMeasures.size === 0 && mIdx >= this.loopStart && mIdx <= this.loopEnd) {
                card.classList.add('in-loop');
            }

            // Header of measure (Checkbox + Measure Number & Marker tag)
            const head = document.createElement('div');
            head.className = 's-meas-head';

            const leftGroup = document.createElement('div');
            leftGroup.className = 's-meas-left-group';

            // Custom Checkbox for Multi-Selection
            const checkLabel = document.createElement('label');
            checkLabel.className = 's-meas-check-label';
            checkLabel.title = 'Marcar para bucle de práctica';

            const chk = document.createElement('input');
            chk.type = 'checkbox';
            chk.className = 's-meas-checkbox';
            chk.checked = this.selectedMeasures.has(mIdx);
            chk.onclick = (e) => {
                e.stopPropagation();
                this.toggleMeasure(mIdx);
            };

            const customCheck = document.createElement('span');
            customCheck.className = 's-meas-custom-check';

            checkLabel.appendChild(chk);
            checkLabel.appendChild(customCheck);
            leftGroup.appendChild(checkLabel);

            const numSpan = document.createElement('span');
            numSpan.className = 's-meas-num';
            numSpan.textContent = `Compás ${m.measure_number}`;
            leftGroup.appendChild(numSpan);

            head.appendChild(leftGroup);

            if (m.marker) {
                const markerBadge = document.createElement('span');
                markerBadge.className = 's-meas-marker';
                markerBadge.textContent = m.marker;
                head.appendChild(markerBadge);
            }

            card.appendChild(head);

            // Mini Staff Preview Canvas
            const canvasWrap = document.createElement('div');
            canvasWrap.className = 's-meas-canvas-wrap';

            const canvas = document.createElement('canvas');
            canvas.className = 's-meas-mini-canvas';
            canvas.width = 280;
            canvas.height = 48;
            this.drawMiniStaff(canvas, m);

            canvasWrap.appendChild(canvas);
            card.appendChild(canvasWrap);

            // Measure footer (notes count & quick quantity pills + practice button)
            const foot = document.createElement('div');
            foot.className = 's-meas-foot';
            
            const notesCount = (m.notes || []).length;
            const infoText = document.createElement('span');
            infoText.className = 's-meas-info';
            infoText.textContent = notesCount > 0 ? `${notesCount} golpes` : 'Silencio / Pausa';

            const actionsDiv = document.createElement('div');
            actionsDiv.className = 's-meas-foot-actions';

            // Quick quantity pills directly on this card:
            const quickPills = document.createElement('div');
            quickPills.className = 's-meas-quick-pills';

            [1, 2, 4, 8].forEach(q => {
                const qBtn = document.createElement('button');
                qBtn.className = 's-meas-pill-btn';
                qBtn.textContent = `${q}C`;
                qBtn.title = `Practicar ${q} compás${q > 1 ? 'es' : ''} desde el compás ${m.measure_number}`;
                qBtn.onclick = (e) => {
                    e.stopPropagation();
                    this.setQuantity(q, mIdx);
                };
                quickPills.appendChild(qBtn);
            });

            const playBtn = document.createElement('button');
            playBtn.className = 's-meas-play-btn';
            playBtn.innerHTML = 'Practicar ▶';
            playBtn.title = `Practicar desde el compás ${m.measure_number}`;
            playBtn.onclick = (e) => {
                e.stopPropagation();
                const q = this.selectedQuantity > 0 ? this.selectedQuantity : 1;
                this.setQuantity(q, mIdx);
            };

            actionsDiv.appendChild(quickPills);
            actionsDiv.appendChild(playBtn);

            foot.appendChild(infoText);
            foot.appendChild(actionsDiv);
            card.appendChild(foot);

            // Clicking card body:
            card.onclick = (e) => {
                if (e.shiftKey && this.lastClickedMeasureIndex >= 0) {
                    this.selectRange(this.lastClickedMeasureIndex, mIdx);
                } else if (e.ctrlKey || e.metaKey) {
                    this.toggleMeasure(mIdx);
                } else {
                    // Standard click: use active quantity (e.g. 1, 2, 4, 8) starting from this measure
                    if (this.selectedQuantity > 0) {
                        this.setQuantity(this.selectedQuantity, mIdx);
                    } else {
                        this.selectSingleMeasure(mIdx);
                    }
                }
                this.lastClickedMeasureIndex = mIdx;
            };

            listContainer.appendChild(card);
        });

        this.updateLoopRangeText();
        this.updateCardSelectionClasses();
    }

    drawMiniStaff(canvas, measure) {
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);

        const staffY = 12;
        const lineSpacing = 6;

        // 5 lines
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            const y = staffY + i * lineSpacing;
            ctx.beginPath();
            ctx.moveTo(8, y);
            ctx.lineTo(w - 8, y);
            ctx.stroke();
        }

        // Barlines
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(8, staffY);
        ctx.lineTo(8, staffY + 4 * lineSpacing);
        ctx.moveTo(w - 8, staffY);
        ctx.lineTo(w - 8, staffY + 4 * lineSpacing);
        ctx.stroke();

        // Notes
        const notes = measure.notes || [];
        const totalTicks = measure.measure_ticks || 1920;
        const startX = 20;
        const usableW = w - 40;

        const rowY = {
            'HI_HAT': staffY - 2,
            'CRASH':  staffY - 4,
            'RIDE':   staffY,
            'TOM_1':  staffY + 3,
            'TOM_2':  staffY + 9,
            'TOM_3':  staffY + 15,
            'SNARE':  staffY + 12,
            'KICK':   staffY + 27
        };

        const colors = {
            'HI_HAT': '#eab308',
            'CRASH':  '#64748b',
            'RIDE':   '#ec4899',
            'TOM_1':  '#3b82f6',
            'TOM_2':  '#22c55e',
            'TOM_3':  '#a855f7',
            'SNARE':  '#ef4444',
            'KICK':   '#f97316'
        };

        notes.forEach(n => {
            const x = startX + (n.tick / totalTicks) * usableW;
            const y = (typeof n.string === 'number') 
                ? (staffY + n.string * lineSpacing) 
                : (rowY[n.row] || (staffY + 12));
            ctx.fillStyle = colors[n.row] || '#22c55e';
            ctx.beginPath();
            ctx.arc(x, y, 2.5, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    selectSingleMeasure(mIdx) {
        this.selectedMeasures.clear();
        this.selectedMeasures.add(mIdx);
        this.lastClickedMeasureIndex = mIdx;
        this.updateCardSelectionClasses();
        this.updateLoopRangeText();

        if (this.onSelectionChangeCallback) {
            this.onSelectionChangeCallback([mIdx]);
        }
        if (this.onSelectMeasureCallback) {
            this.onSelectMeasureCallback(mIdx);
        }
    }

    toggleMeasure(mIdx) {
        if (this.selectedMeasures.has(mIdx)) {
            this.selectedMeasures.delete(mIdx);
        } else {
            this.selectedMeasures.add(mIdx);
        }
        this.lastClickedMeasureIndex = mIdx;
        this.updateCardSelectionClasses();
        this.updateLoopRangeText();

        const sorted = Array.from(this.selectedMeasures).sort((a, b) => a - b);
        if (this.onSelectionChangeCallback) {
            this.onSelectionChangeCallback(sorted);
        }
        if (sorted.length > 0 && !this.selectedMeasures.has(this.activeMeasureIndex)) {
            if (this.onSelectMeasureCallback) {
                this.onSelectMeasureCallback(sorted[0]);
            }
        }
    }

    selectRange(fromIdx, toIdx) {
        const start = Math.min(fromIdx, toIdx);
        const end = Math.max(fromIdx, toIdx);
        for (let i = start; i <= end; i++) {
            this.selectedMeasures.add(i);
        }
        this.updateCardSelectionClasses();
        this.updateLoopRangeText();

        const sorted = Array.from(this.selectedMeasures).sort((a, b) => a - b);
        if (this.onSelectionChangeCallback) {
            this.onSelectionChangeCallback(sorted);
        }
    }

    selectSection(startM, endM, name) {
        this.selectedMeasures.clear();
        for (let i = startM; i <= endM; i++) {
            this.selectedMeasures.add(i);
        }
        this.lastClickedMeasureIndex = startM;
        this.updateCardSelectionClasses();
        this.updateLoopRangeText(name);

        const sorted = Array.from(this.selectedMeasures).sort((a, b) => a - b);
        if (this.onSelectionChangeCallback) {
            this.onSelectionChangeCallback(sorted);
        }
        if (this.onSelectMeasureCallback) {
            this.onSelectMeasureCallback(startM);
        }
    }

    setQuantity(qty, startMeasureIndex = null, notify = true) {
        this.selectedQuantity = qty;
        const total = (this.currentSong?.total_measures || 1);

        if (qty === 0) {
            this.clearSelection();
            return;
        }

        const startIdx = (typeof startMeasureIndex === 'number' && startMeasureIndex >= 0)
            ? startMeasureIndex
            : ((this.selectedMeasures.size > 0)
                ? Math.min(...this.selectedMeasures)
                : (this.activeMeasureIndex || 0));

        const endIdx = Math.min(total - 1, startIdx + qty - 1);

        this.selectedMeasures.clear();
        for (let i = startIdx; i <= endIdx; i++) {
            this.selectedMeasures.add(i);
        }
        this.lastClickedMeasureIndex = startIdx;

        this.updateCardSelectionClasses();
        this.updateLoopRangeText();
        this.updateQuantityUI();

        const sorted = Array.from(this.selectedMeasures).sort((a, b) => a - b);
        if (notify && this.onSelectionChangeCallback) {
            this.onSelectionChangeCallback(sorted);
        }
        if (notify && this.onQuantityChangeCallback) {
            this.onQuantityChangeCallback(qty);
        }
        if (notify && this.onSelectMeasureCallback) {
            this.onSelectMeasureCallback(startIdx);
        }
    }

    updateQuantityUI() {
        const pills = document.querySelectorAll('.sidebar-qty-btn');
        pills.forEach(p => {
            const q = Number(p.dataset.qty);
            p.classList.toggle('active', q === this.selectedQuantity);
        });

        const customVal = document.getElementById('sidebar-qty-custom-val');
        if (customVal) {
            customVal.textContent = this.selectedQuantity > 0 ? this.selectedQuantity : '4';
        }
    }

    clearSelection() {
        this.selectedMeasures.clear();
        this.lastClickedMeasureIndex = -1;
        this.selectedQuantity = 0;
        document.querySelectorAll('.section-chip').forEach(c => c.classList.remove('active'));
        this.updateCardSelectionClasses();
        this.updateLoopRangeText();
        this.updateQuantityUI();

        if (this.onSelectionChangeCallback) {
            this.onSelectionChangeCallback([]);
        }
        if (this.onQuantityChangeCallback) {
            this.onQuantityChangeCallback(0);
        }
    }

    updateCardSelectionClasses() {
        const cards = document.querySelectorAll('.sidebar-measure-card');
        const hasSelection = this.selectedMeasures.size > 0;

        cards.forEach(card => {
            const idx = Number(card.dataset.measureIndex);
            const isSelected = this.selectedMeasures.has(idx);

            card.classList.toggle('selected-measure', isSelected);
            if (hasSelection) {
                card.classList.toggle('in-loop', isSelected);
            } else {
                card.classList.toggle('in-loop', idx >= this.loopStart && idx <= this.loopEnd);
            }

            const cb = card.querySelector('.s-meas-checkbox');
            if (cb) cb.checked = isSelected;
        });

        // Loop All Button & Clear Button State
        const allBtn = document.getElementById('sidebar-loop-all-btn');
        if (allBtn) {
            allBtn.classList.toggle('active', !hasSelection);
        }

        const clearBtn = document.getElementById('sidebar-clear-btn');
        if (clearBtn) {
            clearBtn.style.display = hasSelection ? 'inline-flex' : 'none';
        }
    }

    setActiveMeasure(index) {
        if (index === this.activeMeasureIndex && document.querySelector(`.sidebar-measure-card.active-playing[data-measure-index="${index}"]`)) {
            return;
        }

        const oldActive = document.querySelector('.sidebar-measure-card.active-playing');
        if (oldActive) {
            oldActive.classList.remove('active-playing');
        }

        this.activeMeasureIndex = index;

        const activeCard = document.getElementById(`sidebar-measure-${index}`);
        if (activeCard) {
            activeCard.classList.add('active-playing');

            // Scroll if card is currently outside the visible list viewport (instant scroll to avoid playback stutter)
            const listContainer = document.getElementById('sidebar-measures-list');
            if (listContainer) {
                const cardTop = activeCard.offsetTop;
                const cardBottom = cardTop + activeCard.offsetHeight;
                const viewTop = listContainer.scrollTop;
                const viewBottom = viewTop + listContainer.clientHeight;

                if (cardTop < viewTop || cardBottom > viewBottom) {
                    activeCard.scrollIntoView({ behavior: 'auto', block: 'nearest' });
                }
            }
        }
    }

    setLoopRange(start, end) {
        this.loopStart = start;
        this.loopEnd = end;
        this.updateCardSelectionClasses();
        this.updateLoopRangeText();
    }

    updateLoopRangeText(customName = '') {
        const textEl = document.getElementById('sidebar-loop-range-text');
        if (!textEl) return;

        if (this.selectedMeasures.size === 0) {
            const total = this.currentSong ? this.currentSong.total_measures : 1;
            textEl.innerHTML = `<strong class="loop-all-tag">Toda la Canción</strong> <span class="loop-detail">(Compases 1 - ${total})</span>`;
        } else {
            const sorted = Array.from(this.selectedMeasures).sort((a, b) => a - b);
            if (customName) {
                textEl.innerHTML = `<strong class="loop-active-tag">${customName}</strong> <span class="loop-detail">(C${sorted[0] + 1} - C${sorted[sorted.length - 1] + 1})</span>`;
            } else if (sorted.length === 1) {
                textEl.innerHTML = `<strong class="loop-active-tag">Compás ${sorted[0] + 1}</strong> <span class="loop-detail">(1 compás)</span>`;
            } else {
                let isContiguous = true;
                for (let i = 1; i < sorted.length; i++) {
                    if (sorted[i] !== sorted[i - 1] + 1) {
                        isContiguous = false;
                        break;
                    }
                }
                const modeNote = this.autoAdvanceEnabled ? 'Ventana Continua' : 'Bucle Cerrado';
                if (isContiguous) {
                    textEl.innerHTML = `<strong class="loop-active-tag">Compás ${sorted[0] + 1} - ${sorted[sorted.length - 1] + 1}</strong> <span class="loop-detail">(${sorted.length} compases • ${modeNote})</span>`;
                } else {
                    const listStr = sorted.map(i => `C${i + 1}`).slice(0, 4).join(', ') + (sorted.length > 4 ? '...' : '');
                    textEl.innerHTML = `<strong class="loop-active-tag">${sorted.length} compases</strong> <span class="loop-detail">(${listStr} • ${modeNote})</span>`;
                }
            }
        }
    }

    toggle() {
        if (window.innerWidth <= 1100) {
            const isDrawerOpen = this.container && this.container.classList.contains('drawer-open');
            if (isDrawerOpen) {
                this.closeDrawer();
            } else {
                this.openDrawer();
            }
            return;
        }

        this.isOpen = !this.isOpen;
        if (this.container) {
            this.container.classList.toggle('collapsed', !this.isOpen);
        }
        const toggleBtn = document.getElementById('open-sidebar-floating-btn');
        if (toggleBtn) {
            toggleBtn.style.display = this.isOpen ? 'none' : 'flex';
        }
    }

    open() {
        if (window.innerWidth <= 1100) {
            this.openDrawer();
            return;
        }
        this.isOpen = true;
        if (this.container) this.container.classList.remove('collapsed');
        const toggleBtn = document.getElementById('open-sidebar-floating-btn');
        if (toggleBtn) toggleBtn.style.display = 'none';
    }

    close() {
        if (window.innerWidth <= 1100) {
            this.closeDrawer();
            return;
        }
        this.isOpen = false;
        if (this.container) this.container.classList.add('collapsed');
        const toggleBtn = document.getElementById('open-sidebar-floating-btn');
        if (toggleBtn) toggleBtn.style.display = 'flex';
    }

    openDrawer() {
        if (this.container) {
            this.container.classList.remove('collapsed');
            this.container.classList.add('drawer-open');
        }
        const backdrop = document.getElementById('sidebar-backdrop');
        if (backdrop) backdrop.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeDrawer() {
        if (this.container) {
            this.container.classList.remove('drawer-open');
        }
        const backdrop = document.getElementById('sidebar-backdrop');
        if (backdrop) backdrop.classList.remove('active');
        document.body.style.overflow = '';
    }

    onSelectMeasure(callback) {
        this.onSelectMeasureCallback = callback;
    }

    onSelectSection(callback) {
        this.onSelectSectionCallback = callback;
    }

    onSelectionChange(callback) {
        this.onSelectionChangeCallback = callback;
    }

    onQuantityChange(callback) {
        this.onQuantityChangeCallback = callback;
    }

    onAutoAdvanceChange(callback) {
        this.onAutoAdvanceChangeCallback = callback;
    }

    setAutoAdvanceToggle(val) {
        this.autoAdvanceEnabled = !!val;
        const toggle = document.getElementById('sidebar-auto-advance-toggle');
        if (toggle && toggle.checked !== this.autoAdvanceEnabled) {
            toggle.checked = this.autoAdvanceEnabled;
        }
        this.updateLoopRangeText();
    }
}

window.fullScoreSidebar = new FullScoreSidebar('lateral-score-sidebar');
