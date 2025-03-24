class SettingsUI {
    constructor(playerManager) {
        this.playerManager = playerManager;
        
        // Cache DOM elements
        this.settingsButton = document.getElementById('settings-button');
        this.settingsModal = document.getElementById('settings-modal');
        this.closeButton = this.settingsModal.querySelector('.close-button');
        this.settingsForm = document.getElementById('settings-form');
        
        // Bind event listeners
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Settings button
        this.settingsButton.addEventListener('click', () => this.showModal());
        this.closeButton.addEventListener('click', () => this.hideModal());
        this.settingsModal.addEventListener('click', e => {
            if (e.target === this.settingsModal) this.hideModal();
        });

        // Form submission
        this.settingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSettings();
        });

        // Color input preview
        const colorInput = document.getElementById('player-color');
        colorInput.addEventListener('input', (e) => {
            const color = parseInt(e.target.value.substring(1), 16);
            this.playerManager.getCurrentPlayer().updateColor(color);
        });
    }

    showModal() {
        const currentPlayer = this.playerManager.getCurrentPlayer();
        
        // Set current values
        document.getElementById('player-name').value = currentPlayer.name;
        document.getElementById('player-color').value = '#' + currentPlayer.color.toString(16).padStart(6, '0');
        
        this.settingsModal.style.display = 'block';
    }

    hideModal() {
        this.settingsModal.style.display = 'none';
    }

    saveSettings() {
        const currentPlayer = this.playerManager.getCurrentPlayer();
        const newName = document.getElementById('player-name').value.trim();
        const newColor = parseInt(document.getElementById('player-color').value.substring(1), 16);

        if (newName) {
            currentPlayer.name = newName;
            localStorage.setItem('discGolfPlayerName', newName);
        }

        currentPlayer.updateColor(newColor);
        this.hideModal();
    }
} 