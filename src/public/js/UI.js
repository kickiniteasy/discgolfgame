class UI {
    constructor() {
        // Initialize DOM elements
        this.scoreElement = document.getElementById('score');
        this.throwsElement = document.getElementById('throws');
        this.holeElement = document.getElementById('hole');
        this.totalHolesElement = document.getElementById('total-holes');
        this.parElement = document.getElementById('par');
        this.distanceEl = document.getElementById('distance');
        this.powerFill = document.querySelector('.throw-progress-fill');
        this.messageDisplay = document.getElementById('message');
        this.uiContainer = document.getElementById('ui');
        this.throwButton = document.getElementById('throw-button');
        
        // Players modal elements
        this.playersButton = document.getElementById('players-button');
        this.playersModal = document.getElementById('players-modal');
        this.playersList = document.getElementById('players-list');
        
        // Help modal elements
        this.helpButton = document.getElementById('help-button');
        this.helpModal = document.getElementById('help-modal');
        
        // Camera control elements
        this.resetCameraButton = document.getElementById('reset-camera-button');
        // Set initial auto-target state - on by default with orange border
        if (this.resetCameraButton) {
            this.resetCameraButton.classList.add('auto-target');
        }
        this.showHoleButton = document.getElementById('show-hole-button');
        
        // Throw button state
        this.throwTouchActive = false;
        this.onStartThrow = null;
        this.onThrow = null;
        this.canThrow = () => true; // Default to always allowing throws

        // Initialize modals and controls
        this.initializePlayersModal();
        this.initializeHelpModal();
        this.initializeThrowControls();
        this.initializeCameraControls();

        // X Button click handler
        const socialTwitterButton = document.getElementById('social-twitter-button');
        if (socialTwitterButton) {
            socialTwitterButton.addEventListener('click', () => {
                window.open('https://x.com/kickiniteasy', '_blank');
            });
        }
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

    initializeHelpModal() {
        // Show modal on button click
        this.helpButton.addEventListener('click', () => {
            this.helpModal.style.display = 'block';
        });

        // Close modal when clicking close button
        const closeButton = this.helpModal.querySelector('.close-button');
        closeButton.addEventListener('click', () => {
            this.helpModal.style.display = 'none';
        });

        // Close modal when clicking outside
        this.helpModal.addEventListener('click', (e) => {
            if (e.target === this.helpModal) {
                this.helpModal.style.display = 'none';
            }
        });

        // Add keyboard shortcut (h key) to toggle help
        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'h') {
                this.helpModal.style.display = this.helpModal.style.display === 'block' ? 'none' : 'block';
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
        const handleCameraReset = () => {
            const currentPlayer = window.playerManager.getCurrentPlayer();
            if (currentPlayer && window.cameraController) {
                // Always target hole when manually resetting camera
                window.cameraController.focusOnPlayer(currentPlayer, true);
            }
        };

        // Long press handling for reset camera button
        let longPressTimer;
        let isLongPress = false;
        const longPressDuration = 500; // 500ms for long press

        const handleLongPressStart = (e) => {
            isLongPress = false;
            longPressTimer = setTimeout(() => {
                isLongPress = true;
                this.resetCameraButton.classList.toggle('auto-target');
                // Toggle auto-target mode in camera controller
                if (window.cameraController) {
                    // When button has auto-target class (orange border), auto-target should be ON
                    const isAutoTarget = this.resetCameraButton.classList.contains('auto-target');
                    window.cameraController.setAutoTarget(isAutoTarget);
                }
            }, longPressDuration);
        };

        const handleLongPressEnd = (e) => {
            clearTimeout(longPressTimer);
            // Only trigger camera reset if it wasn't a long press
            if (!isLongPress) {
                handleCameraReset();
            }
        };

        // Mouse events
        this.resetCameraButton.addEventListener('mousedown', handleLongPressStart);
        this.resetCameraButton.addEventListener('mouseup', handleLongPressEnd);
        this.resetCameraButton.addEventListener('mouseleave', handleLongPressEnd);

        // Touch events
        this.resetCameraButton.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent scrolling/zooming while touching the button
            handleLongPressStart(e);
        });
        this.resetCameraButton.addEventListener('touchend', handleLongPressEnd);
        this.resetCameraButton.addEventListener('touchcancel', handleLongPressEnd);

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

    showMessage(text, duration = 2000, type = 'gold') {
        // Use the ToasterMessage system with the specified type
        ToasterMessage[type](text, duration);
    }

    updateDistance(distance) {
        const distanceSpan = document.getElementById('distance');
        if (distanceSpan) {
            distanceSpan.textContent = Math.ceil(distance);
        }
    }

    updateHole(holeNumber, totalHoles) {
        if (!this.holeElement) return;
        this.holeElement.textContent = holeNumber;
        if (totalHoles && this.totalHolesElement) {
            this.totalHolesElement.textContent = totalHoles;
        }
        // Update par for the current hole
        if (window.courseManager && window.courseManager.getCurrentCourse()) {
            const currentPar = window.courseManager.getCurrentCourse().getCurrentHolePar();
            this.updatePar(currentPar);
        }
    }

    updatePar(par) {
        if (!this.parElement) return;
        this.parElement.textContent = par;
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