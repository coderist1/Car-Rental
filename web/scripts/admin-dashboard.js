// admin-dashboard.js - minimal admin controls
document.addEventListener('DOMContentLoaded', () => {
    loadAdminProfile();
    refreshAdminDashboard();

    // Refresh when profile changes
    window.addEventListener('profileUpdated', () => {
        loadAdminProfile();
    });

    // update audit panel when new entries are logged
    window.addEventListener('auditLogged', renderAudit);
});

function refreshAdminDashboard() {
    renderUsers();
    renderVehicles();
    renderApprovals();
    renderRentals();
    renderDisputes();
    renderAudit();
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

    const owners = users.filter(u=>u.role==='owner');
    const others = users.filter(u=>u.role!=='owner');

    function userRow(u) {
        const name = u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim();
        const active = u.active === false ? 'deactivated' : 'active';
        let actions = '';
        if (u.role === 'owner') {
            actions += `<button class="btn btn-secondary" onclick="adminShowVehicles(${u.id})">Show Vehicles</button>`;
        }
        // allow quick conversion to renter if not already
        if (u.role !== 'renter') {
            actions += `<button class="btn btn-outline" onclick="adminChangeRole(${u.id}, 'renter')">Make Renter</button>`;
        }
        actions += `<button class="btn btn-outline" onclick="adminToggleUser(${u.id})">${u.active === false ? 'Activate' : 'Deactivate'}</button>`;
        actions += `<button class="btn btn-danger" onclick="adminDeleteUser(${u.id})">Delete</button>`;
        return `<div class="admin-row">
            <div class="admin-row-main">
                <strong class="admin-row-title">${name || 'Unnamed User'}</strong>
                <small class="admin-row-meta">${u.email || '-'} • ${u.role || 'user'} • ${active}</small>
            </div>
            <div class="admin-row-actions">
                ${actions}
            </div>
        </div>`;
    }

    // build separate panels
    let ownerHtml = '';
    if(owners.length>0){
        ownerHtml = '<div class="admin-subsection"><h3>Owners</h3>' + owners.map(userRow).join('') + '</div>';
    }
    let userHtml = '';
    if(others.length>0){
        userHtml = '<div class="admin-subsection"><h3>Users</h3>' + others.map(userRow).join('') + '</div>';
    }

    // two distinct lists
    container.innerHTML = `
        <div class="admin-list owners-list">${ownerHtml}</div>
        <div class="admin-list users-list">${userHtml}</div>
    `;
}

window.adminToggleUser = function(userId){
    try{
        const users = getUsers();
        const idx = users.findIndex(u=>u.id===userId);
        if(idx===-1) return;
        users[idx].active = !(users[idx].active === false);
        const userName = users[idx].fullName || users[idx].email || `User ${userId}`;
        saveUsers(users);
        refreshAdminDashboard();
        alert('User status updated');
        logAudit('toggleUser', `User "${userName}" ${users[idx].active ? 'activated' : 'deactivated'}`, {
            category: 'user_management',
            severity: 'warning'
        });
    }catch(e){console.error(e)}
}

window.adminDeleteUser = function(userId){
    if(!confirm('Delete user? This cannot be undone.')) return;
    try{
        let users = getUsers();
        const userToDelete = users.find(u=>u.id===userId);
        const userName = userToDelete?.fullName || userToDelete?.email || `User ${userId}`;
        users = users.filter(u=>u.id!==userId);
        saveUsers(users);
        refreshAdminDashboard();
        alert('User deleted');
        logAudit('deleteUser', `User "${userName}" permanently deleted`, {
            category: 'user_management',
            severity: 'critical'
        });
    }catch(e){console.error(e)}
}

window.adminChangeRole = function(userId, newRole) {
    if(!confirm(`Change user role to ${newRole}?`)) return;
    try {
        const users = getUsers();
        const idx = users.findIndex(u => u.id === userId);
        if(idx === -1) return;
        const oldRole = users[idx].role;
        const userName = users[idx].fullName || users[idx].email || `User ${userId}`;
        users[idx].role = newRole;
        saveUsers(users);
        refreshAdminDashboard();
        alert('User role updated');
        logAudit('changeRole', `User "${userName}" role changed from "${oldRole}" to "${newRole}"`, {
            category: 'user_management',
            severity: 'warning'
        });
    } catch(e){ console.error(e); }
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

// vehicle management for admin

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
        const statusText = v.status || 'unknown';
        const statusClass = statusText.toLowerCase();
        return `<div class="admin-row">
            <div class="admin-row-main">
                <strong class="admin-row-title">${v.brand || ''} ${v.name || ''}</strong>
                <small class="admin-row-meta">${v.plate || '-'} • ${v.location || '-'} • <span class="admin-status-pill ${statusClass}">${statusText}</span></small>
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
        logAudit('deleteVehicle', `Vehicle ${id} removed`);
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
        const status = r.endDate ? 'Completed' : (r.returnRequested ? 'Return requested' : (r.status === 'pending' ? 'Pending Approval' : 'Ongoing'));
        const pillClass = r.endDate ? 'done' : (r.status === 'pending' ? 'pending' : 'pending');
        return `<div class="admin-row">
            <div class="admin-row-main">
                <strong class="admin-row-title">${r.vehicleName || 'Vehicle'}</strong>
                <small class="admin-row-meta">Renter: ${r.renterName || 'N/A'} • ${status}</small>
            </div>
            <div class="admin-row-actions">
                <span class="admin-pill ${pillClass}">${status}</span>
                ${!r.endDate && r.status!=='pending' ? `<button class="btn btn-primary" onclick="adminForceComplete(${r.id})">Force Complete</button>` : ''}
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
        const rental = rentals[idx];
        rentals[idx].endDate = new Date().toISOString();
        rentals[idx].returnAccepted = true;
        saveRentals(rentals);

        refreshAdminDashboard();
        alert('Rental marked completed');
        logAudit('forceCompleteRental', `Rental for "${rental.vehicleName}" by ${rental.renterName} force completed`, {
            category: 'booking_management',
            severity: 'warning'
        });
    }catch(e){console.error(e)}
}

window.adminApproveBooking = function(recordId) {
    if(!confirm('Approve this booking?')) return;
    try {
        const rentals = getRentals();
        const idx = rentals.findIndex(r=>r.id===recordId);
        if(idx===-1) return;
        const booking = rentals[idx];
        rentals[idx].status = 'approved';
        saveRentals(rentals);
        refreshAdminDashboard();
        alert('Booking approved');
        logAudit('approveBooking', `Booking for "${booking.vehicleName}" by ${booking.renterName} approved`, {
            category: 'booking_management',
            severity: 'info'
        });
    } catch(e){ console.error(e); }
}

window.adminRejectBooking = function(recordId) {
    if(!confirm('Reject this booking?')) return;
    try {
        const rentals = getRentals();
        const idx = rentals.findIndex(r=>r.id===recordId);
        if(idx===-1) return;
        const booking = rentals[idx];
        rentals[idx].status = 'rejected';
        saveRentals(rentals);
        refreshAdminDashboard();
        alert('Booking rejected');
        logAudit('rejectBooking', `Booking for "${booking.vehicleName}" by ${booking.renterName} rejected`, {
            category: 'booking_management',
            severity: 'warning'
        });
    } catch(e){ console.error(e); }
}

window.adminResolveDispute = function(recordId) {
    if(!confirm('Mark dispute as resolved?')) return;
    try {
        const rentals = getRentals();
        const idx = rentals.findIndex(r=>r.id===recordId);
        if(idx===-1) return;
        
        // Get current admin info
        const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        const adminName = `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim() || 'Admin';
        
        rentals[idx].dispute = false;
        rentals[idx].disputeResolved = true;
        rentals[idx].disputeResolvedAt = new Date().toISOString();
        rentals[idx].disputeResolvedBy = adminName;
        rentals[idx].disputeResolutionNotes = '(No notes)';
        
        saveRentals(rentals);
        refreshAdminDashboard();
        alert('Dispute resolved');
        logAudit('resolveDispute', `Dispute for ${rentals[idx].vehicleName} resolved (No notes provided)`, {
            category: 'dispute_management',
            severity: 'info'
        });
    } catch(e){ console.error(e); }
}

window.adminResolveDisputeWithNotes = function(recordId) {
    const notes = prompt('Enter resolution notes:', '');
    if(notes === null) return; // cancelled
    
    try {
        const rentals = getRentals();
        const idx = rentals.findIndex(r=>r.id===recordId);
        if(idx===-1) return;
        
        // Get current admin info
        const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        const adminName = `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim() || 'Admin';
        
        rentals[idx].dispute = false;
        rentals[idx].disputeResolved = true;
        rentals[idx].disputeResolvedAt = new Date().toISOString();
        rentals[idx].disputeResolvedBy = adminName;
        rentals[idx].disputeResolutionNotes = notes || '(No notes)';
        
        saveRentals(rentals);
        refreshAdminDashboard();
        alert('Dispute resolved');
        logAudit('resolveDispute', `Dispute for ${rentals[idx].vehicleName} resolved: ${notes}`, {
            category: 'dispute_management',
            severity: 'info'
        });
    } catch(e){ console.error(e); }
}



function renderApprovals(){
    const container = document.getElementById('approvals-panel');
    const rentals = getRentals().filter(r => r.status === 'pending');
    if(!container) return;
    if(rentals.length===0){ container.innerHTML = '<h2 class="panel-title">Approvals</h2><div class="admin-empty">No pending approvals</div>'; return; }
    const rows = rentals.map(r=>{
        return `<div class="admin-row">
            <div class="admin-row-main">
                <strong class="admin-row-title">${r.vehicleName || 'Vehicle'}</strong>
                <small class="admin-row-meta">Renter: ${r.renterName || 'N/A'} • ${r.startDate ? new Date(r.startDate).toLocaleDateString() : ''}</small>
            </div>
            <div class="admin-row-actions">
                <button class="btn btn-primary" onclick="adminApproveBooking(${r.id})">Approve</button>
                <button class="btn btn-outline" onclick="adminRejectBooking(${r.id})">Reject</button>
            </div>
        </div>`;
    }).join('');
    container.innerHTML = `<h2 class="panel-title">Approvals</h2><div class="admin-list">${rows}</div>`;
}

function renderDisputes(){
    const container = document.getElementById('admin-disputes');
    const rentals = getRentals();
    if(!container) return;
    
    // Get filter values
    const statusFilter = document.getElementById('dispute-status-filter')?.value || 'all';
    const searchFilter = document.getElementById('dispute-search-filter')?.value || '';
    
    let disputes = rentals.filter(r=>r.dispute);
    
    // Apply status filter
    if(statusFilter === 'open') {
        disputes = disputes.filter(r => !r.disputeResolved);
    } else if(statusFilter === 'resolved') {
        disputes = disputes.filter(r => r.disputeResolved);
    }
    
    // Apply search filter
    if(searchFilter) {
        const search = searchFilter.toLowerCase();
        disputes = disputes.filter(r => 
            (r.vehicleName || '').toLowerCase().includes(search) || 
            (r.renterName || '').toLowerCase().includes(search) ||
            (r.disputeReason || '').toLowerCase().includes(search)
        );
    }
    
    // Sort by filed date (newest first)
    disputes.sort((a,b) => new Date(b.disputeFiledAt || b.createdAt) - new Date(a.disputeFiledAt || a.createdAt));
    
    let filterHTML = `
        <div style="display:flex;gap:10px;margin-bottom:15px;flex-wrap:wrap;align-items:center;">
            <select id="dispute-status-filter" class="form-control" style="flex:0 1 200px;" onchange="renderDisputes()">
                <option value="all">All Disputes</option>
                <option value="open">Open Only</option>
                <option value="resolved">Resolved Only</option>
            </select>
            <input type="text" id="dispute-search-filter" class="form-control" placeholder="Search disputes..." style="flex:1;min-width:200px;" onkeyup="renderDisputes()">

        </div>
    `;
    
    if(!disputes || disputes.length===0){ 
        container.innerHTML = filterHTML + '<div class="admin-empty">No disputes found</div>'; 
        return; 
    }
    
    const rows = disputes.map(r=>{
        const isResolved = r.disputeResolved;
        const statusBadge = isResolved ? 
            `<span class="admin-pill resolved">✓ Resolved</span>` : 
            `<span class="admin-pill critical">● Open</span>`;
        const filedDate = new Date(r.disputeFiledAt || r.createdAt).toLocaleDateString();
        const resolvedInfo = isResolved ? 
            `<small class="admin-row-meta">Resolved by: ${r.disputeResolvedBy || 'Admin'} on ${new Date(r.disputeResolvedAt).toLocaleDateString()}</small>` : 
            '';
        
        return `<div class="admin-row ${isResolved ? 'resolved-dispute' : ''}">
            <div class="admin-row-main">
                <strong class="admin-row-title">${r.vehicleName || 'Vehicle'}</strong>
                <small class="admin-row-meta">Renter: ${r.renterName||'N/A'} • Filed: ${filedDate}</small>
                <div class="admin-row-meta"><strong>Issue:</strong> ${r.disputeReason||'Not specified'}</div>
                ${resolvedInfo}
                ${r.disputeResolutionNotes ? `<div class="admin-row-meta"><strong>Resolution:</strong> ${r.disputeResolutionNotes}</div>` : ''}
            </div>
            <div class="admin-row-actions">
                ${statusBadge}
                ${!isResolved ? `<button class="btn btn-primary" onclick="adminResolveDisputeWithNotes(${r.id})">Resolve</button>` : ''}
            </div>
        </div>`;
    }).join('');
    
    container.innerHTML = filterHTML + `<div class="admin-list">${rows}</div>`;
}

function renderAudit(){
    const container = document.getElementById('admin-logs');
    const logs = typeof getAuditLog === 'function' ? getAuditLog() : [];
    if(!container) return;
    
    // Get filter values
    const categoryFilter = document.getElementById('audit-category-filter')?.value || 'all';
    const searchFilter = document.getElementById('audit-search-filter')?.value || '';
    
    // Apply filters
    let filtered = logs;
    if(categoryFilter !== 'all') {
        filtered = logs.filter(l => l.category === categoryFilter);
    }
    if(searchFilter) {
        const search = searchFilter.toLowerCase();
        filtered = logs.filter(l => 
            l.action.toLowerCase().includes(search) || 
            l.details.toLowerCase().includes(search) ||
            (l.user && (l.user.name.toLowerCase().includes(search) || l.user.email.toLowerCase().includes(search)))
        );
    }
    
    // Get stats
    const stats = typeof getAuditStats === 'function' ? getAuditStats() : {};
    
    let html = `
        <div style="margin-bottom:15px;">
            <div style="display:flex;gap:10px;margin-bottom:15px;flex-wrap:wrap;align-items:center;">
                <select id="audit-category-filter" class="form-control" style="flex:0 1 200px;" onchange="renderAudit()">
                    <option value="all">All Categories</option>
                    <option value="user_management">User Management</option>
                    <option value="vehicle_management">Vehicle Management</option>
                    <option value="booking_management">Booking Management</option>
                    <option value="dispute_management">Dispute Management</option>
                    <option value="return_request">Return Requests</option>
                    <option value="other">Other</option>
                </select>
                <input type="text" id="audit-search-filter" class="form-control" placeholder="Search logs..." style="flex:1;min-width:200px;" onkeyup="renderAudit()">

                <button class="btn btn-outline" onclick="if(typeof clearAuditLog === 'function') { clearAuditLog(); renderAudit(); }">Clear Log</button>
            </div>
            <div style="display:flex;gap:15px;flex-wrap:wrap;margin-bottom:15px;padding:10px;background:#f0f0f0;border-radius:4px;font-size:13px;">
                <div><strong>Total:</strong> ${stats.totalEntries || 0}</div>
                <div><strong>Critical:</strong> ${stats.criticalCount || 0}</div>
                <div><strong>Showing:</strong> ${filtered.length}</div>
            </div>
        </div>
    `;
    
    if(!filtered || filtered.length===0){ 
        html += '<div class="admin-empty">No audit entries found</div>';
        container.innerHTML = html;
        return;
    }
    
    const rows = filtered.slice().reverse().map(l=>{
        const severityClass = (l.severity || 'info').toLowerCase();
        const categoryLabel = (l.category || 'other').replace(/_/g, ' ').toUpperCase();
        const userName = l.user ? l.user.name : 'Unknown';
        return `<div class="admin-row audit-row">
            <div class="admin-row-main">
                <strong class="admin-row-title">${l.action}</strong>
                <small class="admin-row-meta">
                    <span class="audit-category">${categoryLabel}</span> • 
                    ${new Date(l.timestamp).toLocaleString()} • 
                    <span class="audit-user">${userName}</span>
                </small>
                <div class="admin-row-meta">${l.details}</div>
            </div>
            <div class="admin-row-actions">
                <span class="admin-pill ${severityClass}">${l.severity || 'info'}</span>
            </div>
        </div>`;
    }).join('');
    
    html += `<div class="admin-list">${rows}</div>`;
    container.innerHTML = html;
}

function renderAnalytics() {
    const users = getUsers();
    const vehicles = getVehicles();
    const rentals = getRentals();
    const disputes = rentals.filter(r=>r.dispute).length;
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
    const disputesEl = document.getElementById('analytics-disputes');

    if (usersEl) usersEl.textContent = String(totalUsers);
    if (vehiclesEl) vehiclesEl.textContent = String(activeVehicles);
    if (rentalsEl) rentalsEl.textContent = String(ongoingRentals);
    if (disputesEl) disputesEl.textContent = String(disputes);
    if (revenueEl) revenueEl.textContent = `₱${dailyRevenue.toLocaleString()}`;
}

function renderAnalytics() {
    const users = getUsers();
    const vehicles = getVehicles();
    const rentals = getRentals();
    const disputes = rentals.filter(r=>r.dispute).length;

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
        const disputesEl = document.getElementById('analytics-disputes');

    if (usersEl) usersEl.textContent = String(totalUsers);
    if (vehiclesEl) vehiclesEl.textContent = String(activeVehicles);
    if (rentalsEl) rentalsEl.textContent = String(ongoingRentals);
    if (disputesEl) disputesEl.textContent = String(disputes);
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
