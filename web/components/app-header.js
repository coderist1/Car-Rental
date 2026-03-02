class AppHeader extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
    }

    static get observedAttributes() {
        return ['logo', 'title', 'subtitle'];
    }

    attributeChangedCallback() {
        this.render();
    }

    render() {
        const logo = this.getAttribute('logo') || '🚗';
        const title = this.getAttribute('title') || 'CarRental';
        const subtitle = this.getAttribute('subtitle') || 'Find your perfect ride';

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    padding: 20px;
                }

                .logo {
                    font-size: 80px;
                    margin-bottom: 20px;
                }

                .title {
                    font-size: 42px;
                    font-weight: bold;
                    color: #1a2c5e;
                    margin-bottom: 10px;
                    text-align: center;
                }

                .subtitle {
                    font-size: 18px;
                    color: #6b7280;
                    text-align: center;
                }
            </style>
            <div class="logo">${logo}</div>
            <h1 class="title">${title}</h1>
            <p class="subtitle">${subtitle}</p>
        `;
    }
}

customElements.define('app-header', AppHeader);
