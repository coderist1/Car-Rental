document.addEventListener('DOMContentLoaded', function () {

    let state = {
        selectedRole:    'owner',
        firstName:       '',
        lastName:        '',
        middleName:      '',
        sex:             '',
        dateOfBirth:     '',
        email:           '',
        password:        '',
        confirmPassword: '',
        error:           '',
        loading:         false
    };

    const roleOwnerBtn     = document.getElementById('roleOwner');
    const roleRenterBtn    = document.getElementById('roleRenter');
    const firstNameInput   = document.getElementById('firstName');
    const lastNameInput    = document.getElementById('lastName');
    const middleNameInput  = document.getElementById('middleName');
    const sexSelect        = document.getElementById('sex');
    const dobInput         = document.getElementById('dateOfBirth');
    const emailInput       = document.getElementById('email');
    const passwordInput    = document.getElementById('password');
    const confirmPwInput   = document.getElementById('confirmPassword');
    const registerForm     = document.getElementById('registerForm');
    const submitBtn        = document.getElementById('submitBtn');
    const errorMessage     = document.getElementById('errorMessage');

    function calculateAge(dobString) {
        if (!dobString) return null;
        const today = new Date();
        const dob   = new Date(dobString);
        let age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
            age--;
        }
        return age;
    }

    dobInput.max = new Date().toISOString().split('T')[0];

    function setState(partial) {
        state = { ...state, ...partial };
        render();
    }

    function render() {
        roleOwnerBtn.classList.toggle('active', state.selectedRole === 'owner');
        roleRenterBtn.classList.toggle('active', state.selectedRole === 'renter');

        if (state.error) {
            errorMessage.textContent = state.error;
            errorMessage.style.display = 'block';
        } else {
            errorMessage.style.display = 'none';
        }

        submitBtn.textContent = state.loading ? 'Creating Account...' : 'Create Account';
        submitBtn.disabled    = state.loading;
    }

    function validate() {
        if (!state.firstName.trim())
            return 'First name is required.';
        if (!state.lastName.trim())
            return 'Last name is required.';
        if (!state.sex)
            return 'Please select your sex.';
        if (!state.dateOfBirth)
            return 'Date of birth is required.';
        if (state.age === null || state.age < 0)
            return 'Please enter a valid date of birth.';
        if (state.age < 18)
            return 'You must be at least 18 years old to register.';
        if (!state.email.trim())
            return 'Email is required.';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(state.email))
            return 'Please enter a valid email address.';
        if (state.password.length < 6)
            return 'Password must be at least 6 characters.';
        if (state.password !== state.confirmPassword)
            return 'Passwords do not match.';
        return null;
    }

    function getUsers() {
        const raw = localStorage.getItem('carRentalUsers');
        if (!raw) return [];
        try { return JSON.parse(raw); } catch { return []; }
    }

    function saveUser(user) {
        const users = getUsers();
        users.push(user);
        localStorage.setItem('carRentalUsers', JSON.stringify(users));
    }

    roleOwnerBtn.addEventListener('click', function () {
        setState({ selectedRole: 'owner', error: '' });
    });
    roleRenterBtn.addEventListener('click', function () {
        setState({ selectedRole: 'renter', error: '' });
    });

    firstNameInput.addEventListener('input', function () {
        setState({ firstName: this.value, error: '' });
    });
    lastNameInput.addEventListener('input', function () {
        setState({ lastName: this.value, error: '' });
    });
    middleNameInput.addEventListener('input', function () {
        setState({ middleName: this.value });
    });
    sexSelect.addEventListener('change', function () {
        setState({ sex: this.value, error: '' });
    });

    dobInput.addEventListener('change', function () {
        const dob = this.value;
        const age = calculateAge(dob);
        setState({ dateOfBirth: dob, age: age, error: '' });
    });

    emailInput.addEventListener('input', function () {
        setState({ email: this.value, error: '' });
    });
    passwordInput.addEventListener('input', function () {
        setState({ password: this.value, error: '' });
    });
    confirmPwInput.addEventListener('input', function () {
        setState({ confirmPassword: this.value, error: '' });
    });

    registerForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const validationError = validate();
        if (validationError) {
            setState({ error: validationError });
            return;
        }

        const existingUsers = getUsers();
        const emailTaken = existingUsers.some(
            u => u.email.toLowerCase() === state.email.toLowerCase()
        );
        if (emailTaken) {
            setState({ error: 'An account with this email already exists.' });
            return;
        }

        setState({ loading: true, error: '' });

        setTimeout(function () {
            const newUser = {
                id:           Date.now(),
                firstName:    state.firstName.trim(),
                lastName:     state.lastName.trim(),
                middleName:   state.middleName.trim(),
                fullName:     [state.firstName.trim(), state.middleName.trim(), state.lastName.trim()]
                                  .filter(Boolean).join(' '),
                sex:          state.sex,
                dateOfBirth:  state.dateOfBirth,
                age:          calculateAge(state.dateOfBirth),
                email:        state.email.trim().toLowerCase(),
                password:     state.password,
                role:         state.selectedRole,
                createdAt:    new Date().toISOString()
            };

            saveUser(newUser);
            try {
                const profile = {
                    id: newUser.id,
                    firstName: newUser.firstName,
                    lastName: newUser.lastName,
                    middleName: newUser.middleName,
                    fullName: newUser.fullName,
                    email: newUser.email,
                    sex: newUser.sex,
                    dateOfBirth: newUser.dateOfBirth,
                    role: newUser.role,
                    createdAt: newUser.createdAt
                };
                localStorage.setItem('userProfile', JSON.stringify(profile));
                localStorage.setItem('authToken', String(newUser.id));
                window.dispatchEvent(new CustomEvent('profileUpdated', { detail: profile }));
            } catch (e) {
            }
            setState({ loading: false });

            if (state.selectedRole === 'owner') {
                window.location.href = 'dashboard.html';
            } else {
                window.location.href = 'renter-dashboard.html';
            }
        }, 800);
    });

    render();
});