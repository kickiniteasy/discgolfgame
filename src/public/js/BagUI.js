class BagUI {
    constructor(bag, onDiscSelect) {
        this.bag = bag;
        this.onDiscSelect = onDiscSelect;

        // Cache DOM elements
        this.bagButton = document.getElementById('bag-button');
        this.bagModal = document.getElementById('bag-modal');
        this.closeButton = this.bagModal.querySelector('.close-button');
        this.tabButtons = this.bagModal.querySelectorAll('.tab-button');
        this.tabs = this.bagModal.querySelectorAll('.tab');
        this.discsGrid = this.bagModal.querySelector('.discs-grid');
        this.itemsGrid = this.bagModal.querySelector('.items-grid');

        // Bind event listeners
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Bag button
        this.bagButton.addEventListener('click', () => this.showModal());
        this.closeButton.addEventListener('click', () => this.hideModal());
        this.bagModal.addEventListener('click', e => {
            if (e.target === this.bagModal) this.hideModal();
        });

        // Tab switching
        this.tabButtons.forEach(button => {
            button.addEventListener('click', () => this.switchTab(button.dataset.tab));
        });

        // Disc selection
        this.discsGrid.addEventListener('click', e => {
            const gridItem = e.target.closest('.grid-item');
            if (!gridItem) return;

            const discId = gridItem.dataset.discId;
            if (this.bag.selectDisc(discId)) {
                this.onDiscSelect(this.bag.getSelectedDisc());
                this.renderContents();
                this.hideModal();
            }
        });
    }

    showModal() {
        this.bagModal.classList.add('show');
        this.renderContents();
    }

    hideModal() {
        this.bagModal.classList.remove('show');
    }

    switchTab(tabId) {
        this.tabButtons.forEach(button => {
            button.classList.toggle('active', button.dataset.tab === tabId);
        });
        this.tabs.forEach(tab => {
            tab.classList.toggle('active', tab.id === tabId + '-tab');
        });
    }

    renderContents() {
        // Render discs
        this.discsGrid.innerHTML = this.bag.discs.map(disc => `
            <div class="grid-item ${disc.id === this.bag.selectedDisc.id ? 'selected' : ''}" data-disc-id="${disc.id}">
                <img src="${disc.image}" alt="${disc.name}" />
                <div class="name">${disc.name}</div>
                <div class="stats">
                    Speed: ${disc.speed} | Glide: ${disc.glide}<br>
                    Turn: ${disc.turn} | Fade: ${disc.fade}
                </div>
            </div>
        `).join('');

        // Render items
        this.itemsGrid.innerHTML = this.bag.items.map(item => `
            <div class="grid-item" data-item-id="${item.id}">
                <img src="${item.image}" alt="${item.name}" />
                <div class="name">${item.name}</div>
                <div class="stats">${item.description}</div>
            </div>
        `).join('');
    }
} 