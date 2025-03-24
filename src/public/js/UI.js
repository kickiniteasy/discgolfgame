class UI {
    constructor() {
        // Initialize DOM elements
        this.scoreElement = document.getElementById('score');
        this.throwsElement = document.getElementById('throws');
        this.holeElement = document.getElementById('hole');
        this.distanceEl = document.getElementById('distance');
        this.powerFill = document.querySelector('.throw-progress-fill');
        this.messageDisplay = document.getElementById('message');
        this.uiContainer = document.getElementById('ui');
        this.throwButton = document.getElementById('throw-button');
        
        // Players modal elements
        this.playersButton = document.getElementById('players-button');
        this.playersModal = document.getElementById('players-modal');
        this.playersList = document.getElementById('players-list');
        
        // Initialize modals
        this.initializePlayersModal();
    }

    initializePlayersModal() {
        // Show modal on button click
        this.playersButton.addEventListener('click', () => {
            this.playersModal.style.display = 'block';
        });

        // Close modal when clicking close button
        const closeButton = this.playersModal.querySelector('.close-button');
        closeButton.addEventListener('click', () => {
            this.playersModal.style.display = 'none';
        });

        // Close modal when clicking outside
        this.playersModal.addEventListener('click', (e) => {
            if (e.target === this.playersModal) {
                this.playersModal.style.display = 'none';
            }
        });
    }

    updateScoreboard(players) {
        if (!this.playersList) return;

        this.playersList.innerHTML = players.map(player => `
            <div class="player-score ${player.isCurrentTurn ? 'current-turn' : ''}">
                <div class="player-name" style="color: #${player.color.toString(16).padStart(6, '0')}">${player.name}</div>
                <div class="player-stats">
                    <span>Score: ${player.score}</span>
                    <span>Throws: ${player.throws}</span>
                </div>
            </div>
        `).join('');

        // Update current player indicator on button
        const currentPlayer = players.find(p => p.isCurrentTurn);
        if (currentPlayer) {
            this.playersButton.style.borderColor = `#${currentPlayer.color.toString(16).padStart(6, '0')}`;
        }
    }

    showMessage(text, duration = 2000) {
        if (!this.messageDisplay) return;
        this.messageDisplay.textContent = text;
        this.messageDisplay.style.display = 'block';
        setTimeout(() => {
            this.messageDisplay.style.display = 'none';
        }, duration);
    }

    updateDistance(distance) {
        if (!this.distanceEl) return;
        this.distanceEl.textContent = Math.round(distance * 10) / 10;
    }

    updateHole(holeNumber) {
        if (!this.holeElement) return;
        this.holeElement.textContent = holeNumber;
    }

    // Power meter methods
    updatePowerMeter(power) {
        if (!this.powerFill) return;
        const circumference = 2 * Math.PI * 45;
        const offset = circumference - (power / 100) * circumference;
        this.powerFill.style.strokeDashoffset = offset;
    }

    hidePowerMeter() {
        if (!this.throwButton) return;
        this.throwButton.classList.remove('throwing');
        this.updatePowerMeter(0); // Reset the power meter visual to 0
    }

    showPowerMeter() {
        if (!this.throwButton) return;
        this.throwButton.classList.add('throwing');
        this.updatePowerMeter(0); // Start with power at 0
    }

    resetPowerMeter() {
        this.hidePowerMeter();
        this.updatePowerMeter(0);
    }

    // Score and game state updates
    updateScore(score) {
        if (!this.scoreElement) return;
        this.scoreElement.textContent = score;
    }

    updateThrows(throws) {
        if (!this.throwsElement) return;
        this.throwsElement.textContent = throws;
    }

    setOnDiscChange(callback) {
        this.onDiscChangeCallback = callback;
    }
}