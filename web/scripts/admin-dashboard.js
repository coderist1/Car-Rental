// admin-dashboard.js - minimal admin controls
document.addEventListener('DOMContentLoaded', () => {
    loadAdminProfile();
    refreshAdminDashboard();

    // Refresh when profile changes
    window.addEventListener('profileUpdated', () => {
        loadAdminProfile();
    });
});

function refreshAdminDashboard() {
    renderUsers();
    // vehicles removed
    renderRentals();
    renderAnalytics();
}

function loadAdminProfile() {
    try {
        const raw = localStorage.getItem('userProfile');
        if (!raw) return;
        const u = JSON.parse(raw);
        const name = `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Admin';
        const el = document.getElementById('admin-welcome');
        if (el) el.textContent = `Welcome, ${name}`;
        const pm = document.getElementById('adminProfile');
        if (pm) pm.setAttribute('username', name);
    } catch (e) {}
}

function getUsers() {
    try {
        const raw = localStorage.getItem('carRentalUsers');
        return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
}

// vehicles are still stored in ownerVehicles even though admin doesn't manage them directly
function getAllVehicles() {
    try {
        const raw = localStorage.getItem('ownerVehicles');
        return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
}

function saveUsers(users) {
    try { localStorage.setItem('carRentalUsers', JSON.stringify(users)); } catch(e){}
}

function renderUsers(){
    const container = document.getElementById('admin-users');
    const users = getUsers();
    if(!container) return;
    if(users.length===0){ container.innerHTML = '<div class="admin-empty">No users</div>'; return; }
    const rows = users.map(u=>{
        const name = u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim();
        const active = u.active === false ? 'deactivated' : 'active';
        return `<div class="admin-row">
            <div class="admin-row-main">
                <strong class="admin-row-title">${name || 'Unnamed User'}</strong>
                <small class="admin-row-meta">${u.email || '-'} • ${u.role || 'user'} • ${active}</small>
            </div>
            <div class="admin-row-actions">
                <button class="btn btn-secondary" onclick="adminShowVehicles(${u.id})">Show Vehicles</button>
                <button class="btn btn-outline" onclick="adminToggleUser(${u.id})">${u.active === false ? 'Activate' : 'Deactivate'}</button>
                <button class="btn btn-danger" onclick="adminDeleteUser(${u.id})">Delete</button>
            </div>
        </div>`;
    }).join('');
    container.innerHTML = `<div class="admin-list">${rows}</div>`;
}

window.adminToggleUser = function(userId){
    try{
        const users = getUsers();
        const idx = users.findIndex(u=>u.id===userId);
        if(idx===-1) return;
        users[idx].active = !(users[idx].active === false);
        saveUsers(users);
        refreshAdminDashboard();
        alert('User status updated');
    }catch(e){console.error(e)}
}

window.adminDeleteUser = function(userId){
    if(!confirm('Delete user? This cannot be undone.')) return;
    try{
        let users = getUsers();
        users = users.filter(u=>u.id!==userId);
        saveUsers(users);
        refreshAdminDashboard();
        alert('User deleted');
    }catch(e){console.error(e)}
}

// show vehicles owned by a given user (matched by full name)
window.adminShowVehicles = function(userId) {
    const users = getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return;
    if (user.role !== 'owner') {
        openOwnerVehiclesModal(user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(), [], { message: 'This user is not registered as an owner.' });
        return;
    }
    const name = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim();
    const all = getAllVehicles();
    const owned = all.filter(v => {
        if (v.ownerEmail && user.email && v.ownerEmail.toLowerCase() === user.email.toLowerCase()) {
            return true;
        }
        return (v.owner || '').toLowerCase() === name.toLowerCase();
    });
    openOwnerVehiclesModal(name, owned);
}

// vehicle management removed from admin dashboard

function getRentals(){
    try{ const raw = localStorage.getItem('rentalHistory'); return raw? JSON.parse(raw): []; }catch(e){return []}
}

function saveRentals(r){ try{ localStorage.setItem('rentalHistory', JSON.stringify(r)); }catch(e){} }

function renderRentals(){
    const container = document.getElementById('admin-rentals');
    const rentals = getRentals();
    if(!container) return;
    if(rentals.length===0){ container.innerHTML = '<div class="admin-empty">No rental records</div>'; return; }
    const rows = rentals.map(r=>{
        const status = r.endDate ? 'Completed' : (r.returnRequested ? 'Return requested' : 'Ongoing');
        const pillClass = r.endDate ? 'done' : 'pending';
        return `<div class="admin-row">
            <div class="admin-row-main">
                <strong class="admin-row-title">${r.vehicleName || 'Vehicle'}</strong>
                <small class="admin-row-meta">Renter: ${r.renterName || 'N/A'} • ${status}</small>
            </div>
            <div class="admin-row-actions">
                <span class="admin-pill ${pillClass}">${status}</span>
                ${!r.endDate ? `<button class="btn btn-primary" onclick="adminForceComplete(${r.id})">Force Complete</button>` : ''}
            </div>
        </div>`;
    }).join('');
    container.innerHTML = `<div class="admin-list">${rows}</div>`;
}

window.adminForceComplete = function(recordId){
    if(!confirm('Mark this rental as completed?')) return;
    try{
        const rentals = getRentals();
        const idx = rentals.findIndex(r=>r.id===recordId);
        if(idx===-1) return;
        rentals[idx].endDate = new Date().toISOString();
        rentals[idx].returnAccepted = true;
        saveRentals(rentals);


        refreshAdminDashboard();
        alert('Rental marked completed');
    }catch(e){console.error(e)}
}

function renderAnalytics() {
    const users = getUsers();
    const rentals = getRentals();

    const totalUsers = users.length;
    const ongoingRentals = rentals.filter(r => !r.endDate).length;
    const dailyRevenue = rentals
        .filter(r => !r.endDate)
        .reduce((sum, rental) => sum + Number(rental.amount || 0), 0);

    const usersEl = document.getElementById('analytics-users');
    const rentalsEl = document.getElementById('analytics-rentals');
    const revenueEl = document.getElementById('analytics-revenue');

    if (usersEl) usersEl.textContent = String(totalUsers);
    if (rentalsEl) rentalsEl.textContent = String(ongoingRentals);
    if (revenueEl) revenueEl.textContent = `₱${dailyRevenue.toLocaleString()}`;
}

// owner vehicles modal helpers
function openOwnerVehiclesModal(ownerName, vehicles, opts = {}) {
    const modal = document.getElementById('owner-vehicles-modal');
    const nameEl = document.getElementById('modal-owner-name');
    const listEl = document.getElementById('modal-vehicle-list');
    if (nameEl) nameEl.textContent = ownerName || '';
    if (listEl) {
        if (opts.message) {
            listEl.innerHTML = `<p>${opts.message}</p>`;
        } else if (!vehicles || vehicles.length === 0) {
            listEl.innerHTML = '<p>No vehicles to display.</p>';
        } else {
            listEl.innerHTML = vehicles.map(v => {
                const label = `${v.brand||''} ${v.name||''}`.trim();
                const plate = v.plate || '-';
                const status = v.status || (v.available ? 'available' : 'rented');
                const statusClass = (status || '').toLowerCase();
                return `
                    <div class="owner-vehicle-card">
                        <div class="owner-vehicle-info">
                            <span class="owner-vehicle-name">${label || 'Unnamed'}</span>
                            <span class="owner-vehicle-plate">${plate}</span>
                        </div>
                        <span class="owner-vehicle-status ${statusClass}">${status}</span>
                    </div>
                `;
            }).join('');
        }
    }
    if (modal) modal.style.display = 'block';
}

function closeOwnerVehiclesModal() {
    const modal = document.getElementById('owner-vehicles-modal');
    if (modal) modal.style.display = 'none';
}

// close modal when clicking outside
window.addEventListener('click', (e) => {
    const modal = document.getElementById('owner-vehicles-modal');
    if (modal && e.target === modal) {
        closeOwnerVehiclesModal();
    }
});

// navigation helper (mirrors inline script)
function navigateAdmin(e) {
    e.preventDefault();
    const target = e.currentTarget.getAttribute('data-target');
    if (!target) return;

    const analyticsPanel = document.getElementById('analytics-panel');
    if (analyticsPanel) {
        analyticsPanel.classList.toggle('active', target === 'analytics-panel');
    }

    // hide all panels, then show only the selected one via active class
    document.querySelectorAll('.admin-panel').forEach(p => {
        p.classList.remove('active');
    });
    const el = document.getElementById(target);
    if (el && el.classList.contains('admin-panel')) {
        el.classList.add('active');
        // scroll into view in case panels are long
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (target === 'analytics-panel' && analyticsPanel) {
        analyticsPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
    e.currentTarget.classList.add('active');
}

// ensure initial panel state on load
window.addEventListener('DOMContentLoaded', () => {
    // show only the first panel by default
    const first = document.querySelector('.sidebar-nav a');
    if (first) first.click();
});
