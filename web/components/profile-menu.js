class ProfileMenu extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.isOpen = false;
        this._onProfileUpdated = () => this.render();
    }

    connectedCallback() {
        this.render();
        this.attachEventListeners();
        window.addEventListener('profileUpdated', this._onProfileUpdated);
    }

    disconnectedCallback() {
        window.removeEventListener('profileUpdated', this._onProfileUpdated);
    }

    render() {
        let username = 'Guest';
        let userEmail = 'user@example.com';
        
        try {
            const stored = localStorage.getItem('userProfile');
            if (stored) {
                const u = JSON.parse(stored);
                username = `${u.firstName || ''} ${u.lastName || ''}`.trim() || username;
                userEmail = u.email || userEmail;
            }
        } catch (e) {
        }

        const userInitial = (username.charAt(0) || 'U').toUpperCase();

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    position: relative;
                }

                .profile-icon-button {
                    background: linear-gradient(135deg, #ff7a59 0%, #ff9a7b 100%);
                    border: none;
                    border-radius: 50%;
                    width: 44px;
                    height: 44px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: 700;
                    font-size: 18px;
                    box-shadow: 0 2px 8px rgba(255, 122, 89, 0.3);
                    transition: all 0.3s ease;
                }

                .profile-icon-button:hover {
                    transform: scale(1.08);
                    box-shadow: 0 4px 12px rgba(255, 122, 89, 0.4);
                }

                .profile-icon-button:active {
                    transform: scale(0.95);
                }

                
                .dropdown-menu {
                    display: none;
                    position: fixed;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.15);
                    border: 1px solid rgba(148, 163, 184, 0.2);
                    min-width: 200px;
                    z-index: 1100;
                    overflow: hidden;
                    animation: slideDown 0.2s ease-out;
                }

                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-8px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                :host([open]) .dropdown-menu {
                    display: block;
                }

                .dropdown-header {
                    padding: 14px 16px;
                    border-bottom: 1px solid rgba(148, 163, 184, 0.2);
                    background: rgba(248, 250, 252, 0.8);
                }

                .user-name {
                    font-size: 14px;
                    font-weight: 600;
                    color: #0f172a;
                    margin: 0;
                }

                .user-email {
                    font-size: 12px;
                    color: #6b7280;
                    margin: 4px 0 0 0;
                }

                .dropdown-items {
                    padding: 0;
                    margin: 0;
                    list-style: none;
                }

                .dropdown-item {
                    padding: 0;
                    margin: 0;
                }

                .dropdown-link {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    border: none;
                    background: none;
                    color: #0f172a;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    width: 100%;
                    text-align: left;
                    transition: all 0.2s ease;
                    border-left: 3px solid transparent;
                }

                .dropdown-link:hover {
                    background: rgba(248, 250, 252, 0.8);
                    border-left-color: #ff7a59;
                    color: #ff7a59;
                }

                .dropdown-link-icon {
                    font-size: 16px;
                    min-width: 20px;
                }

                .dropdown-divider {
                    height: 1px;
                    background: rgba(148, 163, 184, 0.2);
                    margin: 8px 0;
                }

                .logout-link {
                    color: #ef4444;
                }

                .logout-link:hover {
                    background: rgba(239, 68, 68, 0.08);
                    border-left-color: #ef4444;
                    color: #ef4444;
                }
            </style>

            <button class="profile-icon-button" id="profile-btn">
                ${userInitial}
            </button>

            <div class="dropdown-menu" id="dropdown">
                <div class="dropdown-header">
                    <p class="user-name">${username}</p>
                    <p class="user-email">${userEmail}</p>
                </div>

                <ul class="dropdown-items">
                    <li class="dropdown-item">
                        <button class="dropdown-link" data-action="profile">
                            <span class="dropdown-link-icon">👤</span>
                            <span>My Profile</span>
                        </button>
                    </li>

                    <li class="dropdown-item">
                        <button class="dropdown-link" data-action="change-password">
                            <span class="dropdown-link-icon">🔐</span>
                            <span>Change Password</span>
                        </button>
                    </li>

                    <li class="dropdown-item">
                        <button class="dropdown-link" data-action="bookings">
                            <span class="dropdown-link-icon">📅</span>
                            <span>My Bookings</span>
                        </button>
                    </li>

                    <div class="dropdown-divider"></div>

                    <li class="dropdown-item">
                        <button class="dropdown-link logout-link" data-action="logout">
                            <span class="dropdown-link-icon">🚪</span>
                            <span>Logout</span>
                        </button>
                    </li>
                </ul>
            </div>
        `;
    }

    attachEventListeners() {
        const profileBtn = this.shadowRoot.getElementById('profile-btn');
        const dropdown = this.shadowRoot.getElementById('dropdown');
        const links = this.shadowRoot.querySelectorAll('.dropdown-link');

        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.positionDropdown(dropdown, profileBtn);
            this.toggleMenu();
        });

        links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const action = link.getAttribute('data-action');
                this.handleMenuAction(action);
            });
        });

        document.addEventListener('click', (e) => {
            if (!this.contains(e.target)) {
                this.closeMenu();
            }
        });

        window.addEventListener('resize', () => {
            if (this.isOpen) {
                this.positionDropdown(dropdown, profileBtn);
            }
        });
    }

    positionDropdown(dropdown, button) {
        const rect = button.getBoundingClientRect();
        dropdown.style.top   = `${rect.bottom + 10}px`;
        dropdown.style.right = `${window.innerWidth - rect.right}px`;
        dropdown.style.left  = 'auto';
    }

    toggleMenu() {
        if (this.isOpen) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }

    openMenu() {
        this.setAttribute('open', '');
        this.isOpen = true;
    }

    closeMenu() {
        this.removeAttribute('open');
        this.isOpen = false;
    }

    handleMenuAction(action) {
        switch(action) {
            case 'profile':
                window.location.href = './profile.html';
                break;
            case 'change-password':
                window.location.href = './change-password.html';
                break;
            case 'bookings':
                window.location.href = './bookings.html';
                break;
            case 'logout':
                this.handleLogout();
                break;
            default:
                console.warn('Unknown action:', action);
        }

        this.closeMenu();
    }

    handleLogout() {
        localStorage.removeItem('userProfile');
        localStorage.removeItem('authToken');
        
        this.dispatchEvent(new CustomEvent('logout', {
            bubbles: true,
            composed: true
        }));

        window.location.href = './login.html';
    }
}

customElements.define('profile-menu', ProfileMenu);