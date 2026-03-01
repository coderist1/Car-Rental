// Dashboard JavaScript
// Sample data - simulating system data
const STORAGE_KEY = 'ownerVehicles';
const defaultVehicles = [
    {
        id: 2,
        name: "BMW X5",
        brand: "BMW",
        year: 2022,
        pricePerDay: 5500,
        location: "Makati",
        seats: 7,
        transmission: "Automatic",
        type: "SUV",
        fuel: "Diesel",
        plate: "ABC 1234",
        color: "White",
        status: "rented",
        available: false,
        image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80"
    },
    {
        id: 3,
        name: "Ferrari 488",
        brand: "Ferrari",
        year: 2021,
        pricePerDay: 25000,
        location: "Taguig",
        seats: 2,
        transmission: "Manual",
        type: "Sports",
        fuel: "Gasoline",
        plate: "XYZ 5678",
        color: "Red",
        status: "available",
        available: true,
        image: "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=800&q=80"
    }
];

let vehicles = [];

let editingVehicleId = null;
let showingAvailable = false; // track if we are filtering to available cars

// Initialize the dashboard
function initDashboard() {
    const storedVehicles = loadStoredVehicles();
    if (storedVehicles && storedVehicles.length > 0) {
        vehicles = storedVehicles.map(normalizeVehicle);
    } else {
        vehicles = defaultVehicles.map(normalizeVehicle);
        saveStoredVehicles();
    }
    updateStats();
    renderVehicles();
    setupSearch();

    // make available stat card clickable
    const availableCard = document.getElementById('availableCard');
    if (availableCard) {
        availableCard.addEventListener('click', viewAvailable);
    }
    // Load owner profile into header and profile menu
    loadOwnerProfile();
    // Rental history initialization
    loadRentalHistory();
}

// Rental history storage (only created when an existing vehicle is marked rented)
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
    } catch (e) { /* ignore */ }
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

// Add a rental record when an existing vehicle's status changes to 'rented'
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

// Accept a return request from renter
window.acceptReturn = function(recordId) {
    try {
        const recIndex = rentalHistory.findIndex(r => r.id === recordId);
        if (recIndex === -1) return;
        const rec = rentalHistory[recIndex];
        if (!rec.returnRequested) return;

        // Mark return accepted
        rec.returnAccepted = true;
        rec.returnAcceptedAt = new Date().toISOString();
        rec.endDate = rec.endDate || new Date().toISOString();

        rentalHistory[recIndex] = rec;
        saveRentalHistory();

        // Update vehicle availability
        const vehicleIndex = vehicles.findIndex(v => v.id === rec.vehicleId);
        if (vehicleIndex !== -1) {
            vehicles[vehicleIndex].status = 'available';
            vehicles[vehicleIndex].available = true;
            // clear pending return marker
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

// Approve a booking request
window.approveBooking = function(recordId) {
    try {
        const recIndex = rentalHistory.findIndex(r => r.id === recordId);
        if (recIndex === -1) return;
        
        // Update rental record
        rentalHistory[recIndex].status = 'active';
        saveRentalHistory();

        // Update vehicle status to rented
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

// Reject a booking request
window.rejectBooking = function(recordId) {
    if (!confirm('Reject this booking request?')) return;
    try {
        const recIndex = rentalHistory.findIndex(r => r.id === recordId);
        if (recIndex === -1) return;

        // Update rental record
        rentalHistory[recIndex].status = 'rejected';
        rentalHistory[recIndex].endDate = new Date().toISOString(); // Mark as closed
        saveRentalHistory();

        // Update vehicle status back to available
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
        available: status === 'available'
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
        // Ignore storage errors (private mode, quota).
    }
}

// Update statistics
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

// Load owner profile from storage and update header/menu
function loadOwnerProfile() {
    let name = 'Owner';
    try {
        const stored = localStorage.getItem('userProfile');
        if (stored) {
            const u = JSON.parse(stored);
            name = `${u.firstName || ''} ${u.lastName || ''}`.trim() || name;
        }
    } catch (e) {
        // ignore parse errors
    }

    const welcomeEl = document.getElementById('owner-welcome');
    if (welcomeEl) welcomeEl.textContent = `Welcome, ${name}`;

    const pm = document.getElementById('ownerProfile');
    if (pm) pm.setAttribute('username', name);
}

// rental history removed

// Render vehicles grid
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

    // Wait for custom element to be defined before rendering
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

// Open car details page: store selected vehicle and navigate
// Open car details modal: populate and show modal overlay
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
    // image
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

// Setup search functionality
function setupSearch() {
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', function() {
        // if user is typing, cancel available filter view
        if (showingAvailable) {
            showingAvailable = false;
            const availableCard = document.getElementById('availableCard');
            if (availableCard) availableCard.classList.remove('active');
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
    if (!showingAvailable) {
        const availList = vehicles.filter(v => v.available);
        renderVehicles(availList);
        updateStats(availList);
        showingAvailable = true;
        if (availableCard) availableCard.classList.add('active');
        // clear search field
        const si = document.getElementById('search-input');
        if (si) si.value = '';
    } else {
        renderVehicles();
        updateStats();
        showingAvailable = false;
        if (availableCard) availableCard.classList.remove('active');
    }
}

// Modal functions
function openAddModal() {
    editingVehicleId = null;
    document.getElementById('modal-title').textContent = 'Add New Vehicle';
    document.getElementById('vehicle-form').reset();
    const availabilitySelect = document.getElementById('vehicle-availability');
    if (availabilitySelect) availabilitySelect.value = 'available';
    // reset image preview and internal image data
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

    // Populate form
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
    // populate image preview & internal data
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

    if (!formData.name || !formData.brand || !formData.pricePerDay || !formData.location || !formData.type || !formData.transmission || !formData.fuel || !formData.plate) {
        alert('Please fill in all required fields (marked with *)');
        return;
    }

    // Ask for confirmation when editing existing vehicle
    if (editingVehicleId) {
        showConfirm('Save changes to this vehicle?').then(ok => {
            if (!ok) return; // User cancelled

            // Update existing vehicle
            const index = vehicles.findIndex(v => v.id === editingVehicleId);
            if (index === -1) return;
            const prevStatus = vehicles[index].status || (vehicles[index].available ? 'available' : 'rented');
            vehicles[index] = { ...vehicles[index], ...formData };

            // If status changed to rented, add history record
            if (prevStatus !== 'rented' && formData.status === 'rented') {
                addRentalRecord({ id: editingVehicleId, ...vehicles[index] });
            }

            saveStoredVehicles();

            updateStats();
            renderVehicles();
            closeModal();
        });
    } else {
        // Add new vehicle (no confirmation needed for new items)
        const newId = Math.max(...vehicles.map(v => v.id), 0) + 1;
        const newVehicle = { id: newId, ...formData };
        vehicles.push(newVehicle);

        // Do not automatically create rental history when adding a vehicle
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

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initDashboard);

// Update header when profile changes elsewhere
window.addEventListener('profileUpdated', (e) => {
    loadOwnerProfile();
});

// Generic showConfirm that returns a Promise<boolean>
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

// Close modal when clicking outside
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

// handle vehicle image input preview and data URL storage
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