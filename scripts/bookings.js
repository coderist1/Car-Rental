
class ProfileManager {
    constructor() {
        this.form = document.getElementById('profileForm');
        this.backBtn = document.getElementById('backBtn');
        this.cancelBtn = document.getElementById('cancelBtn');
        this.saveBtn = document.getElementById('saveBtn');
        this.successMessage = document.getElementById('successMessage');
        this.profilePicture = document.getElementById('profilePicture');
        this.pictureInput = document.getElementById('pictureInput');

        this.fields = {
            firstName: document.getElementById('firstName'),
            lastName: document.getElementById('lastName'),
            middleName: document.getElementById('middleName'),
            sex: document.getElementById('sex'),
            dateOfBirth: document.getElementById('dateOfBirth'),
            email: document.getElementById('email')
        };

        this.errorElements = {
            firstName: document.getElementById('firstNameError'),
            lastName: document.getElementById('lastNameError'),
            middleName: document.getElementById('middleNameError'),
            sex: document.getElementById('sexError'),
            dateOfBirth: document.getElementById('dateOfBirthError'),
            email: document.getElementById('emailError')
        };

        this.originalData = {};
        this.init();
    }

    init() {
        this.loadUserData();
        this.attachEventListeners();
    }

    attachEventListeners() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.backBtn.addEventListener('click', () => this.goBack());
        this.cancelBtn.addEventListener('click', () => this.goBack());
        this.pictureInput.addEventListener('change', (e) => this.handlePictureUpload(e));
        
        Object.values(this.fields).forEach(field => {
            field.addEventListener('input', () => {
                const errorElement = this.errorElements[field.id];
                if (errorElement) {
                    errorElement.classList.remove('show');
                    field.classList.remove('error');
                }
                this.successMessage.style.display = 'none';
            });
        });
    }

    updateProfileImageUI(imageSrc, firstName, lastName) {
        if (imageSrc) {
            this.profilePicture.innerHTML = `<img src="${imageSrc}" style="width:100%; height:100%; object-fit:cover; border-radius:50%; display:block;">`;
        } else {
            const initials = (firstName?.charAt(0) || '') + (lastName?.charAt(0) || '');
            this.profilePicture.textContent = initials.toUpperCase() || '👤';
        }
    }

    loadUserData() {
        const userData = this.getUserDataFromStorage();
        const savedPicture = localStorage.getItem('profilePicture');

        this.fields.firstName.value = userData.firstName || '';
        this.fields.lastName.value = userData.lastName || '';
        this.fields.middleName.value = userData.middleName || '';
        this.fields.sex.value = userData.sex || '';
        this.fields.dateOfBirth.value = userData.dateOfBirth || '';
        this.fields.email.value = userData.email || '';

        this.updateProfileImageUI(savedPicture, userData.firstName, userData.lastName);
        this.originalData = { ...userData };
    }

    getUserDataFromStorage() {
        const stored = localStorage.getItem('userProfile');
        return stored ? JSON.parse(stored) : { firstName: '', lastName: '', middleName: '', sex: '', dateOfBirth: '', email: '' };
    }

    handleSubmit(e) {
        e.preventDefault();
        if (!this.validateForm()) return;

        const formData = {
            firstName: this.fields.firstName.value.trim(),
            lastName: this.fields.lastName.value.trim(),
            middleName: this.fields.middleName.value.trim(),
            sex: this.fields.sex.value,
            dateOfBirth: this.fields.dateOfBirth.value,
            email: this.fields.email.value.trim()
        };

        this.saveUserData(formData);
        this.showSuccessMessage();
        this.originalData = { ...formData };

        const savedPicture = localStorage.getItem('profilePicture');
        this.updateProfileImageUI(savedPicture, formData.firstName, formData.lastName);
    }

    validateForm() {
        let isValid = true;
        Object.values(this.errorElements).forEach(el => el.classList.remove('show'));
        Object.values(this.fields).forEach(field => field.classList.remove('error'));

        if (!this.fields.firstName.value.trim()) { this.setError('firstName', 'Required'); isValid = false; }
        if (!this.fields.lastName.value.trim()) { this.setError('lastName', 'Required'); isValid = false; }
        if (!this.fields.sex.value) { this.setError('sex', 'Required'); isValid = false; }
        
        if (!this.fields.dateOfBirth.value) {
            this.setError('dateOfBirth', 'Required');
            isValid = false;
        } else {
            const age = new Date().getFullYear() - new Date(this.fields.dateOfBirth.value).getFullYear();
            if (age < 18) { this.setError('dateOfBirth', 'Must be 18+'); isValid = false; }
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(this.fields.email.value)) { this.setError('email', 'Invalid email'); isValid = false; }

        return isValid;
    }

    setError(fieldName, message) {
        this.fields[fieldName]?.classList.add('error');
        if (this.errorElements[fieldName]) {
            this.errorElements[fieldName].textContent = message;
            this.errorElements[fieldName].classList.add('show');
        }
    }

    saveUserData(data) {
        let currentProfile = JSON.parse(localStorage.getItem('userProfile')) || {};
        const updatedProfile = { ...currentProfile, ...data };
        localStorage.setItem('userProfile', JSON.stringify(updatedProfile));

        try {
            const users = JSON.parse(localStorage.getItem('carRentalUsers')) || [];
            const index = users.findIndex(u => u.id === currentProfile.id || u.email === currentProfile.email);
            if (index !== -1) {
                users[index] = { ...users[index], ...data };
                localStorage.setItem('carRentalUsers', JSON.stringify(users));
            }
        } catch (e) { console.error(e); }

        window.dispatchEvent(new CustomEvent('profileUpdated', { detail: updatedProfile }));
    }

    showSuccessMessage() {
        this.successMessage.style.display = 'flex';
        this.saveBtn.disabled = true;
        setTimeout(() => { this.saveBtn.disabled = false; }, 2000);
        setTimeout(() => { this.successMessage.style.display = 'none'; }, 5000);
    }

    handlePictureUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const imageSrc = event.target.result;
            
            localStorage.setItem('profilePicture', imageSrc);
            
            this.updateProfileImageUI(imageSrc, this.fields.firstName.value, this.fields.lastName.value);
        };
        reader.readAsDataURL(file);
    }

    goBack() {
        const currentData = {
            firstName: this.fields.firstName.value.trim(),
            lastName: this.fields.lastName.value.trim(),
            middleName: this.fields.middleName.value.trim(),
            sex: this.fields.sex.value,
            dateOfBirth: this.fields.dateOfBirth.value,
            email: this.fields.email.value.trim()
        };
        if (JSON.stringify(currentData) !== JSON.stringify(this.originalData)) {
            if (!confirm('Unsaved changes will be lost. Leave?')) return;
        }
        window.history.back();
    }
}

document.addEventListener('DOMContentLoaded', () => new ProfileManager());