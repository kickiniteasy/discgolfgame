class SettingsUI {
    constructor(playerManager) {
        this.playerManager = playerManager;
        this.courseManager = window.courseManager;
        
        // Cache DOM elements
        this.settingsButton = document.getElementById('settings-button');
        this.settingsModal = document.getElementById('settings-modal');
        this.closeButton = this.settingsModal.querySelector('.close-button');
        this.playerSettingsList = document.getElementById('player-settings-list');
        this.savePlayersButton = document.getElementById('save-players-button');
        
        // Create settings container if it doesn't exist
        this.settingsContainer = document.createElement('div');
        this.settingsContainer.className = 'settings-container';
        const playersTab = document.getElementById('players-tab');
        if (playersTab) {
            playersTab.insertBefore(this.settingsContainer, this.playerSettingsList);
        }
        
        // Create confirmation modal
        this.createConfirmationModal();
        
        // Course management elements
        this.courseSelect = document.getElementById('course-select');
        this.courseUrlInput = document.getElementById('course-url');
        this.loadUrlButton = document.getElementById('load-course-url');
        this.courseJsonInput = document.getElementById('course-json');
        this.loadJsonButton = document.getElementById('load-course-json');
        this.copyCourseButton = document.getElementById('copy-course');
        this.saveCourseButton = document.getElementById('save-course');
        
        // Bind event listeners
        this.initializeEventListeners();
        this.initializeCourseSelect();
        
        // Create container for reset buttons
        const resetButtonsContainer = document.createElement('div');
        resetButtonsContainer.className = 'reset-buttons-container';
        
        // Add Reset Game button
        const resetGameButton = document.createElement('button');
        resetGameButton.className = 'reset-game-button';
        resetGameButton.textContent = 'Reset Game';
        resetGameButton.addEventListener('click', () => {
            this.showConfirmModal(
                'Reset Game',
                'Are you sure you want to reset the current game? This will:\n\n' +
                '• Reset back to Hole 1\n' +
                '• Clear all scores and throws\n' +
                '• Keep all player settings\n' +
                '• Return everyone to the first tee',
                () => this.resetGame()
            );
        });
        
        // Add Reset All Data button
        const resetAllButton = document.createElement('button');
        resetAllButton.className = 'reset-all-button';
        resetAllButton.textContent = 'Reset All Data';
        resetAllButton.addEventListener('click', () => {
            this.showConfirmModal(
                'Reset All Data',
                'Are you sure you want to reset ALL data? This will:\n\n' +
                '• Clear all player data and settings\n' +
                '• Remove all added players\n' +
                '• Reset all scores and throws\n' +
                '• Reset game back to Hole 1',
                () => this.resetAllData()
            );
        });
        
        // Add buttons to container
        resetButtonsContainer.appendChild(resetGameButton);
        resetButtonsContainer.appendChild(resetAllButton);
        
        // Add the reset buttons container after the player settings list
        this.playerSettingsList.parentNode.insertBefore(resetButtonsContainer, this.playerSettingsList.nextSibling);
    }

    createConfirmationModal() {
        // Create modal elements
        const modal = document.createElement('div');
        modal.className = 'confirm-modal';
        
        const content = document.createElement('div');
        content.className = 'confirm-modal-content';
        
        const title = document.createElement('div');
        title.className = 'confirm-modal-title';
        
        const message = document.createElement('div');
        message.className = 'confirm-modal-message';
        
        const buttons = document.createElement('div');
        buttons.className = 'confirm-modal-buttons';
        
        const confirmButton = document.createElement('button');
        confirmButton.className = 'confirm-modal-button confirm';
        confirmButton.textContent = 'Reset';
        
        const cancelButton = document.createElement('button');
        cancelButton.className = 'confirm-modal-button cancel';
        cancelButton.textContent = 'Cancel';
        
        // Add event listeners
        cancelButton.addEventListener('click', () => {
            modal.classList.remove('show');
        });
        
        // Assemble modal
        buttons.appendChild(cancelButton);
        buttons.appendChild(confirmButton);
        content.appendChild(title);
        content.appendChild(message);
        content.appendChild(buttons);
        modal.appendChild(content);
        
        // Add to document
        document.body.appendChild(modal);
        
        // Store references
        this.confirmModal = modal;
        this.confirmModalTitle = title;
        this.confirmModalMessage = message;
        this.confirmModalConfirmButton = confirmButton;
    }

    showConfirmModal(titleText, messageText, onConfirm) {
        this.confirmModalTitle.textContent = titleText;
        this.confirmModalMessage.textContent = messageText;
        
        // Remove old confirm listener and add new one
        const confirmButton = this.confirmModalConfirmButton;
        const modal = this.confirmModal;
        
        const newConfirmButton = confirmButton.cloneNode(true);
        confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);
        this.confirmModalConfirmButton = newConfirmButton;
        
        newConfirmButton.addEventListener('click', () => {
            onConfirm();
            modal.classList.remove('show');
        });
        
        // Show modal
        modal.classList.add('show');
    }

    initializeEventListeners() {
        // Settings button
        this.settingsButton.addEventListener('click', () => this.showModal());
        this.closeButton.addEventListener('click', () => this.hideModal());
        this.settingsModal.addEventListener('click', e => {
            if (e.target === this.settingsModal) this.hideModal();
        });

        // Tab switching
        this.tabButtons = this.settingsModal.querySelectorAll('.tab-button');
        this.tabs = this.settingsModal.querySelectorAll('.tab');
        this.tabButtons.forEach(button => {
            button.addEventListener('click', () => this.switchTab(button.dataset.tab));
        });

        // Save players button
        this.savePlayersButton.addEventListener('click', () => {
            console.log('Save button clicked');
            this.savePlayerSettings();
        });

        // Course management listeners
        this.courseSelect.addEventListener('change', () => this.handleCourseSelect());
        this.loadUrlButton.addEventListener('click', () => this.handleLoadCourseUrl());
        this.loadJsonButton.addEventListener('click', () => this.handleLoadCourseJson());
        this.copyCourseButton.addEventListener('click', () => this.handleCopyCourse());
        this.saveCourseButton.addEventListener('click', () => this.handleSaveCourse());
    }

    validateTwitterHandle(name) {
        // Remove @ if present
        name = name.replace(/^@/, '');
        // Keep only alphanumeric and underscore characters
        name = name.replace(/[^a-zA-Z0-9_]/g, '');
        // Ensure it's no longer than 15 characters
        name = name.slice(0, 15);
        return name;
    }

    updatePlayersList() {
        if (!this.playerSettingsList) return;
        
        this.playerSettingsList.innerHTML = '';
        const players = this.playerManager.players;
        
        players.forEach((player, index) => {
            const row = document.createElement('div');
            row.className = `player-settings-row${player.isCurrentTurn ? ' current' : ''}`;
            
            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.className = 'name-input';
            nameInput.value = player.name;
            nameInput.placeholder = '@username';
            nameInput.title = 'Enter Twitter username (without @)';
            nameInput.spellcheck = false;
            nameInput.autocomplete = 'off';
            nameInput.dataset.playerIndex = index;
            
            // Add live validation for Twitter handle
            nameInput.addEventListener('input', (e) => {
                const validHandle = this.validateTwitterHandle(e.target.value);
                if (validHandle !== e.target.value) {
                    e.target.value = validHandle;
                }
            });
            
            const colorInput = document.createElement('input');
            colorInput.type = 'color';
            colorInput.value = '#' + player.color.toString(16).padStart(6, '0');
            colorInput.title = 'Choose player color';
            colorInput.dataset.playerIndex = index;
            
            // Live color preview
            colorInput.addEventListener('input', (e) => {
                const color = parseInt(e.target.value.substring(1), 16);
                player.updateColor(color);
                row.style.borderColor = e.target.value;
                
                // If this is the main player, save the color immediately
                if (index === 0) {
                    localStorage.setItem('discGolfPlayerColor', e.target.value.substring(1));
                }
                
                // If this is the current player, update UI elements immediately
                if (player.isCurrentTurn) {
                    // Update button borders
                    const bagButton = document.getElementById('bag-button');
                    const playersButton = document.getElementById('players-button');
                    if (bagButton) {
                        bagButton.style.outline = `3px solid ${e.target.value}`;
                        bagButton.style.outlineOffset = '2px';
                    }
                    if (playersButton) {
                        playersButton.style.outline = `3px solid ${e.target.value}`;
                        playersButton.style.outlineOffset = '2px';
                    }
                }

                // Update scoreboard immediately
                if (window.ui) {
                    window.ui.updateScoreboard(this.playerManager.getScorecard());
                }
            });

            // Add player type selector for all players except Player 1
            if (index > 0) {
                const typeSelect = document.createElement('select');
                typeSelect.className = 'type-select';
                typeSelect.title = 'Choose player type';
                typeSelect.dataset.playerIndex = index;

                const aiOption = document.createElement('option');
                aiOption.value = 'ai';
                aiOption.textContent = 'AI';
                typeSelect.appendChild(aiOption);

                const humanOption = document.createElement('option');
                humanOption.value = 'human';
                humanOption.textContent = 'Human';
                typeSelect.appendChild(humanOption);

                typeSelect.value = player.type;

                typeSelect.addEventListener('change', (e) => {
                    player.type = e.target.value;
                    this.playerManager.saveAIPlayerData();
                });

                row.appendChild(typeSelect);
            }
            
            // Add remove button for all players except Player 1
            if (index > 0) {
                const removeButton = document.createElement('button');
                removeButton.className = 'remove-player-button';
                removeButton.innerHTML = '&times;';
                removeButton.title = 'Remove player';
                removeButton.dataset.playerIndex = index;
                removeButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    const playerIndex = parseInt(e.target.dataset.playerIndex);
                    this.playerManager.removePlayer(playerIndex);
                    this.updatePlayersList();
                    if (window.ui) {
                        window.ui.updateScoreboard(this.playerManager.getScorecard());
                    }
                });
                row.appendChild(removeButton);
            }
            
            row.appendChild(nameInput);
            row.appendChild(colorInput);
            this.playerSettingsList.appendChild(row);
        });

        // Add "Add Player" button if we have less than max players
        if (players.length < 4) {
            const addPlayerRow = document.createElement('div');
            addPlayerRow.className = 'add-player-row';
            
            const addPlayerButton = document.createElement('button');
            addPlayerButton.className = 'add-player-button';
            addPlayerButton.textContent = 'Add Player';
            addPlayerButton.addEventListener('click', (e) => {
                e.preventDefault();
                const nextIndex = this.playerManager.players.length;
                if (nextIndex < 4) {
                    const nextColor = this.playerManager.playerColors[nextIndex];
                    const nextName = this.playerManager.aiNames[nextIndex - 1] || `Player ${nextIndex + 1}`;
                    this.playerManager.addPlayer(nextName, nextColor, 'ai');
                    this.updatePlayersList();
                    if (window.ui) {
                        window.ui.updateScoreboard(this.playerManager.getScorecard());
                    }
                    // Save player count to localStorage
                    localStorage.setItem('discGolfPlayerCount', this.playerManager.players.length.toString());
                }
            });
            
            addPlayerRow.appendChild(addPlayerButton);
            this.playerSettingsList.appendChild(addPlayerRow);
        }
    }

    savePlayerSettings() {
        console.log('savePlayerSettings called');
        const nameInputs = this.playerSettingsList.querySelectorAll('.name-input');
        const colorInputs = this.playerSettingsList.querySelectorAll('input[type="color"]');
        let anyChanges = false;
        
        nameInputs.forEach((input, i) => {
            const player = this.playerManager.players[i];
            const newName = this.validateTwitterHandle(input.value);
            if (newName && newName !== player.name) {
                player.name = newName;
                if (i === 0) { // If it's the main player
                    console.log('Saving name:', newName);
                    localStorage.setItem('discGolfPlayerName', newName);
                }
                anyChanges = true;
            }
        });
        
        colorInputs.forEach((input, i) => {
            const player = this.playerManager.players[i];
            const newColor = parseInt(input.value.substring(1), 16);
            console.log('Processing color input:', input.value, 'for player', i);
            if (newColor !== player.color) {
                player.updateColor(newColor);
                if (i === 0) { // If it's the main player
                    const colorToSave = input.value.substring(1);
                    console.log('Saving color to localStorage:', colorToSave);
                    localStorage.setItem('discGolfPlayerColor', colorToSave);
                    // Verify it was saved
                    const savedColor = localStorage.getItem('discGolfPlayerColor');
                    console.log('Immediately after saving, color in localStorage:', savedColor);
                }
                anyChanges = true;
            }
        });

        // Update all UI elements that show player information
        if (anyChanges) {
            // Update scoreboard
            if (window.ui) {
                window.ui.updateScoreboard(this.playerManager.getScorecard());
                
                // Update button borders for current player
                const currentPlayer = this.playerManager.getCurrentPlayer();
                if (currentPlayer) {
                    const colorHex = currentPlayer.color.toString(16).padStart(6, '0');
                    const bagButton = document.getElementById('bag-button');
                    const playersButton = document.getElementById('players-button');
                    if (bagButton) {
                        bagButton.style.outline = `3px solid #${colorHex}`;
                        bagButton.style.outlineOffset = '2px';
                    }
                    if (playersButton) {
                        playersButton.style.outline = `3px solid #${colorHex}`;
                        playersButton.style.outlineOffset = '2px';
                    }
                }
            }

            // Update player models and labels in the game
            this.playerManager.players.forEach(player => {
                // Update the player's name label if it exists
                if (player.nameSprite) {
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.width = 256;
                    canvas.height = 64;
                    
                    // Set up text style
                    context.textAlign = 'center';
                    context.font = '24px Arial';
                    
                    // Measure text width for background
                    const textMetrics = context.measureText(player.name);
                    const textWidth = textMetrics.width;
                    const padding = 20;
                    const cornerRadius = 12;
                    
                    // Draw rounded rectangle background
                    const bgWidth = textWidth + padding * 2;
                    const bgHeight = 40;
                    const bgX = (canvas.width - bgWidth) / 2;
                    const bgY = (canvas.height - bgHeight) / 2;
                    
                    context.beginPath();
                    context.moveTo(bgX + cornerRadius, bgY);
                    context.lineTo(bgX + bgWidth - cornerRadius, bgY);
                    context.quadraticCurveTo(bgX + bgWidth, bgY, bgX + bgWidth, bgY + cornerRadius);
                    context.lineTo(bgX + bgWidth, bgY + bgHeight - cornerRadius);
                    context.quadraticCurveTo(bgX + bgWidth, bgY + bgHeight, bgX + bgWidth - cornerRadius, bgY + bgHeight);
                    context.lineTo(bgX + cornerRadius, bgY + bgHeight);
                    context.quadraticCurveTo(bgX, bgY + bgHeight, bgX, bgY + bgHeight - cornerRadius);
                    context.lineTo(bgX, bgY + cornerRadius);
                    context.quadraticCurveTo(bgX, bgY, bgX + cornerRadius, bgY);
                    context.closePath();
                    
                    context.fillStyle = 'rgba(0, 0, 0, 0.5)';
                    context.fill();
                    
                    // Draw text
                    context.strokeStyle = 'rgba(0, 0, 0, 0.8)';
                    context.lineWidth = 3;
                    context.strokeText(player.name, canvas.width / 2, canvas.height / 2 + 2);
                    context.fillStyle = 'white';
                    context.fillText(player.name, canvas.width / 2, canvas.height / 2 + 2);
                    
                    // Update the sprite texture
                    player.nameSprite.material.map.dispose(); // Clean up old texture
                    player.nameSprite.material.map = new THREE.CanvasTexture(canvas);
                    player.nameSprite.material.needsUpdate = true;
                }
            });
        }
        
        this.hideModal();
        if (anyChanges) {
            this.showMessage('Player settings saved!', 'success');
        }
    }

    switchTab(tabId) {
        // Update tab buttons
        this.tabButtons.forEach(button => {
            button.classList.toggle('active', button.dataset.tab === tabId);
        });

        // Update tab content
        this.tabs.forEach(tab => {
            tab.classList.toggle('active', tab.id === `${tabId}-tab`);
        });
    }

    initializeCourseSelect() {
        // Clear existing options except the first one
        while (this.courseSelect.options.length > 1) {
            this.courseSelect.remove(1);
        }

        // Add pre-built courses
        const prebuiltCourses = this.courseManager.getPrebuiltCourses();
        prebuiltCourses.forEach(courseId => {
            const option = document.createElement('option');
            option.value = courseId;
            option.textContent = courseId.charAt(0).toUpperCase() + courseId.slice(1).replace(/_/g, ' ');
            this.courseSelect.appendChild(option);
        });
    }

    async handleCourseSelect() {
        const courseId = this.courseSelect.value;
        if (!courseId) return;

        const success = await this.courseManager.loadCourseFromFile(courseId);
        if (success) {
            this.showMessage('Course loaded successfully!', 'success');
            this.hideModal();
        } else {
            this.showMessage('Failed to load course.', 'error');
        }
    }

    async handleLoadCourseUrl() {
        const url = this.courseUrlInput.value.trim();
        if (!url) {
            this.showMessage('Please enter a valid URL.', 'error');
            return;
        }

        const success = await this.courseManager.loadCourseFromURL(url);
        if (success) {
            this.showMessage('Course loaded successfully!', 'success');
            this.hideModal();
        } else {
            this.showMessage('Failed to load course from URL.', 'error');
        }
    }

    async handleLoadCourseJson() {
        const jsonText = this.courseJsonInput.value.trim();
        if (!jsonText) {
            this.showMessage('Please enter valid course JSON.', 'error');
            return;
        }

        const success = await this.courseManager.loadCourseFromJSON(jsonText);
        if (success) {
            this.showMessage('Course loaded successfully!', 'success');
            this.hideModal();
        } else {
            this.showMessage('Failed to load course from JSON.', 'error');
        }
    }

    handleCopyCourse() {
        const success = this.courseManager.copyCourseToClipboard();
        if (success) {
            this.showMessage('Course copied to clipboard!', 'success');
        } else {
            this.showMessage('Failed to copy course.', 'error');
        }
    }

    async handleSaveCourse() {
        const success = await this.courseManager.saveCourse();
        if (success) {
            this.showMessage('Course saved successfully!', 'success');
        } else {
            this.showMessage('Failed to save course.', 'error');
        }
    }

    showModal() {
        this.updatePlayersList();
        
        // Update version display
        const versionElement = document.getElementById('app-version');
        if (versionElement && window.APP_VERSION) {
            versionElement.textContent = window.APP_VERSION;
        }
        
        this.settingsModal.style.display = 'block';
    }

    hideModal() {
        this.settingsModal.style.display = 'none';
        
        // Clear course inputs
        this.courseSelect.value = '';
        this.courseUrlInput.value = '';
        this.courseJsonInput.value = '';
    }

    showMessage(text, type = 'info') {
        const message = document.createElement('div');
        message.className = `message ${type}`;
        message.textContent = text;
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.style.opacity = '0';
            setTimeout(() => message.remove(), 300);
        }, 3000);
    }

    resetGame() {
        // Reset game state
        window.gameState.throwing = false;
        window.gameState.power = 0;
        window.gameState.powerIncreasing = true;
        window.gameState.discInHand = true;
        window.gameState.celebrationInProgress = false;

        // Clean up existing disc
        if (window.gameState.currentDisc) {
            window.gameState.currentDisc.remove();
            window.gameState.currentDisc = null;
        }

        // Reset course state
        const course = window.courseManager.getCurrentCourse();
        if (course) {
            course.currentHoleIndex = 0;
            course.holes.forEach(hole => {
                hole.hasBeenCompleted = false;
            });

            // Reset player states
            this.playerManager.players.forEach(player => {
                player.score = 0;
                player.throws = 0;
                player.hasCompletedHole = false;
                player.lastDiscPosition = null;
                player.setCurrentTurn(false);
            });

            // Get positions for first hole
            const teePosition = course.getCurrentTeeboxPosition();
            const holePosition = course.getCurrentHolePosition();

            if (teePosition && holePosition) {
                // Position all players at first tee
                this.playerManager.positionPlayersAtTeebox(teePosition, holePosition, true);
                
                // Set up first player's turn
                const firstPlayer = this.playerManager.players[0];
                if (firstPlayer) {
                    this.playerManager.currentPlayerIndex = 0;
                    firstPlayer.setCurrentTurn(true);

                    // Create new disc for first player
                    const selectedDisc = firstPlayer.bag.getSelectedDisc();
                    window.gameState.currentDisc = new Disc(window.courseManager.scene, selectedDisc);
                    window.gameState.currentDisc.setPosition(firstPlayer.position.clone().add(new THREE.Vector3(0, 1, 0)));
                    window.gameState.discInHand = true;

                    // Reset camera and focus on first player
                    if (window.cameraController) {
                        window.cameraController.focusOnPlayer(firstPlayer);
                    }

                    // Update UI elements
                    if (window.ui) {
                        window.ui.updateScoreboard(this.playerManager.getScorecard());
                        window.ui.updateHole(1, course.holes.length);
                        window.ui.updateThrows(0);
                        window.ui.updateDistance(Math.ceil(new THREE.Vector2(
                            holePosition.x - teePosition.x,
                            holePosition.z - teePosition.z
                        ).length()));

                        // Update button outlines
                        const colorHex = firstPlayer.color.toString(16).padStart(6, '0');
                        const bagButton = document.getElementById('bag-button');
                        const playersButton = document.getElementById('players-button');
                        if (bagButton) {
                            bagButton.style.outline = `3px solid #${colorHex}`;
                            bagButton.style.outlineOffset = '2px';
                        }
                        if (playersButton) {
                            playersButton.style.outline = `3px solid #${colorHex}`;
                            playersButton.style.outlineOffset = '2px';
                        }

                        // Reset power meter
                        const powerMeter = document.getElementById('power-meter');
                        if (powerMeter) powerMeter.style.display = 'none';
                    }
                }
            }
        }

        // Close modals
        this.confirmModal.classList.remove('show');
        this.settingsModal.style.display = 'none';
        this.showMessage('Game reset successfully! Starting from Hole 1', 'success');
    }

    resetAllData() {
        // Store current course data before clearing localStorage
        const currentCourseId = localStorage.getItem('currentCourseId');
        const courseData = localStorage.getItem('courseData');
        
        // Clear localStorage but preserve course data
        localStorage.clear();
        if (currentCourseId) localStorage.setItem('currentCourseId', currentCourseId);
        if (courseData) localStorage.setItem('courseData', courseData);
        
        // Remove existing name labels and discs
        this.playerManager.players.forEach(player => {
            if (player.nameSprite && player.nameSprite.parent) {
                player.nameSprite.parent.remove(player.nameSprite);
                player.nameSprite.material.map.dispose();
                player.nameSprite.material.dispose();
                player.nameSprite.geometry.dispose();
                player.nameSprite = null;
            }
            if (player.disc && player.disc.parent) {
                player.disc.parent.remove(player.disc);
                if (player.disc.geometry) player.disc.geometry.dispose();
                if (player.disc.material) player.disc.material.dispose();
                player.disc = null;
            }
        });
        
        // Clear players and reinitialize
        while (this.playerManager.players.length > 0) {
            this.playerManager.players.pop();
        }
        this.playerManager.initializePlayers();
        
        // Reset game state (reuse resetGame function)
        this.resetGame();
        
        // Update UI
        this.updatePlayersList();
        
        // Show success message
        this.showMessage('All data reset successfully!', 'success');
    }

    addSetting(id, label, type, defaultValue, onChange) {
        const settingContainer = document.createElement('div');
        settingContainer.className = 'setting-item';

        const settingLabel = document.createElement('label');
        settingLabel.htmlFor = id;
        settingLabel.textContent = label;

        let input;
        switch (type) {
            case 'checkbox':
                input = document.createElement('input');
                input.type = 'checkbox';
                input.id = id;
                input.checked = defaultValue;
                input.addEventListener('change', () => onChange(input.checked));
                break;
            case 'select':
                input = document.createElement('select');
                input.id = id;
                // Add options if provided in defaultValue
                if (Array.isArray(defaultValue)) {
                    defaultValue.forEach(option => {
                        const opt = document.createElement('option');
                        opt.value = option.value;
                        opt.textContent = option.label;
                        input.appendChild(opt);
                    });
                }
                input.addEventListener('change', () => onChange(input.value));
                break;
            default: // text input
                input = document.createElement('input');
                input.type = 'text';
                input.id = id;
                input.value = defaultValue;
                input.addEventListener('input', () => onChange(input.value));
                break;
        }

        settingContainer.appendChild(settingLabel);
        settingContainer.appendChild(input);
        this.settingsContainer.appendChild(settingContainer);

        return input;
    }
} 