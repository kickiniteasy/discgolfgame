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
        
        // Update bag button style for current player
        this.updateBagButtonStyle();
    }

    setBag(bag) {
        this.bag = bag;
        this.renderContents();
        this.updateBagButtonStyle();
    }

    updateBagButtonStyle() {
        // Get current player
        if (window.playerManager) {
            const currentPlayer = window.playerManager.getCurrentPlayer();
            if (currentPlayer) {
                // Convert player color to CSS color
                const color = '#' + currentPlayer.color.toString(16).padStart(6, '0');
                this.bagButton.style.outline = `3px solid ${color}`;
                this.bagButton.style.outlineOffset = '2px';
            }
        }
    }

    initializeEventListeners() {
        // Bag button
        this.bagButton.addEventListener('click', () => {
            // Update to current player's bag before showing
            if (window.playerManager) {
                const currentPlayer = window.playerManager.getCurrentPlayer();
                if (currentPlayer) {
                    this.setBag(currentPlayer.bag);
                }
            }
            this.showModal();
        });
        
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
            const currentPlayer = window.playerManager.getCurrentPlayer();
            
            // Only allow disc selection for current player
            if (currentPlayer && currentPlayer.bag === this.bag && this.bag.selectDisc(discId)) {
                const selectedDisc = this.bag.getSelectedDisc();
                
                // Remove the old disc from the scene if it exists
                if (window.gameState && window.gameState.currentDisc) {
                    window.gameState.currentDisc.remove();
                }
                
                // Create a new disc with the selected properties
                if (window.gameState && window.scene) {
                    const newDisc = new Disc(window.scene, selectedDisc);
                    
                    // Position the disc at the current player's position
                    if (currentPlayer) {
                        const playerPos = currentPlayer.position.clone();
                        playerPos.y += 1; // Lift disc slightly above player
                        newDisc.setPosition(playerPos);
                        window.gameState.currentDisc = newDisc;
                        window.gameState.discInHand = true;
                    }
                }
                
                if (this.onDiscSelect) {
                    this.onDiscSelect(selectedDisc);
                }
                
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