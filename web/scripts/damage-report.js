

const DMG_KEY = 'damageReports';

function loadDmgReports() {
    try { return JSON.parse(localStorage.getItem(DMG_KEY) || '[]'); }
    catch (e) { return []; }
}
function saveDmgReports(list) {
    try { localStorage.setItem(DMG_KEY, JSON.stringify(list)); } catch (e) {}
}

let _dmgType            = 'checkin';   // 'checkin' | 'checkout'
let _dmgPhotos          = [];          // base64 strings
let _dmgCustomItems     = [];          // [{ id, label }, ...]
let _dmgLinkedCheckinId = null;        // id of the check-in this checkout links to

const DMG_DEFAULTS = [
    { id: 'exterior_scratches', label: 'Exterior scratches / dents'      },
    { id: 'windshield',         label: 'Windshield cracks / chips'        },
    { id: 'tires',              label: 'Tire damage / flat tires'          },
    { id: 'interior',           label: 'Interior damage (seats, dash)'     },
    { id: 'missing_parts',      label: 'Missing parts / accessories'       },
    { id: 'engine',             label: 'Engine / mechanical issue'         },
    { id: 'lights',             label: 'Lights / signals broken'           },
    { id: 'fuel_low',           label: 'Fuel level low'                    },
];

function $id(id) { return document.getElementById(id); }

function dmgShow(id) {
    const el = $id(id);
    if (el) el.style.display = 'flex';
}
function dmgHide(id) {
    const el = $id(id);
    if (el) el.style.display = 'none';
}

function dmgFmtDate(iso) {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleString(); } catch (e) { return iso; }
}

function dmgNowLocal() {
    const d = new Date(), p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function dmgGetVehicles() {
    if (typeof vehicles !== 'undefined' && Array.isArray(vehicles)) return vehicles;
    try { return JSON.parse(localStorage.getItem('ownerVehicles') || '[]'); }
    catch (e) { return []; }
}

function dmgMakeLookup(report) {
    const lk = {};
    DMG_DEFAULTS.forEach(d => { lk[d.id] = d.label; });
    Object.assign(lk, report.customLabels || {});
    return lk;
}

function refreshDmgBadge() {
    const pill = $id('dmg-badge-pill');
    if (!pill) return;
    const n = loadDmgReports().length;
    pill.textContent   = n;
    pill.style.display = n > 0 ? 'inline-flex' : 'none';
}

function openDamageReportsListModal() {
    renderDmgList();
    dmgShow('dmg-list-modal');
}

function closeDamageReportsListModal() {
    dmgHide('dmg-list-modal');
}

function renderDmgList() {
    const container = $id('dmg-list-items');
    const emptyMsg  = $id('dmg-list-empty');
    if (!container) return;

    const search = ($id('dmg-list-search')?.value || '').toLowerCase().trim();
    const filter = $id('dmg-list-filter')?.value || 'all';

    let all = loadDmgReports();

    if (search) {
        all = all.filter(r =>
            (r.vehicleName || '').toLowerCase().includes(search) ||
            (r.renterName  || '').toLowerCase().includes(search) ||
            (r.plate       || '').toLowerCase().includes(search)
        );
    }

    let checkins  = all.filter(r => r.type === 'checkin');
    let checkouts = all.filter(r => r.type === 'checkout');

    if (filter === 'checkin')  checkouts = [];
    if (filter === 'checkout') checkins  = [];

    if (checkins.length === 0 && checkouts.length === 0) {
        container.innerHTML = '';
        if (emptyMsg) emptyMsg.style.display = 'block';
        return;
    }
    if (emptyMsg) emptyMsg.style.display = 'none';

    checkins = checkins.slice().reverse(); // newest first

    let html = '';

    checkins.forEach(ci => {
        const linkedCo   = checkouts.find(co => co.linkedCheckinId === ci.id);
        const ciCount    = (ci.issues || []).length;
        const plateBadge = ci.plate ? `<span class="dmg-plate">${ci.plate}</span>` : '';

        html += `
        <div class="dmg-trip-group">
            <div class="dmg-list-row" onclick="openDmgViewModal('${ci.id}')">
                <div class="dmg-list-row-body">
                    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:5px;">
                        <span class="dmg-tag dmg-tag--ci">✅ Check-in</span>
                        ${linkedCo
                            ? '<span class="dmg-linked-badge">🔗 Trip Complete</span>'
                            : '<span class="dmg-unlinked-badge">⏳ Awaiting Check-out</span>'}
                    </div>
                    <p class="dmg-list-vehicle">${ci.vehicleName || 'Unknown'} ${plateBadge}</p>
                    <div class="dmg-list-meta">
                        <span>👤 ${ci.renterName || '—'}</span>
                        <span>🕐 ${dmgFmtDate(ci.datetime)}</span>
                        ${ciCount > 0
                            ? `<span class="dmg-issues-flag">⚠️ ${ciCount} issue${ciCount > 1 ? 's' : ''}</span>`
                            : `<span class="dmg-issues-ok">✓ No issues</span>`}
                    </div>
                </div>
                <span class="dmg-list-arrow">›</span>
            </div>

            ${linkedCo ? (() => {
                const coIssues  = linkedCo.issues || [];
                const newCount  = coIssues.filter(i => !(ci.issues || []).includes(i)).length;
                const coPlate   = linkedCo.plate ? `<span class="dmg-plate">${linkedCo.plate}</span>` : '';
                return `
                <div class="dmg-list-row dmg-row-indented" onclick="openDmgViewModal('${linkedCo.id}')">
                    <div class="dmg-list-row-body">
                        <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;">
                            <span class="dmg-tag dmg-tag--co">🔁 Check-out</span>
                            <span class="dmg-linked-badge">🔗 Linked</span>
                        </div>
                        <p class="dmg-list-vehicle" style="font-size:13px">${linkedCo.vehicleName || ''} ${coPlate}</p>
                        <div class="dmg-list-meta">
                            <span>🕐 ${dmgFmtDate(linkedCo.datetime)}</span>
                            ${newCount > 0
                                ? `<span class="dmg-issues-flag">⚠️ ${newCount} NEW issue${newCount > 1 ? 's' : ''}</span>`
                                : `<span class="dmg-issues-ok">✓ No new issues</span>`}
                        </div>
                    </div>
                    <span class="dmg-list-arrow">›</span>
                </div>`;
            })() : ''}
        </div>`;
    });

    if (filter !== 'checkin') {
        checkouts
            .filter(co => !checkins.find(ci => ci.id === co.linkedCheckinId))
            .forEach(co => {
                const coPlate = co.plate ? `<span class="dmg-plate">${co.plate}</span>` : '';
                html += `
                <div class="dmg-list-row" onclick="openDmgViewModal('${co.id}')">
                    <div class="dmg-list-row-body">
                        <div style="margin-bottom:5px;"><span class="dmg-tag dmg-tag--co">🔁 Check-out</span></div>
                        <p class="dmg-list-vehicle">${co.vehicleName || 'Unknown'} ${coPlate}</p>
                        <div class="dmg-list-meta"><span>🕐 ${dmgFmtDate(co.datetime)}</span></div>
                    </div>
                    <span class="dmg-list-arrow">›</span>
                </div>`;
            });
    }

    container.innerHTML = html || '<p class="dmg-empty-msg">No matching records.</p>';
}



function openNewReportFromList() {
    closeDamageReportsListModal();
    dmgOpenForm('checkin', null);
}


function startLinkedCheckout(checkinId) {
    closeDmgViewModal();
    dmgOpenForm('checkout', checkinId);
}


function dmgOpenForm(type, linkedCheckinId) {
    _dmgType            = type;
    _dmgPhotos          = [];
    _dmgCustomItems     = [];
    _dmgLinkedCheckinId = linkedCheckinId || null;

    const isCheckout = type === 'checkout';

    
    const emojiEl    = $id('dmg-form-emoji');
    const titleEl    = $id('dmg-form-title');
    const subtitleEl = $id('dmg-form-subtitle');

    if (emojiEl)    emojiEl.textContent    = isCheckout ? '🔁' : '✅';
    if (titleEl)    titleEl.textContent    = isCheckout ? 'New Check-out Report' : 'New Check-in Report';
    if (subtitleEl) subtitleEl.textContent = isCheckout
        ? 'Document vehicle condition AFTER the trip'
        : 'Document vehicle condition BEFORE the trip';

    
    document.querySelectorAll('.dmg-type-btn').forEach(btn => {
        const isActive = btn.dataset.type === type;
        btn.classList.toggle('active', isActive);
        btn.disabled      = isCheckout;
        btn.style.opacity = (isCheckout && !isActive) ? '0.4' : '1';
        btn.title         = isCheckout ? 'Locked — this is a linked check-out' : '';
    });

    
    const banner = $id('dmg-linked-banner');
    let prefillVehicleId = null;
    let prefillRenter    = '';

    if (banner) {
        if (isCheckout && linkedCheckinId) {
            const ci = loadDmgReports().find(r => r.id === linkedCheckinId);
            if (ci) {
                prefillVehicleId = ci.vehicleId;
                prefillRenter    = ci.renterName || '';
            }
            banner.style.display = 'block';
            banner.innerHTML = ci
                ? `🔗 <strong>Linked to Check-in:</strong> ${ci.vehicleName || ''}${ci.plate ? ` (${ci.plate})` : ''} &mdash; Renter: <strong>${ci.renterName || '—'}</strong> &mdash; ${dmgFmtDate(ci.datetime)}`
                : '🔗 Linked to a check-in report';
        } else {
            banner.style.display = 'none';
            banner.innerHTML = '';
        }
    }

    
    const dtEl = $id('dmg-datetime');
    if (dtEl) dtEl.value = dmgNowLocal();

    const renterEl = $id('dmg-renter');
    if (renterEl) renterEl.value = prefillRenter;

    const notesEl = $id('dmg-notes');
    if (notesEl) notesEl.value = '';

    
    dmgRenderChecklist([]);

    
    const pg = $id('dmg-photo-grid');
    if (pg) pg.innerHTML = '';

    
    dmgPopulateVehicleDrop(prefillVehicleId, isCheckout && !!linkedCheckinId);

    dmgShow('dmg-form-modal');
}

function closeDmgFormModal() { dmgHide('dmg-form-modal'); }

function dmgPopulateVehicleDrop(prefillId, locked) {
    const sel = $id('dmg-vehicle');
    if (!sel) return;
    sel.innerHTML = '<option value="">-- Select vehicle --</option>' +
        dmgGetVehicles().map(v => {
            const label    = `${v.brand || ''} ${v.name || ''}`.trim() || `Vehicle #${v.id}`;
            const plateTxt = v.plate ? ` (${v.plate})` : '';
            const sel      = String(v.id) === String(prefillId) ? 'selected' : '';
            return `<option value="${v.id}" data-plate="${v.plate || ''}" ${sel}>${label}${plateTxt}</option>`;
        }).join('');
    sel.disabled      = locked;
    sel.style.opacity = locked ? '0.7' : '1';
}


function setDmgType(type, btn) {
    if (btn && btn.disabled) return;
    _dmgType = type;
    document.querySelectorAll('.dmg-type-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    const emojiEl    = $id('dmg-form-emoji');
    const titleEl    = $id('dmg-form-title');
    const subtitleEl = $id('dmg-form-subtitle');
    if (emojiEl)    emojiEl.textContent    = type === 'checkout' ? '🔁' : '✅';
    if (titleEl)    titleEl.textContent    = type === 'checkout' ? 'New Check-out Report' : 'New Check-in Report';
    if (subtitleEl) subtitleEl.textContent = type === 'checkout'
        ? 'Document vehicle condition AFTER the trip'
        : 'Document vehicle condition BEFORE the trip';
}


function dmgRenderChecklist(checkedIds) {
    const container = $id('dmg-checklist');
    if (!container) return;

    const allItems = [...DMG_DEFAULTS, ..._dmgCustomItems];

    const itemsHtml = allItems.map(item => {
        const isCustom = !!_dmgCustomItems.find(c => c.id === item.id);
        return `
        <label class="dmg-check">
            <input type="checkbox" value="${item.id}" ${checkedIds.includes(item.id) ? 'checked' : ''}>
            <span class="dmg-check-label">${item.label}</span>
            ${isCustom
                ? `<button type="button" class="dmg-check-remove"
                       onclick="dmgRemoveCustomItem('${item.id}')"
                       title="Remove">✕</button>`
                : ''}
        </label>`;
    }).join('');

    const addRowHtml = `
        <div class="dmg-add-other-row">
            <input type="text" id="dmg-other-input" class="form-input dmg-other-input"
                   placeholder="Type a custom condition and press Enter…"
                   onkeydown="if(event.key==='Enter'){event.preventDefault();dmgAddCustomItem();}">
            <button type="button" class="btn btn-secondary dmg-add-other-btn"
                    onclick="dmgAddCustomItem()">+ Add Other</button>
        </div>`;

    container.innerHTML = itemsHtml + addRowHtml;
}

function dmgAddCustomItem() {
    const input = $id('dmg-other-input');
    if (!input) return;
    const label = input.value.trim();
    if (!label) { input.focus(); return; }

    const id = 'custom_' + Date.now();
    _dmgCustomItems.push({ id, label });

    const checked = dmgGetCheckedIssues();
    dmgRenderChecklist(checked);

    const cb = document.querySelector(`#dmg-checklist input[value="${id}"]`);
    if (cb) cb.checked = true;

    input.value = '';
    $id('dmg-other-input')?.focus();
}

function dmgRemoveCustomItem(id) {
    _dmgCustomItems = _dmgCustomItems.filter(c => c.id !== id);
    dmgRenderChecklist(dmgGetCheckedIssues().filter(x => x !== id));
}

function dmgGetCheckedIssues() {
    return Array.from(
        document.querySelectorAll('#dmg-checklist input[type=checkbox]:checked')
    ).map(cb => cb.value);
}

function initDmgPhotoUpload() {
    const input = $id('dmg-photo-input');
    if (!input) return;
    input.addEventListener('change', function () {
        const remaining = 6 - _dmgPhotos.length;
        if (remaining <= 0) { alert('Maximum 6 photos allowed.'); return; }
        Array.from(this.files).slice(0, remaining).forEach(file => {
            if (file.size > 5 * 1024 * 1024) {
                alert(`"${file.name}" exceeds 5 MB and was skipped.`);
                return;
            }
            const reader = new FileReader();
            reader.onload = e => { _dmgPhotos.push(e.target.result); dmgRenderPhotoGrid(); };
            reader.readAsDataURL(file);
        });
        this.value = '';
    });
}

function dmgRenderPhotoGrid() {
    const g = $id('dmg-photo-grid');
    if (!g) return;
    g.innerHTML = _dmgPhotos.map((src, i) => `
        <div class="dmg-thumb">
            <img src="${src}" alt="Photo ${i + 1}">
            <button class="dmg-thumb-remove" onclick="dmgRemovePhoto(${i})" title="Remove">✕</button>
        </div>`).join('');
}

function dmgRemovePhoto(i) {
    _dmgPhotos.splice(i, 1);
    dmgRenderPhotoGrid();
}

function saveDmgReport() {
    const sel = $id('dmg-vehicle');
    if (!sel || !sel.value) { alert('Please select a vehicle.'); return; }

    const opt = sel.options[sel.selectedIndex];

    const customLabels = {};
    _dmgCustomItems.forEach(c => { customLabels[c.id] = c.label; });

    const report = {
        id:              `dmg-${Date.now()}`,
        vehicleId:       sel.value,
        vehicleName:     opt.text,
        plate:           opt.dataset.plate || '',
        renterName:      ($id('dmg-renter')?.value || '').trim(),
        datetime:        $id('dmg-datetime')?.value || new Date().toISOString(),
        type:            _dmgType,
        issues:          dmgGetCheckedIssues(),
        customLabels,
        notes:           ($id('dmg-notes')?.value || '').trim(),
        photos:          _dmgPhotos.slice(),
        linkedCheckinId: _dmgLinkedCheckinId || null,
        createdAt:       new Date().toISOString()
    };

    const all = loadDmgReports();
    all.push(report);
    saveDmgReports(all);

    refreshDmgBadge();
    closeDmgFormModal();
    openDamageReportsListModal();
}

function openDmgViewModal(reportId) {
    const all    = loadDmgReports();
    const report = all.find(r => r.id === reportId);
    if (!report) return;

    const isCI = report.type === 'checkin';
    const isCO = report.type === 'checkout';

    let linked = null;
    if (isCI) linked = all.find(r => r.linkedCheckinId === report.id);
    if (isCO && report.linkedCheckinId) linked = all.find(r => r.id === report.linkedCheckinId);

    
    const emojiEl = $id('dmg-view-emoji');
    const titleEl = $id('dmg-view-title');
    const subEl   = $id('dmg-view-sub');

    if (emojiEl) emojiEl.textContent = isCI ? '✅' : '🔁';
    if (titleEl) titleEl.textContent = linked
        ? (isCI ? 'Trip Report — Check-in view' : 'Trip Report — Check-out view')
        : (isCI ? 'Check-in Report' : 'Check-out Report');
    if (subEl)   subEl.textContent   = dmgFmtDate(report.datetime);

    
    const delBtn = $id('dmg-view-delete');
    if (delBtn) delBtn.onclick = () => dmgDeleteReport(reportId);

    
    const addCoBtn = $id('dmg-view-add-checkout');
    if (addCoBtn) {
        if (isCI && !linked) {
            addCoBtn.style.display = 'inline-flex';
            addCoBtn.onclick = () => startLinkedCheckout(report.id);
        } else {
            addCoBtn.style.display = 'none';
        }
    }

    
    const body = $id('dmg-view-body');
    if (!body) return;

    if (linked) {
        const ciR  = isCI ? report : linked;
        const coR  = isCO ? report : linked;
        const ciLk = dmgMakeLookup(ciR);
        const coLk = dmgMakeLookup(coR);

        body.innerHTML = `
            <div class="dmg-trip-banner">
                <span>🚗 ${ciR.vehicleName || ''}${ciR.plate ? ` <span class="dmg-plate">${ciR.plate}</span>` : ''}</span>
                <span style="opacity:.75">👤 Renter: <strong>${ciR.renterName || '—'}</strong></span>
            </div>
            <div class="dmg-compare-grid">
                <div class="dmg-compare-col">
                    <div class="dmg-compare-header dmg-compare-header--ci">
                        <span>✅ Before Trip</span>
                        <small>${dmgFmtDate(ciR.datetime)}</small>
                    </div>
                    ${dmgConditionBlock(ciR, ciLk, null)}
                    ${dmgNotesBlock(ciR)}
                    ${dmgPhotosBlock(ciR)}
                </div>
                <div class="dmg-compare-col">
                    <div class="dmg-compare-header dmg-compare-header--co">
                        <span>🔁 After Trip</span>
                        <small>${dmgFmtDate(coR.datetime)}</small>
                    </div>
                    ${dmgConditionBlock(coR, coLk, ciR.issues)}
                    ${dmgNotesBlock(coR)}
                    ${dmgPhotosBlock(coR)}
                </div>
            </div>`;

    } else {
        const lk = dmgMakeLookup(report);
        body.innerHTML = `
            <div class="dmg-view-grid">
                <div class="dmg-view-field">
                    <span class="dmg-view-label">Vehicle</span>
                    <span class="dmg-view-value">${report.vehicleName || '—'}</span>
                </div>
                <div class="dmg-view-field">
                    <span class="dmg-view-label">Plate</span>
                    <span class="dmg-view-value">${report.plate || '—'}</span>
                </div>
                <div class="dmg-view-field">
                    <span class="dmg-view-label">Renter</span>
                    <span class="dmg-view-value">${report.renterName || '—'}</span>
                </div>
                <div class="dmg-view-field">
                    <span class="dmg-view-label">Date &amp; Time</span>
                    <span class="dmg-view-value">${dmgFmtDate(report.datetime)}</span>
                </div>
            </div>
            ${isCI ? `<div class="dmg-awaiting-co">
                ⏳ No check-out linked yet.<br>
                Click <strong>"🔁 Add Check-out"</strong> below after the trip ends.
            </div>` : ''}
            ${dmgConditionBlock(report, lk, null)}
            ${dmgNotesBlock(report)}
            ${dmgPhotosBlock(report)}`;
    }

    dmgShow('dmg-view-modal');
}

function closeDmgViewModal() { dmgHide('dmg-view-modal'); }

function dmgDeleteReport(id) {
    if (!confirm('Delete this damage report? This cannot be undone.')) return;
    saveDmgReports(loadDmgReports().filter(r => r.id !== id));
    refreshDmgBadge();
    closeDmgViewModal();
    renderDmgList();
}

function dmgConditionBlock(report, labels, compareIssues) {
    const issues    = report.issues || [];
    const newIssues = compareIssues
        ? issues.filter(i => !compareIssues.includes(i))
        : [];

    const items = issues.length > 0
        ? `<ul class="dmg-view-issues">
            ${issues.map(k => {
                const isNew = newIssues.includes(k);
                return `<li${isNew ? ' class="dmg-issue-new"' : ''}>
                    <span class="dmg-dot${isNew ? ' dmg-dot--new' : ''}"></span>
                    ${labels[k] || k}
                    ${isNew ? '<span class="dmg-new-badge">NEW</span>' : ''}
                </li>`;
            }).join('')}
           </ul>`
        : `<p class="dmg-muted" style="padding:6px 0">✓ No issues flagged</p>`;

    return `<div class="dmg-view-section">
        <p class="dmg-view-section-title">⚠️ Condition</p>${items}
    </div>`;
}

function dmgNotesBlock(r) {
    return `<div class="dmg-view-section">
        <p class="dmg-view-section-title">📝 Notes</p>
        <pre class="dmg-view-notes">${r.notes || 'No notes provided.'}</pre>
    </div>`;
}

function dmgPhotosBlock(r) {
    const photos = r.photos || [];
    const content = photos.length > 0
        ? `<div class="dmg-view-photos">
            ${photos.map((src, i) => `
                <div class="dmg-view-thumb" onclick="dmgOpenLightbox('${r.id}',${i})">
                    <img src="${src}" alt="Photo ${i + 1}">
                    <div class="dmg-view-thumb-overlay">🔍</div>
                </div>`).join('')}
           </div>`
        : `<p class="dmg-muted" style="padding:4px 0">No photos attached.</p>`;

    return `<div class="dmg-view-section">
        <p class="dmg-view-section-title">📷 Photos (${photos.length})</p>${content}
    </div>`;
}

function dmgOpenLightbox(reportId, i) {
    const r = loadDmgReports().find(x => x.id === reportId);
    if (!r?.photos?.[i]) return;

    $id('dmg-lightbox')?.remove();

    const lb = document.createElement('div');
    lb.id = 'dmg-lightbox';
    lb.style.cssText = [
        'position:fixed', 'inset:0', 'z-index:2000',
        'background:rgba(0,0,0,.88)',
        'display:flex', 'align-items:center', 'justify-content:center',
        'cursor:zoom-out'
    ].join(';');
    lb.innerHTML = `<img src="${r.photos[i]}"
        style="max-width:90vw;max-height:90vh;border-radius:10px;box-shadow:0 8px 40px rgba(0,0,0,.5);"
        alt="Photo ${i + 1}">`;
    lb.addEventListener('click', () => lb.remove());
    document.body.appendChild(lb);
}

document.addEventListener('DOMContentLoaded', () => {
    refreshDmgBadge();
    initDmgPhotoUpload();

    ['dmg-list-modal', 'dmg-form-modal', 'dmg-view-modal'].forEach(id => {
        const m = $id(id);
        if (m) m.addEventListener('click', e => { if (e.target === m) m.style.display = 'none'; });
    });

    $id('dmg-list-search')?.addEventListener('input',  renderDmgList);
    $id('dmg-list-filter')?.addEventListener('change', renderDmgList);
});