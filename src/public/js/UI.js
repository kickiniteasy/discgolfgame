class UI {
    constructor() {
        // Initialize DOM elements
        this.scoreElement = document.getElementById('score');
        this.throwsElement = document.getElementById('throws');
        this.holeElement = document.getElementById('hole');
        this.distanceEl = document.getElementById('distance');
        this.powerMeter = document.getElementById('power-meter');
        this.powerFill = document.querySelector('.throw-progress-fill');
        this.messageDisplay = document.getElementById('message');
        this.discElements = document.querySelectorAll('.disc');

        // Bind disc selection event handlers
        this.initDiscSelection();
    }

    initDiscSelection() {
        this.discElements.forEach(discEl => {
            discEl.addEventListener('click', () => {
                // Only allow changing discs when disc is in hand
                if (!window.gameState.discInHand) return;
                
                // Remove selected class from all discs
                this.discElements.forEach(el => el.classList.remove('selected'));
                
                // Add selected class to clicked disc
                discEl.classList.add('selected');
                
                // Update selected disc in game state
                window.gameState.selectedDisc = {
                    type: discEl.dataset.type,
                    speed: parseInt(discEl.dataset.speed),
                    glide: parseInt(discEl.dataset.glide),
                    turn: parseInt(discEl.dataset.turn),
                    fade: parseInt(discEl.dataset.fade)
                };
                
                // Update disc appearance through the callback
                if (this.onDiscChangeCallback) {
                    this.onDiscChangeCallback(window.gameState.selectedDisc);
                }
            });
        });
    }

    // Power meter methods
    updatePowerMeter(power) {
        // Update circular progress on throw button
        if (this.powerFill) {
            const progress = power / 100;
            this.powerFill.style.strokeDashoffset = 283 * (1 - progress);
        }
    }

    hidePowerMeter() {
        // No need to hide anything since the throw button is always visible
        // and the progress is reset by removing the 'throwing' class
    }

    // Score and game state updates
    updateScore(score) {
        this.scoreElement.textContent = `Score: ${score > 0 ? '+' : ''}${score}`;
    }

    updateThrows(throws) {
        this.throwsElement.textContent = `Throws: ${throws}`;
    }

    updateHole(hole) {
        this.holeElement.textContent = `Hole ${hole}`;
    }

    updateDistance(distance) {
        this.distanceEl.textContent = Math.round(distance);
    }

    // Message display
    showMessage(text, duration = 3000) {
        if (!this.messageDisplay) return;
        
        this.messageDisplay.textContent = text;
        this.messageDisplay.style.display = 'block';
        
        setTimeout(() => {
            this.messageDisplay.style.display = 'none';
        }, duration);
    }

    // Event handler setters
    setOnDiscChange(callback) {
        this.onDiscChangeCallback = callback;
    }
} 