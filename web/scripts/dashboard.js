const STORAGE_KEY = 'ownerVehicles';

let vehicles = [];

let editingVehicleId = null;
let showingAvailable = false; // track if we are filtering to available cars
let showingRented = false; // track if we are filtering to rented cars

let currentOwnerProfile = { name: 'Owner', email: '' };

function getCurrentOwnerProfile() {
    return currentOwnerProfile;
}

function initDashboard() {
    const storedVehicles = loadStoredVehicles();
    if (storedVehicles && storedVehicles.length > 0) {
        vehicles = storedVehicles.map(normalizeVehicle);
    } else {
        vehicles = []; // start empty if nothing stored
        saveStoredVehicles();
    }
    updateStats();
    renderVehicles();
    setupSearch();

    const availableCard = document.getElementById('availableCard');
    if (availableCard) {
        availableCard.addEventListener('click', viewAvailable);
    }
    const rentedCard = document.getElementById('rentedCard');
    if (rentedCard) {
        rentedCard.addEventListener('click', viewRented);
    }
    loadOwnerProfile();
    loadRentalHistory();
}

let rentalHistory = [];

function loadRentalHistory() {
    try {
        const raw = localStorage.getItem('rentalHistory');
        rentalHistory = raw ? JSON.parse(raw) : [];
    } catch (e) {
        rentalHistory = [];
    }
}

function saveRentalHistory() {
    try {
        localStorage.setItem('rentalHistory', JSON.stringify(rentalHistory));
    } catch (e) {  }
}

function renderRentalHistory() {
    const container = document.getElementById('rental-history-list');
    const empty = document.getElementById('rental-history-empty');
    if (!container) return;

    if (!rentalHistory || rentalHistory.length === 0) {
        container.innerHTML = '';
        if (empty) empty.style.display = 'block';
        return;
    }

    if (empty) empty.style.display = 'none';

    const html = rentalHistory.slice().reverse().map(item => {
        const start = item.startDate ? new Date(item.startDate).toLocaleString() : '—';
        const end = item.endDate ? new Date(item.endDate).toLocaleString() : 'Ongoing';
        const pending = item.returnRequested;
        const accepted = item.returnAccepted;
        
        const isPendingBooking = item.status === 'pending';
        let actions = '';
        if (isPendingBooking) {
            actions = `<div style="display:flex;gap:8px;margin-top:5px;">
                <button class="btn btn-primary" style="padding:6px 12px;font-size:13px;" onclick="approveBooking(${item.id})">Approve</button>
                <button class="btn btn-danger" style="padding:6px 12px;font-size:13px;" onclick="rejectBooking(${item.id})">Reject</button>
            </div>`;
        } else if (pending && !accepted) {
            actions = `<button class="btn btn-primary" onclick="acceptReturn(${item.id})">Accept Return</button>`;
        }

        return `
            <div class="history-item" style="border-bottom:1px solid #eee;padding:10px 0;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div style="font-weight:600">${item.vehicleName}${isPendingBooking ? ' <span style="color:#d97706;font-size:12px">(Pending Request)</span>' : (pending && !accepted ? ' (return requested)' : '')}</div>
                    <div style="color:#666;font-size:12px">₱${item.amount}/day</div>
                </div>
                <div style="color:#444;margin-top:6px">Renter: ${item.renterName || 'Unknown'}</div>
                <div style="color:#666;font-size:13px;margin-top:6px">${start} → ${end}</div>
                <div style="margin-top:8px">${actions}</div>
            </div>
        `;
    }).join('');

    container.innerHTML = html;
}

function openRentalHistoryModal() {
    loadRentalHistory();
    renderRentalHistory();
    const modal = document.getElementById('rental-history-modal');
    if (modal) modal.style.display = 'block';
}

function closeRentalHistoryModal() {
    const modal = document.getElementById('rental-history-modal');
    if (modal) modal.style.display = 'none';
}

function clearRentalHistory() {
    showConfirm('Clear all rental history? This cannot be undone.').then(ok => {
        if (!ok) return;
        rentalHistory = [];
        saveRentalHistory();
        renderRentalHistory();
    });
}

function addRentalRecord(vehicle) {
    try {
        const ownerName = (() => {
            try {
                const stored = localStorage.getItem('userProfile');
                if (!stored) return '';
                const u = JSON.parse(stored);
                return `${u.firstName || ''} ${u.lastName || ''}`.trim();
            } catch (e) { return ''; }
        })();

        const record = {
            id: Date.now(),
            vehicleId: vehicle.id || null,
            vehicleName: `${vehicle.brand || ''} ${vehicle.name || ''}`.trim() || vehicle.name || 'Vehicle',
            ownerName: ownerName,
            renterName: vehicle.renterName || 'Unknown',
            startDate: new Date().toISOString(),
            endDate: vehicle.returnDate || null,
            amount: vehicle.pricePerDay || 0
        };

        rentalHistory.push(record);
        saveRentalHistory();
    } catch (e) {
        console.error('Failed to add rental record', e);
    }
}

window.acceptReturn = function(recordId) {
    try {
        const recIndex = rentalHistory.findIndex(r => r.id === recordId);
        if (recIndex === -1) return;
        const rec = rentalHistory[recIndex];
        if (!rec.returnRequested) return;

        rec.returnAccepted = true;
        rec.returnAcceptedAt = new Date().toISOString();
        rec.endDate = rec.endDate || new Date().toISOString();

        rentalHistory[recIndex] = rec;
        saveRentalHistory();

        const vehicleIndex = vehicles.findIndex(v => v.id === rec.vehicleId);
        if (vehicleIndex !== -1) {
            vehicles[vehicleIndex].status = 'available';
            vehicles[vehicleIndex].available = true;
            delete vehicles[vehicleIndex].pendingReturn;
            saveStoredVehicles();
            updateStats();
            renderVehicles();
        }

        renderRentalHistory();
        alert('Return accepted. Vehicle is now available.');
    } catch (e) {
        console.error('acceptReturn failed', e);
    }
};

window.approveBooking = function(recordId) {
    try {
        const recIndex = rentalHistory.findIndex(r => r.id === recordId);
        if (recIndex === -1) return;
        
        rentalHistory[recIndex].status = 'active';
        saveRentalHistory();

        const vehicleIndex = vehicles.findIndex(v => v.id === rentalHistory[recIndex].vehicleId);
        if (vehicleIndex !== -1) {
            vehicles[vehicleIndex].status = 'rented';
            vehicles[vehicleIndex].available = false;
            saveStoredVehicles();
            updateStats();
            renderVehicles();
        }
        renderRentalHistory();
        alert('Booking approved.');
    } catch (e) { console.error(e); }
};

window.rejectBooking = function(recordId) {
    if (!confirm('Reject this booking request?')) return;
    try {
        const recIndex = rentalHistory.findIndex(r => r.id === recordId);
        if (recIndex === -1) return;

        rentalHistory[recIndex].status = 'rejected';
        rentalHistory[recIndex].endDate = new Date().toISOString(); // Mark as closed
        saveRentalHistory();

        const vehicleIndex = vehicles.findIndex(v => v.id === rentalHistory[recIndex].vehicleId);
        if (vehicleIndex !== -1) {
            vehicles[vehicleIndex].status = 'available';
            vehicles[vehicleIndex].available = true;
            saveStoredVehicles();
            updateStats();
            renderVehicles();
        }
        renderRentalHistory();
    } catch (e) { console.error(e); }
};

function normalizeVehicle(vehicle) {
    const status = vehicle.status || (vehicle.available ? 'available' : 'rented');
    return {
        ...vehicle,
        status,
        available: status === 'available',
        owner: vehicle.owner || '',
        ownerEmail: vehicle.ownerEmail || ''
    };
}

function loadStoredVehicles() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : null;
    } catch (err) {
        return null;
    }
}

function saveStoredVehicles() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(vehicles.map(normalizeVehicle)));
    } catch (err) {
    }
}

function updateStats(list = vehicles) {
    const total = list.length;
    const available = list.filter(v => v.available).length;
    const rented = total - available;
    const estimatedDailyEarnings = list
        .filter(v => (v.status || (v.available ? 'available' : 'rented')) === 'rented')
        .reduce((sum, vehicle) => sum + Number(vehicle.pricePerDay || 0), 0);

    document.getElementById('total-vehicles').textContent = total;
    document.getElementById('available-vehicles').textContent = available;
    document.getElementById('rented-vehicles').textContent = rented;
    const earningsEl = document.getElementById('estimated-earnings');
    if (earningsEl) earningsEl.textContent = `₱${estimatedDailyEarnings.toLocaleString()}`;
}

function loadOwnerProfile() {
    let name = 'Owner';
    let email = '';
    try {
        const stored = localStorage.getItem('userProfile');
        if (stored) {
            const u = JSON.parse(stored);
            name = `${u.firstName || ''} ${u.lastName || ''}`.trim() || name;
            email = u.email || '';
        }
    } catch (e) {
    }

    currentOwnerProfile = { name, email };

    const welcomeEl = document.getElementById('owner-welcome');
    if (welcomeEl) welcomeEl.textContent = `Welcome, ${name}`;

    const pm = document.getElementById('ownerProfile');
    if (pm) pm.setAttribute('username', name);
}


function renderVehicles(filteredVehicles = vehicles) {
    const grid = document.getElementById('vehicles-grid');

    if (filteredVehicles.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-emoji">🚗</div>
                <h3 class="empty-title">No vehicles yet</h3>
                <p class="empty-text">Add your first vehicle to start earning</p>
                <button class="btn btn-primary" onclick="openAddModal()">+ Add Vehicle</button>
            </div>
        `;
        return;
    }

    customElements.whenDefined('vehicle-card').then(() => {
        grid.innerHTML = '';
        filteredVehicles.forEach(vehicle => {
            const card = document.createElement('vehicle-card');
            card.setAttribute('vehicle-id', vehicle.id);
            card.setAttribute('name', `${vehicle.brand} ${vehicle.name}`);
            card.setAttribute('type', vehicle.type);
            card.setAttribute('price', vehicle.pricePerDay.toLocaleString());
            card.setAttribute('image', vehicle.image);
            card.setAttribute('location', vehicle.location);
            card.setAttribute('seats', vehicle.seats);
            card.setAttribute('transmission', vehicle.transmission);
            card.setAttribute('status', vehicle.status || (vehicle.available ? 'available' : 'rented'));
            card.setAttribute('mode', 'owner');
            
            card.addEventListener('vehicle-action', (e) => {
                const { action, vehicleId } = e.detail;
                if (action === 'edit') {
                    editVehicle(vehicleId);
                } else if (action === 'delete') {
                    deleteVehicle(vehicleId);
                }
            });

            card.addEventListener('vehicle-click', (e) => {
                const { vehicleId } = e.detail;
                if (vehicleId !== null && !Number.isNaN(vehicleId)) {
                    openCarDetails(vehicleId);
                }
            });
            
            grid.appendChild(card);
        });
    });
}

function openCarDetails(id){
    const vehicle = vehicles.find(v=>v.id===id);
    if(!vehicle) return;
    populateCarDetailModal(vehicle);
    showCarDetailModal();
}

function populateCarDetailModal(vehicle){
    document.getElementById('modal-car-title').textContent = `${vehicle.brand} ${vehicle.name}`;
    document.getElementById('modal-make').value = vehicle.brand || '';
    document.getElementById('modal-model').value = vehicle.name || '';
    document.getElementById('modal-year').value = vehicle.year || '';
    document.getElementById('modal-price').value = vehicle.pricePerDay || '';
    document.getElementById('modal-availability').value = vehicle.status || (vehicle.available ? 'available' : 'rented');
    if(document.getElementById('modal-location')) document.getElementById('modal-location').value = vehicle.location || 'Manila';
    document.getElementById('modal-description').value = vehicle.description || '';
    const img = document.getElementById('modal-car-image');
    if(vehicle.image) img.src = vehicle.image;

    const form = document.getElementById('modal-car-form');
    Array.from(form.elements).forEach(el => {
        el.disabled = true;
    });
}

function showCarDetailModal(){
    document.getElementById('car-detail-modal').style.display = 'block';
}

function closeCarDetailModal(){
    document.getElementById('car-detail-modal').style.display = 'none';
}

function setupSearch() {
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', function() {
        if (showingAvailable || showingRented) {
            showingAvailable = false;
            showingRented = false;
            const availableCard = document.getElementById('availableCard');
            if (availableCard) availableCard.classList.remove('active');
            const rentedCard = document.getElementById('rentedCard');
            if (rentedCard) rentedCard.classList.remove('active');
        }
        const query = this.value.toLowerCase();
        const filtered = vehicles.filter(vehicle =>
            vehicle.name.toLowerCase().includes(query) ||
            vehicle.brand.toLowerCase().includes(query)
        );
        renderVehicles(filtered);
    });
}

function viewAvailable() {
    const availableCard = document.getElementById('availableCard');
    const rentedCard = document.getElementById('rentedCard');
    if (!showingAvailable) {
        const availList = vehicles.filter(v => v.available);
        renderVehicles(availList);
        updateStats(availList);
        showingAvailable = true;
        showingRented = false;
        if (availableCard) availableCard.classList.add('active');
        if (rentedCard) rentedCard.classList.remove('active');
        const si = document.getElementById('search-input');
        if (si) si.value = '';
    } else {
        renderVehicles();
        updateStats();
        showingAvailable = false;
        if (availableCard) availableCard.classList.remove('active');
    }
}

function viewRented() {
    const rentedCard = document.getElementById('rentedCard');
    const availableCard = document.getElementById('availableCard');
    if (!showingRented) {
        const rentList = vehicles.filter(v => !v.available);
        renderVehicles(rentList);
        updateStats(rentList);
        showingRented = true;
        showingAvailable = false;
        if (rentedCard) rentedCard.classList.add('active');
        if (availableCard) availableCard.classList.remove('active');
        const si = document.getElementById('search-input');
        if (si) si.value = '';
    } else {
        renderVehicles();
        updateStats();
        showingRented = false;
        if (rentedCard) rentedCard.classList.remove('active');
    }
}

function openAddModal() {
    editingVehicleId = null;
    document.getElementById('modal-title').textContent = 'Add New Vehicle';
    document.getElementById('vehicle-form').reset();
    const availabilitySelect = document.getElementById('vehicle-availability');
    if (availabilitySelect) availabilitySelect.value = 'available';
    const preview = document.getElementById('vehicle-image-preview');
    if(preview) preview.src = '../assets/car-placeholder.jpg';
    window._vehicleImageDataUrl = null;
    document.getElementById('vehicle-modal').style.display = 'block';
}

function editVehicle(id) {
    const vehicle = vehicles.find(v => v.id === id);
    if (!vehicle) return;

    editingVehicleId = id;
    document.getElementById('modal-title').textContent = 'Edit Vehicle';

    document.getElementById('vehicle-name').value = vehicle.name;
    document.getElementById('vehicle-brand').value = vehicle.brand;
    document.getElementById('vehicle-year').value = vehicle.year;
    document.getElementById('vehicle-price').value = vehicle.pricePerDay;
    document.getElementById('vehicle-location').value = vehicle.location;
    document.getElementById('vehicle-seats').value = vehicle.seats;
    document.getElementById('vehicle-transmission').value = vehicle.transmission;
    document.getElementById('vehicle-type').value = vehicle.type;
    if (document.getElementById('vehicle-availability')) {
        document.getElementById('vehicle-availability').value = vehicle.status || (vehicle.available ? 'available' : 'rented');
    }
    if(document.getElementById('vehicle-fuel')) document.getElementById('vehicle-fuel').value = vehicle.fuel || '';
    if(document.getElementById('vehicle-plate')) document.getElementById('vehicle-plate').value = vehicle.plate || '';
    if(document.getElementById('vehicle-color')) document.getElementById('vehicle-color').value = vehicle.color || '';
    if(document.getElementById('vehicle-description')) document.getElementById('vehicle-description').value = vehicle.description || '';
    const preview = document.getElementById('vehicle-image-preview');
    if(preview && vehicle.image) preview.src = vehicle.image;
    window._vehicleImageDataUrl = vehicle.image || null;

    document.getElementById('vehicle-modal').style.display = 'block';
}

function closeModal() {
    document.getElementById('vehicle-modal').style.display = 'none';
    editingVehicleId = null;
}

function saveVehicle() {
    const formData = {
        name: document.getElementById('vehicle-name').value,
        brand: document.getElementById('vehicle-brand').value,
        year: parseInt(document.getElementById('vehicle-year').value),
        pricePerDay: parseInt(document.getElementById('vehicle-price').value),
        location: document.getElementById('vehicle-location').value,
        seats: parseInt(document.getElementById('vehicle-seats').value),
        transmission: document.getElementById('vehicle-transmission').value,
        type: document.getElementById('vehicle-type').value,
        fuel: document.getElementById('vehicle-fuel') ? document.getElementById('vehicle-fuel').value : '',
        plate: document.getElementById('vehicle-plate') ? document.getElementById('vehicle-plate').value : '',
        color: document.getElementById('vehicle-color') ? document.getElementById('vehicle-color').value : '',
        description: document.getElementById('vehicle-description') ? document.getElementById('vehicle-description').value : '',
        status: document.getElementById('vehicle-availability')
            ? document.getElementById('vehicle-availability').value
            : 'available',
        available: document.getElementById('vehicle-availability')
            ? document.getElementById('vehicle-availability').value === 'available'
            : true,
        image: window._vehicleImageDataUrl || getVehicleImage(document.getElementById('vehicle-type').value)
    };

    const ownerProfile = getCurrentOwnerProfile();
    if (ownerProfile.name) formData.owner = ownerProfile.name;
    if (ownerProfile.email) formData.ownerEmail = ownerProfile.email;

    if (!formData.name || !formData.brand || !formData.pricePerDay || !formData.location || !formData.type || !formData.transmission || !formData.fuel || !formData.plate) {
        alert('Please fill in all required fields (marked with *)');
        return;
    }

    if (editingVehicleId) {
        showConfirm('Save changes to this vehicle?').then(ok => {
            if (!ok) return; // User cancelled

            const index = vehicles.findIndex(v => v.id === editingVehicleId);
            if (index === -1) return;
            const prevStatus = vehicles[index].status || (vehicles[index].available ? 'available' : 'rented');
            if (!formData.owner) formData.owner = vehicles[index].owner;
            if (!formData.ownerEmail) formData.ownerEmail = vehicles[index].ownerEmail;
            vehicles[index] = { ...vehicles[index], ...formData };

            if (prevStatus !== 'rented' && formData.status === 'rented') {
                addRentalRecord({ id: editingVehicleId, ...vehicles[index] });
            }

            saveStoredVehicles();

            updateStats();
            renderVehicles();
            closeModal();
        });
    } else {
        const newId = Math.max(...vehicles.map(v => v.id), 0) + 1;
        const newVehicle = { id: newId, ...formData };
        vehicles.push(newVehicle);

        saveStoredVehicles();

        updateStats();
        renderVehicles();
        closeModal();
    }
}

function deleteVehicle(id) {
    showConfirm('Are you sure you want to delete this vehicle?').then(ok=>{
        if(!ok) return;
        vehicles = vehicles.filter(v => v.id !== id);
        saveStoredVehicles();
        updateStats();
        renderVehicles();
    });
}

function getVehicleImage(type){
    const imgs = {
        'Sedan': 'https://images.unsplash.com/photo-1549921296-3b6a7aa7a10b?auto=format&fit=crop&w=800&q=80',
        'SUV': 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80',
        'Sports': 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=800&q=80',
        'Pickup': 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=800&q=80',
        'Hatchback': 'https://images.unsplash.com/photo-1549921296-3b6a7aa7a10b?auto=format&fit=crop&w=800&q=80',
        'Van': 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=800&q=80',
        'MPV': 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=800&q=80',
        'Crossover': 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80',
        'Coupe': 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=800&q=80'
    };
    return imgs[type] || imgs['Sedan'];
}

document.addEventListener('DOMContentLoaded', initDashboard);

window.addEventListener('profileUpdated', (e) => {
    loadOwnerProfile();
});

function showConfirm(message){
    return customElements.whenDefined('confirm-modal').then(() => {
        const modal = document.getElementById('confirm-modal');
        if (!modal) {
            console.log('Confirm modal not found, using native confirm');
            return Promise.resolve(window.confirm(message));
        }
        return modal.show(message);
    });
}

window.onclick = function(event) {
    const addModal = document.getElementById('vehicle-modal');
    const detailModal = document.getElementById('car-detail-modal');
    if (event.target === addModal) {
        closeModal();
    }
    if (event.target === detailModal) {
        closeCarDetailModal();
    }
}

document.addEventListener('DOMContentLoaded', ()=>{
    const input = document.getElementById('vehicle-image-input');
    const preview = document.getElementById('vehicle-image-preview');
    if(!input || !preview) return;
    input.addEventListener('change', (ev)=>{
        const file = ev.target.files && ev.target.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = function(e){
            const url = e.target.result;
            preview.src = url;
            window._vehicleImageDataUrl = url; // store for saving
        };
        reader.readAsDataURL(file);
    });
});