document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('admin-register-form');
    const errorDiv = document.getElementById('errorMessage');
    if (!form) return;

    const ADMIN_REG_KEY = 'ADMIN2026';

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (errorDiv) errorDiv.style.display = 'none';

        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const email = document.getElementById('email').value.trim().toLowerCase();
        const password = document.getElementById('password').value;
        const adminKey = document.getElementById('adminKey').value;

        const showError = (msg) => {
            if (errorDiv) {
                errorDiv.textContent = msg;
                errorDiv.style.display = 'block';
            } else {
                alert(msg);
            }
        };

        if (!firstName || !lastName || !email || !password) {
            showError('Please fill all required fields');
            return;
        }

        if (password.length < 6) {
            showError('Password must be at least 6 characters');
            return;
        }

        if (adminKey !== ADMIN_REG_KEY) {
            showError('Invalid admin key');
            return;
        }

        let users = [];
        try { users = JSON.parse(localStorage.getItem('carRentalUsers')) || []; } catch (e) { users = []; }

        if (users.some(u => (u.email||'').toLowerCase() === email)) {
            showError('An account with this email already exists');
            return;
        }

        const id = Date.now();
        const newUser = {
            id,
            firstName,
            lastName,
            fullName: (firstName + ' ' + lastName).trim(),
            email,
            password, // stored plainly for this demo (no backend)
            role: 'admin',
            active: true,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        try { localStorage.setItem('carRentalUsers', JSON.stringify(users)); } catch (e) { console.error(e); }

        const userProfile = {
            id,
            firstName,
            lastName,
            email,
            role: 'admin'
        };
        try { localStorage.setItem('userProfile', JSON.stringify(userProfile)); } catch(e){}
        try { localStorage.setItem('authToken', 'token-' + id); } catch(e){}

        try { window.dispatchEvent(new Event('profileUpdated')); } catch(e){}

        alert('Admin account created successfully!');
        window.location.href = 'admin-dashboard.html';
    });
});

