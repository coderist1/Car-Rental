const VEHICLE_STORAGE_KEY = 'ownerVehicles';
const SAVED_CARS_STORAGE_KEY = 'renterSavedCars';
const defaultVehicles = [];

function normalizeVehicle(vehicle) {
    const status = vehicle.status || (vehicle.available ? 'available' : 'rented');
    const priceValue = Number(vehicle.pricePerDay ?? vehicle.price ?? 0);
    return {
        ...vehicle,
        price: Number.isNaN(priceValue) ? 0 : priceValue,
        pricePerDay: Number.isNaN(priceValue) ? 0 : priceValue,
        imageUri: vehicle.imageUri || vehicle.image || '',
        image: vehicle.image || vehicle.imageUri || '',
        status,
        available: status === 'available',
        owner: vehicle.owner || 'Admin Owner',
        features: Array.isArray(vehicle.features) && vehicle.features.length > 0
            ? vehicle.features
            : ["Aircon", "Bluetooth", "ABS", "Backup Camera"]
    };
}

function toStoredVehicle(vehicle) {
    return {
        ...vehicle,
        pricePerDay: Number(vehicle.pricePerDay ?? vehicle.price ?? 0),
        image: vehicle.image || vehicle.imageUri || '',
        status: vehicle.status || (vehicle.available ? 'available' : 'rented'),
        available: (vehicle.status || (vehicle.available ? 'available' : 'rented')) === 'available'
    };
}

function loadVehiclesFromStorage() {
    try {
        const raw = localStorage.getItem(VEHICLE_STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed.map(normalizeVehicle);
            }
        }
    } catch (error) {
    }

    saveVehiclesToStorage([]);
    return [];
}

function saveVehiclesToStorage(vehiclesToSave) {
    try {
        localStorage.setItem(VEHICLE_STORAGE_KEY, JSON.stringify(vehiclesToSave.map(toStoredVehicle)));
    } catch (error) {
    }
}

function loadSavedCars() {
    try {
        const raw = localStorage.getItem(SAVED_CARS_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        return [];
    }
}

function saveSavedCars(savedCars) {
    try {
        localStorage.setItem(SAVED_CARS_STORAGE_KEY, JSON.stringify(savedCars));
    } catch (error) {
    }
}

document.addEventListener('DOMContentLoaded', function() {
    let vehicles = [];
    let savedCars = loadSavedCars();
    let showingSaved = false;

    const searchInput = document.getElementById('searchInput');
    const filterButton = document.getElementById('filterButton');
    const filterModal = document.getElementById('filterModal');
    const closeFilter = document.getElementById('closeFilter');
    const applyFilters = document.getElementById('applyFilters');
    const clearFilters = document.getElementById('clearFilters');
    const vehiclesContainer = document.getElementById('vehiclesContainer');
    const detailModal = document.getElementById('detailModal');
    const closeDetail = document.getElementById('closeDetail');
    const profileMenu = document.getElementById('profileMenu');

    const typeFilters = document.querySelectorAll('.filter-option[data-filter="type"]');
    const transmissionFilters = document.querySelectorAll('.filter-option[data-filter="transmission"]');
    const fuelFilters = document.querySelectorAll('.filter-option[data-filter="fuel"]');
    const minPriceInput = document.getElementById('minPrice');
    const maxPriceInput = document.getElementById('maxPrice');

    let currentFilters = {
        search: '',
        types: [],
        transmissions: [],
        fuels: [],
        minPrice: '',
        maxPrice: ''
    };

    vehicles = loadVehiclesFromStorage();
    renderVehicles(vehicles);
    updateStats(vehicles);
    loadRenterProfile();
    loadRenterRentalHistory();

    searchInput.addEventListener('input', handleSearch);
    filterButton.addEventListener('click', openFilterModal);
    closeFilter.addEventListener('click', closeFilterModal);
    closeDetail.addEventListener('click', closeDetailModal);
    applyFilters.addEventListener('click', applyFiltersHandler);
    clearFilters.addEventListener('click', clearFiltersHandler);

    profileMenu.addEventListener('menu-action', (e) => {
        handleMenuAction(e.detail.action);
    });

    window.addEventListener('profileUpdated', () => {
        loadRenterProfile();
        if (document.getElementById('renter-rental-history-modal') && document.getElementById('renter-rental-history-modal').style.display === 'block') {
            loadRenterRentalHistory();
            renderRenterHistoryForUser();
        }
    });

    const myRentalsBtn = document.getElementById('myRentalsBtn');
    if (myRentalsBtn) myRentalsBtn.addEventListener('click', openRenterHistoryModal);

    const savedCard = document.getElementById('savedCardContainer');
    if (savedCard) {
        savedCard.addEventListener('click', viewSavedCars);
    }

    const closeRenterHistory = document.getElementById('closeRenterHistory');
    const closeRenterHistoryFooter = document.getElementById('closeRenterHistoryFooter');
    if (closeRenterHistory) closeRenterHistory.addEventListener('click', closeRenterHistoryModal);
    if (closeRenterHistoryFooter) closeRenterHistoryFooter.addEventListener('click', closeRenterHistoryModal);

    window.addEventListener('click', function(event) {
        if (event.target === filterModal) {
            closeFilterModal();
        }
        if (event.target === detailModal) {
            closeDetailModal();
        }
    });

    window.addEventListener('storage', (event) => {
        if (event.key === 'rentalHistory') {
            loadRenterRentalHistory();
            const historyModal = document.getElementById('renter-rental-history-modal');
            if (historyModal && historyModal.style.display === 'block') {
                renderRenterHistoryForUser();
            }
        }
        if (event.key === VEHICLE_STORAGE_KEY) {
            vehicles = loadVehiclesFromStorage();
            filterVehicles();
        }
    });

    function handleMenuAction(action) {
        switch(action) {
            case 'profile':
                navigateToPage('../pages/profile.html');
                break;
            case 'change-password':
                navigateToPage('../pages/change-password.html');
                break;
            case 'logout':
                handleLogout();
                break;
            default:
                console.log('Unknown action:', action);
        }
    }

    function navigateToPage(page) {
        window.location.href = page;
    }

    function handleLogout() {
        const confirmed = confirm('Are you sure you want to logout?');
        if (confirmed) {
            sessionStorage.clear();
            navigateToPage('../index.html');
        }
    }

    function handleSearch() {
        currentFilters.search = searchInput.value.toLowerCase();
        filterVehicles();
    }

    function openFilterModal() {
        filterModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    function closeFilterModal() {
        filterModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    function closeDetailModal() {
        detailModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    function applyFiltersHandler() {
        currentFilters.types = Array.from(typeFilters)
            .filter(option => option.classList.contains('active'))
            .map(option => option.textContent);

        currentFilters.transmissions = Array.from(transmissionFilters)
            .filter(option => option.classList.contains('active'))
            .map(option => option.textContent);

        currentFilters.fuels = Array.from(fuelFilters)
            .filter(option => option.classList.contains('active'))
            .map(option => option.textContent);

        currentFilters.minPrice = minPriceInput.value;
        currentFilters.maxPrice = maxPriceInput.value;

        filterVehicles();
        closeFilterModal();
        updateFilterBadge();
    }

    function clearFiltersHandler() {
        document.querySelectorAll('.filter-option').forEach(option => {
            option.classList.remove('active');
        });
        minPriceInput.value = '';
        maxPriceInput.value = '';

        currentFilters = {
            search: currentFilters.search,
            types: [],
            transmissions: [],
            fuels: [],
            minPrice: '',
            maxPrice: ''
        };

        filterVehicles();
        updateFilterBadge();
    }

    function filterVehicles() {
        if (showingSaved) {
            showingSaved = false;
            const savedCardElem = document.getElementById('savedCardContainer');
            if (savedCardElem) savedCardElem.classList.remove('active');
        }
        let filteredVehicles = vehicles.filter(vehicle => {
            if (currentFilters.search) {
                const searchTerm = currentFilters.search.toLowerCase();
                const name = (vehicle.name || '').toLowerCase();
                const brand = (vehicle.brand || '').toLowerCase();
                const owner = (vehicle.owner || '').toLowerCase();
                if (!name.includes(searchTerm) &&
                    !brand.includes(searchTerm) &&
                    !owner.includes(searchTerm)) {
                    return false;
                }
            }

            if (currentFilters.types.length > 0 && !currentFilters.types.includes(vehicle.type)) {
                return false;
            }

            if (currentFilters.transmissions.length > 0 && !currentFilters.transmissions.includes(vehicle.transmission)) {
                return false;
            }

            if (currentFilters.fuels.length > 0 && !currentFilters.fuels.includes(vehicle.fuel)) {
                return false;
            }

            if (currentFilters.minPrice && vehicle.price < parseInt(currentFilters.minPrice)) {
                return false;
            }
            if (currentFilters.maxPrice && vehicle.price > parseInt(currentFilters.maxPrice)) {
                return false;
            }

            return true;
        });

        renderVehicles(filteredVehicles);
        updateStats(filteredVehicles);
    }

    function updateFilterBadge() {
        const activeFilters = currentFilters.types.length + currentFilters.transmissions.length +
                             currentFilters.fuels.length +
                             (currentFilters.minPrice ? 1 : 0) + (currentFilters.maxPrice ? 1 : 0);

        const badge = document.querySelector('.filter-badge');
        if (activeFilters > 0) {
            badge.textContent = activeFilters;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }

    function viewSavedCars() {
        if (!showingSaved) {
            if (savedCars.length === 0) {
                alert('You have no saved cars yet.');
                return;
            }

            const savedVehiclesList = vehicles.filter(v => savedCars.includes(v.id));
            renderVehicles(savedVehiclesList);
            updateStats(savedVehiclesList);
            
            searchInput.value = '';
            currentFilters.search = '';

            showingSaved = true;
            if (savedCard) savedCard.classList.add('active');
        } else {
            renderVehicles(vehicles);
            updateStats(vehicles);
            showingSaved = false;
            if (savedCard) savedCard.classList.remove('active');
        }
    }

    function renderVehicles(vehiclesToRender) {
        const visibleVehicles = vehiclesToRender.filter(vehicle => vehicle.available);

        if (visibleVehicles.length === 0) {
            vehiclesContainer.innerHTML = `
                <div class="empty-container">
                    <div class="empty-emoji">🔍</div>
                    <div class="empty-text">No vehicles found</div>
                    <div class="empty-subtext">Try adjusting your search or filters</div>
                </div>
            `;
            return;
        }

        customElements.whenDefined('vehicle-card').then(() => {
            vehiclesContainer.innerHTML = '';
            visibleVehicles.forEach(vehicle => {
                const card = document.createElement('vehicle-card');
                card.setAttribute('vehicle-id', vehicle.id);
                card.setAttribute('name', vehicle.name);
                card.setAttribute('type', vehicle.type);
                card.setAttribute('price', vehicle.price);
                card.setAttribute('image', vehicle.imageUri || 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=800&q=80');
                card.setAttribute('seats', vehicle.seats);
                card.setAttribute('transmission', vehicle.transmission);
                if (vehicle.status) {
                    card.setAttribute('status', vehicle.status);
                }
                card.setAttribute('mode', 'renter');
                card.setAttribute('saved', savedCars.includes(vehicle.id) ? 'true' : 'false');
                
                card.addEventListener('vehicle-click', (e) => {
                    showVehicleDetail(e.detail.vehicleId);
                });
                
                vehiclesContainer.appendChild(card);
            });
        });
    }

    function loadRenterRentalHistory() {
        try {
            const raw = localStorage.getItem('rentalHistory');
            window._allRentalHistory = raw ? JSON.parse(raw) : [];
        } catch (e) {
            window._allRentalHistory = [];
        }
    }

    function loadRenterProfile() {
        try {
            const stored = localStorage.getItem('userProfile');
            if (!stored) return;
            const u = JSON.parse(stored);
            const name = `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Renter';
            const email = u.email || '';

            const greetingEl = document.querySelector('.greeting');
            if (greetingEl) greetingEl.textContent = `Hello, ${name} 👋`;

            const pm = document.getElementById('profileMenu');
            if (pm) pm.setAttribute('username', name);
        } catch (e) {
        }
    }

    function renderRenterHistoryForUser() {
        const listEl = document.getElementById('renter-rental-history-list');
        const emptyEl = document.getElementById('renter-rental-history-empty');
        if (!listEl) return;

        let currentUserName = '';
        let currentUserEmail = '';
        try {
            const stored = localStorage.getItem('userProfile');
            if (stored) {
                const u = JSON.parse(stored);
                currentUserName = `${u.firstName || ''} ${u.lastName || ''}`.trim();
                currentUserEmail = (u.email || '').trim();
            }
        } catch (e) {
        }

        const all = Array.isArray(window._allRentalHistory) ? window._allRentalHistory : [];
        const filtered = all.filter(r => {
            if (!r) return false;
            if (currentUserName && r.renterName && r.renterName === currentUserName) return true;
            if (currentUserEmail && (r.renterEmail && r.renterEmail === currentUserEmail)) return true;
            return false;
        });

        if (!filtered || filtered.length === 0) {
            listEl.innerHTML = '';
            if (emptyEl) emptyEl.style.display = 'block';
            return;
        }

        if (emptyEl) emptyEl.style.display = 'none';

        const html = filtered.slice().reverse().map(item => {
            const start = item.startDate ? new Date(item.startDate).toLocaleDateString() : '—';
            let endDisplay = '—';
            if (item.endDate) {
                endDisplay = new Date(item.endDate).toLocaleDateString();
            } else if (item.plannedEndDate) {
                endDisplay = `Expected: ${new Date(item.plannedEndDate).toLocaleDateString()}`;
            } else {
                endDisplay = 'Ongoing';
            }
            
            if (item.status === 'rejected') endDisplay = 'Cancelled';

            const ongoing = !item.endDate && item.status !== 'pending' && item.status !== 'rejected';
            const returnBtn = ongoing ? `<button class="btn btn-outline" onclick="requestReturn(${item.id})">Request Return</button>` : '';
            const disputeBtn = `<button class="btn btn-danger" onclick="requestDispute(${item.id})">File Dispute</button>`;
            
            let statusText = '';
            if (item.status === 'pending') statusText = ' <span style="color:#d97706;font-size:12px;font-weight:600">(Pending Approval)</span>';
            else if (item.status === 'rejected') statusText = ' <span style="color:#dc2626;font-size:12px;font-weight:600">(Rejected)</span>';
            else if (item.returnRequested) statusText = ' <span style="color:#f59e0b;font-size:12px">(Return Requested)</span>';

            return `
                <div class="history-item" style="border-bottom:1px solid #eee;padding:12px 0;">
                    <div style="display:flex;justify-content:space-between;align-items:start">
                        <div style="font-weight:600;color:#1a2c5e">${item.vehicleName}${statusText}</div>
                        <div style="font-weight:700;color:#059669">₱${(item.amount || 0).toLocaleString()}</div>
                    </div>
                    <div style="color:#666;font-size:13px;margin-top:4px">Owner: ${item.ownerName || 'Unknown'}</div>
                    <div style="color:#444;font-size:13px;margin-top:4px">
                        📅 ${start} → ${endDisplay}
                    </div>
                    <div style="margin-top:10px">${returnBtn}${disputeBtn}</div>
                </div>
            `;
        }).join('');

        listEl.innerHTML = html;
    }

    function openRenterHistoryModal() {
        loadRenterRentalHistory();
        renderRenterHistoryForUser();
        const modal = document.getElementById('renter-rental-history-modal');
        if (modal) modal.style.display = 'block';
    }

    function closeRenterHistoryModal() {
        const modal = document.getElementById('renter-rental-history-modal');
        if (modal) modal.style.display = 'none';
    }

    window.requestReturn = function(recordId) {
        try {
            const raw = localStorage.getItem('rentalHistory');
            const arr = raw ? JSON.parse(raw) : [];
            const idx = arr.findIndex(r => r.id === recordId);
            if (idx === -1) return;
            const rec = arr[idx];
            if (rec.returnRequested) {
                alert('Return already requested.');
                return;
            }
            
            const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
            const renterName = `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim() || currentUserName || 'Unknown Renter';
            
            rec.returnRequested = true;
            rec.returnRequestedAt = new Date().toISOString();
            rec.returnRequestedBy = renterName;
            arr[idx] = rec;
            localStorage.setItem('rentalHistory', JSON.stringify(arr));
            
            try{ 
                logAudit('requestReturn', `Return requested for "${rec.vehicleName}" by ${renterName}`, {
                    category: 'return_request',
                    severity: 'info'
                }); 
            }catch(e){}

            try {
                const rawV = localStorage.getItem(VEHICLE_STORAGE_KEY);
                const vArr = rawV ? JSON.parse(rawV) : [];
                const vIdx = vArr.findIndex(v => v.id === rec.vehicleId);
                if (vIdx !== -1) {
                    vArr[vIdx].pendingReturn = true;
                    localStorage.setItem(VEHICLE_STORAGE_KEY, JSON.stringify(vArr));
                }
            } catch (e) {}

            loadRenterRentalHistory();
            renderRenterHistoryForUser();
            alert('Return requested. The owner will be notified.');
        } catch (e) {
            console.error('requestReturn failed', e);
        }
    };

    window.requestDispute = function(recordId) {
        const reason = prompt('Enter a brief reason for the dispute:');
        if (!reason) {
            return; // cancelled or empty
        }
        try {
            const raw = localStorage.getItem('rentalHistory');
            const arr = raw ? JSON.parse(raw) : [];
            const idx = arr.findIndex(r => r.id === recordId);
            if (idx === -1) return;
            
            const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
            const renterName = `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim() || currentUserName || 'Unknown Renter';
            const renterEmail = userProfile.email || currentUserEmail || 'unknown@email.com';
            
            arr[idx].dispute = true;
            arr[idx].disputeReason = reason;
            arr[idx].disputeFiledAt = new Date().toISOString();
            arr[idx].disputeFiledBy = renterName;
            arr[idx].disputeFiledByEmail = renterEmail;
            arr[idx].disputeResolved = false;
            arr[idx].disputeResolutionNotes = null;
            arr[idx].disputeResolvedBy = null;
            arr[idx].disputeResolvedAt = null;
            
            localStorage.setItem('rentalHistory', JSON.stringify(arr));
            
            try{ 
                logAudit('requestDispute', `Dispute filed for "${arr[idx].vehicleName}" - ${reason}`, {
                    category: 'dispute_management',
                    severity: 'warning'
                }); 
            }catch(e){}

            loadRenterRentalHistory();
            renderRenterHistoryForUser();
            alert('Dispute submitted. Admin will review it.');
            
            try {
                const rec = arr[idx];
                sendEmail('admin@carrental.local', 'New dispute filed', `Renter ${renterName} (${renterEmail}) filed a dispute for ${rec.vehicleName||'a vehicle'}: ${reason}`);
            } catch(e){}
        } catch (e) {
            console.error('requestDispute failed', e);
        }
    };

    function updateStats(vehiclesToCount) {
        const totalVehicles = vehiclesToCount.length;
        const availableVehicles = vehiclesToCount.filter(v => v.available).length;
        const avgPrice = vehiclesToCount.length > 0
            ? Math.round(vehiclesToCount.reduce((sum, v) => sum + v.price, 0) / vehiclesToCount.length)
            : 0;

        document.getElementById('totalVehicles').textContent = totalVehicles;
        document.getElementById('availableVehicles').textContent = availableVehicles;
        document.getElementById('avgPrice').textContent = `₱${avgPrice}`;
        document.getElementById('savedVehicles').textContent = savedCars.length;
    }

    window.showVehicleDetail = function(vehicleId) {
        const vehicle = vehicles.find(v => v.id === vehicleId);
        if (!vehicle) return;
        const isSaved = savedCars.includes(vehicle.id);
        const today = new Date().toISOString().split('T')[0];

        const detailContent = document.getElementById('detailContent');
        detailContent.innerHTML = `
            <div class="detail-image-container">
                ${vehicle.imageUri ? `<img src="${vehicle.imageUri}" alt="${vehicle.name}" class="detail-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : ''}
                <div class="detail-emoji" style="${vehicle.imageUri ? 'display:none;' : ''}">${vehicle.image}</div>
            </div>
            <div class="detail-name">${vehicle.name}</div>
            <div class="detail-brand">${vehicle.brand}</div>

            <div class="detail-price-container">
                <div class="detail-price-label">Price per day</div>
                <div class="detail-price">₱${vehicle.price}</div>
            </div>

            <div class="detail-section">
                <div class="detail-section-title">Specifications</div>
                <div class="specs-grid">
                    <div class="spec-item">
                        <div class="spec-icon">👥</div>
                        <div class="spec-label">Seats</div>
                        <div class="spec-value">${vehicle.seats}</div>
                    </div>
                    <div class="spec-item">
                        <div class="spec-icon">⚙️</div>
                        <div class="spec-label">Transmission</div>
                        <div class="spec-value">${vehicle.transmission}</div>
                    </div>
                    <div class="spec-item">
                        <div class="spec-icon">⛽</div>
                        <div class="spec-label">Fuel</div>
                        <div class="spec-value">${vehicle.fuel}</div>
                    </div>
                    <div class="spec-item">
                        <div class="spec-icon">🚗</div>
                        <div class="spec-label">Type</div>
                        <div class="spec-value">${vehicle.type}</div>
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <div class="detail-section-title">Features</div>
                <div class="features-container">
                    ${vehicle.features.map(feature => `<span class="feature-tag-large"><span class="feature-text-large">${feature}</span></span>`).join('')}
                </div>
            </div>

            <div class="detail-section">
                <div class="detail-section-title">Owner</div>
                <div class="owner-info">${vehicle.owner}</div>
            </div>

            ${vehicle.available ? `
            <div class="detail-section">
                <div class="detail-section-title">Book Your Trip</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                    <div>
                        <label style="font-size: 12px; color: #64748b; display: block; margin-bottom: 4px;">Start Date</label>
                        <input type="date" id="rent-start-date" min="${today}" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px; font-family: inherit;">
                    </div>
                    <div>
                        <label style="font-size: 12px; color: #64748b; display: block; margin-bottom: 4px;">End Date</label>
                        <input type="date" id="rent-end-date" min="${today}" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px; font-family: inherit;">
                    </div>
                </div>
                <div id="rent-summary" style="display: none; background: #f0fdf4; padding: 12px; border-radius: 8px; border: 1px solid #bbf7d0; margin-bottom: 16px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span style="color: #166534; font-size: 14px;">Duration</span>
                        <span style="font-weight: 600; color: #166534; font-size: 14px;" id="rent-duration">0 days</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: #166534; font-weight: 600;">Total</span>
                        <span style="font-weight: 700; color: #15803d; font-size: 18px;" id="rent-total">₱0</span>
                    </div>
                </div>
            </div>
            ` : ''}

            ${vehicle.available
                ? '<div class="detail-actions"><button class="rent-button" onclick="rentVehicle(' + vehicle.id + ')">Rent This Vehicle</button><button class="btn btn-secondary save-car-button" onclick="saveCar(' + vehicle.id + ')">' + (isSaved ? 'Saved' : 'Save Car') + '</button></div>'
                : `<div class="unavailable-button">${vehicle.status === 'maintenance' ? 'Under Maintenance' : 'Currently Unavailable'}</div>`
            }
        `;

        if (vehicle.available) {
            const startInput = document.getElementById('rent-start-date');
            const endInput = document.getElementById('rent-end-date');
            const summaryBox = document.getElementById('rent-summary');
            const durationEl = document.getElementById('rent-duration');
            const totalEl = document.getElementById('rent-total');

            function updateCalculation() {
                if (startInput.value && endInput.value) {
                    const start = new Date(startInput.value);
                    const end = new Date(endInput.value);
                    
                    if (end >= start) {
                        let days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
                        if (days < 1) days = 1;
                        const total = days * vehicle.price;
                        
                        durationEl.textContent = `${days} day${days !== 1 ? 's' : ''}`;
                        totalEl.textContent = `₱${total.toLocaleString()}`;
                        summaryBox.style.display = 'block';
                    } else {
                        summaryBox.style.display = 'none';
                    }
                } else {
                    summaryBox.style.display = 'none';
                }
            }

            if (startInput && endInput) {
                startInput.addEventListener('change', updateCalculation);
                endInput.addEventListener('change', updateCalculation);
            }
        }

        detailModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    };

    window.rentVehicle = function(vehicleId) {
        const index = vehicles.findIndex(v => v.id === vehicleId);
        if (index === -1) return;

        const startInput = document.getElementById('rent-start-date');
        const endInput = document.getElementById('rent-end-date');
        
        if (!startInput || !endInput || !startInput.value || !endInput.value) {
            alert('Please select a start and end date for your booking.');
            return;
        }

        const startDate = new Date(startInput.value);
        const endDate = new Date(endInput.value);

        if (endDate < startDate) {
            alert('End date cannot be before start date.');
            return;
        }

        let days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        if (days < 1) days = 1;
        const totalPrice = days * (vehicles[index].price || 0);

        let renterName = '';
        let renterEmail = '';
        try {
            const stored = localStorage.getItem('userProfile');
            if (stored) {
                const u = JSON.parse(stored);
                renterName = `${u.firstName || ''} ${u.lastName || ''}`.trim();
                renterEmail = u.email || '';
            }
        } catch (e) {}

        vehicles[index] = {
            ...vehicles[index],
            status: 'pending',
            available: false,
            renterName: renterName || vehicles[index].renterName || 'Unknown',
            renterEmail: renterEmail || vehicles[index].renterEmail || '' ,
            rentStart: startDate.toISOString(),
            rentEnd: endDate.toISOString()
        };

        saveVehiclesToStorage(vehicles);

        try {
            const raw = localStorage.getItem('rentalHistory');
            const arr = raw ? JSON.parse(raw) : [];
            const rec = {
                id: Date.now(),
                vehicleId: vehicles[index].id,
                vehicleName: `${vehicles[index].brand || ''} ${vehicles[index].name || ''}`.trim() || vehicles[index].name,
                ownerName: vehicles[index].owner || '',
                renterName: vehicles[index].renterName || renterName || 'Unknown',
                renterEmail: vehicles[index].renterEmail || renterEmail || '',
                startDate: startDate.toISOString(),
                plannedEndDate: endDate.toISOString(),
                endDate: null,
                status: 'pending',
                amount: totalPrice,
                pricePerDay: vehicles[index].pricePerDay || vehicles[index].price || 0
            };
            arr.push(rec);
            localStorage.setItem('rentalHistory', JSON.stringify(arr));
            loadRenterRentalHistory(); // Immediately update in-memory history
        } catch (e) {
            console.error('Failed to write rental history', e);
        }

        filterVehicles();
        alert(`Booking request sent for ${days} day(s). Total: ₱${totalPrice.toLocaleString()}\nPlease wait for the owner to approve.`);
        closeDetailModal();
    };

    window.saveCar = function(vehicleId) {
        if (savedCars.includes(vehicleId)) {
            savedCars = savedCars.filter(id => id !== vehicleId);
            saveSavedCars(savedCars);
            alert('Car removed from saved.');
        } else {
            savedCars = [...savedCars, vehicleId];
            saveSavedCars(savedCars);
            alert('Car saved successfully.');
        }
        filterVehicles();
        closeDetailModal();
        showVehicleDetail(vehicleId);
    };

    document.querySelectorAll('.filter-option').forEach(option => {
        option.addEventListener('click', function() {
            this.classList.toggle('active');
        });
    });
});