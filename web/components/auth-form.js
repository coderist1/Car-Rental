class AuthForm extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
        this.attachEventListeners();
    }

    static get observedAttributes() {
        return ['type', 'title', 'subtitle', 'img-src'];
    }

    attributeChangedCallback() {
        this.render();
        this.attachEventListeners();
    }

    render() {
        const type = this.getAttribute('type') || 'login';
        const title = this.getAttribute('title') || 'Welcome Back';
        const subtitle = this.getAttribute('subtitle') || 'Sign in to your account';
        const imgSrc = this.getAttribute('img-src');
        const isAdmin = this.getAttribute('admin') !== null;

        const adminBadge = isAdmin ? '<div class="admin-badge">👨‍💼 ADMIN</div>' : '';
        const logoImage = imgSrc ? `<img src="${imgSrc}" class="login-logo" alt="Logo" />` : '';
        const emailPlaceholder = isAdmin ? 'Admin Email' : 'Email';

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                }

                .form-card {
                    background: white;
                    border-radius: 16px;
                    padding: 30px;
                    max-width: 400px;
                    width: 100%;
                    box-shadow: 0 6px 12px rgba(0,0,0,0.08);
                }

                .login-logo {
                    width: 120px;
                    height: 120px;
                    border-radius: 12px;
                    object-fit: cover;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    margin: 0 auto 20px;
                    display: block;
                }

                .admin-badge {
                    background: linear-gradient(135deg, #3F9B84 0%, #2d7a67 100%);
                    color: white;
                    padding: 8px 16px;
                    border-radius: 20px;
                    text-align: center;
                    font-weight: 600;
                    margin-bottom: 20px;
                    font-size: 14px;
                }

                .form-title {
                    font-size: 28px;
                    font-weight: bold;
                    color: #1a2c5e;
                    margin-bottom: 8px;
                    text-align: center;
                }

                .form-subtitle {
                    font-size: 15px;
                    color: #6b7280;
                    margin-bottom: 24px;
                    text-align: center;
                }

                .input {
                    width: 100%;
                    padding: 14px;
                    border: 1.5px solid #e2e8f0;
                    border-radius: 10px;
                    font-size: 16px;
                    margin-bottom: 16px;
                    box-sizing: border-box;
                    transition: all 0.3s ease;
                }

                .input:focus {
                    outline: none;
                    border-color: #3F9B84;
                    box-shadow: 0 0 0 3px rgba(63, 155, 132, 0.1);
                }

                .btn {
                    width: 100%;
                    padding: 14px;
                    border: none;
                    border-radius: 10px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .btn-primary {
                    background: #3F9B84;
                    color: white;
                }

                .btn-primary:hover {
                    background: #358a75;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 8px rgba(63, 155, 132, 0.3);
                }

                .btn-primary:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                }

                .demo-credentials {
                    margin-top: 20px;
                    padding: 16px;
                    background-color: #f8fafc;
                    border-radius: 10px;
                    border: 1px solid #e2e8f0;
                }

                .demo-title {
                    font-size: 13px;
                    font-weight: 600;
                    color: #1a2c5e;
                    margin-bottom: 8px;
                }

                .demo-text {
                    font-size: 12px;
                    color: #6b7280;
                    margin: 4px 0;
                }
            </style>
            <div class="form-card">
                ${logoImage}
                ${adminBadge}
                <h2 class="form-title">${title}</h2>
                <p class="form-subtitle">${subtitle}</p>

                <form id="auth-form">
                    <input
                        type="email"
                        id="email"
                        class="input"
                        placeholder="${emailPlaceholder}"
                        required
                    />

                    <input
                        type="password"
                        id="password"
                        class="input"
                        placeholder="Password"
                        required
                    />

                    <button type="submit" class="btn btn-primary" id="submit-btn">
                        ${isAdmin ? 'Admin Sign In' : 'Sign In'}
                    </button>
                </form>

                <slot name="footer"></slot>

                ${isAdmin ? `
                    <div class="demo-credentials">
                        <h4 class="demo-title">Demo Admin Credentials:</h4>
                        <p class="demo-text">admin@test.com / admin123</p>
                    </div>
                ` : `
                    <div class="demo-credentials">
                        <h4 class="demo-title">Demo Credentials:</h4>
                        <p class="demo-text">Owner: owner@test.com / password</p>
                        <p class="demo-text">Renter: renter@test.com / password</p>
                    </div>
                `}
            </div>
        `;
    }

    attachEventListeners() {
        const form = this.shadowRoot.getElementById('auth-form');
        const submitBtn = this.shadowRoot.getElementById('submit-btn');
        const errorDiv = this.shadowRoot.getElementById('error-message');
        const emailInput = this.shadowRoot.getElementById('email');
        const passwordInput = this.shadowRoot.getElementById('password');

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const email = emailInput.value;
                const password = passwordInput.value;
                const isAdmin = this.getAttribute('admin') !== null;

                if (!email || !password) {
                    this.showError('Please fill in all fields');
                    return;
                }

                submitBtn.textContent = 'Signing In...';
                submitBtn.disabled = true;

                this.dispatchEvent(new CustomEvent('auth-submit', {
                    bubbles: true,
                    composed: true,
                    detail: { email, password, isAdmin }
                }));

                setTimeout(() => {
                    submitBtn.textContent = isAdmin ? 'Admin Sign In' : 'Sign In';
                    submitBtn.disabled = false;
                }, 1000);
            });
        }
    }

    showError(message) {
        const errorDiv = this.shadowRoot.getElementById('error-message');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 3000);
        }
    }
}

customElements.define('auth-form', AuthForm);
