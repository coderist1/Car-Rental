
class ChangePasswordManager {
    constructor() {
        this.initializeElements();
        this.validateElements();
        this.init();
    }

    initializeElements() {
        this.form = document.getElementById('passwordForm');
        this.submitBtn = document.getElementById('submitBtn');
        this.formMessage = document.getElementById('formMessage');

        this.currentPassword = document.getElementById('currentPassword');
        this.newPassword = document.getElementById('newPassword');
        this.confirmPassword = document.getElementById('confirmPassword');

        this.toggleBtns = document.querySelectorAll('.toggle-password-btn');

        this.requirements = {
            length: document.getElementById('req-length'),
            uppercase: document.getElementById('req-uppercase'),
            lowercase: document.getElementById('req-lowercase'),
            numbers: document.getElementById('req-numbers'),
            match: document.getElementById('req-match')
        };

        this.strengthBar = document.getElementById('strengthBar');
        this.strengthText = document.getElementById('strengthText');
        this.matchHint = document.getElementById('matchHint');

        this.isSubmitting = false;
    }

    validateElements() {
        const requiredElements = [
            this.form, this.submitBtn, this.formMessage,
            this.currentPassword, this.newPassword, this.confirmPassword
        ];

        const missing = requiredElements.filter(el => !el);
        if (missing.length > 0) {
            console.error('Missing elements:', missing);
        }
    }

    init() {
        this.attachEventListeners();
        this.setFocus();
    }

    attachEventListeners() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));

        this.toggleBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.togglePasswordVisibility(e));
        });

        this.currentPassword.addEventListener('blur', () => this.validateCurrentPassword());
        this.newPassword.addEventListener('input', () => this.handleNewPasswordInput());
        this.confirmPassword.addEventListener('input', () => this.updatePasswordMatch());
    }

    setFocus() {
        this.currentPassword.focus();
    }

    togglePasswordVisibility(e) {
        e.preventDefault();

        const targetId = e.currentTarget.dataset.target;
        const field = document.getElementById(targetId);

        if (field.type === 'password') {
            field.type = 'text';
            e.currentTarget.textContent = '🙈';
        } else {
            field.type = 'password';
            e.currentTarget.textContent = '👁️';
        }
    }

    handleSubmit(e) {
        e.preventDefault();

        if (this.isSubmitting) return;

        if (!this.validateForm()) {
            return;
        }

        this.submitForm();
    }

    validateForm() {
        this.clearMessage();
        let isValid = true;

        if (!this.currentPassword.value) {
            this.showMessage('Please enter your current password', 'error');
            this.currentPassword.classList.add('error');
            isValid = false;
        } else {
            this.currentPassword.classList.remove('error');
        }

        if (!this.validateNewPassword()) {
            isValid = false;
        }

        if (!this.confirmPassword.value) {
            this.showMessage('Please confirm your new password', 'error');
            this.confirmPassword.classList.add('error');
            isValid = false;
        } else if (this.newPassword.value !== this.confirmPassword.value) {
            this.showMessage('Passwords do not match', 'error');
            this.confirmPassword.classList.add('error');
            isValid = false;
        } else {
            this.confirmPassword.classList.remove('error');
        }

        if (this.currentPassword.value === this.newPassword.value) {
            this.showMessage('New password must be different from current password', 'error');
            this.newPassword.classList.add('error');
            isValid = false;
        }

        return isValid;
    }

    validateCurrentPassword() {
        let currentEmail = sessionStorage.getItem('currentUserEmail');
        if (!currentEmail) {
            try {
                const p = JSON.parse(localStorage.getItem('userProfile'));
                if (p) currentEmail = p.email;
            } catch (e) {}
        }
        const usersData = localStorage.getItem('carRentalUsers');

        if (!currentEmail || !usersData) {
            return false;
        }

        try {
            const users = JSON.parse(usersData);
            const user = users.find(u => u.email.toLowerCase() === currentEmail.toLowerCase());

            if (!user) {
                return false;
            }

            if (this.currentPassword.value === user.password) {
                this.currentPassword.classList.remove('error');
                return true;
            } else {
                this.currentPassword.classList.add('error');
                this.showMessage('Current password is incorrect', 'error');
                return false;
            }
        } catch (error) {
            console.error('Error validating current password:', error);
            return false;
        }
    }

    validateNewPassword() {
        const pwd = this.newPassword.value;
        const requirements = this.checkPasswordRequirements(pwd);

        if (!pwd) {
            this.showMessage('Please enter a new password', 'error');
            this.newPassword.classList.add('error');
            return false;
        }

        if (!requirements.length || !requirements.uppercase || !requirements.lowercase || !requirements.numbers) {
            this.showMessage('Password does not meet all requirements', 'error');
            this.newPassword.classList.add('error');
            return false;
        }

        this.newPassword.classList.remove('error');
        return true;
    }

    handleNewPasswordInput() {
        const pwd = this.newPassword.value;
        const requirements = this.checkPasswordRequirements(pwd);

        this.updateRequirements(requirements);
        this.updateStrengthMeter(pwd);
        this.updatePasswordMatch();
    }

    checkPasswordRequirements(password) {
        return {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            numbers: /[0-9]/.test(password),
            match: password === this.confirmPassword.value && password.length > 0
        };
    }

    updateRequirements(requirements) {
        this.updateRequirement('length', requirements.length);
        this.updateRequirement('uppercase', requirements.uppercase);
        this.updateRequirement('lowercase', requirements.lowercase);
        this.updateRequirement('numbers', requirements.numbers);
        this.updateRequirement('match', requirements.match);
    }

    updateRequirement(key, met) {
        const element = this.requirements[key];
        if (element) {
            if (met) {
                element.classList.add('met');
            } else {
                element.classList.remove('met');
            }
        }
    }

    updateStrengthMeter(password) {
        const strength = this.calculatePasswordStrength(password);

        this.strengthBar.className = 'strength-bar';
        this.strengthText.className = 'strength-text';

        switch (strength) {
            case 'weak':
                this.strengthBar.classList.add('weak');
                this.strengthText.classList.add('weak');
                this.strengthText.textContent = 'Weak';
                break;
            case 'fair':
                this.strengthBar.classList.add('fair');
                this.strengthText.classList.add('fair');
                this.strengthText.textContent = 'Fair';
                break;
            case 'good':
                this.strengthBar.classList.add('good');
                this.strengthText.classList.add('good');
                this.strengthText.textContent = 'Good';
                break;
            case 'strong':
                this.strengthBar.classList.add('strong');
                this.strengthText.classList.add('strong');
                this.strengthText.textContent = 'Strong';
                break;
        }
    }

    calculatePasswordStrength(password) {
        if (!password) return 'weak';

        let strength = 0;

        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength++;

        if (strength <= 1) return 'weak';
        if (strength <= 2) return 'fair';
        if (strength <= 4) return 'good';
        return 'strong';
    }

    updatePasswordMatch() {
        const pwd = this.newPassword.value;
        const confirm = this.confirmPassword.value;

        if (!pwd || !confirm) {
            this.matchHint.textContent = '';
            this.matchHint.className = '';
            return;
        }

        if (pwd === confirm) {
            this.matchHint.textContent = '✓ Passwords match';
            this.matchHint.className = 'success';
            this.confirmPassword.classList.remove('error');
        } else {
            this.matchHint.textContent = '✕ Passwords do not match';
            this.matchHint.className = 'error';
            this.confirmPassword.classList.add('error');
        }

        const requirements = this.checkPasswordRequirements(pwd);
        this.updateRequirement('match', requirements.match);
    }

    submitForm() {
        this.isSubmitting = true;
        this.submitBtn.disabled = true;
        this.submitBtn.classList.add('loading');
        this.submitBtn.textContent = 'Updating...';

        setTimeout(() => {
            if (!this.validateCurrentPassword()) {
                this.resetButtonState();
                this.isSubmitting = false;
                return;
            }

            this.updatePassword();
        }, 300);
    }

    updatePassword() {
        let currentEmail = sessionStorage.getItem('currentUserEmail');
        if (!currentEmail) {
            try {
                const p = JSON.parse(localStorage.getItem('userProfile'));
                if (p) currentEmail = p.email;
            } catch (e) {}
        }
        const usersData = localStorage.getItem('carRentalUsers');

        if (!currentEmail || !usersData) {
            this.showMessage('Session expired. Please login again', 'error');
            this.resetButtonState();
            this.isSubmitting = false;
            return;
        }

        try {
            const users = JSON.parse(usersData);
            const userIndex = users.findIndex(u => u.email.toLowerCase() === currentEmail.toLowerCase());

            if (userIndex === -1) {
                this.showMessage('User not found', 'error');
                this.resetButtonState();
                this.isSubmitting = false;
                return;
            }

            users[userIndex].password = this.newPassword.value;
            users[userIndex].updatedAt = new Date().toISOString();

            localStorage.setItem('carRentalUsers', JSON.stringify(users));

            this.showMessage('Password updated successfully', 'success');

            setTimeout(() => {
                this.form.reset();
                this.clearUI();
                this.resetButtonState();
                this.isSubmitting = false;

                window.dispatchEvent(new CustomEvent('passwordUpdated', {
                    detail: { email: currentEmail }
                }));

                setTimeout(() => {
                    window.history.back();
                }, 2000);
            }, 1500);

        } catch (error) {
            console.error('Error updating password:', error);
            this.showMessage('Error updating password. Please try again', 'error');
            this.resetButtonState();
            this.isSubmitting = false;
        }
    }

    clearUI() {
        this.strengthBar.className = 'strength-bar';
        this.strengthText.className = 'strength-text';
        this.strengthText.textContent = 'Weak';

        this.matchHint.textContent = '';
        this.matchHint.className = '';

        [this.currentPassword, this.newPassword, this.confirmPassword].forEach(field => {
            field.classList.remove('error');
        });

        Object.values(this.requirements).forEach(el => {
            el.classList.remove('met');
        });
    }

    resetButtonState() {
        this.submitBtn.classList.remove('loading');
        this.submitBtn.textContent = 'Update Password';
        this.submitBtn.disabled = false;
    }

    showMessage(message, type) {
        this.formMessage.textContent = message;
        this.formMessage.className = `form-message show ${type}`;
    }

    clearMessage() {
        this.formMessage.textContent = '';
        this.formMessage.className = 'form-message';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ChangePasswordManager();
});