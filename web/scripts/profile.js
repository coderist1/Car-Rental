
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

    loadUserData() {
        const userData = this.getUserDataFromStorage();

        this.fields.firstName.value = userData.firstName || '';
        this.fields.lastName.value = userData.lastName || '';
        this.fields.middleName.value = userData.middleName || '';
        this.fields.sex.value = userData.sex || '';
        this.fields.dateOfBirth.value = userData.dateOfBirth || '';
        this.fields.email.value = userData.email || '';

        const initials = (userData.firstName?.charAt(0) || '') + 
                        (userData.lastName?.charAt(0) || '');
        this.profilePicture.textContent = initials.toUpperCase() || '👤';

        this.originalData = { ...userData };
    }

    getUserDataFromStorage() {
        const stored = localStorage.getItem('userProfile');
        if (stored) {
            return JSON.parse(stored);
        }

        return {
            firstName: '',
            lastName: '',
            middleName: '',
            sex: '',
            dateOfBirth: '',
            email: ''
        };
    }

    handleSubmit(e) {
        e.preventDefault();

        if (!this.validateForm()) {
            return;
        }

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

        const initials = (formData.firstName?.charAt(0) || '') + 
                        (formData.lastName?.charAt(0) || '');
        this.profilePicture.textContent = initials.toUpperCase() || '👤';
    }

    validateForm() {
        let isValid = true;

        Object.values(this.errorElements).forEach(el => {
            el.classList.remove('show');
        });
        Object.values(this.fields).forEach(field => {
            field.classList.remove('error');
        });

        if (!this.fields.firstName.value.trim()) {
            this.setError('firstName', 'First name is required');
            isValid = false;
        }

        if (!this.fields.lastName.value.trim()) {
            this.setError('lastName', 'Last name is required');
            isValid = false;
        }

        if (!this.fields.sex.value) {
            this.setError('sex', 'Sex is required');
            isValid = false;
        }

        if (!this.fields.dateOfBirth.value) {
            this.setError('dateOfBirth', 'Date of birth is required');
            isValid = false;
        } else {
            const birthDate = new Date(this.fields.dateOfBirth.value);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();

            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }

            if (age < 18) {
                this.setError('dateOfBirth', 'You must be at least 18 years old');
                isValid = false;
            }
        }

        if (!this.fields.email.value.trim()) {
            this.setError('email', 'Email is required');
            isValid = false;
        } else if (!this.isValidEmail(this.fields.email.value)) {
            this.setError('email', 'Please enter a valid email address');
            isValid = false;
        }

        return isValid;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    setError(fieldName, message) {
        const field = this.fields[fieldName];
        const errorElement = this.errorElements[fieldName];

        if (field) {
            field.classList.add('error');
        }
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
    }

    saveUserData(data) {
        let currentProfile = {};
        try {
            currentProfile = JSON.parse(localStorage.getItem('userProfile')) || {};
        } catch (e) {}

        const updatedProfile = { ...currentProfile, ...data };
        localStorage.setItem('userProfile', JSON.stringify(updatedProfile));

        try {
            const rawUsers = localStorage.getItem('carRentalUsers');
            if (rawUsers) {
                const users = JSON.parse(rawUsers);
                const index = users.findIndex(u => u.id === currentProfile.id || u.email === currentProfile.email);
                
                if (index !== -1) {
                    users[index] = { ...users[index], ...data };
                    localStorage.setItem('carRentalUsers', JSON.stringify(users));
                }
            }
        } catch (e) {
            console.error('Error updating main user database:', e);
        }

        window.dispatchEvent(new CustomEvent('profileUpdated', { detail: updatedProfile }));
    }

    showSuccessMessage() {
        this.successMessage.style.display = 'flex';
        this.saveBtn.disabled = true;

        setTimeout(() => {
            this.saveBtn.disabled = false;
        }, 2000);

        setTimeout(() => {
            if (this.successMessage.style.display !== 'none') {
                this.successMessage.style.display = 'none';
            }
        }, 5000);
    }

    handlePictureUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('Image size must be less than 5MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const imageSrc = event.target.result;
            localStorage.setItem('profilePicture', imageSrc);
            console.log('Picture uploaded:', imageSrc.substring(0, 50) + '...');
        };
        reader.readAsDataURL(file);

        this.pictureInput.value = '';
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

        const hasChanges = JSON.stringify(currentData) !== JSON.stringify(this.originalData);

        if (hasChanges) {
            const confirmed = confirm('You have unsaved changes. Are you sure you want to leave?');
            if (!confirmed) {
                return;
            }
        }

        window.history.back();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ProfileManager();
});