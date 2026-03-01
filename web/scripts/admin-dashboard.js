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
    renderVehicles();
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

function getVehicles(){
    try{ const raw = localStorage.getItem('ownerVehicles'); return raw? JSON.parse(raw): []; }catch(e){return []}
}

function saveVehicles(v){ try{ localStorage.setItem('ownerVehicles', JSON.stringify(v)); }catch(e){} }

function renderVehicles(){
    const container = document.getElementById('admin-vehicles');
    const vehicles = getVehicles();
    if(!container) return;
    if(vehicles.length===0){ container.innerHTML = '<div class="admin-empty">No vehicles</div>'; return; }
    const rows = vehicles.map(v=>{
        return `<div class="admin-row">
            <div class="admin-row-main">
                <strong class="admin-row-title">${v.brand || ''} ${v.name || ''}</strong>
                <small class="admin-row-meta">${v.plate || '-'} • ${v.location || '-'} • ${v.status || 'unknown'}</small>
            </div>
            <div class="admin-row-actions">
                <button class="btn btn-outline" onclick="adminDeleteVehicle(${v.id})">Delete</button>
            </div>
        </div>`;
    }).join('');
    container.innerHTML = `<div class="admin-list">${rows}</div>`;
}

window.adminDeleteVehicle = function(id){
    if(!confirm('Delete vehicle?')) return;
    try{
        let v = getVehicles();
        v = v.filter(x=>x.id!==id);
        saveVehicles(v);
        refreshAdminDashboard();
        alert('Vehicle deleted');
    }catch(e){console.error(e)}
}

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

        // update vehicle availability if present
        const vehicles = getVehicles();
        const vid = rentals[idx].vehicleId;
        const vIdx = vehicles.findIndex(v=>v.id===vid);
        if(vIdx!==-1){ vehicles[vIdx].status = 'available'; vehicles[vIdx].available = true; saveVehicles(vehicles); }

        refreshAdminDashboard();
        alert('Rental marked completed');
    }catch(e){console.error(e)}
}

function renderAnalytics() {
    const users = getUsers();
    const vehicles = getVehicles();
    const rentals = getRentals();

    const totalUsers = users.length;
    const activeVehicles = vehicles.filter(v => (v.status || '').toLowerCase() === 'available').length;
    const ongoingRentals = rentals.filter(r => !r.endDate).length;
    const dailyRevenue = rentals
        .filter(r => !r.endDate)
        .reduce((sum, rental) => sum + Number(rental.amount || 0), 0);

    const usersEl = document.getElementById('analytics-users');
    const vehiclesEl = document.getElementById('analytics-vehicles');
    const rentalsEl = document.getElementById('analytics-rentals');
    const revenueEl = document.getElementById('analytics-revenue');

    if (usersEl) usersEl.textContent = String(totalUsers);
    if (vehiclesEl) vehiclesEl.textContent = String(activeVehicles);
    if (rentalsEl) rentalsEl.textContent = String(ongoingRentals);
    if (revenueEl) revenueEl.textContent = `₱${dailyRevenue.toLocaleString()}`;
}
