class VehicleCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
        this.attachEventListeners();
    }

    static get observedAttributes() {
        return ['name', 'type', 'price', 'image', 'location', 'seats', 'transmission', 'mode', 'status', 'saved'];
    }

    attributeChangedCallback() {
        this.render();
        this.attachEventListeners();
    }

    render() {
        const name = this.getAttribute('name') || 'Vehicle';
        const type = this.getAttribute('type') || 'SUV';
        const price = this.getAttribute('price') || '0';
        const image = this.getAttribute('image') || '';
        const location = this.getAttribute('location') || '';
        const seats = this.getAttribute('seats') || '';
        const transmission = this.getAttribute('transmission') || '';
        const mode = this.getAttribute('mode') || 'renter'; // 'renter' or 'owner'
        const status = this.getAttribute('status') || '';
        const vehicleId = this.getAttribute('vehicle-id') || '';
        const saved = this.getAttribute('saved') === 'true';

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                }

                .vehicle-card {
                    background: white;
                    border-radius: 14px;
                    overflow: hidden;
                    box-shadow: 0 2px 10px rgba(15, 23, 42, 0.08);
                    transition: all 0.3s ease;
                    cursor: pointer;
                    border: 1px solid rgba(148, 163, 184, 0.2);
                }

                :host([mode="renter"]) .vehicle-card {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    padding: 12px;
                    align-items: stretch;
                }

                .vehicle-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 6px 16px rgba(0,0,0,0.15);
                }

                .vehicle-image {
                    width: 100%;
                    height: 200px;
                    object-fit: cover;
                    background: #f8f9fa;
                    padding: 1px;
                    display: inherit;
                    position: relative;
                }

                :host([mode="renter"]) .vehicle-image-container {
                    position: relative;
                }

                .saved-indicator {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: rgba(255, 255, 255, 0.95);
                    border-radius: 50%;
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
                }

                :host([mode="renter"]) .vehicle-image {
                    width: 100%;
                    height: 155px;
                    padding: 1px;
                    border-radius: 10px;
                    background: #f1f5f9;
                    object-fit: cover;
                    display: inherit;
                    margin: auto;
                }

                .vehicle-info {
                    padding: 16px;
                }

                :host([mode="renter"]) .vehicle-info {
                    padding: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    flex: 1;
                }

                .vehicle-name {
                    font-size: 20px;
                    font-weight: bold;
                    color: #0f172a;
                    margin-bottom: 4px;
                }

                :host([mode="renter"]) .vehicle-name {
                    font-size: 16px;
                    margin-bottom: 3px;
                    font-weight: 600;
                }

                .vehicle-type {
                    font-size: 14px;
                    color: #6b7280;
                    margin-bottom: 8px;
                }

                :host([mode="renter"]) .vehicle-type {
                    font-size: 12px;
                    margin-bottom: 3px;
                    color: #8b7b7b;
                }

                .vehicle-status {
                    display: inline-flex;
                    align-items: center;
                    padding: 4px 10px;
                    border-radius: 999px;
                    font-size: 12px;
                    font-weight: 600;
                    margin-bottom: 12px;
                    background: #e2e8f0;
                    color: #1a2c5e;
                }

                :host([mode="renter"]) .vehicle-status {
                    padding: 3px 10px;
                    font-size: 11px;
                    margin-bottom: 3px;
                }

                .status-available {
                    background: #dcfce7;
                    color: #166534;
                }

                .status-rented {
                    background: #ffedd5;
                    color: #9a3412;
                }

                .status-maintenance {
                    background: #e2e8f0;
                    color: #334155;
                }

                .status-pending {
                    background: #fff7ed;
                    color: #c2410c;
                }

                .vehicle-meta {
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                    margin-bottom: 4px;
                    font-size: 12px;
                    color: #64748b;
                }

                :host([mode="renter"]) .vehicle-meta {
                    font-size: 11px;
                    margin-bottom: 5px;
                    gap: 8px;
                    color: #888;
                }

                .vehicle-meta span {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .vehicle-price {
                    font-size: 22px;
                    font-weight: bold;
                    color: #0f766e;
                }

                :host([mode="renter"]) .vehicle-price {
                    font-size: 16px;
                    font-weight: 700;
                    margin-top: 3px;
                }

                .vehicle-actions {
                    display: flex;
                    gap: 8px;
                }

                :host([mode="renter"]) .vehicle-actions {
                    width: auto;
                }

                :host([mode="renter"]) .vehicle-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 10px;
                    margin-top: 3px;
                }

                .btn {
                    padding: 10px 16px;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    flex: 1;
                }

                :host([mode="renter"]) .btn {
                    padding: 8px 12px;
                    font-size: 12px;
                    white-space: nowrap;
                }

                .btn-primary {
                    background: #3F9B84;
                    color: white;
                }

                .btn-primary:hover {
                    background: #358a75;
                }

                .btn-secondary {
                    background: #e2e8f0;
                    color: #1a2c5e;
                }

                .btn-secondary:hover {
                    background: #cbd5e1;
                }

                .btn-danger {
                    background: #ef4444;
                    color: white;
                }

                .btn-danger:hover {
                    background: #dc2626;
                }
            </style>
            <div class="vehicle-card">
                <div style="position: relative;">
                    <img 
                        src="${image}" 
                        alt="${name}" 
                        class="vehicle-image"
                        onerror="this.src='https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=800&q=80'"
                    />
                    ${saved ? '<div class="saved-indicator">❤️</div>' : ''}
                </div>
                <div class="vehicle-info">
                    <div class="vehicle-name">${name}</div>
                    <div class="vehicle-type">${type}</div>
                    ${status ? `<div class="vehicle-status status-${status}">${status === 'maintenance' ? 'Under Maintenance' : status.charAt(0).toUpperCase() + status.slice(1)}</div>` : ''}
                    ${location || seats || transmission ? `
                        <div class="vehicle-meta">
                            ${location ? `<span>📍 ${location}</span>` : ''}
                            ${seats ? `<span>👥 ${seats} seats</span>` : ''}
                            ${transmission ? `<span>⚙️ ${transmission}</span>` : ''}
                        </div>
                    ` : ''}
                    ${mode === 'renter' ? `
                        <div class="vehicle-row">
                            <div class="vehicle-price">₱${price}/day</div>
                            <div class="vehicle-actions">
                                <button class="btn btn-primary" data-action="view">View</button>
                            </div>
                        </div>
                    ` : ''}
                </div>
                ${mode === 'renter' ? '' : `
                    <div class="vehicle-info">
                        <div class="vehicle-price">₱${price}/day</div>
                        <div class="vehicle-actions">
                            <button class="btn btn-secondary" data-action="edit">Edit</button>
                            <button class="btn btn-danger" data-action="delete">Delete</button>
                        </div>
                    </div>
                `}
            </div>
        `;
    }

    attachEventListeners() {
        const buttons = this.shadowRoot.querySelectorAll('[data-action]');
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.getAttribute('data-action');
                const rawId = this.getAttribute('vehicle-id');
                const vehicleId = rawId === null ? null : Number(rawId);
                this.dispatchEvent(new CustomEvent('vehicle-action', {
                    bubbles: true,
                    composed: true,
                    detail: {
                        action,
                        vehicleId,
                        vehicleData: {
                            name: this.getAttribute('name'),
                            type: this.getAttribute('type'),
                            price: this.getAttribute('price'),
                            image: this.getAttribute('image'),
                            location: this.getAttribute('location'),
                            seats: this.getAttribute('seats'),
                            transmission: this.getAttribute('transmission')
                        }
                    }
                }));
            });
        });

        const card = this.shadowRoot.querySelector('.vehicle-card');
        if (card) {
            card.addEventListener('click', () => {
                const rawId = this.getAttribute('vehicle-id');
                const vehicleId = rawId === null ? null : Number(rawId);
                this.dispatchEvent(new CustomEvent('vehicle-click', {
                    bubbles: true,
                    composed: true,
                    detail: {
                        vehicleId
                    }
                }));
            });
        }
    }
}

customElements.define('vehicle-card', VehicleCard);
