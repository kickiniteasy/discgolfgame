class UI {
    constructor() {
        // Initialize DOM elements
        this.scoreElement = document.getElementById('score');
        this.throwsElement = document.getElementById('throws');
        this.holeElement = document.getElementById('hole');
        this.totalHolesElement = document.getElementById('total-holes');
        this.distanceEl = document.getElementById('distance');
        this.powerFill = document.querySelector('.throw-progress-fill');
        this.messageDisplay = document.getElementById('message');
        this.uiContainer = document.getElementById('ui');
        this.throwButton = document.getElementById('throw-button');
        
        // Players modal elements
        this.playersButton = document.getElementById('players-button');
        this.playersModal = document.getElementById('players-modal');
        this.playersList = document.getElementById('players-list');
        
        // Camera control elements
        this.resetCameraButton = document.getElementById('reset-camera-button');
        this.showHoleButton = document.getElementById('show-hole-button');
        
        // Throw button state
        this.throwTouchActive = false;
        this.onStartThrow = null;
        this.onThrow = null;
        this.canThrow = () => true; // Default to always allowing throws

        // Initialize modals and controls
        this.initializePlayersModal();
        this.initializeThrowControls();
        this.initializeCameraControls();
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

    initializeThrowControls() {
        // Space bar controls
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !this.throwTouchActive && this.canThrow() && 
                window.gameState && !window.gameState.celebrationInProgress &&
                window.gameState.discInHand && !window.gameState.throwing) {
                this.throwTouchActive = true;
                this.onStartThrow?.();
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.code === 'Space' && this.throwTouchActive) {
                this.throwTouchActive = false;
                this.onThrow?.();
            }
        });

        // Touch controls
        this.throwButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (!this.throwTouchActive && this.canThrow() && 
                window.gameState && !window.gameState.celebrationInProgress &&
                window.gameState.discInHand && !window.gameState.throwing) {
                this.throwTouchActive = true;
                this.onStartThrow?.();
            }
        });

        this.throwButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (this.throwTouchActive) {
                this.throwTouchActive = false;
                this.onThrow?.();
            }
        });

        // Mouse controls
        this.throwButton.addEventListener('mousedown', (e) => {
            if (!this.throwTouchActive && this.canThrow() && 
                window.gameState && !window.gameState.celebrationInProgress &&
                window.gameState.discInHand && !window.gameState.throwing) {
                this.throwTouchActive = true;
                this.onStartThrow?.();
            }
        });

        this.throwButton.addEventListener('mouseup', (e) => {
            if (this.throwTouchActive) {
                this.throwTouchActive = false;
                this.onThrow?.();
            }
        });
    }

    initializeCameraControls() {
        // Reset camera button
        this.resetCameraButton.addEventListener('click', () => {
            const currentPlayer = window.playerManager.getCurrentPlayer();
            if (currentPlayer && window.cameraController) {
                window.cameraController.focusOnPlayer(currentPlayer);
            }
        });

        // Show hole button
        this.showHoleButton.addEventListener('click', () => {
            if (window.cameraController && !window.cameraController.isAnimating) {
                window.cameraController.showHole();
            }
        });
    }

    setThrowHandlers(onStartThrow, onThrow, canThrow) {
        this.onStartThrow = onStartThrow;
        this.onThrow = onThrow;
        this.canThrow = canThrow;
    }

    updateScoreboard(players) {
        if (!this.playersList) return;

        this.playersList.innerHTML = players.map(player => {
            const colorHex = player.color ? (
                typeof player.color === 'number' ? 
                player.color.toString(16).padStart(6, '0') : 
                player.color.replace('#', '')
            ) : '000000'; // Default to black if no color
            
            return `
                <div class="player-score ${player.isCurrentTurn ? 'current-turn' : ''} ${player.hasCompletedHole ? 'completed' : ''}">
                    <div class="player-name" style="color: #${colorHex}">
                        ${player.name} ${player.isCurrentTurn ? '(Current Turn)' : ''}
                    </div>
                    <div class="player-stats">
                        <span>Score: ${player.score}</span>
                        <span>Throws: ${player.throws}</span>
                        ${player.hasCompletedHole ? '<span class="completed-text">Completed Hole!</span>' : ''}
                    </div>
                </div>
            `;
        }).join('');

        // Update current player indicator on button
        const currentPlayer = players.find(p => p.isCurrentTurn);
        if (currentPlayer) {
            const colorHex = currentPlayer.color ? (
                typeof currentPlayer.color === 'number' ? 
                currentPlayer.color.toString(16).padStart(6, '0') : 
                currentPlayer.color.replace('#', '')
            ) : '000000'; // Default to black if no color
            
            // Update button outline to match bag button style
            this.playersButton.style.outline = `3px solid #${colorHex}`;
            this.playersButton.style.outlineOffset = '2px';
            
            // Update main score display for current player
            this.updateScore(currentPlayer.score);
            this.updateThrows(currentPlayer.throws);
        }
    }

    showMessage(text, duration = 2000) {
        if (!this.messageDisplay) return;
        this.messageDisplay.textContent = text;
        this.messageDisplay.style.display = 'block';
        // Use requestAnimationFrame to ensure display: block is processed before adding visible class
        requestAnimationFrame(() => {
            this.messageDisplay.classList.add('visible');
        });
        
        setTimeout(() => {
            this.messageDisplay.classList.remove('visible');
            // Wait for transition to complete before hiding
            setTimeout(() => {
                this.messageDisplay.style.display = 'none';
            }, 200); // Match the transition duration
        }, duration);
    }

    updateDistance(distance) {
        if (!this.distanceEl) return;
        this.distanceEl.textContent = Math.round(distance * 10) / 10;
    }

    updateHole(holeNumber, totalHoles) {
        if (!this.holeElement) return;
        this.holeElement.textContent = holeNumber;
        if (totalHoles && this.totalHolesElement) {
            this.totalHolesElement.textContent = totalHoles;
        }
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