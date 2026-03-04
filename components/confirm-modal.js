class ConfirmModal extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._resolvePromise = null;
    }

    connectedCallback() {
        this.render();
        this.attachEventListeners();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: none;
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.7);
                    z-index: 1300;
                    align-items: center;
                    justify-content: center;
                }

                :host([open]) {
                    display: flex;
                }

                .modal-content {
                    background: white;
                    border-radius: 12px;
                    padding: 24px;
                    max-width: 400px;
                    width: 90%;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.2);
                }

                .modal-message {
                    font-size: 16px;
                    color: #1a2c5e;
                    margin-bottom: 20px;
                    text-align: center;
                }

                .modal-actions {
                    display: flex;
                    gap: 10px;
                }

                .btn {
                    flex: 1;
                    padding: 12px 20px;
                    border: none;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .btn-secondary {
                    background: #e2e8f0;
                    color: #1a2c5e;
                }

                .btn-secondary:hover {
                    background: #cbd5e1;
                }

                .btn-primary {
                    background: #3F9B84;
                    color: white;
                }

                .btn-primary:hover {
                    background: #358a75;
                }
            </style>
            <div class="modal-content">
                <div class="modal-message" id="message">Are you sure?</div>
                <div class="modal-actions">
                    <button class="btn btn-secondary" id="no-btn">No</button>
                    <button class="btn btn-primary" id="yes-btn">Yes</button>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        const noBtn = this.shadowRoot.getElementById('no-btn');
        const yesBtn = this.shadowRoot.getElementById('yes-btn');

        noBtn.addEventListener('click', () => {
            this.close(false);
        });

        yesBtn.addEventListener('click', () => {
            this.close(true);
        });
    }

    show(message) {
        const messageEl = this.shadowRoot.getElementById('message');
        if (messageEl) {
            messageEl.textContent = message || 'Are you sure?';
        }
        this.setAttribute('open', '');
        
        return new Promise((resolve) => {
            this._resolvePromise = resolve;
        });
    }

    close(result) {
        this.removeAttribute('open');
        if (this._resolvePromise) {
            this._resolvePromise(result);
            this._resolvePromise = null;
        }
    }
}

customElements.define('confirm-modal', ConfirmModal);
